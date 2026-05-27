import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './server';
import { getShippingConfig, getShippingFee } from '@/lib/shipping';
import { logger } from '@/lib/logger';

/* ═══════════════════════════════════════════════════════════════════════════
   Supabase Order Queries
   ═══════════════════════════════════════════════════════════════════════════ */

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderInput {
  /** Client-provided value kept for API compatibility. Server recomputes the actual total. */
  totalAmount: number;
  paymentMethod: 'mobile_money' | 'card' | 'cash_on_delivery';
  /** ID of the selected delivery mode (from ShippingConfig.modes[].id) */
  shippingModeId?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    country: string;
    postalCode?: string;
  };
  phone: string;
  email: string;
  notes?: string;
  items: OrderItem[];
}

export interface Order {
  id: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: Record<string, unknown>;
  phone: string;
  email: string;
  notes: string | null;
  createdAt: string;
  items?: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    product?: { name: string; brand: string; slug: string; images: string[] };
  }>;
}

type ProductPricingRow = {
  id: string;
  price: number | string;
  stock_quantity: number | null;
};

type AggregateQuantitiesResult =
  | { ok: true; quantities: Map<string, number> }
  | { ok: false; error: string };

type VerifiedOrderData = {
  items: OrderItem[];
  totalAmount: number;
};

type BuildVerifiedOrderResult =
  | { ok: true; data: VerifiedOrderData }
  | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function aggregateQuantities(items: OrderItem[]): AggregateQuantitiesResult {
  const quantities = new Map<string, number>();

  for (const item of items) {
    if (!UUID_RE.test(item.productId)) {
      return { ok: false, error: 'Produit invalide' };
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { ok: false, error: 'Quantité invalide' };
    }

    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  return { ok: true, quantities };
}

async function buildVerifiedOrder(
  input: CreateOrderInput,
  supabase: SupabaseClient
): Promise<BuildVerifiedOrderResult> {
  const aggregated = aggregateQuantities(input.items);
  if (!aggregated.ok) return { ok: false, error: aggregated.error };

  const productIds = [...aggregated.quantities.keys()];
  if (productIds.length === 0) return { ok: false, error: 'Au moins un article requis' };

  const { data, error } = await supabase
    .from('products')
    .select('id, price, stock_quantity')
    .in('id', productIds);

  if (error || !data) {
    logger.error('createOrder', 'Failed to fetch products for verification');
    return { ok: false, error: 'Impossible de vérifier les produits' };
  }

  const productsById = new Map(
    (data as ProductPricingRow[]).map((product) => [product.id, product])
  );
  const verifiedItems: OrderItem[] = [];

  for (const productId of productIds) {
    const product = productsById.get(productId);
    const quantity = aggregated.quantities.get(productId) ?? 0;

    if (!product) {
      return { ok: false, error: 'Produit introuvable' };
    }

    const unitPrice = Number(product.price);
    const stockQuantity = Number(product.stock_quantity ?? 0);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return { ok: false, error: 'Prix produit invalide' };
    }

    if (stockQuantity < quantity) {
      return { ok: false, error: 'Stock insuffisant pour un ou plusieurs produits' };
    }

    verifiedItems.push({ productId, quantity, unitPrice });
  }

  const subtotal = verifiedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingCfg = await getShippingConfig();
  const shippingFee = getShippingFee(shippingCfg, input.shippingModeId ?? '');

  return {
    ok: true,
    data: {
      items: verifiedItems,
      totalAmount: subtotal + shippingFee,
    },
  };
}

const IDEMPOTENCY_WINDOW_MS = 30_000;

async function findDuplicateOrder(
  supabase: SupabaseClient,
  phone: string,
  email: string,
  totalAmount: number
): Promise<string | null> {
  const since = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS).toISOString();
  const { data } = await supabase
    .from('orders')
    .select('id')
    .eq('phone', phone)
    .eq('email', email)
    .eq('total_amount', totalAmount)
    .gte('created_at', since)
    .limit(1)
    .single();
  return data?.id ?? null;
}

/** Create a new order with items. */
export async function createOrder(
  userId: string | null,
  input: CreateOrderInput,
  supabaseClient?: SupabaseClient
): Promise<{ order: Order | null; error: string | null }> {
  const supabase = supabaseClient ?? await createClient();
  const verifiedOrder = await buildVerifiedOrder(input, supabase);

  if (!verifiedOrder.ok) {
    return { order: null, error: verifiedOrder.error };
  }

  // Idempotency guard — prevent duplicate orders from rapid retries
  const duplicateId = await findDuplicateOrder(
    supabase,
    input.phone,
    input.email,
    verifiedOrder.data.totalAmount
  );
  if (duplicateId) {
    const { data: existing } = await supabase
      .from('orders')
      .select()
      .eq('id', duplicateId)
      .single();
    if (existing) return { order: mapOrder(existing as OrderRow), error: null };
  }

  // Insert the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      total_amount: verifiedOrder.data.totalAmount,
      payment_method: input.paymentMethod,
      shipping_mode_id: input.shippingModeId ?? null,
      shipping_address: input.shippingAddress,
      phone: input.phone,
      email: input.email,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (orderError || !order) {
    logger.error('createOrder', 'Failed to insert order');
    return { order: null, error: orderError?.message ?? 'Erreur création commande' };
  }

  // Insert order items
  const itemsToInsert = verifiedOrder.data.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert);

  if (itemsError) {
    logger.error('createOrder', 'Failed to insert order items');
    // Order was created but items failed — return partial
    return { order: mapOrder(order), error: 'Commande créée mais erreur sur les articles' };
  }

  return { order: mapOrder(order), error: null };
}

/** Fetch orders for authenticated user */
export async function getUserOrders(userId: string): Promise<Order[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        product_id,
        quantity,
        unit_price,
        products (name, brand, slug, images)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    logger.error('getUserOrders', 'Failed to fetch user orders');
    return [];
  }

  return data.map((row) => {
    const mapped = mapOrder(row);
    const items = row.order_items as Array<{
      id: string;
      product_id: string;
      quantity: number;
      unit_price: number;
      products: { name: string; brand: string; slug: string; images: string[] } | null;
    }> ?? [];
    mapped.items = items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      product: item.products ?? undefined,
    }));
    return mapped;
  });
}

/** Get a single order by ID (owner only via RLS) */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        product_id,
        quantity,
        unit_price,
        products (name, brand, slug, images)
      )
    `)
    .eq('id', orderId)
    .single();

  if (error || !data) return null;

  const mapped = mapOrder(data);
  const items = data.order_items as Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    products: { name: string; brand: string; slug: string; images: string[] } | null;
  }> ?? [];
  mapped.items = items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    quantity: item.quantity,
    unitPrice: Number(item.unit_price),
    product: item.products ?? undefined,
  }));
  return mapped;
}

type OrderRow = {
  id: string;
  status: string;
  total_amount: number | string;
  payment_method: string;
  payment_status: string;
  shipping_address: Record<string, unknown>;
  phone: string;
  email: string;
  notes?: string | null;
  created_at: string;
  order_items?: unknown;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    status: row.status,
    totalAmount: Number(row.total_amount),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    shippingAddress: row.shipping_address,
    phone: row.phone,
    email: row.email,
    notes: row.notes ?? null,
    createdAt: row.created_at,
  };
}
