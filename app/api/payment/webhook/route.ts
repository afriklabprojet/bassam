import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/service';
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
 *  - HMAC-SHA256 signature verified via X-Jeko-Signature header
 *  - Idempotent: skips orders already in a final payment state
 *  - Uses service-role client to bypass RLS (no user session on webhook)
 */
export async function POST(request: NextRequest) {
  const requestCorrelationId = randomUUID();
  try {
    // ── 1. Read raw body (needed for HMAC verification) ────────────────────
    const rawBody = await request.text();
    const signature = request.headers.get('x-jeko-signature') ?? '';

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

    // Ignore unknown event types (forward-compat)
    if (!['payment.success', 'payment.failed'].includes(payload.event)) {
      logger.info(WEBHOOK_LOG_CONTEXT, 'Ignoring unsupported webhook event', {
        correlationId: getWebhookCorrelationId(requestCorrelationId, payload.reference, payload.transactionId),
        event: payload.event,
        reference: payload.reference,
        transactionId: payload.transactionId,
      });
      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceClient();

    // ── 4. Find order by reference (our order UUID) ─────────────────────────
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id, status, payment_status')
      .eq('id', payload.reference)
      .single();

    type OrderRow = { id: string; status: string; payment_status: string };

    let resolvedOrder: OrderRow | null = order;

    if (findError || !resolvedOrder) {
      logger.warn(WEBHOOK_LOG_CONTEXT, 'Order not found by reference, trying payment_reference fallback', {
        correlationId: getWebhookCorrelationId(requestCorrelationId, payload.reference, payload.transactionId),
        reference: payload.reference,
        transactionId: payload.transactionId,
        event: payload.event,
      });

      // Fallback: try matching via payment_reference (Jeko transactionId)
      const { data: orderByTxn } = await supabase
        .from('orders')
        .select('id, status, payment_status')
        .eq('payment_reference', payload.transactionId)
        .single();

      if (!orderByTxn) {
        logger.warn(WEBHOOK_LOG_CONTEXT, 'Order not found for webhook payload', {
          correlationId: getWebhookCorrelationId(requestCorrelationId, payload.reference, payload.transactionId),
          reference: payload.reference,
          transactionId: payload.transactionId,
          event: payload.event,
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
        correlationId: getWebhookCorrelationId(requestCorrelationId, payload.reference, payload.transactionId, resolvedOrder.id),
        orderId: resolvedOrder.id,
        paymentStatus: resolvedOrder.payment_status,
        event: payload.event,
      });
      return NextResponse.json({ ok: true });
    }

    // ── 6. Apply update based on event ─────────────────────────────────────
    const isSuccess = payload.event === 'payment.success';
    const updates = isSuccess
      ? { payment_status: 'paid', status: 'confirmed', payment_reference: payload.transactionId }
      : { payment_status: 'failed', status: 'cancelled' };

    const { error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', resolvedOrder.id);

    if (updateError) {
      logger.error(WEBHOOK_LOG_CONTEXT, 'Failed to update order from webhook', {
        correlationId: getWebhookCorrelationId(requestCorrelationId, payload.reference, payload.transactionId, resolvedOrder.id),
        orderId: resolvedOrder.id,
        transactionId: payload.transactionId,
        event: payload.event,
        targetStatus: updates.status,
        targetPaymentStatus: updates.payment_status,
        error: updateError,
      });
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }

    logger.info(WEBHOOK_LOG_CONTEXT, 'Order updated from Jeko webhook', {
      correlationId: getWebhookCorrelationId(requestCorrelationId, payload.reference, payload.transactionId, resolvedOrder.id),
      orderId: resolvedOrder.id,
      transactionId: payload.transactionId,
      event: payload.event,
      status: updates.status,
      paymentStatus: updates.payment_status,
    });

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
