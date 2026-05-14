import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/** Génère un EAN-13 valide (12 chiffres + checksum) */
function generateEAN13(): string {
  const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
  const sum = digits.reduce((acc, d, i) => acc + (i % 2 === 0 ? d : d * 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return [...digits, check].join('');
}

// GET  /api/admin/barcodes
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');
  const activeOnly = searchParams.get('active') === 'true';
  const generate = searchParams.get('generate');

  // shortcut: generate a random EAN13
  if (generate === 'ean13') {
    return NextResponse.json({ barcode: generateEAN13(), format: 'EAN13' });
  }

  let query = supabase
    .from('barcodes')
    .select('*, products(name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (productId) query = query.eq('product_id', productId);
  if (activeOnly) query = query.eq('active', true);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ barcodes: data ?? [], total: count ?? 0 });
}

// POST /api/admin/barcodes
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  const body = await request.json() as Record<string, unknown>;
  const { product_id, barcode, format, label, auto_generate } = body;

  const barcodeValue = auto_generate ? generateEAN13() : (barcode as string);
  if (!barcodeValue) return NextResponse.json({ error: 'barcode requis (ou auto_generate: true)' }, { status: 400 });

  const { data, error } = await supabase
    .from('barcodes')
    .insert({ product_id, barcode: barcodeValue, format: format ?? 'EAN13', label, active: true, created_by: user?.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/admin/barcodes
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const body = await request.json() as Record<string, unknown>;
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { data, error } = await supabase
    .from('barcodes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/barcodes?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { error } = await supabase.from('barcodes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
