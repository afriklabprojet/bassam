import {
  getSiteBranding,
  isValidColor,
  isValidGFontUrl,
  sanitizeFontFamily,
} from '@/lib/branding';

/**
 * Server Component — injecte une balise <style> dans le <head>.
 *
 * Surcharge les variables CSS de globals.css à la volée, sans JavaScript
 * côté client et sans flash de contenu non stylé (FOUC).
 *
 * Variables remplacées :
 *  --gold, --gold-light, --gold-dark, --gold-muted
 *  --font-serif, --font-sans
 *
 * Injecté via : <BrandingInjector /> dans app/layout.tsx → <head>
 */
export async function BrandingInjector() {
  const b = await getSiteBranding();

  // ─── Sécurité : valider chaque valeur avant injection ────────────────────
  const accent      = isValidColor(b.colorAccent)      ? b.colorAccent      : '#C5A55A';
  const accentLight = isValidColor(b.colorAccentLight)  ? b.colorAccentLight : '#D9BE80';
  const accentDark  = isValidColor(b.colorAccentDark)   ? b.colorAccentDark  : '#9B7B38';
  const accentMuted = isValidColor(b.colorAccentMuted)  ? b.colorAccentMuted : 'rgba(197,165,90,0.15)';

  const serifFamily = sanitizeFontFamily(b.fontSerifFamily);
  const sansFamily  = sanitizeFontFamily(b.fontSansFamily);

  const serifImportLine = isValidGFontUrl(b.fontSerifImport)
    ? `@import url('${b.fontSerifImport}');`
    : '';
  const sansImportLine  = isValidGFontUrl(b.fontSansImport)
    ? `@import url('${b.fontSansImport}');`
    : '';

  const css = [
    serifImportLine,
    sansImportLine,
    ':root {',
    `  --gold: ${accent};`,
    `  --gold-light: ${accentLight};`,
    `  --gold-dark: ${accentDark};`,
    `  --gold-muted: ${accentMuted};`,
    `  --font-serif: ${serifFamily};`,
    `  --font-sans: ${sansFamily};`,
    '}',
  ]
    .filter(Boolean)
    .join('\n');

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
