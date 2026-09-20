import { createServiceClient } from '@/lib/supabase/service';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface AboutStat {
  slug: string;
  value: string;
  label: string;
  ordre: number;
}

export interface AboutValeur {
  slug: string;
  num: string;
  titre: string;
  texte: string;
  ordre: number;
}

export interface AboutEngagement {
  slug: string;
  titre: string;
  texte: string;
  ordre: number;
}

/* ── Defaults (miroir exact du contenu frontend) ───────────────────────────── */

export const DEFAULT_STATS: AboutStat[] = [
  { slug: 'stat-references', value: '150+',   label: 'Références en stock',    ordre: 1 },
  { slug: 'stat-maisons',    value: '40+',    label: 'Maisons de luxe',        ordre: 2 },
  { slug: 'stat-clients',    value: '5\u202F000+', label: 'Clients satisfaits', ordre: 3 },
  { slug: 'stat-annees',     value: '3',      label: "Années d'excellence",    ordre: 4 },
];

export const DEFAULT_VALEURS: AboutValeur[] = [
  {
    slug: 'valeur-authenticite',
    num: '01',
    titre: 'Authenticité garantie',
    texte:
      "Chaque flacon vendu chez VIP Parfumerie Bar est 100\u00A0% authentique, sourcé directement auprès des distributeurs officiels et des maisons de parfumerie européennes. Aucun compromis sur la qualité.",
    ordre: 1,
  },
  {
    slug: 'valeur-excellence',
    num: '02',
    titre: 'Excellence de service',
    texte:
      "De la sélection du parfum à la livraison à domicile, chaque étape est pensée pour vous offrir une expérience à la hauteur des plus grandes maisons. Notre équipe vous accompagne avec discrétion et expertise.",
    ordre: 2,
  },
  {
    slug: 'valeur-accessibilite',
    num: '03',
    titre: 'Accessibilité du luxe',
    texte:
      "Le luxe ne devrait pas être réservé à quelques-uns. Nous rendons les parfums d\u2019exception accessibles à toute l\u2019Afrique de l\u2019Ouest grâce au paiement Mobile Money et à une logistique locale maîtrisée.",
    ordre: 3,
  },
];

export const DEFAULT_ENGAGEMENTS: AboutEngagement[] = [
  { slug: 'engagement-tracabilite', titre: 'Traçabilité totale',    texte: "Chaque produit est accompagné de son certificat d'authenticité et de son numéro de lot vérifiable.", ordre: 1 },
  { slug: 'engagement-emballage',   titre: 'Emballage premium',     texte: 'Coffrets signature, papier de soie et ruban or — votre commande arrive comme un cadeau.', ordre: 2 },
  { slug: 'engagement-paiement',    titre: 'Paiement sécurisé',     texte: "Mobile Money, carte bancaire, Orange Money, Wave — nous acceptons tous vos moyens de paiement locaux.", ordre: 3 },
  { slug: 'engagement-livraison',   titre: 'Livraison rapide',      texte: "24 à 72h à Abidjan, 3 à 5 jours dans toute l\u2019Afrique de l\u2019Ouest.", ordre: 4 },
  { slug: 'engagement-sav',         titre: 'Service après-vente',   texte: "Un problème\u00A0? Notre équipe répond en moins de 2h par WhatsApp, 7j/7.", ordre: 5 },
  { slug: 'engagement-conseil',     titre: 'Conseil personnalisé',  texte: "Pas sûr(e) de votre choix\u00A0? Notre quiz olfactif IA vous guide vers votre signature parfaite.", ordre: 6 },
];

/* ── Getters ────────────────────────────────────────────────────────────────── */

export async function getAboutStats(): Promise<AboutStat[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('about_stats')
      .select('slug, value, label, ordre')
      .order('ordre', { ascending: true });

    if (error || !data || data.length === 0) return DEFAULT_STATS;
    // merge: garder les slugs connus uniquement
    return DEFAULT_STATS.map((def) => {
      const db = (data as AboutStat[]).find((r) => r.slug === def.slug);
      return db ? { ...def, ...db } : def;
    });
  } catch {
    return DEFAULT_STATS;
  }
}

export async function getAboutValeurs(): Promise<AboutValeur[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('about_valeurs')
      .select('slug, num, titre, texte, ordre')
      .order('ordre', { ascending: true });

    if (error || !data || data.length === 0) return DEFAULT_VALEURS;
    return DEFAULT_VALEURS.map((def) => {
      const db = (data as AboutValeur[]).find((r) => r.slug === def.slug);
      return db ? { ...def, ...db } : def;
    });
  } catch {
    return DEFAULT_VALEURS;
  }
}

