import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { CHAT_RATE_LIMIT } from '@/lib/rate-limit-config';
import { logger } from '@/lib/logger';
import { getAnthropicClient, getChatConfigDiagnostics, CHAT_MODEL } from '@/lib/ai/anthropic-client';
import { CHAT_TOOLS, runChatTool } from '@/lib/ai/chat-tools';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { getAssistantConfig } from '@/lib/ai/assistant-config-store';
import { detectUnanswered, logUnansweredQuestion } from '@/lib/ai/unanswered-log';

const MAX_TOOL_ITERATIONS = 6;
const MAX_HISTORY_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 2000;
// Assistant turns replayed from the client's memory can be long (tables, lists).
const MAX_ASSISTANT_MESSAGE_LENGTH = 8000;

const chatSchema = z.object({
  messages: z
    .array(
      z
        .object({
          role: z.enum(['user', 'assistant']),
          content: z.string().trim().min(1).max(MAX_ASSISTANT_MESSAGE_LENGTH),
        })
        .refine((m) => m.role !== 'user' || m.content.length <= MAX_MESSAGE_LENGTH, {
          message: `Message trop long (max ${MAX_MESSAGE_LENGTH} caractères)`,
        })
    )
    .min(1)
    .max(MAX_HISTORY_MESSAGES),
});

function isEmptySearch(toolResult: string): boolean {
  try {
    return (JSON.parse(toolResult) as { total?: number }).total === 0;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, 'chat', CHAT_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const diagnostics = getChatConfigDiagnostics();
  if (!diagnostics.isConfigured) {
    logger.info('API /chat', 'No ANTHROPIC_API_KEY configured — chat unavailable');
    return NextResponse.json(
      { error: "L'assistante n'est pas disponible pour le moment. Contactez-nous par WhatsApp." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(', ') },
      { status: 400 }
    );
  }

  const assistantConfig = await getAssistantConfig();
  if (!assistantConfig.enabled) {
    return NextResponse.json(
      { error: "L'assistant n'est pas disponible pour le moment. Contactez-nous par WhatsApp." },
      { status: 503 },
    );
  }

  const anthropic = getAnthropicClient();
  // The conversation must open with a user turn (the widget's greeting is an assistant turn).
  const firstUserIndex = parsed.data.messages.findIndex((m) => m.role === 'user');
  const messages: Anthropic.MessageParam[] = parsed.data.messages.slice(Math.max(0, firstUserIndex)).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let systemPrompt: string;
  try {
    systemPrompt = await buildSystemPrompt(assistantConfig);
  } catch (err) {
    logger.error('API /chat', 'Failed to build system prompt', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  const lastUserQuestion = [...parsed.data.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = '';
      let lastSearchEmpty = false;
      try {
        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
          const msgStream = anthropic.messages.stream({
            model: CHAT_MODEL,
            max_tokens: 1536,
            system: systemPrompt,
            tools: CHAT_TOOLS,
            messages,
          });

          msgStream.on('text', (textDelta) => {
            answer += textDelta;
            controller.enqueue(encoder.encode(textDelta));
          });

          const final = await msgStream.finalMessage();
          messages.push({ role: 'assistant', content: final.content });

          if (final.stop_reason !== 'tool_use') break;

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of final.content) {
            if (block.type === 'tool_use') {
              const result = await runChatTool(block.name, block.input);
              if (block.name === 'search_products') lastSearchEmpty = isEmptySearch(result);
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
            }
          }
          messages.push({ role: 'user', content: toolResults });
        }
        const reason = detectUnanswered(answer, lastSearchEmpty);
        if (reason) await logUnansweredQuestion(lastUserQuestion, reason);
      } catch (err) {
        logger.error('API /chat', 'Streaming error', err);
        controller.enqueue(
          encoder.encode('\n\nDésolée, une erreur est survenue. Vous pouvez réessayer dans un instant.')
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
