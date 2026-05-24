import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/* ── Mocks ───────────────────────────────────────────────────────────────── */

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}));

const mockOrderUpdate = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
const mockServiceFrom = vi.fn((table: string) => {
  if (table === 'orders') return { update: mockOrderUpdate };
  if (table === 'products') return { select: () => ({ in: mockProductsIn }) };
  if (table === 'order_items') return { insert: mockItemsInsert };
  if (table === 'site_settings') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) };
  return {};
});
const mockProductsIn = vi.fn();
const mockItemsInsert = vi.fn(() => Promise.resolve({ error: null }));
const mockOrderInsertSingle = vi.fn();
const mockOrderInsert = vi.fn(() => ({ select: () => ({ single: mockOrderInsertSingle }) }));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: mockServiceFrom,
  })),
}));

vi.mock('@/lib/supabase/custom-order-items', () => ({
  normalizeOrderItemsForPersistence: vi.fn((_client, items: unknown[]) =>
    Promise.resolve({ ok: true, items, notes: [] })
  ),
}));

const mockInitiatePayment = vi.fn();
vi.mock('@/lib/payment/jeko', () => ({
  initiatePayment: mockInitiatePayment,
  mapProvider: (p: string) => p + '_mapped',
  JEKO_CURRENCY: 'XOF',
}));

const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';
const ORDER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const VALID_BODY = {
  totalAmount: 35000,
  paymentMethod: 'orange',
  mobileNumber: '0700000000',
  shippingAddress: {
    firstName: 'Awa',
    lastName: 'Traoré',
    address: 'Plateau',
    city: 'Abidjan',
    country: "Côte d'Ivoire",
  },
  phone: '0700000000',
  items: [{ productId: PRODUCT_ID, quantity: 1, unitPrice: 35000 }],
};

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/payment/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/* ── Import after mocks ──────────────────────────────────────────────────── */
const { POST } = await import('@/app/api/payment/initiate/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: null } });
  mockProductsIn.mockResolvedValue({
    data: [{ id: PRODUCT_ID, price: 35000, stock_quantity: 10 }],
    error: null,
  });
  mockOrderInsertSingle.mockResolvedValue({
    data: {
      id: ORDER_ID,
      status: 'pending',
      total_amount: 37500,
      payment_method: 'mobile_money',
      payment_status: 'pending',
      shipping_address: VALID_BODY.shippingAddress,
      phone: VALID_BODY.phone,
      email: 'guest@vip-parfumerie.local',
      notes: null,
      created_at: '2026-05-24T00:00:00.000Z',
    },
    error: null,
  });
  mockItemsInsert.mockResolvedValue({ error: null });
  mockInitiatePayment.mockResolvedValue({
    id: 'txn-abc-123',
    storeId: 'store-uuid',
    reference: ORDER_ID,
    type: 'redirect',
    paymentMethod: 'orange',
    status: 'pending',
    errorReason: null,
    transaction: null,
    redirectUrl: 'https://pay.jeko.africa/payment/txn-abc-123',
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockServiceFrom.mockImplementation((table: string): any => {
    if (table === 'orders') return { insert: mockOrderInsert, update: mockOrderUpdate };
    if (table === 'products') return { select: () => ({ in: mockProductsIn }) };
    if (table === 'order_items') return { insert: mockItemsInsert };
    if (table === 'site_settings') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }) }) };
    return {};
  });
  mockOrderUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
});

/* ── Tests ───────────────────────────────────────────────────────────────── */

describe('POST /api/payment/initiate — validation', () => {
  it('rejette un montant négatif', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, totalAmount: -1 }));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/montant/i);
  });

  it('rejette un opérateur inconnu', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, paymentMethod: 'visa' }));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/opérateur/i);
  });

  it('rejette un numéro Mobile Money trop court', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, phone: '123' }));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/mobile money/i);
  });

  it('rejette une adresse de livraison incomplète', async () => {
    const res = await POST(makeRequest({
      ...VALID_BODY,
      shippingAddress: { firstName: 'Awa', lastName: 'Traoré', city: 'Abidjan', country: "Côte d'Ivoire" },
    }));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/adresse/i);
  });

  it("rejette une liste d'articles vide", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, items: [] }));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/article/i);
  });

  it('accepte tous les opérateurs valides', async () => {
    for (const op of ['orange', 'mtn', 'wave', 'moov', 'djamo']) {
      const res = await POST(makeRequest({ ...VALID_BODY, paymentMethod: op }));
      expect(res.status).not.toBe(400);
    }
  });
});

describe('POST /api/payment/initiate — flux nominal', () => {
  it('retourne 201 avec orderId, transactionId et redirectUrl', async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json() as { orderId: string; transactionId: string; redirectUrl: string; status: string };
    expect(body.orderId).toBe(ORDER_ID);
    expect(body.transactionId).toBe('txn-abc-123');
    expect(body.redirectUrl).toBe('https://pay.jeko.africa/payment/txn-abc-123');
    expect(body.status).toBe('pending');
  });

  it('appelle initiatePayment avec la bonne devise et les URLs de redirection', async () => {
    await POST(makeRequest(VALID_BODY));
    expect(mockInitiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'XOF',
        successUrl: expect.stringContaining('/commande/confirmation'),
        errorUrl: expect.stringContaining('/commande'),
        reference: ORDER_ID,
      })
    );
  });

  it("stocke l'id Jeko sur la commande", async () => {
    await POST(makeRequest(VALID_BODY));
    expect(mockOrderUpdate).toHaveBeenCalledWith({ payment_reference: 'txn-abc-123' });
  });

  it('génère un email guest si aucun utilisateur ni email fourni', async () => {
    await POST(makeRequest({ ...VALID_BODY, email: undefined }));
    expect(mockOrderInsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: expect.stringContaining('@vip-parfumerie.local') })
    );
  });

  it("utilise l'email fourni si present", async () => {
    await POST(makeRequest({ ...VALID_BODY, email: 'client@example.com' }));
    expect(mockOrderInsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'client@example.com' })
    );
  });
});

describe('POST /api/payment/initiate — erreurs Jeko', () => {
  it('retourne 500 si Jeko lève une erreur', async () => {
    mockInitiatePayment.mockRejectedValue(new Error('Jeko API error 503'));
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/erreur serveur/i);
  });

  it('retourne 500 si la création de commande échoue', async () => {
    mockOrderInsertSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBeTruthy();
  });
});
