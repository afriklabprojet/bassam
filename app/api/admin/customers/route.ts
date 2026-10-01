import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin, getAdminCustomers } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { ADMIN_PAGE_DEFAULT, ADMIN_LIMIT_DEFAULT } from '@/lib/constants';

// GET /api/admin/customers
export async function GET(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') ?? ADMIN_PAGE_DEFAULT);
    const limit = Number(searchParams.get('limit') ?? ADMIN_LIMIT_DEFAULT);

    const result = await getAdminCustomers(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('[Admin GET /customers]', 'Error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
