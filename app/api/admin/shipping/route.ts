import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { createServiceClient } from '@/lib/supabase/service';
import {
  SHIPPING_CONFIG_KEY,
  DEFAULT_SHIPPING_CONFIG,
  type ShippingConfig,
  type DeliveryMode,
} from '@/lib/shipping';

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
      .eq('key', SHIPPING_CONFIG_KEY)
      .single();

    let config: ShippingConfig = { ...DEFAULT_SHIPPING_CONFIG };
    if (data?.value) {
      const parsed = JSON.parse(data.value as string) as Partial<ShippingConfig> & Record<string, unknown>;
      if (Array.isArray(parsed.modes)) {
        config = { modes: parsed.modes as DeliveryMode[] };
      }
    }

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
    const body = await req.json() as Partial<ShippingConfig>;

    if (!Array.isArray(body.modes) || body.modes.length === 0) {
      return NextResponse.json({ error: 'Au moins un mode de livraison requis' }, { status: 400 });
    }

    const modes: DeliveryMode[] = body.modes
      .filter((m): m is DeliveryMode =>
        typeof m === 'object' && m !== null &&
        typeof m.id === 'string' && m.id.trim() !== '' &&
        typeof m.label === 'string' && m.label.trim() !== '' &&
        typeof m.fee === 'number' && m.fee >= 0 &&
        (m.type === 'delivery' || m.type === 'pickup')
      )
      .map(m => ({
        id: m.id.trim(),
        label: m.label.trim(),
        description: String(m.description ?? '').trim(),
        fee: Math.round(m.fee),
        enabled: Boolean(m.enabled),
        type: m.type,
      }));

    if (modes.length === 0) {
      return NextResponse.json({ error: 'Aucun mode valide fourni' }, { status: 400 });
    }

    const config: ShippingConfig = { modes };

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key: SHIPPING_CONFIG_KEY, value: JSON.stringify(config), updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );

    if (error) throw error;
    return NextResponse.json({ ok: true, config });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}
