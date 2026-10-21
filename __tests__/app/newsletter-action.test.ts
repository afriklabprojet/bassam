// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockInsert = vi.fn();
const mockFrom = vi.fn((table: string) => ({ insert: (row: unknown) => mockInsert(table, row) }));

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': `10.1.0.${Math.floor(Math.random() * 250)}` }),
}));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
    from: mockFrom,
  }),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

const { subscribeToNewsletter } = await import('@/app/actions/newsletter.action');

beforeEach(() => {
  vi.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });
});

describe('subscribeToNewsletter', () => {
  it('enregistre l inscription sans écrire de journal d audit ni d adresse IP', async () => {
    const result = await subscribeToNewsletter({ email: 'client@example.com' });

    expect(result.success).toBe(true);
    expect(mockFrom.mock.calls.map(([table]) => table)).toEqual(['newsletter_subscriptions']);
    expect(mockInsert).toHaveBeenCalledWith(
      'newsletter_subscriptions',
      expect.objectContaining({ email: 'client@example.com', user_id: 'user-1', source: 'website' }),
    );
    expect(JSON.stringify(mockInsert.mock.calls)).not.toMatch(/ip_address|10\.1\.0\./);
  });

  it('signale une adresse déjà inscrite', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

    const result = await subscribeToNewsletter({ email: 'deja@example.com' });

    expect(result).toEqual({ success: false, message: '', error: 'Cette adresse email est déjà inscrite' });
  });
});