export async function getAboutEngagements(): Promise<AboutEngagement[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('about_engagements')
      .select('slug, titre, texte, ordre')
      .order('ordre', { ascending: true });

    if (error || !data || data.length === 0) return DEFAULT_ENGAGEMENTS;
    return DEFAULT_ENGAGEMENTS.map((def) => {
      const db = (data as AboutEngagement[]).find((r) => r.slug === def.slug);
      return db ? { ...def, ...db } : def;
    });
  } catch {
    return DEFAULT_ENGAGEMENTS;
  }
}

/* ── AboutHero ──────────────────────────────────────────────────────────────── */

export interface AboutHero {
  eyebrow: string;
  title_line1: string;
  title_em: string;
  subtitle: string;
}

export const DEFAULT_HERO: AboutHero = {
  eyebrow: 'Notre histoire',
  title_line1: "L'excellence olfactive,",
  title_em: "au cœur de l'Afrique.",
  subtitle:
    "VIP Parfumerie Bar est né d'une conviction simple : chaque personne mérite d'accéder aux plus beaux parfums du monde, ici, en Afrique de l'Ouest, sans compromis sur l'authenticité ni sur l'expérience.",
};

export async function getAboutHero(): Promise<AboutHero> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('about_hero')
      .select('eyebrow, title_line1, title_em, subtitle')
      .eq('id', 1)
      .single();

    if (error || !data) return DEFAULT_HERO;
    return {
      eyebrow: data.eyebrow || DEFAULT_HERO.eyebrow,
      title_line1: data.title_line1 || DEFAULT_HERO.title_line1,
      title_em: data.title_em || DEFAULT_HERO.title_em,
      subtitle: data.subtitle || DEFAULT_HERO.subtitle,
    };
  } catch {
    return DEFAULT_HERO;
  }
}

/* ── AboutStory ─────────────────────────────────────────────────────────────── */

export interface AboutStory {
  section_eyebrow: string;
  title_line1: string;
  title_em: string;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  quote_text: string;
  quote_author: string;
}

export const DEFAULT_STORY: AboutStory = {
  section_eyebrow: 'Fondation',
  title_line1: 'Une maison née de la',
  title_em: 'passion du parfum rare.',
  paragraph1:
    "Fondée à Abidjan en 2022, VIP Parfumerie Bar est née de la frustration de ne pas trouver, en Afrique, des parfums de luxe authentiques à des prix honnêtes. Trop souvent, les Africains se voyaient proposer des contrefaçons, ou devaient faire confiance à des revendeurs opaques.",
  paragraph2:
    "Notre fondateur a décidé de changer cela. Fort de ses connexions avec les distributeurs officiels en Europe, il a construit une chaîne d'approvisionnement rigoureuse, transparente et traçable — directement depuis les maisons de parfumerie jusqu'à votre porte.",
  paragraph3:
    "Aujourd'hui, VIP Parfumerie Bar est la référence des amateurs de beaux parfums en Côte d'Ivoire et au-delà. Plus de 5\u202F000 clients font confiance à notre sélection, notre service et notre engagement pour l'authenticité.",
  quote_text:
    '\u201CChaque parfum que nous vendons a une histoire. Notre r\u00f4le est de vous aider \u00e0 trouver celle qui vous appartient.\u201D',
  quote_author: 'Le fondateur, VIP Parfumerie Bar',
};

const LEGACY_FOUNDER_PARAGRAPH =
  "Notre fondatrice a décidé de changer cela. Forte de ses connexions avec les distributeurs officiels en Europe, elle a construit une chaîne d'approvisionnement rigoureuse, transparente et traçable — directement depuis les maisons de parfumerie jusqu'à votre porte.";
const LEGACY_FOUNDER_AUTHOR = 'La fondatrice, VIP Parfumerie Bar';

export async function getAboutStory(): Promise<AboutStory> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('about_story')
      .select(
        'section_eyebrow, title_line1, title_em, paragraph1, paragraph2, paragraph3, quote_text, quote_author',
      )
      .eq('id', 1)
      .single();

    if (error || !data) return DEFAULT_STORY;
    return {
      section_eyebrow: data.section_eyebrow || DEFAULT_STORY.section_eyebrow,
      title_line1: data.title_line1 || DEFAULT_STORY.title_line1,
      title_em: data.title_em || DEFAULT_STORY.title_em,
      paragraph1: data.paragraph1 || DEFAULT_STORY.paragraph1,
      paragraph2: data.paragraph2 === LEGACY_FOUNDER_PARAGRAPH
        ? DEFAULT_STORY.paragraph2
        : data.paragraph2 || DEFAULT_STORY.paragraph2,
      paragraph3: data.paragraph3 || DEFAULT_STORY.paragraph3,
      quote_text: data.quote_text || DEFAULT_STORY.quote_text,
      quote_author: data.quote_author === LEGACY_FOUNDER_AUTHOR
        ? DEFAULT_STORY.quote_author
        : data.quote_author || DEFAULT_STORY.quote_author,
    };
  } catch {
    return DEFAULT_STORY;
  }
}

