// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockIsAdmin = vi.fn();
const mockInsert = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({ isCurrentUserAdmin: mockIsAdmin }));
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: () => ({ insert: mockInsert }) })),
}));

const { POST } = await import('@/app/api/admin/categories/route');

function makePost(body: unknown) {
  return new NextRequest('http://localhost/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAdmin.mockResolvedValue(true);
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

describe('POST /api/admin/categories — erreurs', () => {
  it('répond 409 en français sur un slug déjà utilisé, sans le message Postgres', async () => {
    mockInsert.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint "categories_slug_key"' },
    });

    const res = await POST(makePost({ name: 'Homme', slug: 'homme' }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toEqual({ error: 'Cet élément existe déjà.' });
    expect(JSON.stringify(body)).not.toMatch(/duplicate key|categories_slug_key/);
  });

  it('ne renvoie pas le message brut d un corps JSON invalide', async () => {
    const res = await POST(makePost('{pas du json'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Erreur serveur. Réessayez dans un instant.' });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
