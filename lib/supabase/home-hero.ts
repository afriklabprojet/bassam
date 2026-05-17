export interface HeroStat {
  value: string;
  label: string;
}

export interface HeroCollectionLink {
  href: string;
  name: string;
  count: string;
  tone: string;
}

export interface HeroProductVisual {
  src: string;
  alt: string;
}

export interface HomeHeroContent {
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  trustItems: string[];
  stats: HeroStat[];
  showcaseEyebrow: string;
  showcaseTitle: string;
  productVisuals: HeroProductVisual[];
  collectionLinks: HeroCollectionLink[];
  brandTicker: string[];
  scrollLabel: string;
}

export const DEFAULT_HOME_HERO: HomeHeroContent = {
  eyebrow: 'Haute parfumerie authentique',
  title: 'Votre parfum signature,',
  titleAccent: 'choisi avec précision.',
  description:
    'Une sélection premium de maisons iconiques et de fragrances rares, livrée rapidement en Côte d\'Ivoire avec accompagnement personnalisé.',
  primaryCtaLabel: 'Voir les best-sellers',
  primaryCtaHref: '/#top-ventes',
  secondaryCtaLabel: 'Trouver mon parfum',
  secondaryCtaHref: '/services/quiz-olfactif',
  trustItems: [
    'Authenticité vérifiée',
    'Livraison 24 h à Abidjan',
    'Paiement Orange Money, MTN, Wave',
    'Conseil olfactif personnalisé',
  ],
  stats: [
    { value: '300+', label: 'Fragrances' },
    { value: '40+', label: 'Maisons' },
    { value: '100%', label: 'Authentique' },
  ],
  showcaseEyebrow: 'Édition 2026',
  showcaseTitle: 'VIP Selection',
  productVisuals: [
    {
      src: '/images/products/dior-sauvage.svg',
      alt: 'Flacon Dior Sauvage disponible chez VIP Parfumerie Bar',
    },
    {
      src: '/images/products/oud-wood.svg',
      alt: 'Flacon Tom Ford Oud Wood disponible chez VIP Parfumerie Bar',
    },
    {
      src: '/images/products/black-opium.svg',
      alt: 'Flacon Black Opium disponible chez VIP Parfumerie Bar',
    },
  ],
  collectionLinks: [
    { href: '/collections/femme', name: 'Femme', count: 'Floraux, ambrés, poudrés', tone: '#C5A55A' },
    { href: '/collections/homme', name: 'Homme', count: 'Boisés, frais, cuirés', tone: '#7896B2' },
    { href: '/collections/mixte', name: 'Mixte', count: 'Oud, santal, muscs', tone: '#A89B7A' },
  ],
  brandTicker: [
    'Dior',
    'Chanel',
    'Creed',
    'Tom Ford',
    'Maison Francis Kurkdjian',
    'Le Labo',
    'Guerlain',
    'Jo Malone',
  ],
  scrollLabel: 'Explorer',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function stringArrayOrFallback(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const strings = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return strings.length > 0 ? strings : fallback;
}

function statsOrFallback(value: unknown, fallback: HeroStat[]) {
  if (!Array.isArray(value)) return fallback;
  const stats = value
    .filter(isRecord)
    .map((item) => ({
      value: stringOrFallback(item.value, ''),
      label: stringOrFallback(item.label, ''),
    }))
    .filter((item) => item.value && item.label);
  return stats.length > 0 ? stats : fallback;
}

function productVisualsOrFallback(value: unknown, fallback: HeroProductVisual[]) {
  if (!Array.isArray(value)) return fallback;
  const visuals = value
    .filter(isRecord)
    .map((item) => ({
      src: stringOrFallback(item.src, ''),
      alt: stringOrFallback(item.alt, ''),
    }))
    .filter((item) => item.src && item.alt)
    .slice(0, 3);
  return visuals.length > 0 ? visuals : fallback;
}

function collectionLinksOrFallback(value: unknown, fallback: HeroCollectionLink[]) {
  if (!Array.isArray(value)) return fallback;
  const links = value
    .filter(isRecord)
    .map((item) => ({
      href: stringOrFallback(item.href, ''),
      name: stringOrFallback(item.name, ''),
      count: stringOrFallback(item.count, ''),
      tone: stringOrFallback(item.tone, '#C5A55A'),
    }))
    .filter((item) => item.href && item.name && item.count)
    .slice(0, 6);
  return links.length > 0 ? links : fallback;
}

function mapDbHero(row: Record<string, unknown>): HomeHeroContent {
  return {
    eyebrow: stringOrFallback(row.eyebrow, DEFAULT_HOME_HERO.eyebrow),
    title: stringOrFallback(row.title, DEFAULT_HOME_HERO.title),
    titleAccent: stringOrFallback(row.title_accent, DEFAULT_HOME_HERO.titleAccent),
    description: stringOrFallback(row.description, DEFAULT_HOME_HERO.description),
    primaryCtaLabel: stringOrFallback(row.primary_cta_label, DEFAULT_HOME_HERO.primaryCtaLabel),
    primaryCtaHref: stringOrFallback(row.primary_cta_href, DEFAULT_HOME_HERO.primaryCtaHref),
    secondaryCtaLabel: stringOrFallback(row.secondary_cta_label, DEFAULT_HOME_HERO.secondaryCtaLabel),
    secondaryCtaHref: stringOrFallback(row.secondary_cta_href, DEFAULT_HOME_HERO.secondaryCtaHref),
    trustItems: stringArrayOrFallback(row.trust_items, DEFAULT_HOME_HERO.trustItems),
    stats: statsOrFallback(row.stats, DEFAULT_HOME_HERO.stats),
    showcaseEyebrow: stringOrFallback(row.showcase_eyebrow, DEFAULT_HOME_HERO.showcaseEyebrow),
    showcaseTitle: stringOrFallback(row.showcase_title, DEFAULT_HOME_HERO.showcaseTitle),
    productVisuals: productVisualsOrFallback(row.product_visuals, DEFAULT_HOME_HERO.productVisuals),
    collectionLinks: collectionLinksOrFallback(row.collection_links, DEFAULT_HOME_HERO.collectionLinks),
    brandTicker: stringArrayOrFallback(row.brand_ticker, DEFAULT_HOME_HERO.brandTicker),
    scrollLabel: stringOrFallback(row.scroll_label, DEFAULT_HOME_HERO.scrollLabel),
  };
}

export async function getHomeHero(): Promise<HomeHeroContent> {
  try {
    const { createServiceClient } = await import('./service');
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('home_hero')
      .select('*')
      .eq('id', 'home')
      .maybeSingle();

    if (error || !data) return DEFAULT_HOME_HERO;

    return mapDbHero(data as Record<string, unknown>);
  } catch {
    return DEFAULT_HOME_HERO;
  }
}

export function toHomeHeroDbRow(content: HomeHeroContent) {
  return {
    id: 'home',
    eyebrow: content.eyebrow,
    title: content.title,
    title_accent: content.titleAccent,
    description: content.description,
    primary_cta_label: content.primaryCtaLabel,
    primary_cta_href: content.primaryCtaHref,
    secondary_cta_label: content.secondaryCtaLabel,
    secondary_cta_href: content.secondaryCtaHref,
    trust_items: content.trustItems,
    stats: content.stats,
    showcase_eyebrow: content.showcaseEyebrow,
    showcase_title: content.showcaseTitle,
    product_visuals: content.productVisuals,
    collection_links: content.collectionLinks,
    brand_ticker: content.brandTicker,
    scroll_label: content.scrollLabel,
    updated_at: new Date().toISOString(),
  };
}