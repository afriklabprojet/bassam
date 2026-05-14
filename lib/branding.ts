/**
 * Site Branding System
 *
 * Persisted as key/value rows in `site_settings` (same table as other settings),
 * all keys prefixed with `brand_`.
 *
 * Flow:
 *  1. getSiteBranding()  ← Server-side fetch (used by BrandingInjector)
 *  2. BrandingInjector   ← Injects <style> into <head> with CSS var overrides
 *  3. Admin panel        ← Reads current branding, saves via PUT /api/admin/branding
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrandingConfig {
  /** Couleur d'accent principale (remplace --gold) */
  colorAccent: string;
  /** Variante claire */
  colorAccentLight: string;
  /** Variante foncée */
  colorAccentDark: string;
  /** Teinte atténuée rgba pour les fonds */
  colorAccentMuted: string;
  /** CSS font-family string pour les titres (serif) */
  fontSerifFamily: string;
  /** CSS font-family string pour le corps (sans-serif) */
  fontSansFamily: string;
  /** URL Google Fonts pour la police serif */
  fontSerifImport: string;
  /** URL Google Fonts pour la police sans */
  fontSansImport: string;
  /** Identifiant du préréglage actif */
  preset: string;
}

export interface BrandingPreset extends BrandingConfig {
  id: string;
  name: string;
  description: string;
  /** Couleur pour l'aperçu de swatch */
  previewAccent: string;
  /** Couleur de fond pour l'aperçu */
  previewBg: string;
}

// ─── Paires de polices ────────────────────────────────────────────────────────

const FONT_PAIRS = {
  cormorant_inter: {
    serifFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
    sansFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serifImport:
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap',
    sansImport:
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap',
  },
  playfair_raleway: {
    serifFamily: "'Playfair Display', Georgia, serif",
    sansFamily: "'Raleway', -apple-system, sans-serif",
    serifImport:
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap',
    sansImport:
      'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600&display=swap',
  },
  baskerville_montserrat: {
    serifFamily: "'Libre Baskerville', Georgia, serif",
    sansFamily: "'Montserrat', -apple-system, sans-serif",
    serifImport:
      'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap',
    sansImport:
      'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap',
  },
  ebgaramond_nunito: {
    serifFamily: "'EB Garamond', Georgia, serif",
    sansFamily: "'Nunito Sans', -apple-system, sans-serif",
    serifImport:
      'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap',
    sansImport:
      'https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,300;6..12,400;6..12,600&display=swap',
  },
  lora_dm: {
    serifFamily: "'Lora', Georgia, serif",
    sansFamily: "'DM Sans', -apple-system, sans-serif",
    serifImport:
      'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap',
    sansImport:
      'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap',
  },
} as const;

export const FONT_PAIR_IDS = Object.keys(FONT_PAIRS) as Array<keyof typeof FONT_PAIRS>;

export const FONT_PAIR_LABELS: Record<keyof typeof FONT_PAIRS, string> = {
  cormorant_inter: 'Cormorant Garamond + Inter',
  playfair_raleway: 'Playfair Display + Raleway',
  baskerville_montserrat: 'Libre Baskerville + Montserrat',
  ebgaramond_nunito: 'EB Garamond + Nunito Sans',
  lora_dm: 'Lora + DM Sans',
};

// ─── Préréglages ─────────────────────────────────────────────────────────────

export const BRANDING_PRESETS: BrandingPreset[] = [
  {
    id: 'luxury-gold',
    name: 'Luxury Gold',
    description: 'Noir profond × Or chaud',
    previewAccent: '#C5A55A',
    previewBg: '#191919',
    colorAccent: '#C5A55A',
    colorAccentLight: '#D9BE80',
    colorAccentDark: '#9B7B38',
    colorAccentMuted: 'rgba(197,165,90,0.15)',
    fontSerifFamily: FONT_PAIRS.cormorant_inter.serifFamily,
    fontSansFamily: FONT_PAIRS.cormorant_inter.sansFamily,
    fontSerifImport: FONT_PAIRS.cormorant_inter.serifImport,
    fontSansImport: FONT_PAIRS.cormorant_inter.sansImport,
    preset: 'luxury-gold',
  },
  {
    id: 'blanc-editorial',
    name: 'Blanc Éditorial',
    description: 'Argent × Blanc pur',
    previewAccent: '#A0A8B0',
    previewBg: '#F0EFEC',
    colorAccent: '#A0A8B0',
    colorAccentLight: '#C8D0D8',
    colorAccentDark: '#707880',
    colorAccentMuted: 'rgba(160,168,176,0.15)',
    fontSerifFamily: FONT_PAIRS.playfair_raleway.serifFamily,
    fontSansFamily: FONT_PAIRS.playfair_raleway.sansFamily,
    fontSerifImport: FONT_PAIRS.playfair_raleway.serifImport,
    fontSansImport: FONT_PAIRS.playfair_raleway.sansImport,
    preset: 'blanc-editorial',
  },
  {
    id: 'rose-precieux',
    name: 'Rose Précieux',
    description: 'Or rosé × Poudré',
    previewAccent: '#C9956C',
    previewBg: '#2A1F1C',
    colorAccent: '#C9956C',
    colorAccentLight: '#DDB090',
    colorAccentDark: '#9E6E48',
    colorAccentMuted: 'rgba(201,149,108,0.15)',
    fontSerifFamily: FONT_PAIRS.baskerville_montserrat.serifFamily,
    fontSansFamily: FONT_PAIRS.baskerville_montserrat.sansFamily,
    fontSerifImport: FONT_PAIRS.baskerville_montserrat.serifImport,
    fontSansImport: FONT_PAIRS.baskerville_montserrat.sansImport,
    preset: 'rose-precieux',
  },
  {
    id: 'bleu-nuit',
    name: 'Bleu Nuit',
    description: 'Saphir × Azur profond',
    previewAccent: '#4A6CF7',
    previewBg: '#0A0E2A',
    colorAccent: '#4A6CF7',
    colorAccentLight: '#7B9AFF',
    colorAccentDark: '#2A4CD4',
    colorAccentMuted: 'rgba(74,108,247,0.15)',
    fontSerifFamily: FONT_PAIRS.ebgaramond_nunito.serifFamily,
    fontSansFamily: FONT_PAIRS.ebgaramond_nunito.sansFamily,
    fontSerifImport: FONT_PAIRS.ebgaramond_nunito.serifImport,
    fontSansImport: FONT_PAIRS.ebgaramond_nunito.sansImport,
    preset: 'bleu-nuit',
  },
  {
    id: 'vert-botanique',
    name: 'Vert Botanique',
    description: 'Forêt × Crème naturelle',
    previewAccent: '#6B8F5E',
    previewBg: '#1A2016',
    colorAccent: '#6B8F5E',
    colorAccentLight: '#8CAF80',
    colorAccentDark: '#4E6B42',
    colorAccentMuted: 'rgba(107,143,94,0.15)',
    fontSerifFamily: FONT_PAIRS.lora_dm.serifFamily,
    fontSansFamily: FONT_PAIRS.lora_dm.sansFamily,
    fontSerifImport: FONT_PAIRS.lora_dm.serifImport,
    fontSansImport: FONT_PAIRS.lora_dm.sansImport,
    preset: 'vert-botanique',
  },
];

