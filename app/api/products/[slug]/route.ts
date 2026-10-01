import { NextRequest, NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/supabase/products';
import { logger } from '@/lib/logger';
import { CACHE_CONTROL_MEDIUM } from '@/lib/constants';

// GET /api/products/[slug]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
    }

    return NextResponse.json(product, {
      headers: { 'Cache-Control': CACHE_CONTROL_MEDIUM },
    });
  } catch (error) {
    logger.error('API /products/slug', 'Failed to load product', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du produit' },
      { status: 500 }
    );
  }
}
