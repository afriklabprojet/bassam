import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mergePreferencesPreservingPrivileges } from '@/lib/profile-preferences';

/* ── Mocks ───────────────────────────────────────────────────────────────── */

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}));

const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();
vi.mock('@/lib/supabase/profile', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

const profile = (preferences: Record<string, unknown>) => ({ id: 'user-1', fullName: 'A', phone: null, avatarUrl: null, email: 'a@example.com', preferences, createdAt: 'x' });
const patch = (body: unknown) =>
  new NextRequest('http://localhost/api/profile', { method: 'PATCH', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
const sentPreferences = () => (mockUpdateProfile.mock.calls[0][1] as { preferences: Record<string, unknown> }).preferences;

/* ── Fusion des préférences (fonction pure) ──────────────────────────────── */

describe('mergePreferencesPreservingPrivileges', () => {
  it('ignore role et admin_level envoyés par le client, quelle que soit la casse', () => {
    const merged = mergePreferencesPreservingPrivileges({ wishlist: [] }, { role: 'admin', Admin_Level: 'super_admin', ROLE: 'admin', wishlist: [1] });
    expect(merged).toEqual({ wishlist: [1] });
  });
  it('conserve les privilèges déjà enregistrés et ignore leur modification', () => {
    const merged = mergePreferencesPreservingPrivileges({ role: 'admin', admin_level: 'admin' }, { role: 'client', admin_level: 'super_admin', wishlist: [] });
    expect(merged).toEqual({ wishlist: [], role: 'admin', admin_level: 'admin' });
  });
  it('ne crée pas de clé privilégiée quand elle n\'existe pas', () => {
    expect(Object.keys(mergePreferencesPreservingPrivileges({}, { wishlist: [] }))).toEqual(['wishlist']);
  });
});

/* ── PATCH /api/profile ──────────────────────────────────────────────────── */

describe('PATCH /api/profile — protection des privilèges (F1, couche application)', () => {
  let PATCH: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockUpdateProfile.mockImplementation(async (_id: string, input: { preferences?: Record<string, unknown> }) => ({ profile: profile(input.preferences ?? {}), error: null }));
    PATCH = (await import('@/app/api/profile/route')).PATCH;
  });

  it('401 sans utilisateur connecté, rien n\'est lu ni écrit', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await PATCH(patch({ fullName: 'X' }));
    expect(res.status).toBe(401);
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('un client qui envoie preferences.role = "admin" ne peut PAS se l\'attribuer', async () => {
    mockGetProfile.mockResolvedValue(profile({ wishlist: [] }));
    const res = await PATCH(patch({ preferences: { wishlist: [], role: 'admin', admin_level: 'super_admin' } }));
    expect(res.status).toBe(200);
    expect(sentPreferences()).not.toHaveProperty('role');
    expect(sentPreferences()).not.toHaveProperty('admin_level');
  });

  it('un administrateur qui renvoie ses préférences (page de compte) conserve son rôle et met sa liste à jour', async () => {
    mockGetProfile.mockResolvedValue(profile({ role: 'admin', admin_level: 'admin', wishlist: [] }));
    const res = await PATCH(patch({ preferences: { role: 'admin', admin_level: 'admin', wishlist: [{ id: 'p1' }] } }));
    expect(res.status).toBe(200);
    expect(sentPreferences()).toEqual({ role: 'admin', admin_level: 'admin', wishlist: [{ id: 'p1' }] });
  });

  it('un administrateur ne peut pas changer son propre niveau via l\'API', async () => {
    mockGetProfile.mockResolvedValue(profile({ role: 'admin', admin_level: 'admin' }));
    await PATCH(patch({ preferences: { role: 'admin', admin_level: 'super_admin' } }));
    expect(sentPreferences()).toMatchObject({ role: 'admin', admin_level: 'admin' });
  });

  it('un envoi de préférences SANS role ne supprime pas le rôle d\'un administrateur (remplacement complet évité)', async () => {
    mockGetProfile.mockResolvedValue(profile({ role: 'admin', admin_level: 'admin', wishlist: [] }));
    await PATCH(patch({ preferences: { wishlist: [{ id: 'p2' }] } }));
    expect(sentPreferences()).toEqual({ wishlist: [{ id: 'p2' }], role: 'admin', admin_level: 'admin' });
  });

  it('échoue fermé : profil illisible → aucune écriture (sinon un rôle existant pourrait être effacé)', async () => {
    mockGetProfile.mockResolvedValue(null);
    const res = await PATCH(patch({ preferences: { wishlist: [] } }));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('mise à jour du nom et du téléphone seule : comportement inchangé, sans lecture préalable', async () => {
    const res = await PATCH(patch({ fullName: 'Awa Koné', phone: '0700000000' }));
    expect(res.status).toBe(200);
    expect(mockGetProfile).not.toHaveBeenCalled();
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-1', { fullName: 'Awa Koné', phone: '0700000000' });
  });

  it('400 pour un corps invalide, aucune écriture', async () => {
    const res = await PATCH(patch({}));
    expect(res.status).toBe(400);
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });
});
