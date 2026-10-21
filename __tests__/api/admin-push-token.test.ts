import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const ADMIN = { id: 'admin-1', app_metadata: { role: 'admin' } };
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: ADMIN } });
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockEqUser = vi.fn().mockResolvedValue({ error: null });
const mockEqToken = vi.fn(() => ({ eq: mockEqUser }));
const mockDelete = vi.fn(() => ({ eq: mockEqToken }));
const mockFrom = vi.fn(() => ({ delete: mockDelete }));
const mockServiceFrom = vi.fn(() => ({ upsert: mockUpsert }));

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ from: mockFrom, auth: { getUser: mockGetUser } })),
}));
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockServiceFrom })),
}));

const TOKEN = 'dQw4w9WgXcQ:APA91bE-token_value.0123456789abcdef';

function post(body: unknown, raw = false) {
  return new NextRequest('http://localhost/api/admin/push-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

function del(token?: string) {
  const query = token === undefined ? '' : `?token=${encodeURIComponent(token)}`;
  return new NextRequest(`http://localhost/api/admin/push-token${query}`, { method: 'DELETE' });
}

const { POST, DELETE } = await import('@/app/api/admin/push-token/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: ADMIN } });
  mockUpsert.mockResolvedValue({ error: null });
  mockEqUser.mockResolvedValue({ error: null });
});

describe('POST /api/admin/push-token', () => {
  it('refuse un utilisateur non administrateur', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'client-1', app_metadata: {} } } });
    const response = await POST(post({ token: TOKEN }));
    expect(response.status).toBe(403);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('enregistre le jeton au nom de l’administrateur connecté', async () => {
    const response = await POST(post({ token: TOKEN, platform: 'android' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mockServiceFrom).toHaveBeenCalledWith('admin_push_tokens');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'admin-1', token: TOKEN, platform: 'android' }),
      { onConflict: 'token' },
    );
  });

  it.each([{}, { token: 42 }, { token: 'court' }, { token: `${TOKEN} avec espace` }, { token: 'a'.repeat(5000) }, { token: TOKEN, platform: 'ios' }])(
    'refuse un corps invalide (%j)',
    async (body) => {
      const response = await POST(post(body));
      expect(response.status).toBe(400);
      expect(mockUpsert).not.toHaveBeenCalled();
    },
  );

  it('n’enregistre rien sans utilisateur vérifié', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await POST(post({ token: TOKEN }));
    expect(response.status).toBe(401);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('refuse un corps qui n’est pas du JSON', async () => {
    const response = await POST(post('{pas du json', true));
    expect(response.status).toBe(400);
  });

  it('vérifie l’utilisateur et son rôle en un seul appel à Supabase Auth', async () => {
    await POST(post({ token: TOKEN }));
    expect(mockGetUser).toHaveBeenCalledOnce();
  });

  it('erreur inattendue (ex. clé service absente) : réponse JSON { error }, sans détail interne', async () => {
    mockServiceFrom.mockImplementationOnce(() => {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante');
    });
    const response = await POST(post({ token: TOKEN }));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'Erreur serveur. Réessayez dans un instant.' });
  });

  it('ne divulgue pas le message d’erreur de la base', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'relation "admin_push_tokens" does not exist' } });
    const response = await POST(post({ token: TOKEN }));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain('relation');
  });
});

describe('DELETE /api/admin/push-token', () => {
  it('refuse un utilisateur non administrateur', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'client-1', app_metadata: {} } } });
    const response = await DELETE(del(TOKEN));
    expect(response.status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('supprime uniquement le jeton de l’administrateur connecté', async () => {
    const response = await DELETE(del(TOKEN));
    expect(response.status).toBe(200);
    expect(mockEqToken).toHaveBeenCalledWith('token', TOKEN);
    expect(mockEqUser).toHaveBeenCalledWith('user_id', 'admin-1');
  });

  it('sans utilisateur connecté : 401 (et non 403)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await DELETE(del(TOKEN));
    expect(response.status).toBe(401);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('erreur inattendue : réponse JSON { error }', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Auth injoignable'));
    const response = await DELETE(del(TOKEN));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Erreur serveur. Réessayez dans un instant.' });
  });

  it.each([undefined, 'court', 'a b c d e f g h i j k l m n o p'])('refuse un jeton absent ou invalide (%s)', async (token) => {
    const response = await DELETE(del(token));
    expect(response.status).toBe(400);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
