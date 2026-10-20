import type Anthropic from '@anthropic-ai/sdk';

// The history comes from the client: cap what gets replayed so a forged
// conversation can't inflate the input tokens of every request (and of each
// tool-loop iteration that resends it).
export const MAX_HISTORY_CHARS = 24_000;

type ChatTurn = { role: 'user' | 'assistant'; content: string };

/**
 * Keeps the most recent turns that fit in `maxChars`. The result always opens
 * with a user turn (the widget's greeting is an assistant turn), and is empty
 * when no user turn fits.
 */
export function trimChatHistory(messages: ChatTurn[], maxChars = MAX_HISTORY_CHARS): Anthropic.MessageParam[] {
  let start = messages.length;
  let total = 0;
  while (start > 0 && total + messages[start - 1].content.length <= maxChars) {
    start -= 1;
    total += messages[start].content.length;
  }
  while (start < messages.length && messages[start].role !== 'user') start += 1;

  return messages.slice(start).map((m) => ({ role: m.role, content: m.content }));
}
