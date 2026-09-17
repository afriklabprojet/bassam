import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';

const WEBHOOK_SECRET = 'test_webhook_secret_xyz';
vi.stubEnv('JEKO_WEBHOOK_SECRET', WEBHOOK_SECRET);

/* ── Supabase service mock ───────────────────────────────────────────────── */

const mockOrderSingle = vi.fn();
const mockOrderTxnSingle = vi.fn();
const mockOrderUpdate = vi.fn();

const mockFrom = vi.fn((table: string) => {
  if (table === 'orders') {
    return {
      select: () => ({
        eq: (col: string) => ({
          single: col === 'id' ? mockOrderSingle : mockOrderTxnSingle,
        }),
      }),
      update: mockOrderUpdate,
    };
  }
  return {};
});

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

const ORDER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PAYMENT_REQUEST_ID = 'payreq-xyz-789';

function sign(body: string) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(body, 'utf8').digest('hex');
}

function makeRequest(payload: object, sig?: string) {
  const body = JSON.stringify(payload);
  return new NextRequest('http://localhost:3000/api/payment/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Real header name per https://developer.jeko.africa/docs/webhooks/integration
      'jeko-signature': sig ?? sign(body),
    },
    body,
  });
}

// Real Jeko webhook shape — a flat transaction object, no {event, ...}
// envelope. Our order id is nested under transactionDetails.reference.
const SUCCESS_PAYLOAD = {
  id: 'txn-abc-123',
  amount: { amount: 37500, currency: 'XOF' },
  status: 'success',
  paymentMethod: 'orange',
  transactionType: 'PaymentRequest',
  counterpartIdentifier: '0700000000',
  transactionDetails: {
    id: PAYMENT_REQUEST_ID,
    reference: ORDER_ID,
  },
};

const ERROR_PAYLOAD = { ...SUCCESS_PAYLOAD, status: 'error' };
const PENDING_PAYLOAD = { ...SUCCESS_PAYLOAD, status: 'pending' };

const { POST } = await import('@/app/api/payment/webhook/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockOrderSingle.mockResolvedValue({
    data: { id: ORDER_ID, status: 'pending', payment_status: 'pending' },
    error: null,
  });
  mockOrderUpdate.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
});

/* ── Tests ───────────────────────────────────────────────────────────────── */

describe('POST /api/payment/webhook — sécurité', () => {
  it('rejette une signature invalide (401)', async () => {
    const res = await POST(makeRequest(SUCCESS_PAYLOAD, 'mauvaise_signature'));
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/signature/i);
  });

  it('rejette une signature vide (401)', async () => {
    const res = await POST(makeRequest(SUCCESS_PAYLOAD, ''));
    expect(res.status).toBe(401);
  });

  it('accepte une signature correcte sur le header Jeko-Signature', async () => {
    const res = await POST(makeRequest(SUCCESS_PAYLOAD));
    expect(res.status).toBe(200);
  });

  it('accepte une signature préfixée sha256=', async () => {
    const body = JSON.stringify(SUCCESS_PAYLOAD);
    const sig = 'sha256=' + sign(body);
    const res = await POST(makeRequest(SUCCESS_PAYLOAD, sig));
    expect(res.status).toBe(200);
  });
});

describe('POST /api/payment/webhook — status success', () => {
  it('met à jour la commande en paid + confirmed', async () => {
    await POST(makeRequest(SUCCESS_PAYLOAD));
    expect(mockOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_status: 'paid', status: 'confirmed' })
    );
  });

  it('stocke l\'id de transaction Jeko', async () => {
    await POST(makeRequest(SUCCESS_PAYLOAD));
    expect(mockOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_reference: 'txn-abc-123' })
    );
  });

  it('retourne { ok: true }', async () => {
    const res = await POST(makeRequest(SUCCESS_PAYLOAD));
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});

describe('POST /api/payment/webhook — status error', () => {
  it('met à jour la commande en failed + cancelled', async () => {
    await POST(makeRequest(ERROR_PAYLOAD));
    expect(mockOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_status: 'failed', status: 'cancelled' })
    );
  });
});

describe('POST /api/payment/webhook — idempotence', () => {
  it('ignore une commande déjà en état final "paid"', async () => {
    mockOrderSingle.mockResolvedValue({
      data: { id: ORDER_ID, status: 'confirmed', payment_status: 'paid' },
      error: null,
    });
    const res = await POST(makeRequest(SUCCESS_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });

  it('ignore une commande déjà en état final "failed"', async () => {
    mockOrderSingle.mockResolvedValue({
      data: { id: ORDER_ID, status: 'cancelled', payment_status: 'failed' },
      error: null,
    });
    await POST(makeRequest(ERROR_PAYLOAD));
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });

  it('ignore une commande déjà "refunded"', async () => {
    mockOrderSingle.mockResolvedValue({
      data: { id: ORDER_ID, status: 'refunded', payment_status: 'refunded' },
      error: null,
    });
    await POST(makeRequest(SUCCESS_PAYLOAD));
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });
});

describe('POST /api/payment/webhook — fallback par payment_reference', () => {
  it('trouve la commande par payment_reference (transactionDetails.id) si référence inconnue', async () => {
    mockOrderSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    mockOrderTxnSingle.mockResolvedValue({
      data: { id: ORDER_ID, status: 'pending', payment_status: 'pending' },
      error: null,
    });

    const res = await POST(makeRequest(SUCCESS_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockOrderUpdate).toHaveBeenCalled();
  });

  it('retourne 200 (sans update) si commande introuvable même par payment_reference', async () => {
    mockOrderSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    mockOrderTxnSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const res = await POST(makeRequest(SUCCESS_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });
});

describe('POST /api/payment/webhook — status non terminal', () => {
  it('retourne 200 sans update pour un status "pending"', async () => {
    const res = await POST(makeRequest(PENDING_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });
});
