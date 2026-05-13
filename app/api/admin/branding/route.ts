import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { createServiceClient } from '@/lib/supabase/service';
import {
  BRANDING_DB_KEYS,
  isValidColor,
  isValidGFontUrl,
  sanitizeFontFamily,
  type BrandingConfig,
} from '@/lib/branding';

// Clés acceptées (toutes les clés de BrandingConfig)
const ALLOWED_KEYS = Object.keys(BRANDING_DB_KEYS) as Array<keyof BrandingConfig>;

// ─── GET /api/admin/branding ──────────────────────────────────────────────────

export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .like('key', 'brand_%');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const settings = Object.fromEntries(
      (data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
    );

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('[Admin /branding GET]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ─── PUT /api/admin/branding ──────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const rows: { key: string; value: string }[] = [];

    for (const k of ALLOWED_KEYS) {
      if (!(k in body)) continue;
      const raw = body[k];

      if (typeof raw !== 'string') {
        return NextResponse.json(
          { error: `Valeur invalide pour "${k}"` },
          { status: 400 }
        );
      }

      let value = raw.trim();

      // ── Validation par champ ─────────────────────────────────────────────
      if (['colorAccent', 'colorAccentLight', 'colorAccentDark'].includes(k)) {
        if (!isValidColor(value)) {
          return NextResponse.json(
            { error: `Couleur invalide pour "${k}" (attendu : hex ou rgba)` },
            { status: 400 }
          );
        }
      }

      if (k === 'colorAccentMuted') {
        // Autoriser rgba() ET hex
        if (!isValidColor(value)) {
          return NextResponse.json(
            { error: `Couleur muette invalide pour "${k}"` },
            { status: 400 }
          );
        }
      }

      if (['fontSerifImport', 'fontSansImport'].includes(k)) {
        if (!isValidGFontUrl(value)) {
          return NextResponse.json(
            { error: `URL de police invalide pour "${k}" (Google Fonts uniquement)` },
            { status: 400 }
          );
        }
      }

      if (['fontSerifFamily', 'fontSansFamily'].includes(k)) {
        value = sanitizeFontFamily(value);
      }

      if (k === 'preset') {
        // On accepte n'importe quelle chaîne alphanumérique+tiret
        value = value.replace(/[^a-z0-9-]/gi, '').substring(0, 50);
      }

      rows.push({ key: BRANDING_DB_KEYS[k], value });
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
    console.error('[Admin /branding PUT]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
