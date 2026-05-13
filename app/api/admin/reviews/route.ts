import { NextRequest, NextResponse } from 'next/server';
import { getAllReviews, setReviewApproval, deleteReview } from '@/lib/supabase/reviews';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single();
  return !!data;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const reviews = await getAllReviews();
  return NextResponse.json({ reviews });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
}
