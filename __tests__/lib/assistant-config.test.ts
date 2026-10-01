import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_ASSISTANT_CONFIG,
  buildWelcomeMessage,
  parseStoredAssistantConfig,
  toPublicAssistantConfig,
} from '@/lib/ai/assistant-config';

vi.mock('@/lib/site-settings', () => ({
  getSiteSettings: vi.fn().mockResolvedValue({
    site_name: 'Maison Test',
    whatsapp_display: '+225 00 00 00 00',
    whatsapp_number: '22500000000',
    address_display: 'Abidjan',
    address_detail: '',
    support_email: 'contact@test.ci',
  }),
}));
vi.mock('@/lib/supabase/contact-content', () => ({ getContactFaq: vi.fn().mockResolvedValue([]) }));
vi.mock('@/lib/ai/shop-knowledge', () => ({ getCatalogueOverview: vi.fn().mockResolvedValue('') }));
vi.mock('@/lib/ai/assistant-config-store', () => ({ getAssistantConfig: vi.fn() }));

const { buildSystemPrompt } = await import('@/lib/ai/system-prompt');

describe('parseStoredAssistantConfig', () => {
  it('falls back to defaults for empty, malformed or invalid data', () => {
    expect(parseStoredAssistantConfig(null)).toEqual(DEFAULT_ASSISTANT_CONFIG);
    expect(parseStoredAssistantConfig('{not json')).toEqual(DEFAULT_ASSISTANT_CONFIG);
    expect(parseStoredAssistantConfig(JSON.stringify({ tone: 'nope' }))).toEqual(DEFAULT_ASSISTANT_CONFIG);
  });

  it('merges stored fields over defaults', () => {
    const parsed = parseStoredAssistantConfig(JSON.stringify({ name: 'Aïcha', tone: 'luxe' }));
    expect(parsed).toMatchObject({ name: 'Aïcha', tone: 'luxe', enabled: true, knowledge: [] });
  });
});

describe('welcome message & public config', () => {
  it('uses the custom welcome when set, a named default otherwise', () => {
    expect(buildWelcomeMessage({ ...DEFAULT_ASSISTANT_CONFIG, welcome_message: 'Salut !' })).toBe('Salut !');
    expect(buildWelcomeMessage({ ...DEFAULT_ASSISTANT_CONFIG, name: 'Aïcha', title: 'Experte' })).toContain('moi c\'est Aïcha, Experte');
  });

  it('never exposes instructions or knowledge to the storefront', () => {
    const pub = toPublicAssistantConfig({
      ...DEFAULT_ASSISTANT_CONFIG,
      custom_instructions: 'SECRET',
      knowledge: [{ id: '1', title: 't', content: 'SECRET', active: true }],
    });
    expect(JSON.stringify(pub)).not.toContain('SECRET');
  });
});

describe('buildSystemPrompt with assistant config', () => {
  it('injects name, tone, instructions and only active knowledge', async () => {
    const prompt = await buildSystemPrompt({
      ...DEFAULT_ASSISTANT_CONFIG,
      name: 'Aïcha',
      title: 'Conseillère olfactive',
      tone: 'luxe',
      custom_instructions: 'Toujours proposer le coffret.',
      knowledge: [
        { id: '1', title: 'Échanges', content: 'Échange sous 7 jours.', active: true },
        { id: '2', title: 'Brouillon', content: 'Ne pas utiliser.', active: false },
      ],
    });
    expect(prompt).toContain("Tu t'appelles Aïcha (Conseillère olfactive)");
    expect(prompt).toContain('haute parfumerie');
    expect(prompt).toContain('Toujours proposer le coffret.');
    expect(prompt).toContain('### Échanges\nÉchange sous 7 jours.');
    expect(prompt).not.toContain('Ne pas utiliser.');
  });

  it('omits the custom sections when nothing is configured', async () => {
    const prompt = await buildSystemPrompt(DEFAULT_ASSISTANT_CONFIG);
    expect(prompt).not.toContain('CONSIGNES PERSONNALISÉES');
    expect(prompt).not.toContain('CONNAISSANCES AJOUTÉES');
  });
});
