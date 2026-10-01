import { getSiteSettings } from '@/lib/site-settings';
import { getShippingConfig } from '@/lib/shipping';
import { getServicesContent } from '@/lib/supabase/services-content';
import { getContactFaq } from '@/lib/supabase/contact-content';
import { getCollectionsContent } from '@/lib/supabase/collections-content';
import { getPublicCategories, getPublicCollections } from '@/lib/supabase/taxonomies';
import { getAboutHero, getAboutStory, getAboutValeurs, getAboutEngagements, getAboutStats } from '@/lib/supabase/about-content';
import { fetchCreationConfig } from '@/lib/custom-creation';
import { createServiceClient } from '@/lib/supabase/service';
import { PAYMENT_METHODS } from '@/lib/payment/methods';
import { formatPrice } from '@/lib/format';
import { SITE_URL } from '@/lib/site-config';

/**
 * Live knowledge the assistant reads straight from the site's own data
 * (admin-editable Supabase content), so it always reflects what the shop
 * currently publishes — nothing about the shop is hard-coded in the prompt.
 */

export const SHOP_INFO_TOPICS = [
  'livraison',
  'paiement',
  'services',
  'creation_sur_mesure',
  'collections',
  'a_propos',
  'faq',
  'contact',
] as const;

export type ShopInfoTopic = (typeof SHOP_INFO_TOPICS)[number];

export function isShopInfoTopic(value: unknown): value is ShopInfoTopic {
  return SHOP_INFO_TOPICS.includes(value as ShopInfoTopic);
}

async function livraison() {
  const config = await getShippingConfig();
  return {
    modes: config.modes
      .filter((m) => m.enabled)
      .map((m) => ({
        nom: m.label,
        detail: m.description,
        frais: m.fee === 0 ? 'Gratuit' : formatPrice(m.fee),
        type: m.type === 'pickup' ? 'retrait en boutique' : 'livraison à domicile',
      })),
    note: "Le seuil de livraison offerte, s'il existe, figure dans la FAQ (topic faq).",
  };
}

async function paiement() {
  return {
    moyens: PAYMENT_METHODS.map((m) => ({ nom: m.label, detail: m.desc })),
    page_commande: `${SITE_URL}/commande`,
  };
}

async function services() {
  const items = await getServicesContent();
  return {
    services: items.map((s) => ({
      titre: s.titre,
      accroche: s.accroche,
      description: s.description,
      points_cles: s.details,
      mention: s.tag,
      url: `${SITE_URL}/services/${s.slug}`,
    })),
  };
}

async function creationSurMesure() {
  const config = await fetchCreationConfig();
  return {
    url: `${SITE_URL}/services/creation-personnalisee`,
    formules: config.formulas.map((f) => ({
      nom: f.name,
      volume: f.volume,
      prix: formatPrice(f.price),
      description: f.description,
      delai: f.leadTime,
      inclus: f.included,
    })),
    familles_olfactives: config.families.map((f) => ({ nom: f.name, notes: f.notes, ambiance: f.mood })),
    notes_disponibles: config.notes,
    flacons: config.bottles.map((b) => ({ nom: b.name, description: b.description })),
    intensites: config.intensities,
    occasions: config.audiences,
  };
}

async function collections() {
  const [cols, cats, content] = await Promise.all([
    getPublicCollections(),
    getPublicCategories(),
    getCollectionsContent(),
  ]);
  return {
    collections: cols.map((c) => ({ nom: c.name, description: c.description, url: `${SITE_URL}/collections/${c.slug}` })),
    categories: cats.map((c) => {
      const extra = content[c.slug];
      return {
        nom: c.name,
        description: c.description ?? extra?.description ?? null,
        accroche: extra?.tagline ?? null,
        url: `${SITE_URL}/collections/${c.slug}`,
      };
    }),
  };
}

async function aPropos() {
  const [hero, story, valeurs, engagements, stats] = await Promise.all([
    getAboutHero(),
    getAboutStory(),
    getAboutValeurs(),
    getAboutEngagements(),
    getAboutStats(),
  ]);
  return {
    url: `${SITE_URL}/a-propos`,
    presentation: hero.subtitle,
    histoire: [story.paragraph1, story.paragraph2, story.paragraph3],
    valeurs: valeurs.map((v) => ({ titre: v.titre, texte: v.texte })),
    engagements: engagements.map((e) => ({ titre: e.titre, texte: e.texte })),
    chiffres: stats.map((s) => ({ label: s.label, valeur: s.value })),
  };
}

