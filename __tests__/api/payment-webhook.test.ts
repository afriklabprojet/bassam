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

function sign(body: string) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(body, 'utf8').digest('hex');
}

function makeRequest(payload: object, sig?: string) {
  const body = JSON.stringify(payload);
  return new NextRequest('http://localhost:3000/api/payment/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-jeko-signature': sig ?? sign(body),
    },
    body,
  });
}

const SUCCESS_PAYLOAD = {
  event: 'payment.success',
  transactionId: 'txn-abc-123',
  reference: ORDER_ID,
  amount: 37500,
  currency: 'XOF',
  status: 'success',
  provider: 'orange_money',
  phone: '0700000000',
};

const FAILED_PAYLOAD = { ...SUCCESS_PAYLOAD, event: 'payment.failed', status: 'failed' };

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

  it('accepte une signature correcte', async () => {
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

describe('POST /api/payment/webhook — payment.success', () => {
  it('met à jour la commande en paid + confirmed', async () => {
    await POST(makeRequest(SUCCESS_PAYLOAD));
    expect(mockOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_status: 'paid', status: 'confirmed' })
    );
  });

  it('stocke le transactionId Jeko', async () => {
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

describe('POST /api/payment/webhook — payment.failed', () => {
  it('met à jour la commande en failed + cancelled', async () => {
    await POST(makeRequest(FAILED_PAYLOAD));
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
    await POST(makeRequest(FAILED_PAYLOAD));
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

describe('POST /api/payment/webhook — fallback par transactionId', () => {
  it('trouve la commande par payment_reference si référence inconnue', async () => {
    mockOrderSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    mockOrderTxnSingle.mockResolvedValue({
      data: { id: ORDER_ID, status: 'pending', payment_status: 'pending' },
      error: null,
    });

    const res = await POST(makeRequest(SUCCESS_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockOrderUpdate).toHaveBeenCalled();
  });

  it('retourne 200 (sans update) si commande introuvable même par transactionId', async () => {
    mockOrderSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    mockOrderTxnSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const res = await POST(makeRequest(SUCCESS_PAYLOAD));
    expect(res.status).toBe(200);
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });
});

describe('POST /api/payment/webhook — événements inconnus', () => {
  it('retourne 200 sans update pour un événement non géré', async () => {
    const unknownPayload = { ...SUCCESS_PAYLOAD, event: 'payment.refunded' };
    const res = await POST(makeRequest(unknownPayload));
    expect(res.status).toBe(200);
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });
});
