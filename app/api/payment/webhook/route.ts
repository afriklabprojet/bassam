import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyWebhookSignature, type JekoWebhookPayload } from '@/lib/payment/jeko';

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
  // ── 1. Read raw body (needed for HMAC verification) ──────────────────────
  const rawBody = await request.text();
  const signature = request.headers.get('x-jeko-signature') ?? '';

  // ── 2. Verify signature ───────────────────────────────────────────────────
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[webhook] Invalid Jeko signature — rejected');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ── 3. Parse payload ──────────────────────────────────────────────────────
  let payload: JekoWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as JekoWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Ignore unknown event types (forward-compat)
  if (!['payment.success', 'payment.failed'].includes(payload.event)) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceClient();

  // ── 4. Find order by reference (our order UUID) ───────────────────────────
  const { data: order, error: findError } = await supabase
    .from('orders')
    .select('id, status, payment_status')
    .eq('id', payload.reference)
    .single();

  type OrderRow = { id: string; status: string; payment_status: string };

  let resolvedOrder: OrderRow | null = order as OrderRow | null;

  if (findError || !resolvedOrder) {
    // Fallback: try matching via payment_reference (Jeko transactionId)
    const { data: orderByTxn } = await supabase
      .from('orders')
      .select('id, status, payment_status')
      .eq('payment_reference', payload.transactionId)
      .single();

    if (!orderByTxn) {
      console.error('[webhook] Order not found for reference:', payload.reference);
      // Return 200 to prevent Jeko from retrying indefinitely
      return NextResponse.json({ ok: true });
    }

    resolvedOrder = orderByTxn as OrderRow;
  }

  // ── 5. Idempotency — skip if already in a final state ────────────────────
  const finalStates = ['paid', 'failed', 'refunded'];
  if (finalStates.includes(resolvedOrder.payment_status)) {
    return NextResponse.json({ ok: true });
  }

  // ── 6. Apply update based on event ───────────────────────────────────────
  const isSuccess = payload.event === 'payment.success';
  const updates = isSuccess
    ? { payment_status: 'paid', status: 'confirmed', payment_reference: payload.transactionId }
    : { payment_status: 'failed', status: 'cancelled' };

  const { error: updateError } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', resolvedOrder.id);

  if (updateError) {
    console.error('[webhook] Failed to update order', resolvedOrder.id, updateError.message);
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
  }

  console.log(`[webhook] Order ${resolvedOrder.id} → ${updates.status} (${payload.event})`);

  return NextResponse.json({ ok: true });
}
