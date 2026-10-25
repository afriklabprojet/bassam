import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { ORDER_TRACK_RATE_LIMIT } from '@/lib/rate-limit-config';
import { orderIdRange, parseOrderRef, phonesMatch, type TrackedOrder } from '@/lib/order-tracking';

const LOG_CONTEXT = 'API /orders/track';
const NOT_FOUND = 'Commande introuvable. Vérifiez le numéro de commande et le téléphone utilisé pour la commande.';

type OrderRow = {
  id: string;
  status: string;
  payment_status: string | null;
  total_amount: number | string | null;
  phone: string | null;
  created_at: string;
  order_items: Array<{ quantity: number; products: { name: string } | null }> | null;
};

// POST /api/orders/track  { ref, phone }
//
// Public lookup for /suivi-commande. Guest orders have no user_id, so RLS can never let a guest read them: the
// service client is used, and access requires BOTH the order number printed on the email/invoice and the phone
// given at checkout. A wrong number and a wrong phone get the same 404. Only status, payment status, amount, date
// and item names are returned — never the address, email or phone.
export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, 'orders:track', ORDER_TRACK_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const { ref: rawRef, phone } = (body ?? {}) as Record<string, unknown>;
  const ref = typeof rawRef === 'string' ? parseOrderRef(rawRef) : null;
  if (!ref) {
    return NextResponse.json({ error: 'Numéro de commande invalide. Il ressemble à VIP-ABCDEF12.' }, { status: 400 });
  }
  if (typeof phone !== 'string' || phone.replaceAll(/\D/g, '').length < 8) {
    return NextResponse.json({ error: 'Numéro de téléphone invalide.' }, { status: 400 });
  }

  try {
    const [from, to] = orderIdRange(ref);
    const { data, error } = await createServiceClient()
      .from('orders')
      .select('id, status, payment_status, total_amount, phone, created_at, order_items (quantity, products (name))')
      .gte('id', from)
      .lte('id', to)
      .limit(5);
    if (error) {
      logger.error(LOG_CONTEXT, 'Unable to look up order', { error });
      return NextResponse.json({ error: 'Erreur serveur. Réessayez dans un instant.' }, { status: 500 });
    }

    const order = ((data ?? []) as unknown as OrderRow[]).find((row) => phonesMatch(phone, row.phone));
    if (!order) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });

    const tracked: TrackedOrder = {
      orderNumber: `VIP-${order.id.slice(0, 8).toUpperCase()}`,
      status: order.status,
      paymentStatus: order.payment_status,
      totalAmount: Number(order.total_amount) || 0,
      createdAt: order.created_at,
      items: (order.order_items ?? []).map((item) => ({
        name: item.products?.name ?? 'Article retiré du catalogue',
        quantity: item.quantity,
      })),
    };
    return NextResponse.json({ order: tracked });
  } catch (error) {
    logger.error(LOG_CONTEXT, 'Unexpected error', { error });
    return NextResponse.json({ error: 'Erreur serveur. Réessayez dans un instant.' }, { status: 500 });
  }
}
