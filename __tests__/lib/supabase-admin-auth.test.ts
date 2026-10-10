import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mockGetUser } })),
}));

describe('isCurrentUserAdmin', () => {
  let isCurrentUserAdmin: () => Promise<boolean>;

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ isCurrentUserAdmin } = await import('@/lib/supabase/admin'));
  });

  it('autorise un utilisateur dont le rôle admin est confirmé par Supabase', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'admin' } } }, error: null });
    await expect(isCurrentUserAdmin()).resolves.toBe(true);
  });

  it('refuse un utilisateur connecté sans rôle admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u2', app_metadata: { role: 'customer' } } }, error: null });
    await expect(isCurrentUserAdmin()).resolves.toBe(false);
  });

  it('refuse un utilisateur sans app_metadata', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u3' } }, error: null });
    await expect(isCurrentUserAdmin()).resolves.toBe(false);
  });

  it('refuse un jeton invalide ou expiré (aucun utilisateur renvoyé)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid JWT', status: 401 } });
    await expect(isCurrentUserAdmin()).resolves.toBe(false);
  });
});
