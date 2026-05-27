import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin, getAdminOrders, updateOrderStatus } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// GET /api/admin/orders
export async function GET(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 20);
    const status = searchParams.get('status') || undefined;

    const result = await getAdminOrders(page, limit, status);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('[Admin GET /orders]', 'Error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/orders — update order status
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID commande requis' }, { status: 400 });
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const { error } = await updateOrderStatus(id, status);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Admin PATCH /orders]', 'Error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
