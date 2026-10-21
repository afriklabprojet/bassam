import { beforeEach, describe, expect, it, vi } from 'vitest';

const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_PRODUCT_ID = '22222222-2222-4222-8222-222222222222';

const mockProductsIn = vi.fn();
const mockOrderSingle = vi.fn();
const mockOrderInsert = vi.fn(() => ({
  select: () => ({ single: mockOrderSingle }),
}));
const mockDuplicateSingle = vi.fn();
const mockItemsInsert = vi.fn();
const mockOrderDeleteEq = vi.fn();
const mockPromoSingle = vi.fn();
// Promo use counters only move through SQL functions (supabase.rpc).
const mockRpc = vi.fn();
const rpcNames = () => mockRpc.mock.calls.map(([name]) => name);

const PROMO_ROW = {
  id: 'promo-1',
  code: 'VIP10',
  type: 'percentage',
  value: 10,
  min_order_amount: null,
  max_uses: 5,
  uses_count: 4,
  expires_at: null,
  is_active: true,
};

function buildDuplicateQuery(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.limit = vi.fn(() => ({ single: mockDuplicateSingle }));
  return chain;
}

const mockFrom = vi.fn((table: string) => {
  if (table === 'products') {
    return {
      select: () => ({ in: mockProductsIn }),
    };
  }

  if (table === 'orders') {
    return { insert: mockOrderInsert, select: () => buildDuplicateQuery(), delete: () => ({ eq: mockOrderDeleteEq }) };
  }

  if (table === 'order_items') {
    return { insert: mockItemsInsert };
  }

  if (table === 'promo_codes') {
    return {
      select: () => ({ eq: () => ({ single: mockPromoSingle }) }),
    };
  }

  return {};
});

const mockServiceFrom = vi.fn(() => ({
  select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom, rpc: mockRpc })),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockServiceFrom })),
}));

import { createOrder } from '@/lib/supabase/orders';

