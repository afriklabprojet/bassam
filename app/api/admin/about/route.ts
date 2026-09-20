import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/service';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { getAboutPageContent, toAboutPageSettingRows } from '@/lib/supabase/about-content';

export const runtime = 'nodejs';

const SECTION_TABLE: Record<string, string> = {
  stats:       'about_stats',
  valeurs:     'about_valeurs',
  engagements: 'about_engagements',
};

const VALID_SLUGS: Record<string, readonly string[]> = {
  stats:       ['stat-references', 'stat-maisons', 'stat-clients', 'stat-annees'],
  valeurs:     ['valeur-authenticite', 'valeur-excellence', 'valeur-accessibilite'],
  engagements: ['engagement-tracabilite', 'engagement-emballage', 'engagement-paiement', 'engagement-livraison', 'engagement-sav', 'engagement-conseil'],
};

const contentField = z.string().trim().min(1).max(2000);
const shortField = z.string().trim().min(1).max(200);
const hrefField = z.string().trim().min(1).max(300).refine((value) => {
  if (value.startsWith('/')) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}, 'URL interne ou HTTPS attendue');

const SINGLETON_SCHEMAS = {
  hero: z.object({
    eyebrow: shortField,
    title_line1: shortField,
    title_em: shortField,
    subtitle: contentField,
  }),
  story: z.object({
    section_eyebrow: shortField,
    title_line1: shortField,
    title_em: shortField,
    paragraph1: contentField,
    paragraph2: contentField,
    paragraph3: contentField,
    quote_text: contentField,
    quote_author: shortField,
  }),
  page: z.object({
    meta_title: shortField,
    meta_description: contentField,
    meta_keywords: contentField,
    values_eyebrow: shortField,
    values_title: shortField,
    values_title_em: shortField,
    brands_eyebrow: shortField,
    brands: z.array(shortField).min(1).max(40),
    engagements_eyebrow: shortField,
    engagements_title: shortField,
    engagements_title_em: shortField,
    engagements_description: contentField,
    engagements_cta_label: shortField,
    engagements_cta_href: hrefField,
    cta_eyebrow: shortField,
    cta_title: shortField,
    cta_title_em: shortField,
    cta_description: contentField,
    cta_primary_label: shortField,
    cta_primary_href: hrefField,
    cta_secondary_label: shortField,
    cta_secondary_href: hrefField,
  }),
} as const;

const SINGLETON_TABLES = {
  hero: 'about_hero',
  story: 'about_story',
} as const;

// ── GET /api/admin/about ───────────────────────────────────────────────────────
export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  try {
    const supabase = createServiceClient();
    const [statsRes, valeursRes, engagementsRes, heroRes, storyRes, page] = await Promise.all([
      supabase.from('about_stats').select('*').order('ordre'),
      supabase.from('about_valeurs').select('*').order('ordre'),
      supabase.from('about_engagements').select('*').order('ordre'),
      supabase.from('about_hero').select('eyebrow, title_line1, title_em, subtitle').eq('id', 1).single(),
      supabase.from('about_story').select('section_eyebrow, title_line1, title_em, paragraph1, paragraph2, paragraph3, quote_text, quote_author').eq('id', 1).single(),
      getAboutPageContent(),
    ]);

    return NextResponse.json({
      stats:       statsRes.data ?? [],
      valeurs:     valeursRes.data ?? [],
      engagements: engagementsRes.data ?? [],
      hero:         heroRes.data ?? null,
      story:        storyRes.data ?? null,
      page,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}

// ── PUT /api/admin/about ───────────────────────────────────────────────────────
// Body: { section, rows } for lists or { section, data } for singletons.
interface PutBody {
  section: string;
  rows?: Record<string, unknown>[];
  data?: unknown;
}

export async function PUT(req: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  try {
    const body = await req.json() as PutBody;
    const { section } = body;

    if (section === 'page') {
      const parsed = SINGLETON_SCHEMAS.page.safeParse(body.data);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Contenu page invalide', details: parsed.error.issues },
          { status: 400 },
        );
      }

      const supabase = createServiceClient();
      const { error } = await supabase
        .from('site_settings')
        .upsert(toAboutPageSettingRows(parsed.data), { onConflict: 'key' });

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (Object.hasOwn(SINGLETON_TABLES, section)) {
      const singletonSection = section as keyof typeof SINGLETON_TABLES;
      const parsed = SINGLETON_SCHEMAS[singletonSection].safeParse(body.data);

      if (!parsed.success) {
        return NextResponse.json(
          { error: `Contenu ${section} invalide`, details: parsed.error.issues },
          { status: 400 },
        );
      }

      const supabase = createServiceClient();
      const { error } = await supabase
        .from(SINGLETON_TABLES[singletonSection])
        .upsert({ id: 1, ...parsed.data, updated_at: new Date().toISOString() }, { onConflict: 'id' });

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    const table = SECTION_TABLE[section];
    if (!table) {
      return NextResponse.json({ error: `Section invalide : ${section}` }, { status: 400 });
    }

    const rows = body.rows;
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: 'Liste de contenu invalide' }, { status: 400 });
    }

    const validSlugs = new Set(VALID_SLUGS[section]);
    for (const row of rows) {
      if (typeof row.slug !== 'string' || !validSlugs.has(row.slug)) {
        return NextResponse.json({ error: `Slug invalide : ${String(row.slug)}` }, { status: 400 });
      }
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from(table)
      .upsert(
        rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })),
        { onConflict: 'slug' },
      );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}
