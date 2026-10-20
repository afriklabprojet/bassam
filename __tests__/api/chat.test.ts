// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { DEFAULT_ASSISTANT_CONFIG } from '@/lib/ai/assistant-config';

vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test');

type FakeFinal = { stop_reason: string; stop_details?: { category: string | null } | null; content: unknown[] };

const mockStream = vi.fn();
const mockRunChatTool = vi.fn();

function fakeStream(text: string, final: FakeFinal) {
  return {
    on: (event: string, cb: (delta: string) => void) => {
      if (event === 'text' && text) cb(text);
    },
    finalMessage: async () => final,
  };
}

vi.mock('@/lib/ai/anthropic-client', () => ({
  CHAT_MODEL: 'claude-sonnet-5-5',
  getAnthropicClient: () => ({ messages: { stream: mockStream } }),
  getChatConfigDiagnostics: () => ({ isConfigured: true }),
}));
vi.mock('@/lib/ai/assistant-config-store', () => ({
  getAssistantConfig: vi.fn(async () => ({ ...DEFAULT_ASSISTANT_CONFIG, enabled: true })),
}));
vi.mock('@/lib/ai/system-prompt', () => ({ buildSystemPrompt: vi.fn(async () => 'SYSTEM PROMPT') }));
vi.mock('@/lib/ai/chat-tools', () => ({ CHAT_TOOLS: [], runChatTool: mockRunChatTool }));
vi.mock('@/lib/ai/unanswered-log', () => ({
  detectUnanswered: vi.fn(() => null),
  logUnansweredQuestion: vi.fn(),
}));

const { POST } = await import('@/app/api/chat/route');

function makeRequest(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}` },
    body: JSON.stringify({ messages }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/chat', () => {
  it('appelle le modèle avec effort low, cache et historique sans accueil assistant', async () => {
    mockStream.mockReturnValue(fakeStream('Bonjour !', { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Bonjour !' }] }));

    const res = await POST(makeRequest([
      { role: 'assistant', content: 'Bienvenue chez nous' },
      { role: 'user', content: 'Un parfum boisé ?' },
    ]));

    expect(await res.text()).toBe('Bonjour !');
    const params = mockStream.mock.calls[0][0];
    expect(params.model).toBe('claude-sonnet-5-5');
    expect(params.output_config).toEqual({ effort: 'low' });
    expect(params.cache_control).toEqual({ type: 'ephemeral' });
    expect(params.system).toEqual([{ type: 'text', text: 'SYSTEM PROMPT', cache_control: { type: 'ephemeral' } }]);
    expect(params.messages[0]).toEqual({ role: 'user', content: 'Un parfum boisé ?' });
  });

  it('répond poliment et s arrête quand le modèle refuse', async () => {
    mockStream.mockReturnValue(fakeStream('', { stop_reason: 'refusal', stop_details: { category: 'general_harms' }, content: [] }));

    const res = await POST(makeRequest([{ role: 'user', content: 'Question hors sujet' }]));

    expect(await res.text()).toMatch(/Je ne peux pas répondre à cette demande/);
    expect(mockStream).toHaveBeenCalledTimes(1);
    expect(mockRunChatTool).not.toHaveBeenCalled();
  });

  it('refuse un historique sans aucun message utilisateur', async () => {
    const res = await POST(makeRequest([{ role: 'assistant', content: 'Bienvenue' }]));

    expect(res.status).toBe(400);
    expect(mockStream).not.toHaveBeenCalled();
  });
});
