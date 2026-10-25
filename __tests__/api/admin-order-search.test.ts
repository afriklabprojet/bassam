import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockIsAdmin = vi.fn();
const mockSearch = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({ isCurrentUserAdmin: mockIsAdmin }));
vi.mock('@/lib/supabase/admin-order-search', () => ({ searchOrdersByTrackingNumber: mockSearch }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

function makeGet(q?: string) {
  const url = new URL('http://localhost/api/admin/orders/search');
  if (q !== undefined) url.searchParams.set('q', q);
  return new NextRequest(url.toString(), { method: 'GET' });
}

describe('GET /api/admin/orders/search', () => {
  let GET: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockIsAdmin.mockResolvedValue(true);
    GET = (await import('@/app/api/admin/orders/search/route')).GET;
  });

  it('retourne 403 sans interroger la base si l\'utilisateur n\'est pas admin', async () => {
    mockIsAdmin.mockResolvedValue(false);
    const res = await GET(makeGet('VIP-3F2A9C1B'));
    expect(res.status).toBe(403);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('retourne 400 si le champ est vide', async () => {
    for (const q of [undefined, '', '   ']) {
      const res = await GET(makeGet(q));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('Veuillez saisir un numéro de suivi.');
    }
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('retourne 400 si la saisie est trop longue', async () => {
    const res = await GET(makeGet('A'.repeat(65)));
    expect(res.status).toBe(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('retourne 400 si le format est invalide', async () => {
    mockSearch.mockResolvedValue({ ok: false, reason: 'invalid' });
    const res = await GET(makeGet('abc'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('VIP-3F2A9C1B');
  });

  it('retourne 200 et une liste vide quand aucune commande ne correspond', async () => {
    mockSearch.mockResolvedValue({ ok: true, orders: [] });
    const res = await GET(makeGet('VIP-3F2A9C1B'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ orders: [] });
  });

  it('retourne les commandes trouvées, sans mise en cache', async () => {
    mockSearch.mockResolvedValue({ ok: true, orders: [{ id: 'o1', trackingNumber: 'VIP-3F2A9C1B' }] });
    const res = await GET(makeGet('  vip-3f2a9c1b '));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect((await res.json()).orders).toHaveLength(1);
    expect(mockSearch).toHaveBeenCalledWith('vip-3f2a9c1b');
  });

  it('retourne 500 sans détail interne en cas d\'erreur de base', async () => {
    mockSearch.mockResolvedValue({ ok: false, reason: 'error' });
    const res = await GET(makeGet('VIP-3F2A9C1B'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Erreur serveur' });
  });

  it('retourne 500 si la recherche lève une exception', async () => {
    mockSearch.mockRejectedValue(new Error('secret interne'));
    const res = await GET(makeGet('VIP-3F2A9C1B'));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret');
  });
});
