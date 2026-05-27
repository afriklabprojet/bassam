import { NextResponse } from 'next/server';
import {
  getDashboardStats, getRecentOrders, getTopProducts,
  getLowStockProducts, getPaymentMethodStats, getTopCustomers,
  isCurrentUserAdmin,
} from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const [stats, recentOrders, topProducts, lowStockProducts, paymentStats, topCustomers] = await Promise.all([
      getDashboardStats(),
      getRecentOrders(8),
      getTopProducts(5),
      getLowStockProducts(5),
      getPaymentMethodStats(),
      getTopCustomers(5),
    ]);

    return NextResponse.json({ stats, recentOrders, topProducts, lowStockProducts, paymentStats, topCustomers });
  } catch (error) {
    logger.error('[Admin /stats]', 'Error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
