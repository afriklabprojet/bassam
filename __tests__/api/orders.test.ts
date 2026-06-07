import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/* ── Mocks ───────────────────────────────────────────────────────────────── */

const mockCheckRateLimit = vi.fn(() => ({ allowed: true, remaining: 4, resetAt: Date.now() + 300_000 }));
const mockRateLimitResponse = vi.fn(() => new Response('Too many requests', { status: 429 }));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
  rateLimitResponse: mockRateLimitResponse,
}));

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}));

const mockCreateOrder = vi.fn();
vi.mock('@/lib/supabase/orders', () => ({
  createOrder: mockCreateOrder,
  getUserOrders: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/supabase/custom-order-items', () => ({
  normalizeOrderItemsForPersistence: vi.fn((_client, items: unknown[]) =>
    Promise.resolve({ ok: true, items, notes: [] })
  ),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: vi.fn() })),
}));

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  totalAmount: 35000,
  paymentMethod: 'cash_on_delivery',
  shippingAddress: { firstName: 'Awa', lastName: 'Koné', address: 'Cocody', city: 'Abidjan', country: "Côte d'Ivoire" },
  phone: '0701020304',
  items: [{ productId: 'prod-uuid-1', quantity: 1, unitPrice: 35000 }],
};

/* ── Tests ───────────────────────────────────────────────────────────────── */

describe('POST /api/orders', () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 4, resetAt: Date.now() + 300_000 });
    const mod = await import('@/app/api/orders/route');
    POST = mod.POST;
  });

  it('retourne 429 quand le rate limit est atteint', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() + 300_000 });
    const req = makeRequest(validBody);
    await POST(req);
    expect(mockRateLimitResponse).toHaveBeenCalledOnce();
  });

  it('retourne 400 si le corps est invalide (phone manquant)', async () => {
    const { phone: _phone, ...bodyWithoutPhone } = validBody;
    const req = makeRequest(bodyWithoutPhone);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('retourne 400 si items est vide', async () => {
    const req = makeRequest({ ...validBody, items: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si paymentMethod est invalide', async () => {
    const req = makeRequest({ ...validBody, paymentMethod: 'bitcoin' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('crée la commande et retourne 201 pour un paiement à la livraison valide', async () => {
    const fakeOrder = { id: 'order-uuid-1', total_amount: 35000, status: 'pending' };
    mockCreateOrder.mockResolvedValue({ order: fakeOrder, error: null });
    const req = makeRequest(validBody);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.order).toBeDefined();
    expect(body.order.id).toBe('order-uuid-1');
  });

  it('retourne 500 si createOrder échoue', async () => {
    mockCreateOrder.mockResolvedValue({ order: null, error: 'Erreur DB' });
    const req = makeRequest(validBody);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('passe le téléphone à createOrder', async () => {
    const fakeOrder = { id: 'order-uuid-2', total_amount: 35000, status: 'pending' };
    mockCreateOrder.mockResolvedValue({ order: fakeOrder, error: null });
    const req = makeRequest({ ...validBody, phone: '0700000001' });
    await POST(req);
    expect(mockCreateOrder).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ phone: '0700000001' }),
      expect.anything()
    );
  });
});
