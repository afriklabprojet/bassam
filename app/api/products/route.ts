import { NextRequest, NextResponse } from 'next/server';
import type { ProductFilters } from '@/types/product.types';
import { getProducts, getBrands } from '@/lib/supabase/products';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Endpoint: GET /api/products?brands=true → returns distinct brand list
    if (searchParams.get('brands') === 'true') {
      const brands = await getBrands();
      return NextResponse.json({ brands }, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      });
    }

    const filters: ProductFilters = {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      gender: (searchParams.get('gender') as ProductFilters['gender']) || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      brand: searchParams.get('brand') || undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      promo: searchParams.get('filtre') === 'promo' ? true : undefined,
      tri: (searchParams.get('tri') as ProductFilters['tri']) || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 12,
    };

    const response = await getProducts(filters);

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    logger.error('API /products', 'Failed to load products', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des produits' },
      { status: 500 }
    );
  }
}
