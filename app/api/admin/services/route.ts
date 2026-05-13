import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const VALID_SLUGS = new Set(['quiz-olfactif', 'consultation', 'creation-personnalisee']);

// ── GET /api/admin/services ───────────────────────────────────────────────────
export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('services_content')
      .select('slug, ordre, titre, accroche, description, details, cta_label, tag, is_active')
      .order('ordre');

    if (error) throw error;

    return NextResponse.json({ services: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}

// ── PUT /api/admin/services ───────────────────────────────────────────────────
// Body: single object or array with slug + editable fields
interface ServiceRow {
  slug: string;
  titre?: string;
  accroche?: string;
  description?: string;
  details?: string[];
  cta_label?: string;
  tag?: string;
  is_active?: boolean;
}

export async function PUT(req: NextRequest) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }
  try {
    const body = await req.json() as ServiceRow | ServiceRow[];
    const rows = Array.isArray(body) ? body : [body];

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
      .from('services_content')
      .upsert(
        rows.map((r) => ({
          slug: r.slug,
          ...(r.titre !== undefined && { titre: r.titre }),
          ...(r.accroche !== undefined && { accroche: r.accroche }),
          ...(r.description !== undefined && { description: r.description }),
          ...(r.details !== undefined && { details: r.details }),
          ...(r.cta_label !== undefined && { cta_label: r.cta_label }),
          ...(r.tag !== undefined && { tag: r.tag }),
          ...(r.is_active !== undefined && { is_active: r.is_active }),
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
