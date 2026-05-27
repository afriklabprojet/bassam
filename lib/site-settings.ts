/**
 * Site settings — source of truth for contact/social config.
 *
 * Server-side async fetch from Supabase `site_settings` table,
 * with env-var fallback for backward compatibility.
 *
 * Usage in Server Components / API Routes:
 *   const settings = await getSiteSettings();
 *
 * For Client Components, use `useSiteSettings()` from site-settings-context.
 */

export interface SiteSettings {
  support_phone: string;
  support_phone_display: string;
  support_email: string;
  whatsapp_number: string;
  whatsapp_display: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  address_display: string;
  address_detail: string;
  /** URL du logo (Supabase Storage ou chemin local) */
  logo_url: string;
  /** URL du favicon/icône (Supabase Storage ou chemin local) */
  favicon_url: string;
  /** Nom affiché de l'experte/consultante */
  consultant_name: string;
  /** Photo de profil de la consultante (URL Supabase Storage) */
  consultant_photo_url: string;
  /** Délai de réponse garanti en heures (affiché dans le compte à rebours) */
  consultant_response_hours: string;
}

/** Fallback values from env vars (backward-compatible) */
export const DEFAULT_SETTINGS: SiteSettings = {
  support_phone: (process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '').replaceAll(/\D/g, ''),
  support_phone_display: process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY ?? '',
  support_email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? '',
  whatsapp_number: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replaceAll(/\D/g, ''),
  whatsapp_display: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? '',
  instagram_url: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? '',
  facebook_url: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? '',
  tiktok_url: process.env.NEXT_PUBLIC_TIKTOK_URL ?? '',
  address_display: process.env.NEXT_PUBLIC_ADDRESS_DISPLAY ?? 'Abidjan, Côte d\'Ivoire',
  address_detail: process.env.NEXT_PUBLIC_ADDRESS_DETAIL ?? 'Livraison dans toute l\'Afrique de l\'Ouest',
  logo_url: '',
  favicon_url: '',
  consultant_name: '',
  consultant_photo_url: '',
  consultant_response_hours: '24',
};

/** Fetch settings from DB, falling back to env vars. Server-side only. */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const { createServiceClient } = await import('./supabase/service');
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value');

    if (error || !data || data.length === 0) {
      return DEFAULT_SETTINGS;
    }

    const map = Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]));

    return {
      support_phone: (map.support_phone ?? DEFAULT_SETTINGS.support_phone).replaceAll(/\D/g, ''),
      support_phone_display: map.support_phone_display ?? DEFAULT_SETTINGS.support_phone_display,
      support_email: map.support_email ?? DEFAULT_SETTINGS.support_email,
      whatsapp_number: (map.whatsapp_number ?? DEFAULT_SETTINGS.whatsapp_number).replaceAll(/\D/g, ''),
      whatsapp_display: map.whatsapp_display ?? DEFAULT_SETTINGS.whatsapp_display,
      instagram_url: map.instagram_url ?? DEFAULT_SETTINGS.instagram_url,
      facebook_url: map.facebook_url ?? DEFAULT_SETTINGS.facebook_url,
      tiktok_url: map.tiktok_url ?? DEFAULT_SETTINGS.tiktok_url,
      address_display: map.address_display ?? DEFAULT_SETTINGS.address_display,
      address_detail: map.address_detail ?? DEFAULT_SETTINGS.address_detail,
      logo_url: map.logo_url ?? '',
      favicon_url: map.favicon_url ?? '',
      consultant_name: map.consultant_name ?? '',
      consultant_photo_url: map.consultant_photo_url ?? '',
      consultant_response_hours: map.consultant_response_hours ?? '24',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/* ─── Helper functions (pure, usable server + client side) ───────────────── */

export function hasWhatsApp(settings: SiteSettings) {
  return settings.whatsapp_number.length > 0;
}

export function buildWhatsAppHref(settings: SiteSettings, message: string) {
  if (!hasWhatsApp(settings)) return '/contact';
  return `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`;
}

export function getPhoneHref(settings: SiteSettings) {
  if (!settings.support_phone) return '';
  return `tel:+${settings.support_phone}`;
}
