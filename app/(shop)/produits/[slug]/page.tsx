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
      const desc = product.description?.slice(0, 155) || `Achetez ${product.name} de ${product.brand} chez VIP Parfumerie Bar à Abidjan. Authentique, livraison Côte d'Ivoire.`;
      return {
        title: `${product.name} - ${product.brand} | VIP Parfumerie Bar Abidjan`,
        description: desc,
        keywords: `${product.name}, ${product.brand}, parfum Abidjan, acheter ${product.brand} Côte d'Ivoire, parfum luxe Afrique`,
        alternates: { canonical: `${BASE_URL}/produits/${product.slug}` },
        openGraph: {
          title: `${product.name} — ${product.brand} | VIP Parfumerie Bar`,
          description: desc,
          images: product.images[0] ? [{ url: product.images[0] }] : [],
          type: 'website',
          locale: 'fr_CI',
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
  const productLd = {
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
      seller: {
        '@type': 'Organization',
        name: 'VIP Parfumerie Bar',
        '@id': `${BASE_URL}/#organization`,
      },
      areaServed: { '@type': 'Country', name: 'Côte d\'Ivoire' },
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Produits', item: `${BASE_URL}/produits` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${BASE_URL}/produits/${product.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ProductDetailClient slug={slug} initialProduct={product} relatedProducts={relatedProducts} />
    </>
  );
}
