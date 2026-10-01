import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { DEFAULT_ASSISTANT_CONFIG } from '@/lib/ai/assistant-config';

const mockIsAdmin = vi.fn().mockResolvedValue(true);
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null });
const mockFrom = vi.fn(() => ({
  upsert: mockUpsert,
  select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
}));
const mockRevalidate = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({ isCurrentUserAdmin: mockIsAdmin }));
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn(() => ({ from: mockFrom })) }));
vi.mock('next/cache', () => ({ revalidatePath: mockRevalidate }));

const { GET, PUT } = await import('@/app/api/admin/ai-assistant/route');

function makePut(body: unknown) {
  return new NextRequest('http://localhost/api/admin/ai-assistant', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAdmin.mockResolvedValue(true);
  mockUpsert.mockResolvedValue({ error: null });
  mockMaybeSingle.mockResolvedValue({ data: null });
});

describe('/api/admin/ai-assistant', () => {
  it('refuses non-admin users', async () => {
    mockIsAdmin.mockResolvedValue(false);
    expect((await GET()).status).toBe(403);
    expect((await PUT(makePut(DEFAULT_ASSISTANT_CONFIG))).status).toBe(403);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('returns the default configuration when nothing is stored', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).config).toEqual(DEFAULT_ASSISTANT_CONFIG);
  });

  it('rejects an invalid configuration', async () => {
    const res = await PUT(makePut({ ...DEFAULT_ASSISTANT_CONFIG, name: '   ', tone: 'sarcastique' }));
    expect(res.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('rejects a javascript: avatar URL', async () => {
    const res = await PUT(makePut({ ...DEFAULT_ASSISTANT_CONFIG, avatar_url: 'javascript:alert(1)' }));
    expect(res.status).toBe(400);
  });

  it('saves a valid configuration and refreshes the storefront', async () => {
    const config = {
      ...DEFAULT_ASSISTANT_CONFIG,
      name: 'Aïcha',
      title: 'Conseillère olfactive',
      avatar_url: 'https://example.supabase.co/storage/v1/object/public/product-images/a.png',
      knowledge: [{ id: 'k1', title: 'Échanges', content: 'Échange sous 7 jours si non ouvert.', active: true }],
    };
    const res = await PUT(makePut(config));
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      { key: 'ai_assistant_config', value: JSON.stringify(config) },
      { onConflict: 'key' },
    );
    expect(mockRevalidate).toHaveBeenCalledWith('/', 'layout');
  });
});
