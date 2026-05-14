import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// GET  /api/admin/refunds
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('refunds')
    .select('*, orders(email, phone)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // aggregate stats
  const { data: all } = await supabase.from('refunds').select('status, amount');
  const stats = {
    pending: 0, approved: 0, rejected: 0, processed: 0, cancelled: 0,
    total_pending_amount: 0, total_processed_amount: 0,
  };
  for (const r of all ?? []) {
    (stats as Record<string, number>)[r.status] = ((stats as Record<string, number>)[r.status] ?? 0) + 1;
    if (r.status === 'pending' || r.status === 'approved') stats.total_pending_amount += r.amount;
    if (r.status === 'processed') stats.total_processed_amount += r.amount;
  }

  return NextResponse.json({ refunds: data ?? [], stats, total: count ?? 0, page, limit });
}

// POST /api/admin/refunds
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  const body = await request.json() as Record<string, unknown>;
  const { order_id, payment_id, amount, currency, reason, refund_method, notes } = body;

  if (!amount || !reason) {
    return NextResponse.json({ error: 'Champs obligatoires: amount, reason' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('refunds')
    .insert({
      order_id, payment_id, amount, currency: currency ?? 'XOF',
      reason, refund_method: refund_method ?? 'original', notes,
      status: 'pending', requested_by: user?.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/admin/refunds  — approve / reject / process
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  const body = await request.json() as Record<string, unknown>;
  const { id, status, notes, transaction_id, refund_method } = body;
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (notes) updates.notes = notes;
  if (transaction_id) updates.transaction_id = transaction_id;
  if (refund_method) updates.refund_method = refund_method;
  if (status === 'processed' || status === 'approved' || status === 'rejected') {
    updates.processed_by = user?.id;
    updates.processed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('refunds')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
