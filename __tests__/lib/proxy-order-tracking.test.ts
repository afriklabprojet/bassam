import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser: mockGetUser } }),
}));

function req(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

// Le suivi sert d'abord aux clients sans compte : ni la page ni son API ne doivent exiger une connexion.
describe('proxy — suivi de commande public', () => {
  let proxy: (r: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    ({ proxy } = await import('@/proxy'));
  });

  it.each(['/suivi-commande', '/suivi-commande?ref=VIP-ABCDEF12', '/api/orders/track'])(
    '%s reste accessible sans session (pas de redirection vers la connexion)',
    async (path) => {
      const res = await proxy(req(path));
      expect(res.status).not.toBe(307);
      expect(res.headers.get('location') ?? '').not.toContain('/auth/login');
    },
  );

  it('une page privée redirige toujours vers la connexion sans session', async () => {
    const res = await proxy(req('/compte'));
    expect(res.headers.get('location') ?? '').toContain('/auth/login');
  });
});
