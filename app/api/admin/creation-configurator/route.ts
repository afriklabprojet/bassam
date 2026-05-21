import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { createServiceClient } from '@/lib/supabase/service';
import { getDefaultCreationConfig, CREATION_CONFIG_KEY, type CreationConfig } from '@/lib/custom-creation';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', CREATION_CONFIG_KEY)
      .single();

    const config: CreationConfig = data?.value
      ? (JSON.parse(data.value) as CreationConfig)
      : getDefaultCreationConfig();

    return NextResponse.json({ config });
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
    const config = await req.json() as CreationConfig;

    if (!config.formulas || !config.families || !config.notes || !config.bottles) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key: CREATION_CONFIG_KEY, value: JSON.stringify(config), updated_at: new Date().toISOString() },
        { onConflict: 'key' },
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
