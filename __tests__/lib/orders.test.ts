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
    return { insert: mockOrderInsert, select: () => buildDuplicateQuery() };
  }

  if (table === 'order_items') {
    return { insert: mockItemsInsert };
  }

  return {};
});

const mockServiceFrom = vi.fn(() => ({
  select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
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
});