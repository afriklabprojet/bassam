import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { decrementProductStock } from '@/lib/supabase/products';
import { verifyWebhookSignature, type JekoWebhookPayload } from '@/lib/payment/jeko';
import { logger } from '@/lib/logger';

const WEBHOOK_LOG_CONTEXT = 'API /payment/webhook';

function getWebhookEnvSnapshot() {
  return {
    hasJekoWebhookSecret: Boolean(process.env.JEKO_WEBHOOK_SECRET),
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL),
    hasSupabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
  };
}

function getWebhookCorrelationId(
  requestCorrelationId: string,
  reference?: string,
  transactionId?: string,
  resolvedOrderId?: string
) {
  return resolvedOrderId ?? reference ?? transactionId ?? requestCorrelationId;
}

/**
 * POST /api/payment/webhook
 * Receives Jeko Africa payment events and updates the corresponding order.
 *
 * Security:
 *  - HMAC-SHA256 signature verified via the `Jeko-Signature` header (see
 *    https://developer.jeko.africa/docs/webhooks/integration — NOT
 *    `X-Jeko-Signature`; that mismatch used to make every real webhook call
 *    fail signature verification and get rejected with 401, which is why
 *    orders stayed stuck on "pending" even after a successful payment)
 *  - Idempotent: skips orders already in a final payment state
 *  - Uses service-role client to bypass RLS (no user session on webhook)
 */
