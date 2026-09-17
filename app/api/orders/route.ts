import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserOrders } from '@/lib/supabase/orders';
import { logger } from '@/lib/logger';

// GET /api/orders — list user's orders (requires auth)
//
// NOTE: this route used to also expose POST for guest order creation
// (including a `cash_on_delivery` payment method), but nothing in the app
// calls it anymore since checkout now exclusively goes through
// /api/payment/initiate (see commits cd3b796 / da0563a). Because /api/orders
// is a public route (see proxy.ts), that POST handler let anyone create a
// real, unpaid order with zero verification — it has been removed.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Veuillez vous connecter' },
        { status: 401 }
      );
    }

    const orders = await getUserOrders(user.id);
    return NextResponse.json({ orders });
  } catch (error) {
    logger.error('[API GET /orders]', 'Error', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
