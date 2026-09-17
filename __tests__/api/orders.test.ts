import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ── Mocks ───────────────────────────────────────────────────────────────── */

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}));

const mockGetUserOrders = vi.fn();
vi.mock('@/lib/supabase/orders', () => ({
  getUserOrders: mockGetUserOrders,
}));

/* ── Tests ───────────────────────────────────────────────────────────────── */
//
// NOTE: this route used to also expose POST for guest order creation
// (including a `cash_on_delivery` payment method), but nothing in the app
// calls it anymore since checkout now exclusively goes through
// /api/payment/initiate. Because /api/orders is a public route, that POST
// handler let anyone create a real, unpaid order with zero verification —
// it has been removed (see app/api/orders/route.ts). Only GET remains.

describe('GET /api/orders', () => {
  let GET: () => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/app/api/orders/route');
    GET = mod.GET;
  });

  it('retourne 401 si non authentifié', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('retourne les commandes de l\'utilisateur authentifié', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockGetUserOrders.mockResolvedValue([{ id: 'order-1' }]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders).toHaveLength(1);
    expect(mockGetUserOrders).toHaveBeenCalledWith('user-1');
  });
});
