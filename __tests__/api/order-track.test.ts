import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

type Row = {
  id: string;
  status: string;
  payment_status: string | null;
  total_amount: number | string;
  phone: string | null;
  created_at: string;
  shipping_address?: unknown;
  email?: string;
  order_items: Array<{ quantity: number; products: { name: string } | null }>;
};

let rows: Row[] = [];
const range: { gte?: string; lte?: string; select?: string } = {};
const mockLimit = vi.fn(async () => ({ data: rows, error: null as unknown }));
const mockFrom = vi.fn(() => ({
  select: (columns: string) => {
    range.select = columns;
    return {
      gte: (_c: string, lo: string) => {
        range.gte = lo;
        return {
          lte: (_c2: string, hi: string) => {
            range.lte = hi;
            return { limit: mockLimit };
          },
        };
      },
    };
  },
}));
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn(() => ({ from: mockFrom })) }));

const { POST } = await import('@/app/api/orders/track/route');

let ip = 0;
function track(body: unknown, forwardedFor = `10.0.0.${++ip}`) {
  return POST(
    new NextRequest('http://localhost/api/orders/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': forwardedFor },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

const ORDER: Row = {
  id: 'abcdef12-0000-4000-8000-000000000001',
  status: 'shipped',
  payment_status: 'paid',
  total_amount: '45000',
  phone: '07 01 02 03 04',
  created_at: '2026-10-20T10:00:00Z',
  shipping_address: { firstName: 'Aya', address: 'Cocody, rue 12' },
  email: 'aya@example.com',
  order_items: [
    { quantity: 2, products: { name: 'Oud Royal' } },
    { quantity: 1, products: null },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  rows = [ORDER];
});

describe('POST /api/orders/track', () => {
  it('bon numéro et bon téléphone : statut, paiement, montant et articles, sans donnée personnelle', async () => {
    const res = await track({ ref: 'VIP-ABCDEF12', phone: '+225 0701020304' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      order: {
        orderNumber: 'VIP-ABCDEF12',
        status: 'shipped',
        paymentStatus: 'paid',
        totalAmount: 45000,
        createdAt: '2026-10-20T10:00:00Z',
        items: [
          { name: 'Oud Royal', quantity: 2 },
          { name: 'Article retiré du catalogue', quantity: 1 },
        ],
      },
    });
    const raw = JSON.stringify(body);
    for (const secret of ['Cocody', 'aya@example.com', '0701020304', '01 02 03 04', 'Aya', ORDER.id]) {
      expect(raw).not.toContain(secret);
    }
  });

  it('cherche par plage d’identifiants (index de la clé primaire) et ne lit que les colonnes utiles', async () => {
    await track({ ref: 'abcdef12', phone: '0701020304' });
    expect(range.gte).toBe('abcdef12-0000-0000-0000-000000000000');
    expect(range.lte).toBe('abcdef12-ffff-ffff-ffff-ffffffffffff');
    expect(range.select).not.toMatch(/shipping_address|email/);
  });

  it('numéro inconnu ou téléphone faux : la même réponse « introuvable » dans les deux cas', async () => {
    const wrongPhone = await track({ ref: 'VIP-ABCDEF12', phone: '0701020399' });
    rows = [];
    const unknownRef = await track({ ref: 'VIP-ABCDEF12', phone: '0701020304' });

    expect(wrongPhone.status).toBe(404);
    expect(unknownRef.status).toBe(404);
    expect(await wrongPhone.json()).toEqual(await unknownRef.json());
  });

  it('retrouve la bonne commande quand deux identifiants commencent pareil', async () => {
    rows = [
      { ...ORDER, id: 'abcdef12-1111-4000-8000-000000000002', phone: '0505050505', status: 'pending' },
      ORDER,
    ];
    const body = await (await track({ ref: 'VIP-ABCDEF12', phone: '0701020304' })).json();
    expect(body.order.status).toBe('shipped');
  });

  it.each([
    [{}, 'champs absents'],
    [{ ref: 'VIP-XYZ', phone: '0701020304' }, 'numéro mal formé'],
    [{ ref: 'VIP-ABCDEF12', phone: '12' }, 'téléphone trop court'],
    [{ ref: 42, phone: 42 }, 'types invalides'],
  ])('refuse une saisie invalide sans interroger la base (%s)', async (body, _label) => {
    const res = await track(body);
    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('refuse un corps qui n’est pas du JSON', async () => {
    expect((await track('{pas du json')).status).toBe(400);
  });

  it('limite les tentatives : 10 par visiteur, puis « trop de requêtes » (429)', async () => {
    const visitor = '192.168.50.7';
    for (let i = 0; i < 10; i++) {
      expect((await track({ ref: 'VIP-ABCDEF12', phone: '0701020399' }, visitor)).status).toBe(404);
    }
    const blocked = await track({ ref: 'VIP-ABCDEF12', phone: '0701020304' }, visitor);
    expect(blocked.status).toBe(429);
  });

  it('erreur de la base : réponse JSON générique, sans détail interne', async () => {
    mockLimit.mockResolvedValueOnce({ data: null as unknown as Row[], error: { message: 'relation "orders" does not exist' } });
    const res = await track({ ref: 'VIP-ABCDEF12', phone: '0701020304' });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('relation');
  });
});
