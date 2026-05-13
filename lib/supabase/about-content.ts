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
