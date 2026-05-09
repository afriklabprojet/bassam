import { createClient } from './server';

/* ═══════════════════════════════════════════════════════════════════════════
   Supabase Order Queries
   ═══════════════════════════════════════════════════════════════════════════ */

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderInput {
  totalAmount: number;
  paymentMethod: 'mobile_money' | 'card' | 'cash_on_delivery';
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

/** Create a new order with items (transactional) */
export async function createOrder(userId: string, input: CreateOrderInput): Promise<{ order: Order | null; error: string | null }> {
  const supabase = await createClient();

  // Insert the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      total_amount: input.totalAmount,
      payment_method: input.paymentMethod,
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
  const itemsToInsert = input.items.map((item) => ({
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
