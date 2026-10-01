import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { CHAT_RATE_LIMIT } from '@/lib/rate-limit-config';
import { logger } from '@/lib/logger';
import { getAnthropicClient, getChatConfigDiagnostics, CHAT_MODEL } from '@/lib/ai/anthropic-client';
import { CHAT_TOOLS, runChatTool } from '@/lib/ai/chat-tools';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';

const MAX_TOOL_ITERATIONS = 4;
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
      })
    )
    .min(1)
    .max(MAX_HISTORY_MESSAGES),
});

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

  const anthropic = getAnthropicClient();
  const messages: Anthropic.MessageParam[] = parsed.data.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let systemPrompt: string;
  try {
    systemPrompt = await buildSystemPrompt();
  } catch (err) {
    logger.error('API /chat', 'Failed to build system prompt', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
          const msgStream = anthropic.messages.stream({
            model: CHAT_MODEL,
            max_tokens: 1024,
            system: systemPrompt,
            tools: CHAT_TOOLS,
            messages,
          });

          msgStream.on('text', (textDelta) => {
            controller.enqueue(encoder.encode(textDelta));
          });

          const final = await msgStream.finalMessage();
          messages.push({ role: 'assistant', content: final.content });

          if (final.stop_reason !== 'tool_use') break;

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of final.content) {
            if (block.type === 'tool_use') {
              const result = await runChatTool(block.name, block.input);
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
            }
          }
          messages.push({ role: 'user', content: toolResults });
        }
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
