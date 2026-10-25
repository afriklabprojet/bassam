import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { searchOrdersByTrackingNumber } from '@/lib/supabase/admin-order-search';
import { logger } from '@/lib/logger';

const NO_STORE = { 'Cache-Control': 'no-store' };

// GET /api/admin/orders/search?q=VIP-XXXXXXXX → { orders: TrackedOrder[] } (0 à 5 résultats)
export async function GET(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403, headers: NO_STORE });
    }

    const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
    if (!q) {
      return NextResponse.json({ error: 'Veuillez saisir un numéro de suivi.' }, { status: 400, headers: NO_STORE });
    }
    if (q.length > 64) {
      return NextResponse.json({ error: 'Numéro de suivi invalide.' }, { status: 400, headers: NO_STORE });
    }

    const result = await searchOrdersByTrackingNumber(q);
    if (!result.ok && result.reason === 'invalid') {
      return NextResponse.json(
        { error: 'Numéro de suivi invalide. Exemple : VIP-3F2A9C1B.' },
        { status: 400, headers: NO_STORE },
      );
    }
    if (!result.ok) {
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500, headers: NO_STORE });
    }

    return NextResponse.json({ orders: result.orders }, { headers: NO_STORE });
  } catch (error) {
    logger.error('[Admin GET /orders/search]', 'Error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500, headers: NO_STORE });
  }
}
