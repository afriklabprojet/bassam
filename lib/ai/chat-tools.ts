import type Anthropic from '@anthropic-ai/sdk';
import { getProducts } from '@/lib/supabase/products';
import { formatPrice } from '@/lib/format';
import { SITE_URL } from '@/lib/site-config';
import { SHOP_INFO_TOPICS, getShopInfo, isShopInfoTopic } from '@/lib/ai/shop-knowledge';

export const SEARCH_PRODUCTS_TOOL: Anthropic.Tool = {
  name: 'search_products',
  description:
    "Cherche de vrais parfums dans le catalogue de la boutique (prix et disponibilité réels). " +
    "À utiliser dès que tu recommandes ou cites un produit précis — ne jamais inventer un nom, un prix ou une disponibilité. " +
    "Les résultats incluent, quand elles existent, les notes olfactives (tête/cœur/fond).",
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Mots-clés libres : nom, marque, famille olfactive, ambiance (ex: "oud", "floral frais", "Dior")',
      },
      category: {
        type: 'string',
        description: 'Catégorie cible si connue : femme, homme, ou mixte',
      },
      minPrice: { type: 'number', description: 'Prix minimum en FCFA' },
      maxPrice: { type: 'number', description: 'Prix maximum en FCFA' },
      featured: { type: 'boolean', description: 'true pour ne montrer que les produits mis en avant' },
    },
    required: [],
  },
};

export const GET_SHOP_INFO_TOOL: Anthropic.Tool = {
  name: 'get_shop_info',
  description:
    "Lit en direct les informations officielles publiées par la boutique (données du site, modifiables par l'équipe) : " +
    "tarifs et modes de livraison, moyens de paiement, services, formules de création sur mesure (prix, volumes, délais, familles, flacons), " +
    "collections et catégories, histoire et engagements, FAQ (retours, authenticité, seuil de livraison offerte…), coordonnées. " +
    "À utiliser dès que la question porte sur une de ces informations — ne jamais répondre de mémoire.",
  input_schema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        enum: [...SHOP_INFO_TOPICS],
        description: 'Le sujet à consulter',
      },
    },
    required: ['topic'],
  },
};

export const CHAT_TOOLS: Anthropic.Tool[] = [SEARCH_PRODUCTS_TOOL, GET_SHOP_INFO_TOOL];

type SearchProductsInput = {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
};

/** Executes a tool call and returns the string to send back as the tool_result content. */
export async function runChatTool(name: string, rawInput: unknown): Promise<string> {
  if (name === 'search_products') {
    const input = (rawInput ?? {}) as SearchProductsInput;

    const { products, total } = await getProducts({
      q: input.query?.trim() || undefined,
      category: input.category?.trim() || undefined,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice,
      featured: input.featured,
      limit: 8,
    });

    if (products.length === 0) {
      return JSON.stringify({ total: 0, results: [], note: 'Aucun produit trouvé pour cette recherche.' });
    }

    const results = products.map((p) => ({
      name: p.name,
      brand: p.brand,
      price: formatPrice(p.price),
      onSale: p.originalPrice != null,
      concentration: p.concentration ?? undefined,
      volume: p.volume ?? undefined,
      notes: p.notes ?? undefined,
      inStock: p.stockQuantity > 0,
      url: `${SITE_URL}/produits/${p.slug}`,
    }));

    return JSON.stringify({ total, results });
  }

  if (name === 'get_shop_info') {
    const topic = (rawInput as { topic?: unknown } | null)?.topic;
    if (!isShopInfoTopic(topic)) {
      return JSON.stringify({ error: 'Sujet inconnu', sujets_valides: SHOP_INFO_TOPICS });
    }
    return getShopInfo(topic);
  }

  return JSON.stringify({ error: `Outil inconnu: ${name}` });
}
