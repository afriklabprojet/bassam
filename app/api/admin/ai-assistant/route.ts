import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';
import { getAssistantConfig } from '@/lib/ai/assistant-config-store';
import { ASSISTANT_CONFIG_KEY, assistantConfigSchema } from '@/lib/ai/assistant-config';

/* ─── GET /api/admin/ai-assistant ────────────────────────────────────────── */
export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    return NextResponse.json({ config: await getAssistantConfig() });
  } catch (err) {
    logger.error('[Admin /ai-assistant GET]', 'Error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/* ─── PUT /api/admin/ai-assistant ────────────────────────────────────────── */
export async function PUT(req: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    const parsed = assistantConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => `${i.path.join('.') || 'config'} : ${i.message}`).join(' · ') },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: ASSISTANT_CONFIG_KEY, value: JSON.stringify(parsed.data) }, { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // The storefront layout embeds the public part (name, avatar, welcome) — refresh it now.
    revalidatePath('/', 'layout');

    return NextResponse.json({ config: parsed.data });
  } catch (err) {
    logger.error('[Admin /ai-assistant PUT]', 'Error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
