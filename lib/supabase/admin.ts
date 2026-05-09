import { createClient } from './server';

/* ═══════════════════════════════════════════════════════════════════════════
   Supabase Admin Queries — require admin role
   ═══════════════════════════════════════════════════════════════════════════ */

/** Check if the current user is an admin */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return user.app_metadata?.role === 'admin';
}

/** Get dashboard stats */
export async function getDashboardStats() {
  const supabase = await createClient();

  const [products, orders, revenue, customers, newsletter] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('newsletter_subscriptions').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const totalRevenue = (revenue.data ?? []).reduce((sum, row) => sum + Number(row.total_amount), 0);

  return {
    totalProducts: products.count ?? 0,
    totalOrders: orders.count ?? 0,
    totalRevenue,
    totalCustomers: customers.count ?? 0,
    totalNewsletter: newsletter.count ?? 0,
  };
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
      items: (row.order_items as Array<Record<string, unknown>>)?.map((item) => ({
        id: item.id as string,
        productId: item.product_id as string,
        quantity: item.quantity as number,
        unitPrice: Number(item.unit_price),
        product: item.products as { name: string; brand: string; slug: string } | null,
      })) ?? [],
    })),
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

/** Update order status */
export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  return { error: error?.message ?? null };
}

/** Get all products (admin — with full details) */
export async function getAdminProducts(page = 1, limit = 20, search?: string) {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('products')
    .select('*, categories(name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    const q = `%${search}%`;
    query = query.or(`name.ilike.${q},brand.ilike.${q}`);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error || !data) return { products: [], total: 0, page, totalPages: 0 };

  return {
    products: data.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      brand: row.brand,
      description: row.description,
      price: Number(row.price),
      originalPrice: row.original_price ? Number(row.original_price) : null,
      gender: row.gender,
      stockQuantity: row.stock_quantity,
      isFeatured: row.is_featured,
      images: row.images ?? [],
      categoryName: (row.categories as { name: string } | null)?.name ?? null,
      notes: row.notes,
      concentration: row.concentration,
      volume: row.volume,
      createdAt: row.created_at,
    })),
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

/** Create a product */
export async function createProduct(input: {
  name: string; slug: string; brand: string; description?: string;
  price: number; originalPrice?: number; categoryId?: string;
  gender?: string; stockQuantity?: number; isFeatured?: boolean;
  images?: string[]; notes?: Record<string, unknown>;
  concentration?: string; volume?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      slug: input.slug,
      brand: input.brand,
      description: input.description || null,
      price: input.price,
      original_price: input.originalPrice || null,
      category_id: input.categoryId || null,
      gender: input.gender || null,
      stock_quantity: input.stockQuantity ?? 0,
      is_featured: input.isFeatured ?? false,
      images: input.images ?? [],
      notes: input.notes ?? null,
      concentration: input.concentration || null,
      volume: input.volume || null,
    })
    .select()
    .single();

  return { product: data, error: error?.message ?? null };
}

/** Update a product */
export async function updateProduct(id: string, input: Record<string, unknown>) {
  const supabase = await createClient();

  // Convert camelCase to snake_case
  const mapped: Record<string, unknown> = {};
  const keyMap: Record<string, string> = {
    name: 'name', slug: 'slug', brand: 'brand', description: 'description',
    price: 'price', originalPrice: 'original_price', categoryId: 'category_id',
    gender: 'gender', stockQuantity: 'stock_quantity', isFeatured: 'is_featured',
    images: 'images', notes: 'notes', concentration: 'concentration', volume: 'volume',
  };

  for (const [key, value] of Object.entries(input)) {
    const dbKey = keyMap[key];
    if (dbKey) mapped[dbKey] = value;
  }

  const { error } = await supabase
    .from('products')
    .update(mapped)
    .eq('id', id);

  return { error: error?.message ?? null };
}

/** Delete a product */
export async function deleteProduct(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  return { error: error?.message ?? null };
}

/** Get all customers (profiles with their order stats) */
export async function getAdminCustomers(page = 1, limit = 20) {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error || !data) return { customers: [], total: 0, page, totalPages: 0 };

  return {
    customers: data.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
    })),
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}
