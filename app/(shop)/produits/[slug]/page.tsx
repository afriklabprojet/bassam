import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/supabase/products';
import type { Product } from '@/types/product.types';
import ProductDetailClient from './ProductDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vip-parfumerie-bar.com';

export const dynamic = 'force-dynamic';

async function getRelatedProducts(product: Product): Promise<Product[]> {
  const relatedProducts: Product[] = [];
  const seenIds = new Set([product.id]);

  const appendUnique = (products: Product[]) => {
    for (const candidate of products) {
      if (seenIds.has(candidate.id)) continue;
      seenIds.add(candidate.id);
      relatedProducts.push(candidate);
      if (relatedProducts.length >= 4) break;
    }
  };

  if (product.gender) {
    const sameGender = await getProducts({ gender: product.gender, limit: 8 });
    appendUnique(sameGender.products);
  }

  if (relatedProducts.length < 4) {
    const featured = await getProducts({ featured: true, limit: 8 });
    appendUnique(featured.products);
  }

  if (relatedProducts.length < 4) {
    const latest = await getProducts({ tri: 'nouveautes', limit: 8 });
    appendUnique(latest.products);
  }

  return relatedProducts.slice(0, 4);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getProductBySlug(slug);
    if (product) {
      return {
        title: `${product.name} - ${product.brand} | VIP Parfumerie Bar`,
        description: product.description?.slice(0, 160) || `Achetez ${product.name} de ${product.brand} chez VIP Parfumerie Bar. Livraison rapide en Afrique.`,
        openGraph: {
          title: `${product.name} - ${product.brand}`,
          description: product.description?.slice(0, 160) || `Parfum de luxe authentique. Livraison en Afrique de l'Ouest.`,
          images: product.images[0] ? [{ url: product.images[0] }] : [],
          type: 'website',
        },
      };
    }
  } catch {
    // fallback
  }

  return {
    title: 'Produit | VIP Parfumerie Bar',
    description: 'Découvrez nos parfums de luxe authentiques chez VIP Parfumerie Bar.',
  };
}

export default async function ProductPage({ params }: Readonly<PageProps>) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // Hard 404 for unknown slugs
  if (product === null) notFound();

  const relatedProducts = await getRelatedProducts(product);

  // Schema.org JSON-LD — Product
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    description: product.description ?? undefined,
    image: product.images,
    url: `${BASE_URL}/produits/${product.slug}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'XOF',
      price: product.price,
      availability: product.stockQuantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'VIP Parfumerie Bar' },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient slug={slug} initialProduct={product} relatedProducts={relatedProducts} />
    </>
  );
}
