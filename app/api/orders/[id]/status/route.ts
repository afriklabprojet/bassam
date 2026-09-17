import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// GET /api/orders/[id]/status
//
// Public, read-only, minimal-fields lookup used by the post-payment
// confirmation page (/commande/confirmation?order=...). It has to bypass RLS
// via the service client because guest orders have `user_id = null`, and the
// "Users can view their own orders" policy (auth.uid() = user_id) can never
// match NULL — meaning a guest could otherwise never check their own order,
// even right after paying for it. The order id is an unguessable UUID, and
// only non-sensitive status fields are returned (no address, no full phone).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, payment_status, total_amount, shipping_address, phone, created_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    const shippingAddress = data.shipping_address as { firstName?: string } | null;

    return NextResponse.json({
      orderId: data.id,
      status: data.status,
      paymentStatus: data.payment_status,
      totalAmount: Number(data.total_amount),
      firstName: shippingAddress?.firstName ?? null,
      phone: data.phone,
      createdAt: data.created_at,
    });
  } catch (error) {
    logger.error('API /orders/[id]/status', 'Failed to load order status', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
