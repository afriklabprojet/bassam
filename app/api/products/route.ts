import { NextRequest, NextResponse } from 'next/server';
import type { ProductFilters } from '@/types/product.types';
import { getProducts, getBrands } from '@/lib/supabase/products';
import { logger } from '@/lib/logger';
import { CACHE_CONTROL_MEDIUM, CACHE_CONTROL_SHORT, PRODUCTS_LIST_PAGE_DEFAULT, PRODUCTS_LIST_LIMIT_DEFAULT } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category') || searchParams.get('gender') || undefined;

    // Endpoint: GET /api/products?brands=true → returns distinct brand list
    if (searchParams.get('brands') === 'true') {
      const brands = await getBrands();
      return NextResponse.json({ brands }, {
        headers: { 'Cache-Control': CACHE_CONTROL_MEDIUM },
      });
    }

    const filters: ProductFilters = {
      q: searchParams.get('q') || undefined,
      category: categoryParam as ProductFilters['category'],
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      brand: searchParams.get('brand') || undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      promo: searchParams.get('filtre') === 'promo' ? true : undefined,
      tri: (searchParams.get('tri') as ProductFilters['tri']) || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : PRODUCTS_LIST_PAGE_DEFAULT,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : PRODUCTS_LIST_LIMIT_DEFAULT,
    };

    const response = await getProducts(filters);

    return NextResponse.json(response, {
      headers: { 'Cache-Control': CACHE_CONTROL_SHORT },
    });
  } catch (error) {
    logger.error('API /products', 'Failed to load products', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des produits' },
      { status: 500 }
    );
  }
}
