import { createClient } from './server';

type CategoryJoin = { id: string; name: string } | null;

/** Get all products (admin — with full details) */
export async function getAdminProducts(page = 1, limit = 20, search?: string) {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('products')
    .select('*, categories(id, name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    const q = `%${search}%`;
    query = query.or(`name.ilike.${q},brand.ilike.${q}`);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error || !data) return { products: [], total: 0, page, totalPages: 0 };

  return {
    products: data.map((row) => {
      const category = row.categories as CategoryJoin;
      return {
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
        categoryId: category?.id ?? null,
        categoryName: category?.name ?? null,
        notes: row.notes,
        concentration: row.concentration,
        volume: row.volume,
        createdAt: row.created_at,
      };
    }),
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
  const { createServiceClient } = await import('./service');
  const supabase = createServiceClient();

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

const PRODUCT_KEY_MAP: Record<string, string> = {
  name: 'name', slug: 'slug', brand: 'brand', description: 'description',
  price: 'price', originalPrice: 'original_price', categoryId: 'category_id',
  gender: 'gender', stockQuantity: 'stock_quantity', isFeatured: 'is_featured',
  images: 'images', notes: 'notes', concentration: 'concentration', volume: 'volume',
};

/** Update a product */
export async function updateProduct(id: string, input: Record<string, unknown>) {
  const { createServiceClient } = await import('./service');
  const supabase = createServiceClient();

  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const dbKey = PRODUCT_KEY_MAP[key];
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
  const { createServiceClient } = await import('./service');
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  return { error: error?.message ?? null };
}
