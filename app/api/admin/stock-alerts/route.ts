import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

function err(msg: string, status = 403) {
  return NextResponse.json({ error: msg }, { status });
}

// ─── GET /api/admin/stock-alerts ───────────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) return err('Accès interdit');

  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status');
  const severity = searchParams.get('severity');

  let query = supabase
    .from('stock_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (status)   query = query.eq('status',   status);
  if (severity) query = query.eq('severity', severity);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const alerts = data ?? [];

  const stats = {
    total:        alerts.length,
    pending:      alerts.filter((a) => a.status === 'pending').length,
    acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
    resolved:     alerts.filter((a) => a.status === 'resolved').length,
    critical:     alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length,
  };

  // When filtering, recalculate global stats without filter
  if (status || severity) {
    const { data: all } = await supabase.from('stock_alerts').select('status, severity');
    const a = all ?? [];
    stats.total        = a.length;
    stats.pending      = a.filter((x) => x.status === 'pending').length;
    stats.acknowledged = a.filter((x) => x.status === 'acknowledged').length;
    stats.resolved     = a.filter((x) => x.status === 'resolved').length;
    stats.critical     = a.filter((x) => x.severity === 'critical' && x.status !== 'resolved').length;
  }

  return NextResponse.json({ alerts, stats });
}

// ─── POST /api/admin/stock-alerts ──────────────────────────────────────────
// action=check   → scan inventory and create new alerts
// action=notify  → acknowledge all pending alerts (mark as acknowledged)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) return err('Accès interdit');

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'check') {
    // Fetch inventory items
    const { data: items, error: invErr } = await supabase
      .from('inventory')
      .select('id, name, sku, quantity, low_stock_threshold');

    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });

    const lowItems = (items ?? []).filter((i) => i.quantity <= i.low_stock_threshold);

    if (lowItems.length === 0) {
      return NextResponse.json({ created: 0, message: 'Tous les stocks sont suffisants.' });
    }

    // For each low-stock item, only create an alert if there isn't an open one
    const { data: existing } = await supabase
      .from('stock_alerts')
      .select('inventory_id')
      .in('status', ['pending', 'acknowledged']);

    const existingIds = new Set((existing ?? []).map((e) => e.inventory_id));

    const toInsert = lowItems
      .filter((i) => !existingIds.has(i.id))
      .map((i) => ({
        inventory_id:     i.id,
        product_name:     i.name,
        sku:              i.sku ?? null,
        current_quantity: i.quantity,
        threshold:        i.low_stock_threshold,
        severity:         i.quantity === 0 ? 'critical' : 'warning',
        status:           'pending',
      }));

    if (toInsert.length === 0) {
      return NextResponse.json({ created: 0, message: 'Des alertes ouvertes existent déjà pour ces articles.' });
    }

    const { error: insertErr } = await supabase.from('stock_alerts').insert(toInsert);
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ created: toInsert.length });
  }

  if (action === 'notify') {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: pending } = await supabase
      .from('stock_alerts')
      .select('id')
      .eq('status', 'pending');

    if (!pending || pending.length === 0) {
      return NextResponse.json({ updated: 0, message: 'Aucune alerte en attente.' });
    }

    const ids = pending.map((p) => p.id);
    const { error: updErr } = await supabase
      .from('stock_alerts')
      .update({
        status:          'acknowledged',
        acknowledged_by: user?.id ?? null,
        acknowledged_at: new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      })
      .in('id', ids);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ updated: pending.length });
  }

  return err('Action inconnue. Utilisez ?action=check ou ?action=notify', 400);
}

// ─── PATCH /api/admin/stock-alerts ─────────────────────────────────────────
// { id, status, notes }
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) return err('Accès interdit');

  const body = await request.json() as Record<string, unknown>;
  const { id, status, notes } = body;

  if (!id || typeof id !== 'string') return err('id requis', 400);
  if (!status || typeof status !== 'string') return err('status requis', 400);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (notes !== undefined) update.notes = notes;
  if (status === 'acknowledged') {
    update.acknowledged_by  = user?.id ?? null;
    update.acknowledged_at  = new Date().toISOString();
  }
  if (status === 'resolved') {
    update.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase.from('stock_alerts').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// ─── DELETE /api/admin/stock-alerts ────────────────────────────────────────
// ?id=... — supprimer une alerte
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) return err('Accès interdit');

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return err('id requis', 400);

  const { error } = await supabase.from('stock_alerts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
