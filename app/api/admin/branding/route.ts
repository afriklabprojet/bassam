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
import { logger } from '@/lib/logger';

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
    logger.error('[Admin /branding GET]', 'Error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

const COLOR_KEYS = ['colorAccent', 'colorAccentLight', 'colorAccentDark', 'colorAccentMuted'] as const;
const FONT_IMPORT_KEYS = ['fontSerifImport', 'fontSansImport'] as const;
const FONT_FAMILY_KEYS = ['fontSerifFamily', 'fontSansFamily'] as const;

function validateAndNormalizeBrandingField(
  k: keyof BrandingConfig,
  raw: unknown
): { value: string } | { error: string } {
  if (typeof raw !== 'string') return { error: `Valeur invalide pour "${k}"` };

  let value = raw.trim();

  if ((COLOR_KEYS as readonly string[]).includes(k)) {
    if (!isValidColor(value)) return { error: `Couleur invalide pour "${k}" (attendu : hex ou rgba)` };
  }

  if ((FONT_IMPORT_KEYS as readonly string[]).includes(k)) {
    if (!isValidGFontUrl(value)) return { error: `URL de police invalide pour "${k}" (Google Fonts uniquement)` };
  }

  if ((FONT_FAMILY_KEYS as readonly string[]).includes(k)) {
    value = sanitizeFontFamily(value);
  }

  if (k === 'preset') {
    value = value.replace(/[^a-z0-9-]/gi, '').substring(0, 50);
  }

  return { value };
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

      const result = validateAndNormalizeBrandingField(k, body[k]);
      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      rows.push({ key: BRANDING_DB_KEYS[k], value: result.value });
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
    logger.error('Admin /branding PUT', 'Unexpected error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
