import { NextRequest, NextResponse, after } from 'next/server';
import { isCurrentUserAdmin, getAdminOrders, getOrderCountByPhone, updateOrderStatus } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { ADMIN_PAGE_DEFAULT, ADMIN_LIMIT_DEFAULT } from '@/lib/constants';
import { dbErrorResponse } from '@/lib/api-errors';
import { isCustomerStatusEmail, sendOrderStatusEmail } from '@/lib/order-notifications';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/admin/orders
// GET /api/admin/orders?phone=&excludeId= → returns { previousCount }
export async function GET(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Count previous orders for a phone
    const phone = searchParams.get('phone');
    const excludeId = searchParams.get('excludeId');
    if (phone && excludeId) {
      const previousCount = await getOrderCountByPhone(phone, excludeId);
      return NextResponse.json({ previousCount });
    }

    const page = Number(searchParams.get('page') ?? ADMIN_PAGE_DEFAULT);
    const limit = Number(searchParams.get('limit') ?? ADMIN_LIMIT_DEFAULT);
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

    const result = await updateOrderStatus(id, status);

    if (result.error) {
      return dbErrorResponse('API /admin/orders', result.error);
    }

    // Chaque changement de statut prévient le client, seulement s'il change vraiment (pas de doublon),
    // et après la réponse pour ne jamais ralentir l'admin (site ou application).
    if (isCustomerStatusEmail(status) && result.previousStatus !== status) {
      after(() => sendOrderStatusEmail(createServiceClient(), id, status));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Admin PATCH /orders]', 'Error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
