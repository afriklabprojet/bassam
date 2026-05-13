import { createServiceClient } from '@/lib/supabase/service';

export interface ServiceContent {
  slug: string;
  ordre: number;
  titre: string;
  accroche: string;
  description: string;
  details: string[];
  cta_label: string;
  tag: string;
  is_active: boolean;
}

const DEFAULT_SERVICES: ServiceContent[] = [
  {
    slug: 'quiz-olfactif',
    ordre: 1,
    titre: 'Quiz Olfactif IA',
    accroche: 'Votre signature en 5 minutes.',
    description:
      'Notre algorithme analyse vos préférences — humeur, occasion, notes aimées — et vous recommande les parfums qui vous correspondent avec précision.',
    details: [
      '5 étapes guidées',
      'Résultats personnalisés instantanés',
      'Recommandations de 3 à 6 fragrances',
      'Gratuit & sans inscription',
    ],
    cta_label: 'Démarrer le quiz',
    tag: 'Gratuit',
    is_active: true,
  },
  {
    slug: 'consultation',
    ordre: 2,
    titre: 'Consultation Privée',
    accroche: 'L\'expertise à votre écoute.',
    description:
      'Un rendez-vous exclusif avec notre experte parfumerie. Nous construisons ensemble votre garde-robe olfactive, selon votre personnalité, vos envies et votre budget.',
    details: [
      'Séance de 60 à 90 minutes',
      'Analyse de votre profil olfactif',
      'Sélection de 6 à 10 fragrances',
      'Disponible en présentiel ou visio',
    ],
    cta_label: 'Prendre rendez-vous',
    tag: 'Sur rendez-vous',
    is_active: true,
  },
  {
    slug: 'creation-personnalisee',
    ordre: 3,
    titre: 'Création Personnalisée',
    accroche: 'Un parfum unique, le vôtre.',
    description:
      'Nous composons pour vous une fragrance exclusive — accord sur-mesure, flacon gravé, coffret cadeau. Un objet de luxe signé à votre nom.',
    details: [
      'Formulation artisanale exclusive',
      'Flacon numéroté & gravé à votre nom',
      'Coffret luxe avec certificat',
      'Idéal comme cadeau prestige',
    ],
    cta_label: 'Créer mon parfum',
    tag: 'Sur-mesure',
    is_active: true,
  },
];

/**
 * Returns active services content from the DB ordered by ordre,
 * falling back to DEFAULT_SERVICES.
 */
export async function getServicesContent(): Promise<ServiceContent[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('services_content')
      .select('slug, ordre, titre, accroche, description, details, cta_label, tag, is_active')
      .eq('is_active', true)
      .order('ordre', { ascending: true });

    if (error || !data || data.length === 0) return DEFAULT_SERVICES;

    return data.map((row): ServiceContent => {
      const def = DEFAULT_SERVICES.find((s) => s.slug === row.slug);
      // details is stored as JSONB array of strings in the DB
      let details: string[] = def?.details ?? [];
      if (Array.isArray(row.details)) {
        details = row.details as string[];
      }
      return {
        slug: row.slug ?? def?.slug ?? '',
        ordre: row.ordre ?? def?.ordre ?? 99,
        titre: row.titre ?? def?.titre ?? '',
        accroche: row.accroche ?? def?.accroche ?? '',
        description: row.description ?? def?.description ?? '',
        details,
        cta_label: row.cta_label ?? def?.cta_label ?? 'Découvrir',
        tag: row.tag ?? def?.tag ?? '',
        is_active: row.is_active ?? true,
      };
    });
  } catch {
    return DEFAULT_SERVICES;
  }
}
