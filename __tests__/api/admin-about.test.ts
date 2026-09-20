import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { DEFAULT_HERO, DEFAULT_PAGE_CONTENT, DEFAULT_STORY } from '@/lib/supabase/about-content';

const mockIsAdmin = vi.fn().mockResolvedValue(true);
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }));

vi.mock('@/lib/supabase/admin', () => ({
  isCurrentUserAdmin: mockIsAdmin,
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

function makePut(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/about', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const { PUT } = await import('@/app/api/admin/about/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAdmin.mockResolvedValue(true);
  mockUpsert.mockResolvedValue({ error: null });
});

describe('PUT /api/admin/about', () => {
  it('refuse un utilisateur non administrateur', async () => {
    mockIsAdmin.mockResolvedValue(false);

    const response = await PUT(makePut({ section: 'hero', data: DEFAULT_HERO }));

    expect(response.status).toBe(403);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('enregistre le hero singleton', async () => {
    const response = await PUT(makePut({ section: 'hero', data: DEFAULT_HERO }));

    expect(response.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith('about_hero');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, title_line1: DEFAULT_HERO.title_line1 }),
      { onConflict: 'id' },
    );
  });

  it('enregistre tout le contenu éditorial de la page', async () => {
    const response = await PUT(makePut({ section: 'page', data: DEFAULT_PAGE_CONTENT }));

    expect(response.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith('site_settings');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        { key: 'about_page_meta_title', value: DEFAULT_PAGE_CONTENT.meta_title },
        { key: 'about_page_brands', value: JSON.stringify(DEFAULT_PAGE_CONTENT.brands) },
      ]),
      { onConflict: 'key' },
    );
  });

  it('rejette un lien externe non sécurisé', async () => {
    const response = await PUT(makePut({
      section: 'page',
      data: { ...DEFAULT_PAGE_CONTENT, cta_primary_href: 'javascript:alert(1)' },
    }));

    expect(response.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

describe('contenu À propos par défaut', () => {
  it('utilise le masculin pour le fondateur', () => {
    expect(DEFAULT_STORY.paragraph2).toContain('Notre fondateur');
    expect(DEFAULT_STORY.paragraph2).not.toContain('fondatrice');
    expect(DEFAULT_STORY.quote_author).toBe('Le fondateur, VIP Parfumerie Bar');
  });
});