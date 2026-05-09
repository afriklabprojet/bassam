import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin, getAdminCustomers } from '@/lib/supabase/admin';

// GET /api/admin/customers
export async function GET(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 20);

    const result = await getAdminCustomers(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Admin GET /customers]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
