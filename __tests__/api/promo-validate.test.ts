import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

import { POST } from '@/app/api/promo-codes/validate/route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/promo-codes/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const BASE_CODE = {
  id: 'code-uuid-1',
  code: 'VIP10',
  type: 'percentage',
  value: 10,
  min_order_amount: 0,
  max_uses: null,
  uses_count: 0,
  expires_at: null,
  is_active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/promo-codes/validate', () => {
  it('retourne 400 si le code est absent', async () => {
    const res = await POST(makeRequest({ orderAmount: 50000 }));
    expect(res.status).toBe(400);
  });

  it('retourne valid:false si le code n\'existe pas en base', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'no rows' } });
    const res = await POST(makeRequest({ code: 'INEXISTANT', orderAmount: 50000 }));
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(typeof body.error).toBe('string');
  });

  it('valide un code actif sans restriction', async () => {
    mockSingle.mockResolvedValue({ data: BASE_CODE, error: null });
    const res = await POST(makeRequest({ code: 'VIP10', orderAmount: 50000 }));
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.type).toBe('percentage');
    expect(body.value).toBe(10);
  });

  it('normalise le code en majuscules avant la requête', async () => {
    mockSingle.mockResolvedValue({ data: BASE_CODE, error: null });
    await POST(makeRequest({ code: 'vip10', orderAmount: 50000 }));
    expect(mockEq).toHaveBeenCalledWith('code', 'VIP10');
  });

  it('retourne valid:false pour un code désactivé', async () => {
    mockSingle.mockResolvedValue({ data: { ...BASE_CODE, is_active: false }, error: null });
    const res = await POST(makeRequest({ code: 'VIP10', orderAmount: 50000 }));
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.error).toContain('désactivé');
  });

  it('retourne valid:false pour un code expiré', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    mockSingle.mockResolvedValue({
      data: { ...BASE_CODE, expires_at: pastDate },
      error: null,
    });
    const res = await POST(makeRequest({ code: 'VIP10', orderAmount: 50000 }));
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.error).toContain('expiré');
  });

  it('retourne valid:true pour un code non encore expiré', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    mockSingle.mockResolvedValue({
      data: { ...BASE_CODE, expires_at: futureDate },
      error: null,
    });
    const res = await POST(makeRequest({ code: 'VIP10', orderAmount: 50000 }));
    const body = await res.json();
    expect(body.valid).toBe(true);
  });

  it('retourne valid:false si max_uses atteint', async () => {
    mockSingle.mockResolvedValue({
      data: { ...BASE_CODE, max_uses: 100, uses_count: 100 },
      error: null,
    });
    const res = await POST(makeRequest({ code: 'VIP10', orderAmount: 50000 }));
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.error).toContain('maximum');
  });

  it('retourne valid:false si montant commande inférieur au minimum', async () => {
    mockSingle.mockResolvedValue({
      data: { ...BASE_CODE, min_order_amount: 100000 },
      error: null,
    });
    const res = await POST(makeRequest({ code: 'VIP10', orderAmount: 50000 }));
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.error).toContain('minimum');
  });

  it('valide un code de type fixed', async () => {
    mockSingle.mockResolvedValue({
      data: { ...BASE_CODE, type: 'fixed', value: 5000 },
      error: null,
    });
    const res = await POST(makeRequest({ code: 'REMISE5K', orderAmount: 50000 }));
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.type).toBe('fixed');
    expect(body.value).toBe(5000);
  });
});
