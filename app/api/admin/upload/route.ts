import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';

const BUCKET = 'product-images';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function POST(req: NextRequest) {
  /* ── Auth: admin via app_metadata ────────────────────────────────────── */
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const service = createServiceClient();

  /* ── Fichier ─────────────────────────────────────────────────────────── */
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Format non supporté (JPEG, PNG, WebP, AVIF uniquement)' },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop lourd (max 5 Mo)' }, { status: 400 });
  }

  /* ── Upload Supabase Storage ─────────────────────────────────────────── */
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data, error } = await service.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: '31536000',
    });

  if (error) {
    logger.error('[upload] Supabase Storage error:', 'Error', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = service.storage.from(BUCKET).getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl });
}
