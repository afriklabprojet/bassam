import { describe, it, expect, vi, beforeEach } from 'vitest';

type Result = { data: unknown; error: { message: string } | null };

const calls: Array<{ table: string; method: string; args: unknown[] }> = [];
let results: Record<string, Result> = {};

function chain(table: string) {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'gte', 'lte', 'in', 'order', 'limit']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ table, method, args });
      return builder;
    };
  }
  builder.then = (resolve: (value: Result) => unknown) => resolve(results[table] ?? { data: [], error: null });
  return builder;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: (table: string) => chain(table) }),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { searchOrdersByTrackingNumber, ORDER_SEARCH_MAX_RESULTS } from '@/lib/supabase/admin-order-search';

const ORDER_ID = '3f2a9c1b-1111-4222-8333-444455556666';

const orderRow = {
  id: ORDER_ID,
  status: 'shipped',
  total_amount: '45000.00',
  payment_method: 'mobile_money',
  payment_status: 'paid',
  shipping_address: { firstName: 'Awa', lastName: 'Diop', address: '12 rue des Palmiers', city: 'Abidjan', country: 'CI' },
  phone: '+2250700000000',
  email: 'awa@example.com',
  notes: null,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-02T10:00:00Z',
  order_items: [
    { id: 'i1', quantity: 2, unit_price: '15000.00', products: { name: 'Oud Royal', brand: 'VIP' } },
    { id: 'i2', quantity: 1, unit_price: '15000.00', products: null },
  ],
};

beforeEach(() => {
  calls.length = 0;
  results = {};
});

describe('searchOrdersByTrackingNumber', () => {
  it('refuse un format invalide sans interroger la base', async () => {
    const result = await searchOrdersByTrackingNumber('pas-un-numero');
    expect(result).toEqual({ ok: false, reason: 'invalid' });
    expect(calls).toHaveLength(0);
  });

  it('cherche par intervalle sur la clé primaire, avec une limite', async () => {
    results.orders = { data: [], error: null };
    const result = await searchOrdersByTrackingNumber('VIP-3F2A9C1B');
    expect(result).toEqual({ ok: true, orders: [] });
    expect(calls).toContainEqual({ table: 'orders', method: 'gte', args: ['id', '3f2a9c1b-0000-0000-0000-000000000000'] });
    expect(calls).toContainEqual({ table: 'orders', method: 'lte', args: ['id', '3f2a9c1b-ffff-ffff-ffff-ffffffffffff'] });
    expect(calls).toContainEqual({ table: 'orders', method: 'limit', args: [ORDER_SEARCH_MAX_RESULTS] });
    expect(calls.some((c) => c.table === 'payments')).toBe(false);
  });

  it('cherche aussi par intervalle quand on saisit un UUID complet', async () => {
    await searchOrdersByTrackingNumber(ORDER_ID.toUpperCase());
    expect(calls).toContainEqual({ table: 'orders', method: 'gte', args: ['id', '3f2a9c1b-0000-0000-0000-000000000000'] });
    expect(calls).toContainEqual({ table: 'orders', method: 'lte', args: ['id', '3f2a9c1b-ffff-ffff-ffff-ffffffffffff'] });
  });

  it('assemble commande, articles, paiements, remboursements et historique', async () => {
    results.orders = { data: [orderRow], error: null };
    results.payments = {
      data: [
        { id: 'p1', order_id: ORDER_ID, amount: '45000', status: 'completed', method: 'mobile_money', transaction_id: 'tx1', created_at: '2026-10-01T10:01:00Z', paid_at: '2026-10-01T10:02:00Z' },
        { id: 'p2', order_id: 'autre', amount: '1', status: 'completed', method: 'card', transaction_id: null, created_at: '2026-10-01T10:01:00Z', paid_at: null },
      ],
      error: null,
    };

    const result = await searchOrdersByTrackingNumber('3f2a9c1b');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const [order] = result.orders;
    expect(order.trackingNumber).toBe('VIP-3F2A9C1B');
    expect(order.totalAmount).toBe(45000);
    expect(order.deliveryStatus).toBe('En cours de livraison');
    expect(order.customer).toEqual({ name: 'Awa Diop', phone: '+2250700000000', email: 'awa@example.com' });
    expect(order.items).toEqual([
      { id: 'i1', name: 'Oud Royal', brand: 'VIP', quantity: 2, unitPrice: 15000 },
      { id: 'i2', name: 'Produit supprimé du catalogue', brand: null, quantity: 1, unitPrice: 15000 },
    ]);
    expect(order.payments).toHaveLength(1);
    expect(order.payments[0]).toMatchObject({ id: 'p1', amount: 45000, status: 'completed' });
    expect(order.timeline.map((e) => e.label)).toEqual(['Commande créée', 'Paiement reçu', 'Dernière mise à jour — Expédiée']);
    expect(order).not.toHaveProperty('userId');
  });

  it('interroge paiements et remboursements une seule fois pour toutes les commandes trouvées', async () => {
    results.orders = { data: [orderRow, { ...orderRow, id: '3f2a9c1b-9999-4222-8333-444455556666' }], error: null };
    await searchOrdersByTrackingNumber('VIP-3F2A9C1B');
    expect(calls.filter((c) => c.table === 'payments' && c.method === 'in')).toHaveLength(1);
    expect(calls.filter((c) => c.table === 'refunds' && c.method === 'in')).toHaveLength(1);
  });

  it('signale une erreur de base de données sur les commandes', async () => {
    results.orders = { data: null, error: { message: 'boom' } };
    expect(await searchOrdersByTrackingNumber('VIP-3F2A9C1B')).toEqual({ ok: false, reason: 'error' });
  });

  it('retourne la commande même si paiements et remboursements sont illisibles', async () => {
    results.orders = { data: [orderRow], error: null };
    results.payments = { data: null, error: { message: 'rls' } };
    results.refunds = { data: null, error: { message: 'rls' } };
    const result = await searchOrdersByTrackingNumber('VIP-3F2A9C1B');
    expect(result.ok && result.orders[0].payments).toEqual([]);
  });
});
