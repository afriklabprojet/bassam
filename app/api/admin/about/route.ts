import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

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

// ── GET /api/admin/about ───────────────────────────────────────────────────────
export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  try {
    const supabase = createServiceClient();
    const [statsRes, valeursRes, engagementsRes] = await Promise.all([
      supabase.from('about_stats').select('*').order('ordre'),
      supabase.from('about_valeurs').select('*').order('ordre'),
      supabase.from('about_engagements').select('*').order('ordre'),
    ]);

    return NextResponse.json({
      stats:       statsRes.data ?? [],
      valeurs:     valeursRes.data ?? [],
      engagements: engagementsRes.data ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}

// ── PUT /api/admin/about ───────────────────────────────────────────────────────
// Body: { section: 'stats'|'valeurs'|'engagements', rows: Row[] }
interface PutBody {
  section: string;
  rows: Record<string, unknown>[];
}

export async function PUT(req: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  try {
    const body = await req.json() as PutBody;
    const { section, rows } = body;

    const table = SECTION_TABLE[section];
    if (!table) {
      return NextResponse.json({ error: `Section invalide : ${section}` }, { status: 400 });
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
