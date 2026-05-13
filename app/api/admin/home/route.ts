import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const VALID_SLUGS = new Set(['femme', 'homme', 'mixte']);

// ── GET /api/admin/home ────────────────────────────────────────────────────────
export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('home_univers')
      .select('slug, tagline, description, notes, ordre')
      .order('ordre');

    if (error) throw error;

    return NextResponse.json({ univers: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}

// ── PUT /api/admin/home ────────────────────────────────────────────────────────
// Body: { rows: { slug, tagline, description, notes }[] }
interface UniversRow {
  slug: string;
  tagline: string;
  description: string;
  notes: string[];
  ordre?: number;
}

export async function PUT(req: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  try {
    const { rows } = (await req.json()) as { rows: UniversRow[] };

    for (const row of rows) {
      if (!VALID_SLUGS.has(row.slug)) {
        return NextResponse.json({ error: `Slug invalide : ${row.slug}` }, { status: 400 });
      }
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('home_univers')
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
