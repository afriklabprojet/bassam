import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/* ── Mocks ───────────────────────────────────────────────────────────────── */

const mockIsAdmin = vi.fn().mockResolvedValue(true);
const mockUpdateOrderStatus = vi.fn();
const mockGetAdminOrders = vi.fn().mockResolvedValue({ orders: [], total: 0 });
const mockGetOrderCountByPhone = vi.fn().mockResolvedValue(0);

vi.mock('@/lib/supabase/admin', () => ({
  isCurrentUserAdmin: mockIsAdmin,
  getAdminOrders: mockGetAdminOrders,
  getOrderCountByPhone: mockGetOrderCountByPhone,
  updateOrderStatus: mockUpdateOrderStatus,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}));

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function makePatch(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGet(params?: Record<string, string>) {
  const url = new URL('http://localhost/api/admin/orders');
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString(), { method: 'GET' });
}

/* ── Tests ───────────────────────────────────────────────────────────────── */

describe('PATCH /api/admin/orders', () => {
  let PATCH: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockIsAdmin.mockResolvedValue(true);
    const mod = await import('@/app/api/admin/orders/route');
    PATCH = mod.PATCH;
  });

  it('retourne 403 si l\'utilisateur n\'est pas admin', async () => {
    mockIsAdmin.mockResolvedValue(false);
    const req = makePatch({ id: 'order-1', status: 'confirmed' });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('retourne 400 si l\'id est manquant', async () => {
    const req = makePatch({ status: 'confirmed' });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si le statut est invalide', async () => {
    const req = makePatch({ id: 'order-1', status: 'invalid_status' });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('accepte tous les statuts valides', async () => {
    mockUpdateOrderStatus.mockResolvedValue({ error: null });
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    for (const status of validStatuses) {
      const req = makePatch({ id: 'order-1', status });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
    }
  });

  it('retourne 200 et success:true pour une mise à jour réussie', async () => {
    mockUpdateOrderStatus.mockResolvedValue({ error: null });
    const req = makePatch({ id: 'order-uuid-1', status: 'confirmed' });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('appelle updateOrderStatus avec les bons arguments', async () => {
    mockUpdateOrderStatus.mockResolvedValue({ error: null });
    const req = makePatch({ id: 'order-uuid-2', status: 'shipped' });
    await PATCH(req);
    expect(mockUpdateOrderStatus).toHaveBeenCalledWith('order-uuid-2', 'shipped');
  });

  it('retourne 500 si updateOrderStatus échoue', async () => {
    mockUpdateOrderStatus.mockResolvedValue({ error: 'Erreur DB' });
    const req = makePatch({ id: 'order-1', status: 'confirmed' });
    const res = await PATCH(req);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/admin/orders', () => {
  let GET: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockIsAdmin.mockResolvedValue(true);
    const mod = await import('@/app/api/admin/orders/route');
    GET = mod.GET;
  });

  it('retourne 403 si l\'utilisateur n\'est pas admin', async () => {
    mockIsAdmin.mockResolvedValue(false);
    const req = makeGet();
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('retourne la liste des commandes pour un admin', async () => {
    mockGetAdminOrders.mockResolvedValue({ orders: [{ id: 'order-1' }], total: 1 });
    const req = makeGet();
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders).toHaveLength(1);
  });

  it('retourne le compte des commandes précédentes via ?phone=&excludeId=', async () => {
    mockGetOrderCountByPhone.mockResolvedValue(3);
    const req = makeGet({ phone: '0701020304', excludeId: 'order-uuid-x' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.previousCount).toBe(3);
    expect(mockGetOrderCountByPhone).toHaveBeenCalledWith('0701020304', 'order-uuid-x');
  });
});
