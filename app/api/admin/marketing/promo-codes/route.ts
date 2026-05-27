import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// GET /api/admin/marketing/promo-codes
export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ codes: data ?? [] });
  } catch (err) {
    logger.error('[Admin GET /promo-codes]', 'Error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/marketing/promo-codes
export async function POST(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const body = await request.json();
    const { code, type, value, min_order_amount, max_uses, expires_at, description } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 });
    }
    if (!['percentage', 'fixed'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }
    if (typeof value !== 'number' || value <= 0) {
      return NextResponse.json({ error: 'Valeur invalide' }, { status: 400 });
    }
    if (type === 'percentage' && value > 100) {
      return NextResponse.json({ error: 'Pourcentage max 100%' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        code: code.trim().toUpperCase(),
        type,
        value,
        min_order_amount: min_order_amount ?? 0,
        max_uses: max_uses ?? null,
        expires_at: expires_at ?? null,
        description: description ?? null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Ce code existe déjà' }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ code: data }, { status: 201 });
  } catch (err) {
    logger.error('[Admin POST /promo-codes]', 'Error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/marketing/promo-codes
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    // Whitelist updatable fields
    const allowed = ['is_active', 'value', 'type', 'min_order_amount', 'max_uses', 'expires_at', 'description'];
    const sanitized: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in updates) sanitized[key] = updates[key];
    }

    const supabase = await createClient();
    const { error } = await supabase.from('promo_codes').update(sanitized).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[Admin PATCH /promo-codes]', 'Error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/admin/marketing/promo-codes
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[Admin DELETE /promo-codes]', 'Error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