/* ── AboutPage ─────────────────────────────────────────────────────────────── */

export interface AboutPageContent {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  values_eyebrow: string;
  values_title: string;
  values_title_em: string;
  brands_eyebrow: string;
  brands: string[];
  engagements_eyebrow: string;
  engagements_title: string;
  engagements_title_em: string;
  engagements_description: string;
  engagements_cta_label: string;
  engagements_cta_href: string;
  cta_eyebrow: string;
  cta_title: string;
  cta_title_em: string;
  cta_description: string;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
}

export const DEFAULT_PAGE_CONTENT: AboutPageContent = {
  meta_title: 'À propos — VIP Parfumerie Bar Abidjan',
  meta_description: "Découvrez l'histoire de VIP Parfumerie Bar, votre maison de parfums de luxe authentiques au cœur d'Abidjan et de l'Afrique de l'Ouest.",
  meta_keywords: "parfumerie luxe Abidjan, histoire VIP Parfumerie Bar, parfums authentiques Côte d'Ivoire",
  values_eyebrow: 'Ce qui nous guide',
  values_title: 'Trois piliers,',
  values_title_em: 'une promesse.',
  brands_eyebrow: 'Maisons que nous distribuons',
  brands: ['Chanel', 'Dior', 'Yves Saint Laurent', 'Guerlain', 'Givenchy', 'Lancôme', 'Hermès', 'Tom Ford', 'Creed', 'Giorgio Armani', 'Versace', 'Paco Rabanne', 'Carolina Herrera', 'Jo Malone', 'Maison Margiela'],
  engagements_eyebrow: 'Nos engagements',
  engagements_title: 'Ce que nous vous',
  engagements_title_em: 'promettons.',
  engagements_description: 'Chaque engagement ci-contre est une promesse tenue au quotidien. Notre réputation se construit sur votre confiance.',
  engagements_cta_label: 'Nous contacter',
  engagements_cta_href: '/contact',
  cta_eyebrow: 'Rejoignez-nous',
  cta_title: 'Prêt(e) à découvrir votre',
  cta_title_em: 'signature olfactive ?',
  cta_description: "Explorez nos collections, passez notre quiz olfactif IA ou prenez rendez-vous pour une consultation privée. L'expérience VIP commence ici.",
  cta_primary_label: 'Voir les collections',
  cta_primary_href: '/produits',
  cta_secondary_label: 'Quiz olfactif IA',
  cta_secondary_href: '/services/quiz-olfactif',
};

const ABOUT_PAGE_SETTING_PREFIX = 'about_page_';

export function toAboutPageSettingRows(content: AboutPageContent) {
  return Object.entries(content).map(([field, value]) => ({
    key: `${ABOUT_PAGE_SETTING_PREFIX}${field}`,
    value: Array.isArray(value) ? JSON.stringify(value) : value,
  }));
}

export async function getAboutPageContent(): Promise<AboutPageContent> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .like('key', `${ABOUT_PAGE_SETTING_PREFIX}%`);

    if (error || !data || data.length === 0) return DEFAULT_PAGE_CONTENT;

    const settings = Object.fromEntries(
      (data as Array<{ key: string; value: string }>).map(({ key, value }) => [key, value]),
    );
    const content = { ...DEFAULT_PAGE_CONTENT };

    for (const field of Object.keys(DEFAULT_PAGE_CONTENT) as Array<keyof AboutPageContent>) {
      const value = settings[`${ABOUT_PAGE_SETTING_PREFIX}${field}`];
      if (!value) continue;

      if (field === 'brands') {
        try {
          const brands = JSON.parse(value) as unknown;
          if (Array.isArray(brands) && brands.every((brand) => typeof brand === 'string')) {
            content.brands = brands.filter((brand) => brand.trim().length > 0);
          }
        } catch {
          content.brands = DEFAULT_PAGE_CONTENT.brands;
        }
      } else {
        Object.assign(content, { [field]: value });
      }
    }

    return content;
  } catch {
    return DEFAULT_PAGE_CONTENT;
  }
}