const baseInput = {
  totalAmount: 1,
  paymentMethod: 'cash_on_delivery' as const,
  shippingAddress: {
    firstName: 'Awa',
    lastName: 'Kouassi',
    address: 'Plateau',
    city: 'Abidjan',
    country: "Côte d'Ivoire",
  },
  phone: '0700000000',
  email: 'awa@example.com',
  items: [{ productId: PRODUCT_ID, quantity: 2, unitPrice: 1 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockDuplicateSingle.mockResolvedValue({ data: null, error: null });
  mockOrderSingle.mockResolvedValue({
    data: {
      id: 'order-1',
      status: 'pending',
      total_amount: 60000,
      payment_method: 'cash_on_delivery',
      payment_status: 'pending',
      shipping_address: baseInput.shippingAddress,
      phone: baseInput.phone,
      email: baseInput.email,
      notes: null,
      created_at: '2026-05-17T00:00:00.000Z',
    },
    error: null,
  });
  mockItemsInsert.mockResolvedValue({ error: null });
  mockOrderDeleteEq.mockResolvedValue({ error: null });
  mockRpc.mockImplementation(async (name: string) => ({ data: name === 'unclaim_promo_code_use' ? null : true, error: null }));
});

describe('createOrder', () => {
  it('recalcule le total et les prix depuis les produits en base', async () => {
    mockProductsIn.mockResolvedValue({
      data: [{ id: PRODUCT_ID, price: 30000, stock_quantity: 5 }],
      error: null,
    });

    const result = await createOrder('user-1', baseInput);

    expect(result.error).toBeNull();
    expect(mockOrderInsert).toHaveBeenCalledWith(expect.objectContaining({ total_amount: 60000 }));
    expect(mockItemsInsert).toHaveBeenCalledWith([
      expect.objectContaining({ product_id: PRODUCT_ID, quantity: 2, unit_price: 30000 }),
    ]);
  });

  it('ajoute les frais de livraison si le sous-total est sous le seuil offert', async () => {
    mockProductsIn.mockResolvedValue({
      data: [
        { id: PRODUCT_ID, price: 20000, stock_quantity: 2 },
        { id: SECOND_PRODUCT_ID, price: 20000, stock_quantity: 2 },
      ],
      error: null,
    });

    await createOrder('user-1', {
      ...baseInput,
      shippingModeId: 'express',
      items: [
        { productId: PRODUCT_ID, quantity: 1, unitPrice: 1 },
        { productId: SECOND_PRODUCT_ID, quantity: 1, unitPrice: 1 },
      ],
    });

    expect(mockOrderInsert).toHaveBeenCalledWith(expect.objectContaining({ total_amount: 42500 }));
  });

  it('refuse une commande si le stock est insuffisant', async () => {
    mockProductsIn.mockResolvedValue({
      data: [{ id: PRODUCT_ID, price: 30000, stock_quantity: 1 }],
      error: null,
    });

    const result = await createOrder('user-1', baseInput);

    expect(result.order).toBeNull();
    expect(result.error).toContain('Stock insuffisant');
    expect(mockOrderInsert).not.toHaveBeenCalled();
    expect(mockItemsInsert).not.toHaveBeenCalled();
  });

  it('ne renvoie pas le message SQL quand l insertion échoue', async () => {
    mockProductsIn.mockResolvedValue({
      data: [{ id: PRODUCT_ID, price: 30000, stock_quantity: 5 }],
      error: null,
    });
    mockOrderSingle.mockResolvedValue({
      data: null,
      error: { code: '23514', message: 'new row for relation "orders" violates check constraint' },
    });

    const result = await createOrder('user-1', baseInput);

    expect(result.order).toBeNull();
    expect(result.error).toBe('Erreur création commande');
  });

  it('enregistre le code promo sur la commande et y rattache l usage réservé', async () => {
    mockProductsIn.mockResolvedValue({
      data: [{ id: PRODUCT_ID, price: 30000, stock_quantity: 5 }],
      error: null,
    });
    mockPromoSingle.mockResolvedValueOnce({ data: PROMO_ROW, error: null });

    const result = await createOrder('user-1', { ...baseInput, promoCode: 'vip10' });

    expect(result.error).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith('claim_promo_code_use', { p_promo_id: 'promo-1' });
    expect(mockOrderInsert).toHaveBeenCalledWith(
      expect.objectContaining({ promo_code_id: 'promo-1', promo_use_counted: true }),
    );
  });

  it('ne rattache aucun usage à une commande sans code promo', async () => {
    mockProductsIn.mockResolvedValue({
      data: [{ id: PRODUCT_ID, price: 30000, stock_quantity: 5 }],
      error: null,
    });

    await createOrder('user-1', baseInput);

    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockOrderInsert).toHaveBeenCalledWith(
      expect.objectContaining({ promo_code_id: null, promo_use_counted: false }),
    );
  });

  it('refuse la commande si le dernier usage du code promo est pris entre-temps', async () => {
    mockProductsIn.mockResolvedValue({
      data: [{ id: PRODUCT_ID, price: 30000, stock_quantity: 5 }],
      error: null,
    });
    // Validation sees 4/5; by the time the use is claimed, another order took the 5th.
    mockPromoSingle.mockResolvedValueOnce({ data: PROMO_ROW, error: null });
    mockRpc.mockResolvedValueOnce({ data: false, error: null });

    const result = await createOrder('user-1', { ...baseInput, promoCode: 'vip10' });

    expect(result.order).toBeNull();
    expect(result.error).toMatch(/code promo/i);
    expect(mockOrderInsert).not.toHaveBeenCalled();
    expect(rpcNames()).toEqual(['claim_promo_code_use']);
  });

  it('rend l usage du code promo si l insertion de la commande échoue', async () => {
    mockProductsIn.mockResolvedValue({
      data: [{ id: PRODUCT_ID, price: 30000, stock_quantity: 5 }],
      error: null,
    });
    mockPromoSingle.mockResolvedValueOnce({ data: PROMO_ROW, error: null });
    mockOrderSingle.mockResolvedValue({ data: null, error: { code: '23514', message: 'check violation' } });

    const result = await createOrder('user-1', { ...baseInput, promoCode: 'vip10' });

    expect(result.error).toBe('Erreur création commande');
    expect(rpcNames()).toEqual(['claim_promo_code_use', 'unclaim_promo_code_use']);
  });

  it('supprime la commande sans articles et rend l usage du code promo', async () => {
    mockProductsIn.mockResolvedValue({
      data: [{ id: PRODUCT_ID, price: 30000, stock_quantity: 5 }],
      error: null,
    });
    mockPromoSingle.mockResolvedValueOnce({ data: PROMO_ROW, error: null });
    mockItemsInsert.mockResolvedValue({ error: { code: '23503', message: 'fk violation' } });

    const result = await createOrder('user-1', { ...baseInput, promoCode: 'vip10' });

    expect(result).toEqual({ order: null, error: 'Erreur création commande' });
    expect(mockOrderDeleteEq).toHaveBeenCalledWith('id', 'order-1');
    expect(rpcNames()).toEqual(['claim_promo_code_use', 'unclaim_promo_code_use']);
  });

  it('libère l usage par la commande si sa suppression échoue, sans double restitution', async () => {
    mockProductsIn.mockResolvedValue({
      data: [{ id: PRODUCT_ID, price: 30000, stock_quantity: 5 }],
      error: null,
    });
    mockPromoSingle.mockResolvedValueOnce({ data: PROMO_ROW, error: null });
    mockItemsInsert.mockResolvedValue({ error: { code: '23503', message: 'fk violation' } });
    mockOrderDeleteEq.mockResolvedValue({ error: { code: '57014', message: 'canceling statement' } });

    const result = await createOrder('user-1', { ...baseInput, promoCode: 'vip10' });

    expect(result.error).toBe('Erreur création commande');
    expect(rpcNames()).toEqual(['claim_promo_code_use', 'release_order_promo']);
    expect(mockRpc).toHaveBeenLastCalledWith('release_order_promo', { p_order_id: 'order-1' });
  });
});
