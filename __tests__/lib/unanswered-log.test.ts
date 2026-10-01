import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detectUnanswered, normalizeQuestionKey, redactPersonalData } from '@/lib/ai/unanswered-log';

const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdateEq = vi.fn();
const mockDeleteLt = vi.fn();

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }) }),
      insert: mockInsert,
      update: () => ({ eq: mockUpdateEq }),
      delete: () => ({ lt: mockDeleteLt }),
    }),
  })),
}));

const { logUnansweredQuestion } = await import('@/lib/ai/unanswered-log');

beforeEach(() => {
  vi.clearAllMocks();
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  mockInsert.mockResolvedValue({ error: null });
  mockUpdateEq.mockResolvedValue({ error: null });
  mockDeleteLt.mockResolvedValue({ error: null });
});

describe('redactPersonalData', () => {
  it('masks e-mails and phone numbers', () => {
    const out = redactPersonalData('Rappelez-moi au +225 07 79 11 79 79 ou écrivez à kouadio@mail.com svp');
    expect(out).not.toMatch(/kouadio|0779|07 79/);
    expect(out).toContain('[email]');
    expect(out).toContain('[numéro]');
  });

  it('truncates long questions', () => {
    expect(redactPersonalData('a'.repeat(900)).length).toBe(500);
  });
});

describe('normalizeQuestionKey', () => {
  it('groups rephrasings that differ only by case, accents and punctuation', () => {
    expect(normalizeQuestionKey('Livrez-vous à Korhogo ?')).toBe(normalizeQuestionKey('livrez vous a KORHOGO'));
  });
});

describe('detectUnanswered', () => {
  it('flags the assistant fallback phrases', () => {
    expect(detectUnanswered('Je préfère vérifier cette information avant de vous répondre…', false)).toBe('fallback');
    expect(detectUnanswered('Je ne trouve pas cette information de manière fiable sur le site actuellement.', false)).toBe('fallback');
  });

  it('flags an empty final search, and ignores normal answers', () => {
    expect(detectUnanswered('Voici deux références…', true)).toBe('no_results');
    expect(detectUnanswered('Voici deux références…', false)).toBeNull();
  });
});

describe('logUnansweredQuestion', () => {
  it('inserts a new redacted question', async () => {
    await logUnansweredQuestion('Avez-vous du Oud Wood ? Mon mail: a@b.com', 'no_results');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'no_results', question: expect.not.stringContaining('a@b.com') }),
    );
    expect(mockDeleteLt).toHaveBeenCalled();
  });

  it('increments the counter instead of duplicating an open question', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'abc', occurrences: 2 }, error: null });
    await logUnansweredQuestion('Livrez-vous à Korhogo ?', 'fallback');
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'abc');
  });

  it('ignores trivial input and never throws when the table is missing', async () => {
    await logUnansweredQuestion('ok', 'fallback');
    expect(mockInsert).not.toHaveBeenCalled();

    mockMaybeSingle.mockResolvedValue({ data: null, error: { code: '42P01', message: 'relation does not exist' } });
    await expect(logUnansweredQuestion('Question parfaitement valable', 'fallback')).resolves.toBeUndefined();
  });
});
