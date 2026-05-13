import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { createServiceClient } from '@/lib/supabase/service';
import type { SiteSettings } from '@/lib/site-settings';

const ALLOWED_KEYS: Array<keyof SiteSettings> = [
  'support_phone',
  'support_phone_display',
  'support_email',
  'whatsapp_number',
  'whatsapp_display',
  'instagram_url',
  'facebook_url',
  'tiktok_url',
  'address_display',
  'address_detail',
];

/* ─── GET /api/admin/settings ────────────────────────────────────────────── */
export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .order('key');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const settings = Object.fromEntries(
      (data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
    );

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('[Admin /settings GET]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/* ─── PUT /api/admin/settings ────────────────────────────────────────────── */
export async function PUT(req: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = (await req.json()) as Record<string, unknown>;

    // Validate — only known keys, string values
    const rows: { key: string; value: string }[] = [];
    for (const key of ALLOWED_KEYS) {
      if (key in body) {
        const val = body[key];
        if (typeof val !== 'string') {
          return NextResponse.json(
            { error: `Valeur invalide pour "${key}"` },
            { status: 400 }
          );
        }
        rows.push({ key, value: val.trim() });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Aucun champ valide fourni' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('site_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Admin /settings PUT]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
