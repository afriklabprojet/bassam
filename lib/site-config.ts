/** Single source of truth for the production domain. Never duplicate this. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vipparfumeriebar.com';

/** Opening hours, shown on /contact and given by the AI assistant: change them here only. */
export const SHOP_HOURS = {
  short: 'Lun–Sam, 8h–18h',
  full: 'Lundi – Samedi · 8h00 – 18h00 (GMT)',
} as const;
