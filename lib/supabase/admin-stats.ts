import { createClient } from './server';

/** Get dashboard stats — with period comparison */
export async function getDashboardStats() {
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = monthStart;

  const [
    products, orders, revenue, customers, newsletter,
    todayOrders, thisMonthOrders, lastMonthOrders, pendingOrders, lowStock,
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('newsletter_subscriptions').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('total_amount').eq('payment_status', 'paid').gte('created_at', todayStart),
    supabase.from('orders').select('total_amount').eq('payment_status', 'paid').gte('created_at', monthStart),
    supabase.from('orders').select('total_amount').eq('payment_status', 'paid').gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock_quantity', 5),
  ]);

  const totalRevenue = (revenue.data ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0);
  const revenueToday = (todayOrders.data ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0);
  const revenueThisMonth = (thisMonthOrders.data ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0);
  const revenueLastMonth = (lastMonthOrders.data ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0);
  const paidCount = revenue.data?.length ?? 0;
  const averageOrderValue = paidCount > 0 ? totalRevenue / paidCount : 0;
  let monthGrowth: number;
  if (revenueLastMonth > 0) {
    monthGrowth = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
  } else {
    monthGrowth = revenueThisMonth > 0 ? 100 : 0;
  }

  return {
    totalProducts: products.count ?? 0,
    totalOrders: orders.count ?? 0,
    totalRevenue,
    totalCustomers: customers.count ?? 0,
    totalNewsletter: newsletter.count ?? 0,
    revenueToday,
    revenueThisMonth,
    revenueLastMonth,
    monthGrowth,
    averageOrderValue,
    pendingOrdersCount: pendingOrders.count ?? 0,
    lowStockCount: lowStock.count ?? 0,
  };
}

type ProductJoin = { name: string; brand: string; images: string[]; stock_quantity: number };

/** Top selling products by revenue */
export async function getTopProducts(limit = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('order_items')
    .select('product_id, quantity, unit_price, products(name, brand, images, stock_quantity)');

  if (error || !data) return [];

  const map = new Map<string, { id: string; name: string; brand: string; image: string; stock: number; revenue: number; qty: number }>();

  for (const item of data) {
    if (!item.product_id || !item.products) continue;
    const p = item.products as unknown as ProductJoin;
    const existing = map.get(item.product_id);
    if (existing) {
      existing.revenue += Number(item.unit_price) * Number(item.quantity);
      existing.qty += Number(item.quantity);
    } else {
      map.set(item.product_id, {
        id: item.product_id,
        name: p.name,
        brand: p.brand,
        image: p.images?.[0] ?? '',
        stock: p.stock_quantity,
        revenue: Number(item.unit_price) * Number(item.quantity),
        qty: Number(item.quantity),
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/** Products with low stock */
export async function getLowStockProducts(threshold = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, stock_quantity, images')
    .lte('stock_quantity', threshold)
    .order('stock_quantity', { ascending: true })
    .limit(8);

  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    stock: p.stock_quantity,
    image: (p.images as string[])?.[0] ?? '',
  }));
}

/** Payment method distribution */
export async function getPaymentMethodStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('payment_method, total_amount');

  if (error || !data) return [];

  const stats: Record<string, { count: number; revenue: number }> = {};
  for (const order of data) {
    const method = order.payment_method ?? 'unknown';
    if (!stats[method]) stats[method] = { count: 0, revenue: 0 };
    stats[method].count++;
    stats[method].revenue += Number(order.total_amount);
  }

  const total = data.length;
  return Object.entries(stats).map(([method, s]) => ({
    method,
    count: s.count,
    revenue: s.revenue,
    pct: total > 0 ? (s.count / total) * 100 : 0,
  }));
}

/** Top customers by spending */
export async function getTopCustomers(limit = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('email, total_amount')
    .eq('payment_status', 'paid');

  if (error || !data) return [];

  const map = new Map<string, { email: string; total: number; orders: number }>();
  for (const order of data) {
    const email = order.email;
    if (!email) continue;
    const existing = map.get(email);
    if (existing) {
      existing.total += Number(order.total_amount);
      existing.orders++;
    } else {
      map.set(email, { email, total: Number(order.total_amount), orders: 1 });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/** Get recent orders for dashboard */
export async function getRecentOrders(limit = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, payment_method, payment_status,
      phone, email, created_at,
      order_items (quantity)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    status: row.status,
    totalAmount: Number(row.total_amount),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    phone: row.phone,
    email: row.email,
    itemsCount: (row.order_items as Array<{ quantity: number }>)?.reduce((s, i) => s + i.quantity, 0) ?? 0,
    createdAt: row.created_at,
  }));
}