export const DEFAULT_BRANDING: BrandingConfig = {
  colorAccent: BRANDING_PRESETS[0].colorAccent,
  colorAccentLight: BRANDING_PRESETS[0].colorAccentLight,
  colorAccentDark: BRANDING_PRESETS[0].colorAccentDark,
  colorAccentMuted: BRANDING_PRESETS[0].colorAccentMuted,
  fontSerifFamily: BRANDING_PRESETS[0].fontSerifFamily,
  fontSansFamily: BRANDING_PRESETS[0].fontSansFamily,
  fontSerifImport: BRANDING_PRESETS[0].fontSerifImport,
  fontSansImport: BRANDING_PRESETS[0].fontSansImport,
  preset: BRANDING_PRESETS[0].preset,
};

// ─── Mapping DB ───────────────────────────────────────────────────────────────

export const BRANDING_DB_KEYS: Record<keyof BrandingConfig, string> = {
  colorAccent: 'brand_color_accent',
  colorAccentLight: 'brand_color_accent_light',
  colorAccentDark: 'brand_color_accent_dark',
  colorAccentMuted: 'brand_color_accent_muted',
  fontSerifFamily: 'brand_font_serif_family',
  fontSansFamily: 'brand_font_sans_family',
  fontSerifImport: 'brand_font_serif_import',
  fontSansImport: 'brand_font_sans_import',
  preset: 'brand_preset',
};

// ─── Fetch server-side ────────────────────────────────────────────────────────

/**
 * Récupère la config branding depuis Supabase (server-side uniquement).
 * Retourne les valeurs par défaut en cas d'erreur.
 */
export async function getSiteBranding(): Promise<BrandingConfig> {
  try {
    // Import dynamique pour ne pas polluer le bundle client
    const { createServiceClient } = await import('./supabase/service');
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .like('key', 'brand_%');

    if (error || !data || data.length === 0) return DEFAULT_BRANDING;

    const map = Object.fromEntries(
      data.map((r: { key: string; value: string }) => [r.key, r.value])
    );

    return {
      colorAccent:      map.brand_color_accent       ?? DEFAULT_BRANDING.colorAccent,
      colorAccentLight: map.brand_color_accent_light  ?? DEFAULT_BRANDING.colorAccentLight,
      colorAccentDark:  map.brand_color_accent_dark   ?? DEFAULT_BRANDING.colorAccentDark,
      colorAccentMuted: map.brand_color_accent_muted  ?? DEFAULT_BRANDING.colorAccentMuted,
      fontSerifFamily:  map.brand_font_serif_family   ?? DEFAULT_BRANDING.fontSerifFamily,
      fontSansFamily:   map.brand_font_sans_family    ?? DEFAULT_BRANDING.fontSansFamily,
      fontSerifImport:  map.brand_font_serif_import   ?? DEFAULT_BRANDING.fontSerifImport,
      fontSansImport:   map.brand_font_sans_import    ?? DEFAULT_BRANDING.fontSansImport,
      preset:           map.brand_preset              ?? DEFAULT_BRANDING.preset,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

// ─── Validation (security) ────────────────────────────────────────────────────

const HEX_RE = /^#[0-9A-Fa-f]{3,8}$/;
const RGBA_RE = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[\d.]+\s*)?\)$/;

export function isValidColor(v: string): boolean {
  return HEX_RE.test(v) || RGBA_RE.test(v);
}

export function isValidGFontUrl(v: string): boolean {
  return v.startsWith('https://fonts.googleapis.com/css2?') && v.length < 500;
}

/** Sanitise une chaîne font-family (supprime ; { } ) */
export function sanitizeFontFamily(v: string): string {
  return v.replaceAll(/[;{}]/g, '').substring(0, 200);
}
