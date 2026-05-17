import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { createServiceClient } from '@/lib/supabase/service';
import {
  getHomeHero,
  toHomeHeroDbRow,
} from '@/lib/supabase/home-hero';
import { isValidColor } from '@/lib/branding';

export const runtime = 'nodejs';

function isInternalOrHttpsUrl(value: string) {
  if (value.startsWith('/')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isAllowedImageSrc(value: string) {
  if (value.startsWith('/')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in'))
      && url.pathname.startsWith('/storage/v1/object/public/');
  } catch {
    return false;
  }
}

const ctaHrefSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .refine(isInternalOrHttpsUrl, {
    message: 'URL interne ou HTTPS attendue',
  });

const imageSrcSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .refine(isAllowedImageSrc, {
    message: 'Image locale ou Supabase Storage attendue',
  });

const toneSchema = z
  .string()
  .trim()
  .max(40)
  .refine(isValidColor, { message: 'Couleur invalide' });

const heroSchema = z.object({
  eyebrow: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(90),
  titleAccent: z.string().trim().min(1).max(90),
  description: z.string().trim().min(1).max(360),
  primaryCtaLabel: z.string().trim().min(1).max(40),
  primaryCtaHref: ctaHrefSchema,
  secondaryCtaLabel: z.string().trim().min(1).max(40),
  secondaryCtaHref: ctaHrefSchema,
  trustItems: z.array(z.string().trim().min(1).max(90)).min(1).max(8),
  stats: z.array(z.object({
    value: z.string().trim().min(1).max(18),
    label: z.string().trim().min(1).max(40),
  })).min(1).max(4),
  showcaseEyebrow: z.string().trim().min(1).max(50),
  showcaseTitle: z.string().trim().min(1).max(60),
  productVisuals: z.array(z.object({
    src: imageSrcSchema,
    alt: z.string().trim().min(1).max(160),
  })).min(1).max(3),
  collectionLinks: z.array(z.object({
    href: ctaHrefSchema,
    name: z.string().trim().min(1).max(40),
    count: z.string().trim().min(1).max(80),
    tone: toneSchema,
  })).min(1).max(6),
  brandTicker: z.array(z.string().trim().min(1).max(60)).min(1).max(16),
  scrollLabel: z.string().trim().min(1).max(30),
});

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  try {
    return NextResponse.json({ hero: await getHomeHero() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = heroSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Contenu hero invalide', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('home_hero')
      .upsert(toHomeHeroDbRow(parsed.data), { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}