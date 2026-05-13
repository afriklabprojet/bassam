import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// ── GET /api/admin/collections ────────────────────────────────────────────────
export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('collections_content')
      .select('slug, eyebrow, tagline, description')
      .order('slug');

    if (error) throw error;

    return NextResponse.json({ collections: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}

// ── PUT /api/admin/collections ────────────────────────────────────────────────
// Body: { slug: string; eyebrow?: string; tagline?: string; description?: string }[]
// or a single object
export async function PUT(req: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const body = await req.json() as
      | { slug: string; eyebrow?: string; tagline?: string; description?: string }
      | { slug: string; eyebrow?: string; tagline?: string; description?: string }[];

    const rows = Array.isArray(body) ? body : [body];

    const VALID_SLUGS = new Set(['nouveautes', 'femme', 'homme', 'mixte']);
    for (const row of rows) {
      if (!VALID_SLUGS.has(row.slug)) {
        return NextResponse.json(
          { error: `Slug invalide : ${row.slug}` },
          { status: 400 },
        );
      }
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('collections_content')
      .upsert(
        rows.map((r) => ({
          slug: r.slug,
          eyebrow: r.eyebrow ?? '',
          tagline: r.tagline ?? '',
          description: r.description ?? '',
          updated_at: new Date().toISOString(),
        })),
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
