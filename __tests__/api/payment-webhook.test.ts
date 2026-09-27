import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';

const WEBHOOK_SECRET = 'test_webhook_secret_xyz';
vi.stubEnv('JEKO_WEBHOOK_SECRET', WEBHOOK_SECRET);
vi.stubEnv('RESEND_API_KEY', 're_test_key');

/* ── Supabase service mock ───────────────────────────────────────────────── */

const mockOrderSingle = vi.fn();
const mockOrderTxnSingle = vi.fn();
const mockOrderUpdate = vi.fn();
const mockOrderItems = vi.fn();

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
  if (table === 'order_items') {
    return {
      select: () => ({
        eq: mockOrderItems,
      }),
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
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  mockOrderSingle.mockResolvedValue({
    data: {
      id: ORDER_ID,
      status: 'pending',
      payment_status: 'pending',
      total_amount: 37500,
      payment_method: 'mobile_money',
      payment_reference: 'txn-abc-123',
      shipping_address: {
        firstName: 'Awa',
        lastName: 'Kouassi',
        address: 'Cocody',
        city: 'Abidjan',
        country: "Côte d'Ivoire",
      },
      phone: '0700000000',
      email: 'client@example.com',
      created_at: '2026-09-22T10:00:00.000Z',
    },
    error: null,
  });
  mockOrderItems.mockResolvedValue({
    data: [{
      product_id: 'product-1',
      quantity: 1,
      unit_price: 37500,
      products: { name: 'Parfum Test', brand: 'Maison Test' },
    }],
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

  it('envoie la confirmation au client et une copie au vendeur', async () => {
    await POST(makeRequest(SUCCESS_PAYLOAD));

    const messages = vi.mocked(fetch).mock.calls.map(([, init]) => {
      return JSON.parse(String(init?.body)) as {
        to: string;
        attachments: Array<{ filename: string; content: string }>;
      };
    });

    expect(messages.map((message) => message.to)).toEqual(
      expect.arrayContaining(['client@example.com', 'commande@vipparfumeriebar.com'])
    );
    expect(messages).toHaveLength(2);
    expect(messages.every((message) =>
      message.attachments[0].filename.endsWith('.pdf') && message.attachments[0].content.length > 0
    )).toBe(true);
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

// Placed last: stubs WhatsApp env vars that must NOT leak into earlier tests
// (vitest doesn't auto-restore vi.stubEnv between tests in this file).
describe('POST /api/payment/webhook — copie WhatsApp à la boutique', () => {
  it('n\'appelle pas l\'API WhatsApp quand elle n\'est pas configurée', async () => {
    await POST(makeRequest(SUCCESS_PAYLOAD));
    const waCalls = vi.mocked(fetch).mock.calls.filter(([input]) => String(input).includes('graph.facebook.com'));
    expect(waCalls).toHaveLength(0);
  });

  it('upload le PDF puis envoie le template WhatsApp quand configuré', async () => {
    vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'test_wa_token');
    vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', 'phone-id-123');
    vi.stubEnv('WHATSAPP_SHOP_NOTIFICATION_NUMBER', '2250700000000');

    vi.mocked(fetch).mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('/media')) {
        return { ok: true, json: async () => ({ id: 'media-id-999' }), text: async () => '' } as Response;
      }
      return { ok: true, json: async () => ({}), text: async () => '' } as Response;
    });

    await POST(makeRequest(SUCCESS_PAYLOAD));

    const calls = vi.mocked(fetch).mock.calls;
    const mediaCall = calls.find(([input]) => String(input).includes('/media'));
    const messageCall = calls.find(([input]) => String(input).includes('/messages') && String(input).includes('graph.facebook.com'));

    expect(mediaCall).toBeDefined();
    expect(messageCall).toBeDefined();

    const messageBody = JSON.parse(String(messageCall?.[1]?.body)) as {
      to: string;
      template: { name: string; components: Array<{ type: string; parameters: Array<Record<string, unknown>> }> };
    };
    expect(messageBody.to).toBe('2250700000000');
    expect(messageBody.template.name).toBe('nouvelle_commande_payee');

    const header = messageBody.template.components.find((c) => c.type === 'header');
    expect(header?.parameters[0]).toEqual(
      expect.objectContaining({ type: 'document', document: expect.objectContaining({ id: 'media-id-999' }) })
    );

    const body = messageBody.template.components.find((c) => c.type === 'body');
    expect(body?.parameters).toHaveLength(4);
  });
});
