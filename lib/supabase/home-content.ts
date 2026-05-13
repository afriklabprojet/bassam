import { createServiceClient } from '@/lib/supabase/service';

/* ── Type ───────────────────────────────────────────────────────────────────── */

export interface UniversContent {
  slug: string;       // femme | homme | mixte
  tagline: string;
  description: string;
  notes: string[];
}

/* ── Defaults (miroir exact du UNIVERS_META de la homepage) ─────────────────── */

export const DEFAULT_UNIVERS: UniversContent[] = [
  {
    slug: 'femme',
    tagline: 'La féminité sublimée',
    description: 'Floraux envoûtants, orientaux profonds, boisés soyeux — les plus grandes maisons pour elle.',
    notes: ['Jasmin', 'Rose', 'Vanille', 'Oud'],
  },
  {
    slug: 'homme',
    tagline: 'La force en signature',
    description: 'Fraîcheurs marines, bois nobles, muscs intenses — des fragrances qui définissent le caractère.',
    notes: ['Cèdre', 'Vétiver', 'Bergamote', 'Ambre'],
  },
  {
    slug: 'mixte',
    tagline: 'Au-delà des genres',
    description: 'Fragrances unisexes qui transcendent les conventions et les saisons.',
    notes: ['Poivre', 'Santal', 'Iris', 'Patchouli'],
  },
];

/* ── Getter ─────────────────────────────────────────────────────────────────── */

export async function getHomeUnivers(): Promise<UniversContent[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('home_univers')
      .select('slug, tagline, description, notes')
      .in('slug', ['femme', 'homme', 'mixte']);

    if (error || !data || data.length === 0) return DEFAULT_UNIVERS;

    // merge DB text over hardcoded defaults (préserve gradient/dot définis côté frontend)
    return DEFAULT_UNIVERS.map((def) => {
      const db = (data as UniversContent[]).find((r) => r.slug === def.slug);
      if (!db) return def;
      return {
        ...def,
        tagline: db.tagline || def.tagline,
        description: db.description || def.description,
        notes: Array.isArray(db.notes) && db.notes.length > 0 ? db.notes : def.notes,
      };
    });
  } catch {
    return DEFAULT_UNIVERS;
  }
}
