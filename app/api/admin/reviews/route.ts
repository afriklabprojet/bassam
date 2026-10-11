import { NextRequest, NextResponse } from 'next/server';
import { getAllReviews, setReviewApproval, deleteReview } from '@/lib/supabase/reviews';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const reviews = await getAllReviews();
    return NextResponse.json({ reviews });
  } catch (error) {
    logger.error('[API /admin/reviews]', 'Failed to list reviews', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json() as { id?: string; action?: string };
    const { id, action } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    if (action === 'approve') {
      await setReviewApproval(id, true);
      return NextResponse.json({ ok: true });
    }
    if (action === 'reject') {
      await setReviewApproval(id, false);
      return NextResponse.json({ ok: true });
    }
    if (action === 'delete') {
      await deleteReview(id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    logger.error('[API /admin/reviews]', 'Failed to moderate review', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
