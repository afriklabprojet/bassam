import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';

/**
 * Route-level tests for POST /api/payment/webhook.
 *
 * Vérifie :
 *   - rejet de la mauvaise signature (401)
 *   - référence inconnue → 200 (pas de retry infini côté Jeko)
 *   - idempotence : commande déjà dans un état final → skip sans update
 *   - succès : mise à jour vers `paid` / `confirmed`
 *   - échec paiement : mise à jour vers `failed` / `cancelled`
 */

const TEST_SECRET = 'test_webhook_secret_route_12345';
vi.stubEnv('JEKO_WEBHOOK_SECRET', TEST_SECRET);
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role');

// ── Mock Supabase service client — chainable builder ─────────────────────
const mockSingle = vi.fn();
const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect, update: mockUpdate }));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

const { POST } = await import('@/app/api/payment/webhook/route');

function sign(body: string): string {
  return crypto.createHmac('sha256', TEST_SECRET).update(body, 'utf8').digest('hex');
}

function makeRequest(body: unknown, signature?: string): NextRequest {
  const raw = JSON.stringify(body);
  return new NextRequest('http://localhost/api/payment/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-jeko-signature': signature ?? sign(raw),
    },
    body: raw,
  });
}

const BASE_PAYLOAD = {
  event: 'payment.success' as const,
  transactionId: 'jeko-txn-1',
  reference: '11111111-1111-1111-1111-111111111111',
  amount: 50000,
  currency: 'XOF',
  status: 'success' as const,
  provider: 'orange_money',
  phone: '+2250700000000',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateEq.mockResolvedValue({ error: null });
});

describe('POST /api/payment/webhook', () => {
  it('rejette avec 401 si la signature est invalide', async () => {
    const res = await POST(makeRequest(BASE_PAYLOAD, 'bad-signature'));
    expect(res.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('retourne 400 pour un body signé mais non-JSON', async () => {
    const raw = 'not json at all';
    const req = new NextRequest('http://localhost/api/payment/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-jeko-signature': crypto.createHmac('sha256', TEST_SECRET).update(raw, 'utf8').digest('hex'),
      },
      body: raw,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retourne 200 sans update pour une référence inconnue (pas de retry Jeko)', async () => {
    // Both id lookup and payment_reference fallback miss.
    mockSingle.mockResolvedValue({ data: null, error: { message: 'no rows' } });
    const res = await POST(makeRequest(BASE_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('est idempotent : ignore une commande déjà payée (replay)', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: BASE_PAYLOAD.reference, status: 'confirmed', payment_status: 'paid' },
      error: null,
    });
    const res = await POST(makeRequest(BASE_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('est idempotent : ignore une commande déjà remboursée', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: BASE_PAYLOAD.reference, status: 'cancelled', payment_status: 'refunded' },
      error: null,
    });
    const res = await POST(makeRequest(BASE_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('marque la commande comme payée sur payment.success', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: BASE_PAYLOAD.reference, status: 'pending', payment_status: 'pending' },
      error: null,
    });
    const res = await POST(makeRequest(BASE_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      payment_status: 'paid',
      status: 'confirmed',
      payment_reference: BASE_PAYLOAD.transactionId,
    });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', BASE_PAYLOAD.reference);
  });

  it('marque la commande comme échouée sur payment.failed', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: BASE_PAYLOAD.reference, status: 'pending', payment_status: 'pending' },
      error: null,
    });
    const failedPayload = { ...BASE_PAYLOAD, event: 'payment.failed' as const, status: 'failed' as const };
    const res = await POST(makeRequest(failedPayload));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      payment_status: 'failed',
      status: 'cancelled',
    });
  });

  it('ignore les événements inconnus (forward-compat)', async () => {
    const unknown = { ...BASE_PAYLOAD, event: 'payment.pending' as unknown as 'payment.success' };
    const res = await POST(makeRequest(unknown));
    expect(res.status).toBe(200);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('retourne 500 si l\'update DB échoue', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: BASE_PAYLOAD.reference, status: 'pending', payment_status: 'pending' },
      error: null,
    });
    mockUpdateEq.mockResolvedValueOnce({ error: { message: 'boom' } });
    const res = await POST(makeRequest(BASE_PAYLOAD));
    expect(res.status).toBe(500);
  });
});
