import { createClient } from './server';
import type { Product, ProductFilters, ProductsResponse } from '@/types/product.types';

/* ═══════════════════════════════════════════════════════════════════════════
   Supabase Product Queries — replaces mock data
   ═══════════════════════════════════════════════════════════════════════════ */

/** Map a Supabase row to the app-level Product type */
function mapRow(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    brand: row.brand as string,
    description: (row.description as string) ?? null,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : null,
    categoryId: (row.category_id as string) ?? null,
    categoryName: (row.categories as { name: string } | null)?.name ?? null,
    gender: (row.gender as Product['gender']) ?? null,
    stockQuantity: Number(row.stock_quantity ?? 0),
    isFeatured: Boolean(row.is_featured),
    images: (row.images as string[]) ?? [],
    createdAt: row.created_at as string,
    notes: (row.notes as { top: string[]; heart: string[]; base: string[] } | null) ?? null,
    concentration: (row.concentration as string) ?? null,
    volume: (row.volume as string) ?? null,
  };
}

/** Fetch products list with server-side filtering, sorting and pagination */
export async function getProducts(filters: ProductFilters): Promise<ProductsResponse> {
  const supabase = await createClient();

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(48, Math.max(1, filters.limit ?? 12));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('products')
    .select('*, categories(name)', { count: 'exact' });

  // Text search (name, brand, description)
  if (filters.q) {
    const q = `%${filters.q}%`;
    query = query.or(`name.ilike.${q},brand.ilike.${q},description.ilike.${q}`);
  }

  // Gender filter
  if (filters.gender) {
    query = query.eq('gender', filters.gender);
  }

  // Category slug → gender mapping (homme/femme/mixte slugs)
  if (filters.category && ['homme', 'femme', 'mixte'].includes(filters.category)) {
    query = query.eq('gender', filters.category);
  }

  // Price range
  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  // Brand filter
  if (filters.brand) {
    query = query.ilike('brand', filters.brand);
  }

  // Featured only
  if (filters.featured) {
    query = query.eq('is_featured', true);
  }

  // Promo: has an original_price (means product is on sale)
  if (filters.promo) {
    query = query.not('original_price', 'is', null);
  }

  // Sorting
  switch (filters.tri) {
    case 'prix-asc':
      query = query.order('price', { ascending: true });
      break;
    case 'prix-desc':
      query = query.order('price', { ascending: false });
      break;
    case 'nouveautes':
      query = query.order('created_at', { ascending: false });
      break;
    case 'marque':
      query = query.order('brand', { ascending: true });
      break;
    default:
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
  }

  // Pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('[getProducts]', error.message);
    return { products: [], total: 0, page, totalPages: 0 };
  }

  const total = count ?? 0;
  const products = (data ?? []).map(mapRow);

  return {
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/** Fetch a single product by slug */
export async function getProductBySlug(slug: string): Promise<(Product & { notes?: { top: string[]; heart: string[]; base: string[] }; concentration?: string; volume?: string }) | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  return {
    ...mapRow(data),
    // Extended fields if stored in a JSONB column or separate table later
    notes: (data as Record<string, unknown>).notes as { top: string[]; heart: string[]; base: string[] } | undefined,
    concentration: (data as Record<string, unknown>).concentration as string | undefined,
    volume: (data as Record<string, unknown>).volume as string | undefined,
  };
}

/** Get distinct brands for filter UI */
export async function getBrands(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .order('brand');

  if (error || !data) return [];

  return [...new Set(data.map((r) => r.brand as string))];
}

/** Count products by gender (for collection pages) */
export async function getProductCountsByGender(): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('gender');

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    const g = (row.gender as string) ?? 'autre';
    counts[g] = (counts[g] ?? 0) + 1;
  }
  return counts;
}
