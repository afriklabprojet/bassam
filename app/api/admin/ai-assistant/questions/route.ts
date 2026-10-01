import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';

const LIST_LIMIT = 100;

const idSchema = z.object({ id: z.uuid() });

/** PostgREST / Postgres codes meaning "the table does not exist (yet)". */
function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '');
}

/* ─── GET — open questions the assistant could not answer ─────────────────── */
export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('assistant_unanswered')
      .select('id, question, reason, occurrences, last_seen_at')
      .eq('status', 'new')
      .order('occurrences', { ascending: false })
      .order('last_seen_at', { ascending: false })
      .limit(LIST_LIMIT);

    if (error) {
      if (isMissingTable(error)) return NextResponse.json({ questions: [], setupRequired: true });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ questions: data ?? [], setupRequired: false });
  } catch (err) {
    logger.error('[Admin /ai-assistant/questions GET]', 'Error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/* ─── PATCH — mark a question as handled (kept out of the list) ───────────── */
export async function PATCH(req: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const parsed = idSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase.from('assistant_unanswered').update({ status: 'resolved' }).eq('id', parsed.data.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('[Admin /ai-assistant/questions PATCH]', 'Error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/* ─── DELETE — remove a question for good ─────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const parsed = idSchema.safeParse({ id: req.nextUrl.searchParams.get('id') });
    if (!parsed.success) return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase.from('assistant_unanswered').delete().eq('id', parsed.data.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('[Admin /ai-assistant/questions DELETE]', 'Error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
