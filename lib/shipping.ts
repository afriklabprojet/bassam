import { createServiceClient } from './supabase/service';

export const SHIPPING_CONFIG_KEY = 'shipping_config';

export interface DeliveryMode {
  id: string;
  label: string;
  description: string; // délai + info affichée au client
  fee: number;         // FCFA — 0 = gratuit (ex: retrait)
  enabled: boolean;
  type: 'delivery' | 'pickup'; // pickup = pas d'adresse requise
}

export interface ShippingConfig {
  modes: DeliveryMode[];
}

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  modes: [
    {
      id: 'express',
      label: 'Livraison Express',
      description: "Aujourd'hui avant 20h (commande avant 12h) — Abidjan uniquement",
      fee: 2500,
      enabled: true,
      type: 'delivery',
    },
    {
      id: 'standard',
      label: 'Livraison Standard',
      description: '24 à 48h ouvrables — Abidjan et environs',
      fee: 1500,
      enabled: true,
      type: 'delivery',
    },
    {
      id: 'interieur',
      label: 'Livraison Intérieur CI',
      description: '3 à 5 jours ouvrables — Bouaké, Yamoussoukro, San-Pédro…',
      fee: 3500,
      enabled: true,
      type: 'delivery',
    },
    {
      id: 'retrait',
      label: 'Retrait en boutique',
      description: 'Disponible dans la journée — Marcory, Abidjan',
      fee: 0,
      enabled: true,
      type: 'pickup',
    },
  ],
};

export function getShippingFee(config: ShippingConfig, modeId: string): number {
  const mode = config.modes.find(m => m.id === modeId && m.enabled);
  return mode?.fee ?? 0;
}

export function getMinDeliveryFee(config: ShippingConfig): number {
  const fees = config.modes
    .filter(m => m.enabled && m.type === 'delivery')
    .map(m => m.fee);
  return fees.length > 0 ? Math.min(...fees) : 0;
}

export async function getShippingConfig(): Promise<ShippingConfig> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SHIPPING_CONFIG_KEY)
      .single();

    if (data?.value) {
      const parsed = JSON.parse(data.value as string) as Partial<ShippingConfig> & Record<string, unknown>;
      // New format: has modes array
      if (Array.isArray(parsed.modes)) {
        return { modes: parsed.modes as DeliveryMode[] };
      }
    }
  } catch {
    // fall through
  }
  return { ...DEFAULT_SHIPPING_CONFIG };
}
