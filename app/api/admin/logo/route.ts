/**
 * /api/admin/logo — Upload logo ou favicon dans Supabase Storage
 * et sauvegarde l'URL dans site_settings.
 *
 * POST body: multipart/form-data
 *   - file: File
 *   - type: "logo" | "favicon"
 *
 * GET: retourne les URLs actuelles de logo et favicon
 */
import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';

const BUCKET = 'product-images';
const MAX_SIZE = 2 * 1024 * 1024; // 2 Mo
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const FAVICON_TYPES = ['image/png', 'image/svg+xml', 'image/x-icon'];

// ── GET — retourne logo_url et favicon_url actuels ─────────────────────────

export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const service = createServiceClient();

    const { data } = await service
      .from('site_settings')
      .select('key, value')
      .in('key', ['logo_url', 'favicon_url']);

    const map = Object.fromEntries(
      (data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
    );

    return NextResponse.json({
      logo_url: map.logo_url ?? '',
      favicon_url: map.favicon_url ?? '',
    });
  } catch (error) {
    logger.error('[logo GET]', 'Error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── POST — upload + sauvegarde ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const service = createServiceClient();

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }
    if (type !== 'logo' && type !== 'favicon') {
      return NextResponse.json({ error: 'Type invalide (logo | favicon)' }, { status: 400 });
    }

    const allowedTypes = type === 'logo' ? LOGO_TYPES : FAVICON_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Format non supporté pour ${type} (${allowedTypes.join(', ')})` },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop lourd (max 2 Mo)' }, { status: 400 });
    }

    // Choisir l'extension
    const extMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/x-icon': 'ico',
    };
    const ext = extMap[file.type] ?? 'png';
    const path = `brand/${type}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload dans Supabase Storage
    const { data: uploaded, error: uploadError } = await service.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '31536000',
      });

    if (uploadError) {
      logger.error('[logo upload] Storage error:', 'Error', uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = service.storage.from(BUCKET).getPublicUrl(uploaded.path);

    // Sauvegarder l'URL dans site_settings
    const settingKey = type === 'logo' ? 'logo_url' : 'favicon_url';
    const { error: upsertError } = await service
      .from('site_settings')
      .upsert({ key: settingKey, value: publicUrl }, { onConflict: 'key' });

    if (upsertError) {
      logger.error('[logo upsert]', 'Error', upsertError.message);
      return NextResponse.json({ error: 'Erreur sauvegarde en base' }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl, type, key: settingKey });
  } catch (error) {
    logger.error('[logo POST]', 'Error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
