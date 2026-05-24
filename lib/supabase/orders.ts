import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './server';
import { getShippingConfig, getShippingFee } from '@/lib/shipping';

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
    console.error('[createOrder products]', error?.message);
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
    console.error('[createOrder]', orderError?.message);
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
    console.error('[createOrder items]', itemsError.message);
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
    console.error('[getUserOrders]', error?.message);
    return [];
  }

  return data.map((row) => {
    const mapped = mapOrder(row);
    mapped.items = ((row as Record<string, unknown>).order_items as Array<Record<string, unknown>> ?? []).map((item) => ({
      id: item.id as string,
      productId: item.product_id as string,
      quantity: item.quantity as number,
      unitPrice: item.unit_price as number,
      product: item.products as { name: string; brand: string; slug: string; images: string[] } | undefined,
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
  mapped.items = ((data as Record<string, unknown>).order_items as Array<Record<string, unknown>> ?? []).map((item) => ({
    id: item.id as string,
    productId: item.product_id as string,
    quantity: item.quantity as number,
    unitPrice: item.unit_price as number,
    product: item.products as { name: string; brand: string; slug: string; images: string[] } | undefined,
  }));
  return mapped;
}

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    status: row.status as string,
    totalAmount: Number(row.total_amount),
    paymentMethod: row.payment_method as string,
    paymentStatus: row.payment_status as string,
    shippingAddress: row.shipping_address as Record<string, unknown>,
    phone: row.phone as string,
    email: row.email as string,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}