export async function POST(request: NextRequest) {
  const requestCorrelationId = randomUUID();
  try {
    // ── 1. Read raw body (needed for HMAC verification) ────────────────────
    const rawBody = await request.text();
    const signature = request.headers.get('jeko-signature') ?? '';

    logger.info(WEBHOOK_LOG_CONTEXT, 'Webhook received', {
      correlationId: getWebhookCorrelationId(requestCorrelationId),
      hasSignature: Boolean(signature),
      bodyBytes: rawBody.length,
      env: getWebhookEnvSnapshot(),
    });

    if (process.env.NODE_ENV === 'production' && !process.env.JEKO_WEBHOOK_SECRET) {
      logger.error(WEBHOOK_LOG_CONTEXT, 'Missing JEKO_WEBHOOK_SECRET in production', {
        correlationId: getWebhookCorrelationId(requestCorrelationId),
        hasSignature: Boolean(signature),
        bodyBytes: rawBody.length,
        env: getWebhookEnvSnapshot(),
      });

      return NextResponse.json({ error: 'Webhook configuration missing' }, { status: 503 });
    }

    // ── 2. Verify signature ─────────────────────────────────────────────────
    if (!verifyWebhookSignature(rawBody, signature)) {
      logger.warn(WEBHOOK_LOG_CONTEXT, 'Invalid Jeko signature rejected', {
        correlationId: getWebhookCorrelationId(requestCorrelationId),
        hasSignature: Boolean(signature),
        bodyBytes: rawBody.length,
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // ── 3. Parse payload ────────────────────────────────────────────────────
    let payload: JekoWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as JekoWebhookPayload;
    } catch {
      logger.warn(WEBHOOK_LOG_CONTEXT, 'Webhook payload JSON parse failed', {
        correlationId: getWebhookCorrelationId(requestCorrelationId),
        bodyBytes: rawBody.length,
      });
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Jeko sends a flat transaction object (no {event, ...} envelope). Our
    // order id was submitted as `reference` when creating the payment
    // request, and comes back nested under transactionDetails.reference.
    // transactionDetails.id is the payment-request id, matching what we
    // stored as orders.payment_reference right after initiation.
    const reference = payload.transactionDetails?.reference;
    const paymentRequestId = payload.transactionDetails?.id;
    const transactionId = payload.id;

    // Only "success" is ever sent for a completed payment (Jeko does not
    // call the webhook for failed payments at all), but handle "error"
    // defensively in case that ever changes; ignore anything else
    // (e.g. "pending") without touching the order.
    if (payload.status !== 'success' && payload.status !== 'error') {
      logger.info(WEBHOOK_LOG_CONTEXT, 'Ignoring non-terminal webhook status', {
        correlationId: getWebhookCorrelationId(requestCorrelationId, reference, transactionId),
        status: payload.status,
        reference,
        transactionId,
      });
      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceClient();

    // ── 4. Find order by reference (our order UUID) ─────────────────────────
    const { data: order, error: findError } = reference
      ? await supabase.from('orders').select('id, status, payment_status').eq('id', reference).single()
      : { data: null, error: null };

    type OrderRow = { id: string; status: string; payment_status: string };

    let resolvedOrder: OrderRow | null = order;

    if (findError || !resolvedOrder) {
      logger.warn(WEBHOOK_LOG_CONTEXT, 'Order not found by reference, trying payment_reference fallback', {
        correlationId: getWebhookCorrelationId(requestCorrelationId, reference, transactionId),
        reference,
        transactionId,
        paymentRequestId,
        status: payload.status,
      });

      // Fallback: match via payment_reference (the payment-request id we
      // stored on the order right after calling Jeko's initiation API).
      const { data: orderByTxn } = paymentRequestId
        ? await supabase.from('orders').select('id, status, payment_status').eq('payment_reference', paymentRequestId).single()
        : { data: null };

      if (!orderByTxn) {
        logger.warn(WEBHOOK_LOG_CONTEXT, 'Order not found for webhook payload', {
          correlationId: getWebhookCorrelationId(requestCorrelationId, reference, transactionId),
          reference,
          transactionId,
          paymentRequestId,
          status: payload.status,
        });
        // Return 200 to prevent Jeko from retrying indefinitely
        return NextResponse.json({ ok: true });
      }

      resolvedOrder = orderByTxn;
    }

    // ── 5. Idempotency — skip if already in a final state ──────────────────
    const finalStates = ['paid', 'failed', 'refunded'];
    if (finalStates.includes(resolvedOrder.payment_status)) {
      logger.info(WEBHOOK_LOG_CONTEXT, 'Skipping webhook for order already in final state', {
        correlationId: getWebhookCorrelationId(requestCorrelationId, reference, transactionId, resolvedOrder.id),
        orderId: resolvedOrder.id,
        paymentStatus: resolvedOrder.payment_status,
        status: payload.status,
      });
      return NextResponse.json({ ok: true });
    }

    // ── 6. Apply update based on transaction status ─────────────────────────
    const isSuccess = payload.status === 'success';
    const updates = isSuccess
      ? { payment_status: 'paid', status: 'confirmed', payment_reference: transactionId }
      : { payment_status: 'failed', status: 'cancelled' };

    const { error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', resolvedOrder.id);

    if (updateError) {
      logger.error(WEBHOOK_LOG_CONTEXT, 'Failed to update order from webhook', {
        correlationId: getWebhookCorrelationId(requestCorrelationId, reference, transactionId, resolvedOrder.id),
        orderId: resolvedOrder.id,
        transactionId,
        status: payload.status,
        targetStatus: updates.status,
        targetPaymentStatus: updates.payment_status,
        error: updateError,
      });
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }

    logger.info(WEBHOOK_LOG_CONTEXT, 'Order updated from Jeko webhook', {
      correlationId: getWebhookCorrelationId(requestCorrelationId, reference, transactionId, resolvedOrder.id),
      orderId: resolvedOrder.id,
      transactionId,
      status: payload.status,
      newStatus: updates.status,
      newPaymentStatus: updates.payment_status,
    });

    // ── 7. Deplete stock now that payment is actually confirmed ────────────
    // (nothing decrements stock earlier in the flow — see createOrder, which
    // only checks availability — so this is the one place it happens.)
    // Isolated in its own try/catch: a stock-side failure must never turn
    // into a non-200 response, or Jeko will keep retrying a webhook whose
    // order update already succeeded.
    if (isSuccess) {
      try {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', resolvedOrder.id);

        for (const item of (orderItems ?? []) as Array<{ product_id: string; quantity: number }>) {
          const result = await decrementProductStock(supabase, item.product_id, item.quantity);
          if (!result.ok) {
            logger.error(WEBHOOK_LOG_CONTEXT, 'Failed to decrement stock after payment success', {
              correlationId: getWebhookCorrelationId(requestCorrelationId, reference, transactionId, resolvedOrder.id),
              orderId: resolvedOrder.id,
              productId: item.product_id,
              quantity: item.quantity,
            });
          } else if (result.oversold) {
            logger.warn(WEBHOOK_LOG_CONTEXT, 'Product oversold — stock floored at 0', {
              correlationId: getWebhookCorrelationId(requestCorrelationId, reference, transactionId, resolvedOrder.id),
              orderId: resolvedOrder.id,
              productId: item.product_id,
              quantity: item.quantity,
            });
          }
        }
      } catch (stockError) {
        logger.error(WEBHOOK_LOG_CONTEXT, 'Unexpected error while decrementing stock', {
          correlationId: getWebhookCorrelationId(requestCorrelationId, reference, transactionId, resolvedOrder.id),
          orderId: resolvedOrder.id,
          error: stockError,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error(WEBHOOK_LOG_CONTEXT, 'Unexpected webhook processing error', {
      correlationId: getWebhookCorrelationId(requestCorrelationId),
      env: getWebhookEnvSnapshot(),
      error,
    });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
