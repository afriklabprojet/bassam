import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';

/**
 * Webhook de paiement réussi : l'email/WhatsApp et la notification des téléphones admin partent en parallèle,
 * et la commande lue par le webhook est transmise telle quelle (pas de seconde lecture).
 */

const WEBHOOK_SECRET = 'test_webhook_secret_push';
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

function successRequest() {
  const body = JSON.stringify({
    id: 'txn-push-1',
    amount: { amount: 42000, currency: 'XOF' },
    status: 'success',
    paymentMethod: 'wave',
    transactionType: 'PaymentRequest',
    transactionDetails: { id: 'payreq-push-1', reference: ORDER_ID },
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
  notifyAdminsOfPaidOrder.mockResolvedValue(undefined);
});

describe('POST /api/payment/webhook — notifications', () => {
  it('lance la notification des téléphones sans attendre la fin de l’email/WhatsApp', async () => {
    let finishEmail: () => void = () => {};
    sendOrderNotifications.mockImplementation(() => new Promise<void>((resolve) => (finishEmail = resolve)));

    const response = POST(successRequest());
    await vi.waitFor(() => expect(notifyAdminsOfPaidOrder).toHaveBeenCalledOnce());
    expect(sendOrderNotifications).toHaveBeenCalledOnce();

    finishEmail();
    expect((await response).status).toBe(200);
  });

  it('transmet la commande lue par le webhook (numéro et montant)', async () => {
    sendOrderNotifications.mockResolvedValue(undefined);
    await POST(successRequest());
    expect(notifyAdminsOfPaidOrder).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: ORDER_ID, total_amount: 42000 }),
    );
  });

  it('un échec de l’email n’empêche ni la notification ni la réponse 200', async () => {
    sendOrderNotifications.mockRejectedValue(new Error('Resend indisponible'));
    const response = await POST(successRequest());
    expect(response.status).toBe(200);
    expect(notifyAdminsOfPaidOrder).toHaveBeenCalledOnce();
  });

  it('commande déjà traitée (livraison concurrente) : aucune notification', async () => {
    claimSelect.mockResolvedValue({ data: [], error: null });
    const response = await POST(successRequest());
    expect(response.status).toBe(200);
    expect(notifyAdminsOfPaidOrder).not.toHaveBeenCalled();
    expect(sendOrderNotifications).not.toHaveBeenCalled();
  });
});
