// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockIsAdmin = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({ isCurrentUserAdmin: mockIsAdmin }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: () => ({ insert: () => ({ select: () => ({ single: mockSingle }) }) }),
  })),
}));

const { POST } = await import('@/app/api/admin/payments/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAdmin.mockResolvedValue(true);
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

describe('POST /api/admin/payments — erreurs', () => {
  it('explique une commande inexistante sans parler de suppression ni exposer la contrainte', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: {
        code: '23503',
        message: 'insert or update on table "payments" violates foreign key constraint "payments_order_id_fkey"',
      },
    });

    const res = await POST(
      new NextRequest('http://localhost/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: '00000000-0000-4000-8000-000000000000', amount: 10000, method: 'cash' }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe('Opération impossible : un élément lié est manquant ou encore utilisé.');
    expect(body.error).not.toMatch(/supprim/);
    expect(JSON.stringify(body)).not.toMatch(/payments_order_id_fkey|foreign key/);
  });
});
