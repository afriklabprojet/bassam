import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock next/cache avant l'import de la route
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

// Mock Supabase server
const mockInsert = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: () => ({ insert: mockInsert }),
    })
  ),
}));

// Rate limiter toujours autorisé dans les tests
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 })),
  rateLimitResponse: vi.fn(),
}));

import { POST } from '@/app/api/newsletter/route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

describe('POST /api/newsletter', () => {
  it('retourne 400 pour un email invalide', async () => {
    const res = await POST(makeRequest({ email: 'pas-un-email' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('retourne 400 pour un numéro de téléphone trop court', async () => {
    const res = await POST(makeRequest({ email: 'test@test.com', phone: '123' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('inscrit un email valide avec succès', async () => {
    mockInsert.mockResolvedValue({ error: null });
    const res = await POST(makeRequest({ email: 'client@vip.com' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('accepte email + téléphone valide', async () => {
    mockInsert.mockResolvedValue({ error: null });
    const res = await POST(makeRequest({ email: 'client@vip.com', phone: '07001234' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('retourne 409 si email déjà inscrit (code 23505)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate' } });
    const res = await POST(makeRequest({ email: 'deja@inscrit.com' }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('retourne 500 pour une erreur Supabase inconnue', async () => {
    mockInsert.mockResolvedValue({ error: { code: 'XXXX', message: 'db error' } });
    const res = await POST(makeRequest({ email: 'ok@test.com' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('retourne 503 si les variables Supabase sont absentes', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const res = await POST(makeRequest({ email: 'ok@test.com' }));
    expect(res.status).toBe(503);
  });

  it('normalise l\'email en minuscules', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await POST(makeRequest({ email: 'TEST@VIP.COM' }));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@vip.com' })
    );
  });
});
