import Anthropic from '@anthropic-ai/sdk';

export const CHAT_MODEL = 'claude-sonnet-5';

let client: Anthropic | null = null;

/** Lazily-created singleton — avoids constructing a client when the key is missing. */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    // Org-level API keys (not scoped to a single workspace) require this
    // header on every request — optional, only needed for that key type.
    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      ...(workspaceId ? { defaultHeaders: { 'anthropic-workspace-id': workspaceId } } : {}),
    });
  }
  return client;
}

export interface ChatConfigDiagnostics {
  isConfigured: boolean;
}

/** Mirrors lib/payment/jeko.ts's diagnostics pattern for graceful degradation. */
export function getChatConfigDiagnostics(): ChatConfigDiagnostics {
  return { isConfigured: Boolean(process.env.ANTHROPIC_API_KEY) };
}