async function faq() {
  const items = await getContactFaq();
  return { faq: [...items].sort((a, b) => a.ordre - b.ordre).map((i) => ({ question: i.question, reponse: i.reponse })) };
}

async function contact() {
  const s = await getSiteSettings();
  return {
    email: s.support_email || undefined,
    whatsapp: s.whatsapp_display || undefined,
    telephone: s.support_phone_display || undefined,
    adresse: [s.address_display, s.address_detail].filter(Boolean).join(' — ') || undefined,
    instagram: s.instagram_url || undefined,
    facebook: s.facebook_url || undefined,
    tiktok: s.tiktok_url || undefined,
    page_contact: `${SITE_URL}/contact`,
  };
}

const TOPIC_LOADERS: Record<ShopInfoTopic, () => Promise<unknown>> = {
  livraison,
  paiement,
  services,
  creation_sur_mesure: creationSurMesure,
  collections,
  a_propos: aPropos,
  faq,
  contact,
};

/** Reads one topic of live shop information and returns it as the tool_result string. */
export async function getShopInfo(topic: ShopInfoTopic): Promise<string> {
  try {
    return JSON.stringify(await TOPIC_LOADERS[topic]());
  } catch {
    return JSON.stringify({ error: "Information momentanément inaccessible : n'invente rien, oriente vers WhatsApp." });
  }
}

/* ── Catalogue overview (injected in the system prompt) ──────────────────── */

const OVERVIEW_TTL_MS = 5 * 60 * 1000;
const OVERVIEW_MAX_ROWS = 1000;
const OVERVIEW_MAX_BRANDS = 40;

let overviewCache: { value: string; expiresAt: number } | null = null;

type OverviewRow = {
  brand: string | null;
  category: string | null;
  price: number | string | null;
  original_price: number | string | null;
  stock_quantity: number | string | null;
};

/**
 * Compact, always-fresh snapshot of what the catalogue contains (size, brands,
 * categories, price range). Lets the assistant know what exists before searching.
 * Best-effort: returns '' on failure so the chat never breaks because of it.
 */
export async function getCatalogueOverview(): Promise<string> {
  if (overviewCache && overviewCache.expiresAt > Date.now()) return overviewCache.value;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('products')
      .select('brand, category, price, original_price, stock_quantity')
      .limit(OVERVIEW_MAX_ROWS);
    if (error || !data || data.length === 0) return '';

    const rows = data as OverviewRow[];
    const prices = rows.map((r) => Number(r.price)).filter((n) => Number.isFinite(n) && n > 0);
    const brands = [...new Set(rows.map((r) => r.brand?.trim()).filter((b): b is string => Boolean(b)))].sort();
    const byCategory = new Map<string, number>();
    for (const r of rows) {
      const key = r.category ?? 'autre';
      byCategory.set(key, (byCategory.get(key) ?? 0) + 1);
    }
    const inStock = rows.filter((r) => Number(r.stock_quantity ?? 0) > 0).length;
    const onSale = rows.filter((r) => r.original_price != null).length;

    const lines = [
      `- ${rows.length} références au catalogue, dont ${inStock} avec du stock et ${onSale} actuellement en promotion.`,
      prices.length > 0
        ? `- Prix affichés de ${formatPrice(Math.min(...prices))} à ${formatPrice(Math.max(...prices))}.`
        : null,
      `- Répartition par catégorie : ${[...byCategory].map(([k, n]) => `${k} (${n})`).join(', ')}.`,
      `- Marques présentes${brands.length > OVERVIEW_MAX_BRANDS ? ` (extrait)` : ''} : ${brands.slice(0, OVERVIEW_MAX_BRANDS).join(', ')}.`,
    ].filter((line): line is string => line !== null);

    const value = lines.join('\n');
    overviewCache = { value, expiresAt: Date.now() + OVERVIEW_TTL_MS };
    return value;
  } catch {
    return '';
  }
}
