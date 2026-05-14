import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// GET  /api/admin/maintenance
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');

  let query = supabase
    .from('maintenance_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const stats = {
    pending: 0, in_progress: 0, done: 0, cancelled: 0,
    critical: 0, high: 0, medium: 0, low: 0,
  };
  for (const t of data ?? []) {
    if (t.status in stats) (stats as Record<string, number>)[t.status]++;
    if (t.priority in stats) (stats as Record<string, number>)[t.priority]++;
  }

  return NextResponse.json({ tasks: data ?? [], stats, total: count ?? 0 });
}

// POST /api/admin/maintenance
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  const body = await request.json() as Record<string, unknown>;
  const { type, title, description, priority, assigned_to, scheduled_at, notes } = body;

  if (!title) return NextResponse.json({ error: 'title requis' }, { status: 400 });

  const { data, error } = await supabase
    .from('maintenance_logs')
    .insert({ type: type ?? 'preventive', title, description, priority: priority ?? 'medium', assigned_to, scheduled_at, notes, created_by: user?.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/admin/maintenance
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const body = await request.json() as Record<string, unknown>;
  const { id, status, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const updates: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
  if (status) {
    updates.status = status;
    if (status === 'in_progress' && !rest.started_at) updates.started_at = new Date().toISOString();
    if (status === 'done' && !rest.completed_at) updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('maintenance_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/maintenance?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { error } = await supabase.from('maintenance_logs').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
