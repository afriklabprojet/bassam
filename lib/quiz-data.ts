export type StepNumber = 1 | 2 | 3 | 4 | 5;

export interface Choice {
  id: string;
  label: string;
  sub?: string;
  icon?: string;
  description?: string;
}

export interface StepConfig {
  num: StepNumber;
  question: string;
  hint: string;
  multiple?: boolean;
  gridTwo?: boolean;
  choices: Choice[];
}

export interface ProductResult {
  id: string;
  name: string;
  brand?: string;
  concentration?: string;
  description?: string;
  slug: string;
  image_url?: string;
  price: number;
  olfactive_family?: string;
}

export const QUIZ_STEPS: StepConfig[] = [
  {
    num: 1,
    question: 'Pour qui est ce parfum ?',
    hint: 'Sélectionnez un profil',
    choices: [
      { id: 'femme',   label: 'Pour elle',  sub: 'Féminin' },
      { id: 'homme',   label: 'Pour lui',   sub: 'Masculin' },
      { id: 'unisex',  label: 'Unisexe',    sub: 'Sans genre' },
      { id: 'cadeau',  label: 'Un cadeau',  sub: 'Je ne sais pas encore' },
    ],
  },
  {
    num: 2,
    question: 'Quelle ambiance vous attire ?',
    hint: "Choisissez jusqu'à 2 familles olfactives",
    multiple: true,
    gridTwo: true,
    choices: [
      { id: 'floral',    label: 'Floral',           icon: '✦', description: 'Rose de Grasse, jasmin sambac, pivoine — la féminité en flacon' },
      { id: 'oriental',  label: 'Oriental & Oud',   icon: '◈', description: 'Oud méditerranée, ambre, encens — chaleur et mystère' },
      { id: 'boise',     label: 'Boisé & Santal',   icon: '◉', description: "Santal Mysore, cèdre, vétiver d'Haïti — élégance naturelle" },
      { id: 'frais',     label: 'Frais & Hespéridé',icon: '◇', description: 'Bergamote, thé vert, aldéhydes — légèreté et énergie' },
      { id: 'gourmand',  label: 'Gourmand & Vanille',icon: '◆', description: 'Vanille bourbon, caramel, tonka — douceur enveloppante' },
      { id: 'cuir',      label: 'Cuir & Fumé',      icon: '◻', description: 'Tabac blond, birch tar, iris — caractère affirmé' },
    ],
  },
  {
    num: 3,
    question: 'Pour quelle occasion ?',
    hint: 'Sélectionnez un contexte',
    choices: [
      { id: 'quotidien',  label: 'Au quotidien',        sub: 'Bureau, sorties, journée légère' },
      { id: 'soiree',     label: 'Soirée & Événements', sub: 'Dîners, galas, cérémonies' },
      { id: 'seduction',  label: 'Séduction',            sub: 'Romantique, intime, mémorable' },
      { id: 'priere',     label: 'Prière & Spirituel',   sub: 'Encens, oud, bakhour — dimension sacrée' },
      { id: 'voyage',     label: 'Voyage & Découverte',  sub: 'Escapades, aventure, liberté' },
    ],
  },
  {
    num: 4,
    question: 'Quelle intensité souhaitez-vous ?',
    hint: 'Le sillage et la durée de tenue',
    choices: [
      { id: 'discret',   label: 'Signature discrète', sub: 'EDT — Subtile, personnelle, 4–6h' },
      { id: 'affirme',   label: 'Présence affirmée',  sub: 'EDP — Sillage élégant, 6–10h' },
      { id: 'intense',   label: 'Empreinte intense',  sub: 'Extrait — Inoubliable, toute la journée' },
      { id: 'surprise',  label: 'Surprise-moi',       sub: 'Je fais confiance à votre nez' },
    ],
  },
  {
    num: 5,
    question: 'Quel est votre budget ?',
    hint: 'Prix en Franc CFA (XOF)',
    choices: [
      { id: 'accessible', label: 'Accessible',    sub: '10 000 – 30 000 FCFA' },
      { id: 'premium',    label: 'Premium',       sub: '30 000 – 80 000 FCFA' },
      { id: 'luxe',       label: 'Luxe',          sub: '80 000 FCFA et plus' },
      { id: 'illimite',   label: 'Pas de limite', sub: 'Je veux le meilleur' },
    ],
  },
];

export const TOTAL_STEPS = QUIZ_STEPS.length;

export function getCategoryParam(categoryId: string): string {
  if (categoryId === 'femme') return 'femme';
  if (categoryId === 'homme') return 'homme';
  if (categoryId === 'unisex') return 'mixte';
  return '';
}

export function buildApiParams(answers: Readonly<Record<number, string[]>>): URLSearchParams {
  const params = new URLSearchParams({ limit: '5' });

  const category = answers[1]?.[0] ?? '';
  const categoryParam = getCategoryParam(category);
  if (categoryParam !== '') params.set('category', categoryParam);

  const ambiances = answers[2] ?? [];
  if (ambiances.length > 0) {
    const hasOriental = ambiances.includes('oriental');
    const keywords = hasOriental
      ? ['oud', ...ambiances.filter((a) => a !== 'oriental')]
      : [...ambiances];
    params.set('q', keywords.join(' '));
  }

  const occasion = answers[3]?.[0] ?? '';
  if (occasion === 'soiree' || occasion === 'seduction') params.set('featured', 'true');

  return params;
}

export function truncateDescription(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

const GENRE_MAP: Record<string, string> = { femme: 'Féminin', homme: 'Masculin', unisex: 'Unisexe', cadeau: 'Cadeau' };
const UNIVERS_MAP: Record<string, string> = {
  floral: 'Floral', oriental: 'Oriental & Oud', boise: 'Boisé & Santal',
  frais: 'Frais & Hespéridé', gourmand: 'Gourmand & Vanille', cuir: 'Cuir & Fumé',
};
const OCCASION_MAP: Record<string, string> = {
  quotidien: 'Quotidien', soiree: 'Soirée & Événements', seduction: 'Séduction',
  priere: 'Prière & Spirituel', voyage: 'Voyage & Découverte',
};
const INTENSITE_MAP: Record<string, string> = {
  discret: 'EDT — Signature discrète', affirme: 'EDP — Présence affirmée',
  intense: 'Extrait — Inoubliable', surprise: 'Surprise-moi',
};
const BUDGET_MAP: Record<string, string> = {
  accessible: '10 000 – 30 000 FCFA', premium: '30 000 – 80 000 FCFA',
  luxe: '80 000 FCFA+', illimite: 'Pas de limite',
};

export interface ProfileSummary {
  genre: string;
  univers: string;
  occasion: string;
  intensite: string;
  budget: string;
}

export function getProfileSummary(answers: Readonly<Record<number, string[]>>): ProfileSummary {
  return {
    genre:    GENRE_MAP[answers[1]?.[0] ?? ''] ?? '—',
    univers:  (answers[2] ?? []).map((a) => UNIVERS_MAP[a] ?? a).join(', ') || '—',
    occasion: OCCASION_MAP[answers[3]?.[0] ?? ''] ?? '—',
    intensite:INTENSITE_MAP[answers[4]?.[0] ?? ''] ?? '—',
    budget:   BUDGET_MAP[answers[5]?.[0] ?? ''] ?? '—',
  };
}
