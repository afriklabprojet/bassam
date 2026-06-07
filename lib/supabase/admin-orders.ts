import { createClient } from './server';

type OrderItemJoin = { name: string; brand: string; slug: string };

/** Get all orders (paginated) for admin */
export async function getAdminOrders(page = 1, limit = 20, status?: string) {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('orders')
    .select(`
      id, user_id, status, total_amount, payment_method, payment_status,
      shipping_address, phone, email, notes, created_at,
      order_items (id, product_id, quantity, unit_price, products (name, brand, slug))
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error || !data) return { orders: [], total: 0, page, totalPages: 0 };

  return {
    orders: data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      status: row.status,
      totalAmount: Number(row.total_amount),
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      shippingAddress: row.shipping_address,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      createdAt: row.created_at,
      items: (row.order_items as unknown as Array<{
        id: string;
        product_id: string;
        quantity: number;
        unit_price: number;
        products: OrderItemJoin | null;
      }>)?.map((item) => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        product: item.products,
      })) ?? [],
    })),
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

/** Count previous orders for the same phone (excluding current order) */
export async function getOrderCountByPhone(phone: string, excludeOrderId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phone)
    .neq('id', excludeOrderId);
  return count ?? 0;
}

/** Update order status */
export async function updateOrderStatus(orderId: string, status: string) {
  const { createServiceClient } = await import('./service');
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  return { error: error?.message ?? null };
}
