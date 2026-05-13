import { createServiceClient } from '@/lib/supabase/service';

export interface CollectionContent {
  slug: string;
  eyebrow: string;
  tagline: string;
  description: string;
}

const DEFAULT_CONTENT: Record<string, Omit<CollectionContent, 'slug'>> = {
  nouveautes: {
    eyebrow: 'Dernières arrivées',
    tagline: 'Ce qui vient de poser ses valises',
    description:
      'Parcourez les toutes dernières créations des maisons que nous sélectionnons avec soin — des lancements mondiaux disponibles à Abidjan.',
  },
  femme: {
    eyebrow: 'Collection féminine',
    tagline: 'Floraux enivrants, orientaux profonds',
    description:
      'De la rose de Grasse aux muscs orientaux, découvrez une sélection de fragrances féminines qui incarnent l\'élégance à son sommet.',
  },
  homme: {
    eyebrow: 'Collection masculine',
    tagline: 'Boisés élégants, signatures puissantes',
    description:
      'Des sillages qui affirment sans imposer. De l\'ud pur aux accordéons boisés contemporains, des parfums qui définissent le gentleman moderne.',
  },
  mixte: {
    eyebrow: 'Au-delà des genres',
    tagline: 'La fragrance ne connaît pas de frontières',
    description:
      'Des compositions olfactives qui transcendent les catégories. Pour ceux qui choisissent leur parfum à l\'instinct, sans convention.',
  },
};

/**
 * Returns collections content from the DB, falling back to DEFAULT_CONTENT.
 * Result is a Record<slug, {eyebrow, tagline, description}>.
 */
export async function getCollectionsContent(): Promise<Record<string, Omit<CollectionContent, 'slug'>>> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('collections_content')
      .select('slug, eyebrow, tagline, description');

    if (error || !data || data.length === 0) return DEFAULT_CONTENT;

    const result = { ...DEFAULT_CONTENT };
    for (const row of data) {
      if (row.slug) {
        result[row.slug] = {
          eyebrow: row.eyebrow ?? DEFAULT_CONTENT[row.slug]?.eyebrow ?? '',
          tagline: row.tagline ?? DEFAULT_CONTENT[row.slug]?.tagline ?? '',
          description: row.description ?? DEFAULT_CONTENT[row.slug]?.description ?? '',
        };
      }
    }
    return result;
  } catch {
    return DEFAULT_CONTENT;
  }
}
