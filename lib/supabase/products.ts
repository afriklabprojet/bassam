import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './server';
import type { Product, ProductFilters, ProductsResponse } from '@/types/product.types';
import { logger } from '@/lib/logger';

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
    collectionId: (row.collection_id as string) ?? null,
    collectionName: (row.collections as { name: string } | null)?.name ?? null,
    category: (row.category as Product['category']) ?? null,
    stockQuantity: Number(row.stock_quantity ?? 0),
    isFeatured: Boolean(row.is_featured),
    images: (row.images as string[]) ?? [],
    createdAt: row.created_at as string,
    notes: (row.notes as { top: string[]; heart: string[]; base: string[] } | null) ?? null,
    concentration: (row.concentration as string) ?? null,
    volume: (row.volume as string) ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any, any>;

type ProductsFallbackReason = 'empty-primary' | 'primary-error';

type ProductsFallbackContext = {
  reason: ProductsFallbackReason;
  tri: ProductFilters['tri'] | null;
  category: string | null;
  brand: string | null;
  featured: boolean;
  promo: boolean;
  hasSearchQuery: boolean;
  page: number;
  limit: number;
  errorMessage?: string;
};

function createFallbackContext(
  filters: ProductFilters,
  reason: ProductsFallbackReason,
  errorMessage?: string
): ProductsFallbackContext {
  return {
    reason,
    tri: filters.tri ?? null,
    category: filters.category ?? null,
    brand: filters.brand ?? null,
    featured: Boolean(filters.featured),
    promo: Boolean(filters.promo),
    hasSearchQuery: Boolean(filters.q && filters.q.trim().length > 0),
    page: Math.max(1, filters.page ?? 1),
    limit: Math.min(48, Math.max(1, filters.limit ?? 12)),
    errorMessage,
  };
}

function logProductsFallback(context: ProductsFallbackContext) {
  // Production observability by default; enable locally with DEBUG_PRODUCTS_FALLBACK=true.
  if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_PRODUCTS_FALLBACK !== 'true') {
    return;
  }

  logger.warn('products', 'Fallback triggered');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyProductFilters(query: any, filters: ProductFilters) {
  // Text search (name, brand, description)
  if (filters.q) {
    const q = `%${filters.q}%`;
    query = query.or(`name.ilike.${q},brand.ilike.${q},description.ilike.${q}`);
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.collectionId) {
    query = query.eq('collection_id', filters.collectionId);
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

  return query;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyProductSorting(query: any, tri: ProductFilters['tri']) {
  switch (tri) {
    case 'prix-asc':
      return query.order('price', { ascending: true });
    case 'prix-desc':
      return query.order('price', { ascending: false });
    case 'nouveautes':
      return query.order('created_at', { ascending: false });
    case 'marque':
      return query.order('brand', { ascending: true });
    default:
      return query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
  }
}

async function runProductsQuery(supabase: AnySupabaseClient, filters: ProductFilters): Promise<ProductsResponse> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(48, Math.max(1, filters.limit ?? 12));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('products')
    .select('*, collections(name)', { count: 'exact' });

  query = applyProductFilters(query, filters);
  query = applyProductSorting(query, filters.tri);
  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw error;
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

async function tryServiceProductsQuery(filters: ProductFilters): Promise<ProductsResponse | null> {
  try {
    const { createServiceClient } = await import('./service');
    const serviceClient = createServiceClient();
    return await runProductsQuery(serviceClient, filters);
  } catch {
    return null;
  }
}

/** Fetch products list with server-side filtering, sorting and pagination */
export async function getProducts(filters: ProductFilters): Promise<ProductsResponse> {
  try {
    const supabase = await createClient();
    const primary = await runProductsQuery(supabase, filters);

    // If anon/RLS path returns an empty payload, try a trusted server fallback.
    if (primary.total === 0) {
      const serviceResult = await tryServiceProductsQuery(filters);
      if (serviceResult && serviceResult.total > 0) {
        logProductsFallback(createFallbackContext(filters, 'empty-primary'));
        return serviceResult;
      }
    }

    return primary;
  } catch (error) {
    logger.warn('products', 'Primary query failed, trying service fallback');
    const serviceResult = await tryServiceProductsQuery(filters);
    if (serviceResult) {
      logProductsFallback(
        createFallbackContext(
          filters,
          'primary-error',
          error instanceof Error ? error.message : 'unknown error'
        )
      );
      return serviceResult;
    }

    return { products: [], total: 0, page: Math.max(1, filters.page ?? 1), totalPages: 0 };
  }
}

/** Fetch a single product by slug */
export async function getProductBySlug(slug: string): Promise<(Product & { notes?: { top: string[]; heart: string[]; base: string[] }; concentration?: string; volume?: string }) | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*, collections(name)')
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

/** Count products by category (for collection pages) */
export async function getProductCountsByCategory(): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('category');

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    const category = (row.category as string) ?? 'autre';
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
}
