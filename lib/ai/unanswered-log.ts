import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';

/**
 * Anonymous journal of questions the assistant could not answer, so the team can
 * teach it (admin → Assistant IA → Questions sans réponse). Best-effort only:
 * a failure here must never affect the chat.
 */

export type UnansweredReason = 'fallback' | 'no_results';

export const UNANSWERED_RETENTION_DAYS = 90;
const MAX_QUESTION_LENGTH = 500;
const MIN_QUESTION_LENGTH = 4;

// The assistant's mandatory "I can't verify this" phrasings (see system-prompt.ts).
const FALLBACK_MARKERS = [
  /je préfère vérifier cette information/i,
  /je ne trouve pas cette information de manière fiable/i,
];

/** Masks e-mails and phone-like numbers, then truncates. Nothing else is stored. */
export function redactPersonalData(text: string): string {
  return text
    .replaceAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]')
    .replaceAll(/\+?\d[\d\s().-]{6,}\d/g, '[numéro]')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUESTION_LENGTH);
}

/** Stable key to group repeated phrasings of the same question. */
export function normalizeQuestionKey(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[^a-z0-9\s]/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

export function detectUnanswered(finalText: string, lastSearchEmpty: boolean): UnansweredReason | null {
  if (FALLBACK_MARKERS.some((marker) => marker.test(finalText))) return 'fallback';
  if (lastSearchEmpty) return 'no_results';
  return null;
}

export async function logUnansweredQuestion(rawQuestion: string, reason: UnansweredReason): Promise<void> {
  try {
    const question = redactPersonalData(rawQuestion);
    const key = normalizeQuestionKey(question);
    if (question.length < MIN_QUESTION_LENGTH || key.length < MIN_QUESTION_LENGTH) return;

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    const { data: existing, error: readError } = await supabase
      .from('assistant_unanswered')
      .select('id, occurrences')
      .eq('question_key', key)
      .eq('status', 'new')
      .maybeSingle();
    if (readError) throw readError;

    if (existing) {
      await supabase
        .from('assistant_unanswered')
        .update({ occurrences: Number(existing.occurrences) + 1, last_seen_at: now })
        .eq('id', existing.id);
    } else {
      const { error: insertError } = await supabase
        .from('assistant_unanswered')
        .insert({ question, question_key: key, reason });
      // 23505 = a concurrent request just created the same open question: nothing to do.
      if (insertError && insertError.code !== '23505') throw insertError;
    }

    const cutoff = new Date(Date.now() - UNANSWERED_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('assistant_unanswered').delete().lt('last_seen_at', cutoff);
  } catch (err) {
    logger.warn('assistant', 'Could not record unanswered question (is the migration applied?)', err);
  }
}
