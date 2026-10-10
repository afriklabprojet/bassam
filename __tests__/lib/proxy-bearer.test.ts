import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJl';

const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser: mockGetUser } }),
}));

const admin = { id: 'a1', app_metadata: { role: 'admin' } };
const customer = { id: 'c1', app_metadata: { role: 'customer' } };

function req(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe('proxy — Authorization: Bearer sur /api/admin', () => {
  let proxy: (r: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    ({ proxy } = await import('@/proxy'));
  });

  it('laisse passer un jeton Bearer d\'admin et le vérifie auprès de Supabase', async () => {
    mockGetUser.mockResolvedValue({ data: { user: admin }, error: null });
    const res = await proxy(req('/api/admin/orders', { authorization: `Bearer ${JWT}` }));

    expect(res.status).toBe(200);
    expect(mockGetUser).toHaveBeenCalledWith(JWT);
  });

  it('retourne 403 pour un jeton valide d\'un non-admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: customer }, error: null });
    const res = await proxy(req('/api/admin/orders', { authorization: `Bearer ${JWT}` }));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBeTruthy();
  });

  it('retourne 401 pour un jeton refusé par Supabase (expiré, révoqué, utilisateur supprimé)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid JWT' } });
    const res = await proxy(req('/api/admin/orders', { authorization: `Bearer ${JWT}` }));

    expect(res.status).toBe(401);
  });

  it('retourne 401 pour un Bearer mal formé, sans retomber sur les cookies', async () => {
    mockGetUser.mockResolvedValue({ data: { user: admin }, error: null });
    const res = await proxy(
      req('/api/admin/orders', { authorization: 'Bearer pas-un-jwt', cookie: 'sb-session=valide' })
    );

    expect(res.status).toBe(401);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('sans Authorization : continue d\'utiliser la session par cookies', async () => {
    mockGetUser.mockResolvedValue({ data: { user: admin }, error: null });
    const res = await proxy(req('/api/admin/orders', { cookie: 'sb-session=valide' }));

    expect(res.status).toBe(200);
    expect(mockGetUser).toHaveBeenCalledWith();
  });

  it('sans Authorization ni session : 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });
    const res = await proxy(req('/api/admin/orders'));

    expect(res.status).toBe(401);
  });

  it('ignore le Bearer hors de /api/admin (pages admin et routes publiques)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: admin }, error: null });

    await proxy(req('/admin/commandes', { authorization: `Bearer ${JWT}` }));
    expect(mockGetUser).toHaveBeenCalledWith();

    mockGetUser.mockClear();
    await proxy(req('/api/products', { authorization: `Bearer ${JWT}` }));
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});
