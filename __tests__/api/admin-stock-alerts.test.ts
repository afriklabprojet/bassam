import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockIsAdmin = vi.fn().mockResolvedValue(true);
const mockEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } });
const mockFrom = vi.fn(() => ({ update: mockUpdate }));

vi.mock('@/lib/supabase/admin', () => ({
  isCurrentUserAdmin: mockIsAdmin,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ from: mockFrom, auth: { getUser: mockGetUser } })),
}));

function makePatch(body: unknown, raw = false) {
  return new NextRequest('http://localhost/api/admin/stock-alerts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

const { PATCH } = await import('@/app/api/admin/stock-alerts/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAdmin.mockResolvedValue(true);
  mockEq.mockResolvedValue({ error: null });
});

describe('PATCH /api/admin/stock-alerts', () => {
  it('refuse un utilisateur non administrateur', async () => {
    mockIsAdmin.mockResolvedValue(false);

    const response = await PATCH(makePatch({ id: 'a1', status: 'resolved' }));

    expect(response.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('refuse un statut hors de la liste autorisée', async () => {
    const response = await PATCH(makePatch({ id: 'a1', status: 'deleted' }));

    expect(response.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it.each([{ notes: 42 }, { notes: { a: 1 } }, { notes: 'x'.repeat(2001) }])('refuse des notes invalides (%j)', async (extra) => {
    const response = await PATCH(makePatch({ id: 'a1', status: 'acknowledged', ...extra }));

    expect(response.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('refuse un corps qui n\'est pas du JSON', async () => {
    const response = await PATCH(makePatch('{pas du json', true));

    expect(response.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('met à jour une alerte avec un statut et des notes valides', async () => {
    const response = await PATCH(makePatch({ id: 'a1', status: 'resolved', notes: 'Réassort reçu' }));

    expect(response.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith('stock_alerts');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'resolved', notes: 'Réassort reçu' }));
    expect(mockEq).toHaveBeenCalledWith('id', 'a1');
  });

  it('ne divulgue pas le détail d\'une erreur SQL au client', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockEq.mockResolvedValue({ error: { message: 'relation "secret_table" violates constraint' } });

    const response = await PATCH(makePatch({ id: 'a1', status: 'resolved' }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Erreur serveur' });
    expect(JSON.stringify(body)).not.toContain('secret_table');
    expect(consoleError).toHaveBeenCalled(); // le détail reste dans les journaux serveur
    consoleError.mockRestore();
  });
});
