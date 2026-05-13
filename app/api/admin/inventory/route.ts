import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

function adminError(msg: string, status = 403) {
  return NextResponse.json({ error: msg }, { status });
}

// GET  /api/admin/inventory  — list all items
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) return adminError('Accès interdit');

  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id, sku, name, quantity, low_stock_threshold, unit_cost, location,
      last_updated, created_at,
      product_id,
      products ( name, images )
    `)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []).map((item) => ({
    ...item,
    is_low_stock: item.quantity <= item.low_stock_threshold,
  }));

  const stats = {
    total: items.length,
    low_stock: items.filter((i) => i.is_low_stock).length,
    out_of_stock: items.filter((i) => i.quantity === 0).length,
    total_value: items.reduce((s, i) => s + (i.quantity * (i.unit_cost ?? 0)), 0),
  };

  return NextResponse.json({ items, stats });
}

// POST /api/admin/inventory  — create item
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) return adminError('Accès interdit');

  const body = await request.json() as Record<string, unknown>;
  const { name, sku, product_id, quantity, low_stock_threshold, unit_cost, location } = body;

  if (!name || quantity === undefined) {
    return NextResponse.json({ error: 'Champs obligatoires: name, quantity' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('inventory')
    .insert({ name, sku, product_id, quantity, low_stock_threshold, unit_cost, location })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/admin/inventory  — update quantity + optional fields
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) return adminError('Accès interdit');

  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json() as Record<string, unknown>;
  const { id, quantity, movement_type, reason, ...rest } = body;

  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { data: current, error: fetchErr } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('id', id)
    .single();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const updates: Record<string, unknown> = { ...rest, last_updated: new Date().toISOString() };
  if (quantity !== undefined) updates.quantity = quantity;

  const { data, error } = await supabase
    .from('inventory')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // record movement if quantity changed
  if (quantity !== undefined && quantity !== current.quantity) {
    const delta = (quantity as number) - current.quantity;
    await supabase.from('inventory_movements').insert({
      inventory_id: id,
      type: movement_type ?? (delta > 0 ? 'in' : 'out'),
      quantity: Math.abs(delta),
      reason: reason ?? null,
      performed_by: user?.id ?? null,
    });
  }

  return NextResponse.json(data);
}

// DELETE /api/admin/inventory?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) return adminError('Accès interdit');

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { error } = await supabase.from('inventory').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
