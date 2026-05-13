import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// GET  /api/admin/payments
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
    .from('payments')
    .select('*, orders(email, phone)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // aggregate stats
  const { data: statsData } = await supabase
    .from('payments')
    .select('status, amount');

  const stats = {
    total_revenue: 0,
    pending_amount: 0,
    count_completed: 0,
    count_pending: 0,
    count_failed: 0,
    count_refunded: 0,
  };
  for (const p of statsData ?? []) {
    if (p.status === 'completed') {
      stats.total_revenue += p.amount;
      stats.count_completed++;
    } else if (p.status === 'pending') {
      stats.pending_amount += p.amount;
      stats.count_pending++;
    } else if (p.status === 'failed') {
      stats.count_failed++;
    } else if (p.status === 'refunded') {
      stats.count_refunded++;
    }
  }

  return NextResponse.json({ payments: data ?? [], stats, total: count ?? 0, page, limit });
}

// POST /api/admin/payments  — manually register a payment
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const body = await request.json() as Record<string, unknown>;
  const { order_id, amount, currency, method, status, transaction_id, provider, metadata, paid_at } = body;

  if (!amount || !method) {
    return NextResponse.json({ error: 'Champs obligatoires: amount, method' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({ order_id, amount, currency: currency ?? 'XOF', method, status: status ?? 'completed', transaction_id, provider, metadata: metadata ?? {}, paid_at: paid_at ?? new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/admin/payments  — update status
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const body = await request.json() as Record<string, unknown>;
  const { id, status, transaction_id, notes } = body;
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (transaction_id) updates.transaction_id = transaction_id;
  if (status === 'completed' && !updates.paid_at) updates.paid_at = new Date().toISOString();
  if (notes) updates.notes = notes;

  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
