import { NextResponse } from 'next/server';
import { getDashboardStats, getRecentOrders } from '@/lib/supabase/admin';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const [stats, recentOrders] = await Promise.all([
      getDashboardStats(),
      getRecentOrders(8),
    ]);

    return NextResponse.json({ stats, recentOrders });
  } catch (error) {
    console.error('[Admin /stats]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
