// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SHOP_HOURS } from '@/lib/site-config';

const mockGetSiteSettings = vi.fn();

vi.mock('@/lib/site-settings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/site-settings')>()),
  getSiteSettings: () => mockGetSiteSettings(),
}));
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn() }));
vi.mock('@/lib/supabase/contact-content', () => ({ getContactFaq: vi.fn().mockResolvedValue([]) }));

const { getShopInfo } = await import('@/lib/ai/shop-knowledge');

const baseSettings = {
  support_email: 'contact@vipparfumeriebar.com',
  whatsapp_display: '+225 07 79 11 79 79',
  whatsapp_number: '2250779117979',
  support_phone_display: '+225 07 79 11 79 79',
  address_display: 'Abidjan, Koumassi',
  address_detail: "Côte d'Ivoire",
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
};

beforeEach(() => {
  mockGetSiteSettings.mockResolvedValue(baseSettings);
});

describe('getShopInfo("contact") — horaires', () => {
  it('donne les horaires affichés sur la page Contact et WhatsApp 7j/7', async () => {
    const info = JSON.parse(await getShopInfo('contact'));

    expect(info.horaires).toEqual({ boutique_et_telephone: SHOP_HOURS.full, whatsapp: 'disponible 7j/7' });
    expect(SHOP_HOURS.full).toBe('Lundi – Samedi · 8h00 – 18h00 (GMT)');
  });

  it('ne promet pas WhatsApp quand il n est pas configuré', async () => {
    mockGetSiteSettings.mockResolvedValue({ ...baseSettings, whatsapp_number: '', whatsapp_display: '' });

    const info = JSON.parse(await getShopInfo('contact'));

    expect(info.horaires).toEqual({ boutique_et_telephone: SHOP_HOURS.full });
  });
});
