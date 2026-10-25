import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';

/** Paiement échoué : la commande passe à « annulée » et le client en est prévenu par e-mail, une seule fois. */

const WEBHOOK_SECRET = 'test_webhook_secret_failure';
vi.stubEnv('JEKO_WEBHOOK_SECRET', WEBHOOK_SECRET);

const ORDER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const ORDER = { id: ORDER_ID, status: 'pending', payment_status: 'pending', total_amount: 42000 };

const claimSelect = vi.fn().mockResolvedValue({ data: [{ id: ORDER_ID }], error: null });
const claimGuard = vi.fn(() => ({ select: claimSelect }));

const mockFrom = vi.fn((table: string) => {
  if (table === 'orders') {
    return {
      select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue({ data: ORDER, error: null }) }) }),
      update: () => ({ eq: () => ({ eq: claimGuard, is: claimGuard }) }),
    };
  }
  if (table === 'order_items') {
    return { select: () => ({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) };
  }
  return {};
});

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom, rpc: vi.fn().mockResolvedValue({ data: false, error: null }) })),
}));
vi.mock('@/lib/promo', () => ({
  consumeOrderPromoUseOnPayment: vi.fn().mockResolvedValue(false),
  releaseOrderPromoUse: vi.fn().mockResolvedValue(undefined),
}));

const sendOrderNotifications = vi.fn<(supabase: unknown, id: string) => Promise<void>>();
const sendOrderStatusEmail = vi.fn<(supabase: unknown, id: string, kind: string) => Promise<void>>();
vi.mock('@/lib/order-notifications', () => ({
  sendOrderNotifications: (...args: [unknown, string]) => sendOrderNotifications(...args),
  sendOrderStatusEmail: (...args: [unknown, string, string]) => sendOrderStatusEmail(...args),
}));

const notifyAdminsOfPaidOrder = vi.fn<(supabase: unknown, order: unknown) => Promise<void>>();
vi.mock('@/lib/push/fcm', () => ({
  notifyAdminsOfPaidOrder: (...args: [unknown, unknown]) => notifyAdminsOfPaidOrder(...args),
}));

const { POST } = await import('@/app/api/payment/webhook/route');

function jekoRequest(status: 'success' | 'error') {
  const body = JSON.stringify({
    id: 'txn-fail-1',
    amount: { amount: 42000, currency: 'XOF' },
    status,
    paymentMethod: 'wave',
    transactionType: 'PaymentRequest',
    transactionDetails: { id: 'payreq-fail-1', reference: ORDER_ID },
  });
  const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body, 'utf8').digest('hex');
  return new NextRequest('http://localhost:3000/api/payment/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'jeko-signature': signature },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  claimSelect.mockResolvedValue({ data: [{ id: ORDER_ID }], error: null });
  sendOrderStatusEmail.mockResolvedValue(undefined);
  sendOrderNotifications.mockResolvedValue(undefined);
  notifyAdminsOfPaidOrder.mockResolvedValue(undefined);
});

describe('POST /api/payment/webhook — paiement échoué', () => {
  it('prévient le client que le paiement n’a pas abouti et que la commande est annulée', async () => {
    const res = await POST(jekoRequest('error'));
    expect(res.status).toBe(200);
    expect(sendOrderStatusEmail).toHaveBeenCalledTimes(1);
    expect(sendOrderStatusEmail).toHaveBeenCalledWith(expect.anything(), ORDER_ID, 'payment_failed');
    expect(sendOrderNotifications).not.toHaveBeenCalled();
    expect(notifyAdminsOfPaidOrder).not.toHaveBeenCalled();
  });

  it('livraison concurrente déjà traitée : aucun e-mail en double', async () => {
    claimSelect.mockResolvedValue({ data: [], error: null });
    await POST(jekoRequest('error'));
    expect(sendOrderStatusEmail).not.toHaveBeenCalled();
  });

  it('commande déjà annulée par l’admin : pas de second e-mail d’annulation', async () => {
    ORDER.status = 'cancelled';
    try {
      await POST(jekoRequest('error'));
      expect(sendOrderStatusEmail).not.toHaveBeenCalled();
    } finally {
      ORDER.status = 'pending';
    }
  });

  it('un échec de l’e-mail ne change pas la réponse à Jeko', async () => {
    sendOrderStatusEmail.mockRejectedValue(new Error('Resend indisponible'));
    const res = await POST(jekoRequest('error'));
    expect(res.status).toBe(200);
  });

  it('paiement réussi : pas d’e-mail « paiement échoué » (la confirmation part à la place)', async () => {
    await POST(jekoRequest('success'));
    expect(sendOrderStatusEmail).not.toHaveBeenCalled();
    expect(sendOrderNotifications).toHaveBeenCalledTimes(1);
  });
});
