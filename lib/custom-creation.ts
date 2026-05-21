export type CreationFormulaId = 'essentiel' | 'signature' | 'prestige';

/* ─── Config complète persistée en DB ──────────────────────── */

export interface CreationConfigFormula {
  id: CreationFormulaId;
  name: string;
  volume: string;
  price: number;
  description: string;
  leadTime: string;
  included: string[];
}

export interface CreationConfigFamily {
  id: string;
  name: string;
  notes: string[];
  mood: string;
}

export interface CreationConfigBottle {
  id: string;
  name: string;
  description: string;
}

export interface CreationConfig {
  formulas: CreationConfigFormula[];
  families: CreationConfigFamily[];
  notes: string[];
  bottles: CreationConfigBottle[];
  intensities: string[];
  audiences: string[];
}

export function getDefaultCreationConfig(): CreationConfig {
  return {
    formulas: CUSTOM_CREATION_FORMULAS.map((f) => ({ ...f })),
    families: CUSTOM_CREATION_FAMILIES.map((f) => ({ ...f })),
    notes: [...CUSTOM_CREATION_NOTES],
    bottles: CUSTOM_CREATION_BOTTLES.map((b) => ({ ...b })),
    intensities: ['Subtil', 'Equilibre', 'Intense', 'Sillage fort'],
    audiences: ['Pour moi', 'A offrir', 'Mariage', 'Business', 'Soiree'],
  };
}

const CREATION_CONFIG_KEY = 'creation_configurator_config';

export async function fetchCreationConfig(): Promise<CreationConfig> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', CREATION_CONFIG_KEY)
      .single();
    if (data?.value) return JSON.parse(data.value) as CreationConfig;
  } catch { /* fallback */ }
  return getDefaultCreationConfig();
}

export { CREATION_CONFIG_KEY };

export type CustomCreationSnapshot = {
  formulaId: CreationFormulaId;
  formulaName: string;
  volume: string;
  family: string;
  intensity: string;
  audience: string;
  notes: string[];
  bottle: string;
  engraving: string;
  perfumeName: string;
  inspiration: string;
  createdAt: string;
};

export type CustomCreationFormula = {
  id: CreationFormulaId;
  name: string;
  volume: string;
  price: number;
  description: string;
  leadTime: string;
  included: string[];
};

export const CUSTOM_CREATION_FORMULAS: CustomCreationFormula[] = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    volume: '30 ml',
    price: 85000,
    description: 'Une premiere signature olfactive avec flacon grave et certificat de creation.',
    leadTime: '17 a 21 jours',
    included: ['Accord sur-mesure', 'Flacon 30 ml grave', 'Coffret noir & or', 'Certificat de creation'],
  },
  {
    id: 'signature',
    name: 'Signature',
    volume: '50 ml',
    price: 135000,
    description: 'La creation complete avec deux cycles d\'affinage et coffret luxe numerote.',
    leadTime: '19 a 25 jours',
    included: ['Accord sur-mesure', '2 affinages inclus', 'Flacon 50 ml grave', 'Coffret luxe velours'],
  },
  {
    id: 'prestige',
    name: 'Cadeau Prestige',
    volume: '30 ml + carte',
    price: 95000,
    description: 'Un bon de creation premium a offrir, avec message personnalise et coffret cadeau.',
    leadTime: '17 a 25 jours',
    included: ['Bon de creation', 'Coffret cadeau', 'Message manuscrit', 'Flacon grave'],
  },
];

export const CUSTOM_CREATION_FAMILIES = [
  { id: 'floral', name: 'Floral', notes: ['Rose', 'Jasmin', 'Pivoine', 'Tubéreuse'], mood: 'Romantique, lumineux, elegant' },
  { id: 'oriental', name: 'Oriental', notes: ['Oud', 'Ambre', 'Vanille', 'Benjoin'], mood: 'Chaud, sensuel, profond' },
  { id: 'boise', name: 'Boisé', notes: ['Santal', 'Vétiver', 'Cèdre', 'Patchouli'], mood: 'Structure, chic, confidentiel' },
  { id: 'frais', name: 'Frais', notes: ['Bergamote', 'Thé vert', 'Fleur d’oranger', 'Aldéhydes'], mood: 'Net, aerien, moderne' },
  { id: 'gourmand', name: 'Gourmand', notes: ['Caramel', 'Praliné', 'Miel', 'Cacao'], mood: 'Enveloppant, memorable, solaire' },
  { id: 'cuir', name: 'Cuir & Fumé', notes: ['Encens', 'Tabac', 'Iris', 'Bois brûlé'], mood: 'Mystere, caractere, nuit' },
];

export const CUSTOM_CREATION_NOTES = [
  'Bergamote',
  'Fleur d’oranger',
  'Rose',
  'Jasmin',
  'Iris',
  'Santal',
  'Vétiver',
  'Oud',
  'Ambre',
  'Vanille',
  'Musc blanc',
  'Cuir',
  'Tabac blond',
  'Cacao',
  'Thé vert',
  'Poivre rose',
];

export const CUSTOM_CREATION_BOTTLES = [
  { id: 'noir-or', name: 'Noir & or', description: 'Flacon sombre, etiquette doree, allure signature.' },
  { id: 'cristal', name: 'Cristal clair', description: 'Verre transparent, minimal, tres lumineux.' },
  { id: 'velours', name: 'Prestige velours', description: 'Presentation cadeau avec coffret tactile.' },
];

export function getCustomCreationFormula(id: string) {
  return CUSTOM_CREATION_FORMULAS.find((formula) => formula.id === id) ?? CUSTOM_CREATION_FORMULAS[1];
}

export function formatCustomCreationSnapshot(snapshot: CustomCreationSnapshot) {
  return [
    `Formule: ${snapshot.formulaName} (${snapshot.volume})`,
    `Nom du parfum: ${snapshot.perfumeName}`,
    `Famille: ${snapshot.family}`,
    `Intensité: ${snapshot.intensity}`,
    `Pour: ${snapshot.audience}`,
    `Notes: ${snapshot.notes.join(', ')}`,
    `Flacon: ${snapshot.bottle}`,
    snapshot.engraving ? `Gravure: ${snapshot.engraving}` : 'Gravure: aucune',
    snapshot.inspiration ? `Brief: ${snapshot.inspiration}` : 'Brief: non renseigne',
  ].join('\n');
}