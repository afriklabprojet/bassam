import { z } from 'zod';

/**
 * Admin-editable configuration of the AI assistant (identity, voice, extra
 * instructions and knowledge base). Client-safe: no server imports here —
 * persistence lives in assistant-config-store.ts.
 */

export const ASSISTANT_CONFIG_KEY = 'ai_assistant_config';

export const ASSISTANT_LIMITS = {
  name: 40,
  title: 60,
  welcome: 400,
  instructions: 2000,
  knowledgeEntries: 50,
  knowledgeTitle: 120,
  knowledgeContent: 2000,
  avatarUrl: 500,
} as const;

export const ASSISTANT_TONES = {
  doux: {
    label: 'Doux et attentionné',
    description: "À l'écoute, posé, rassurant — le style par défaut.",
    prompt: "doux, attentionné et posé — à l'écoute, rassurant, jamais robotique",
  },
  professionnel: {
    label: 'Professionnel et précis',
    description: 'Courtois, direct et efficace, sans familiarité.',
    prompt: 'professionnel, précis et efficace — courtois et direct, sans familiarité ni fioritures',
  },
  chaleureux: {
    label: 'Chaleureux et enjoué',
    description: 'Proche du client, souriant, comme en boutique.',
    prompt: 'chaleureux, enjoué et proche du client — comme un conseiller de boutique qui accueille avec le sourire',
  },
  luxe: {
    label: 'Raffiné, haute parfumerie',
    description: 'Vocabulaire soigné, vouvoiement strict, élégance.',
    prompt: "raffiné et élégant, avec le vocabulaire soigné d'une maison de haute parfumerie — vouvoiement strict, jamais familier",
  },
} as const;

export type AssistantToneId = keyof typeof ASSISTANT_TONES;
const TONE_IDS = Object.keys(ASSISTANT_TONES) as [AssistantToneId, ...AssistantToneId[]];

const knowledgeEntrySchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1, 'Titre requis').max(ASSISTANT_LIMITS.knowledgeTitle),
  content: z.string().trim().min(1, 'Contenu requis').max(ASSISTANT_LIMITS.knowledgeContent),
  active: z.boolean(),
});

export const assistantConfigSchema = z.object({
  enabled: z.boolean(),
  name: z.string().trim().min(1, 'Nom requis').max(ASSISTANT_LIMITS.name),
  title: z.string().trim().max(ASSISTANT_LIMITS.title),
  avatar_url: z
    .string()
    .trim()
    .max(ASSISTANT_LIMITS.avatarUrl)
    .refine((v) => v === '' || v.startsWith('https://') || v.startsWith('/'), 'URL d\'avatar invalide'),
  welcome_message: z.string().trim().max(ASSISTANT_LIMITS.welcome),
  tone: z.enum(TONE_IDS),
  custom_instructions: z.string().trim().max(ASSISTANT_LIMITS.instructions),
  knowledge: z.array(knowledgeEntrySchema).max(ASSISTANT_LIMITS.knowledgeEntries),
});

export type AssistantConfig = z.infer<typeof assistantConfigSchema>;
export type KnowledgeEntry = AssistantConfig['knowledge'][number];

export const DEFAULT_ASSISTANT_NAME = 'Conseillère olfactive';

export const DEFAULT_ASSISTANT_CONFIG: AssistantConfig = {
  enabled: true,
  name: DEFAULT_ASSISTANT_NAME,
  title: '',
  avatar_url: '',
  welcome_message: '',
  tone: 'doux',
  custom_instructions: '',
  knowledge: [],
};

/** Tolerant read of the stored JSON: bad or missing fields fall back to defaults. */
export function parseStoredAssistantConfig(raw: unknown): AssistantConfig {
  if (typeof raw !== 'string' || raw.trim() === '') return { ...DEFAULT_ASSISTANT_CONFIG };
  try {
    const parsed = assistantConfigSchema.partial().safeParse(JSON.parse(raw));
    if (!parsed.success) return { ...DEFAULT_ASSISTANT_CONFIG };
    const merged = { ...DEFAULT_ASSISTANT_CONFIG };
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
    }
    return merged;
  } catch {
    return { ...DEFAULT_ASSISTANT_CONFIG };
  }
}

/** Welcome bubble shown at the top of the chat (custom text, or a sensible default). */
export function buildWelcomeMessage(config: AssistantConfig): string {
  if (config.welcome_message) return config.welcome_message;
  const pitch =
    "Dites-moi en un peu plus sur vos goûts, l'occasion ou le budget — je suis là pour vous aider à trouver le parfum qui vous ressemble. 🌸";
  if (config.name === DEFAULT_ASSISTANT_NAME) {
    return `Bonjour, je suis votre conseillère olfactive. ${pitch}`;
  }
  return `Bonjour, moi c'est ${config.name}${config.title ? `, ${config.title}` : ''}. ${pitch}`;
}

/** What the storefront widget needs — never includes instructions or knowledge. */
export interface PublicAssistantConfig {
  name: string;
  title: string;
  avatar_url: string;
  welcome: string;
}

export function toPublicAssistantConfig(config: AssistantConfig): PublicAssistantConfig {
  return {
    name: config.name,
    title: config.title,
    avatar_url: config.avatar_url,
    welcome: buildWelcomeMessage(config),
  };
}
