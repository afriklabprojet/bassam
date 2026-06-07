import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/supabase/products';
import { getPublicCategoryBySlug, getPublicCollectionBySlug } from '@/lib/supabase/taxonomies';
import type { Product } from '@/types/product.types';

interface PageProps {
  params: Promise<{ category: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vipparfumeriebar.com';

// ISR: revalidate every 5 minutes
export const revalidate = 300;

type CategoryMeta = {
  title: string;
  description: string;
  category?: string;
  collectionId?: string;
  imageUrl?: string | null;
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  homme: {
    title: 'Parfums Homme',
    description: 'Découvrez notre sélection de parfums masculins de luxe — boisés, frais, orientaux. Livraison en Afrique.',
    category: 'homme',
  },
  femme: {
    title: 'Parfums Femme',
    description: 'Explorez nos fragrances féminines élégantes — floraux, gourmands, orientaux. Paiement Mobile Money.',
    category: 'femme',
  },
  mixte: {
    title: 'Parfums Mixtes',
    description: 'Des fragrances unisexes modernes qui transcendent les genres.',
    category: 'mixte',
  },
  nouveautes: {
    title: 'Nouveautés',
    description: 'Les dernières fragrances arrivées chez VIP Parfumerie Bar.',
  },
  'soins-visage': {
    title: 'Soins Visage',
    description: 'Prenez soin de votre peau avec nos soins visage premium.',
  },
  'soins-corps': {
    title: 'Soins Corps',
    description: 'Hydratants, gommages et soins corps luxueux.',
  },
  'soins-homme': {
    title: 'Soins Homme',
    description: 'Gamme soins visage et rasage pour hommes.',
  },
};

// generateStaticParams retiré : les pages sont rendues dynamiquement (ISR via revalidate=300)
// Cela évite les timeouts Supabase au moment du build
export const dynamicParams = true;

async function resolveCategoryMeta(category: string): Promise<CategoryMeta | null> {
  const staticMeta = CATEGORY_META[category];
  if (staticMeta) {
    return staticMeta;
  }

  const dbCategory = await getPublicCategoryBySlug(category);
  if (dbCategory) {
    return {
      title: dbCategory.name,
      description: dbCategory.description ?? `Découvrez la catégorie ${dbCategory.name} chez VIP Parfumerie Bar.`,
      category: dbCategory.slug,
      imageUrl: dbCategory.image_url,
    };
  }

  // Chercher dans la table collections (collections commerciales du menu nav)
  const dbCollection = await getPublicCollectionBySlug(category);
  if (!dbCollection) {
    return null;
  }

  return {
    title: dbCollection.name,
    description: dbCollection.description ?? `Découvrez la collection ${dbCollection.name} chez VIP Parfumerie Bar.`,
    collectionId: dbCollection.id,
    imageUrl: dbCollection.image_url,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const meta = await resolveCategoryMeta(category);

  if (!meta) {
    return { title: 'Collection | VIP Parfumerie Bar' };
  }

  return {
    title: `${meta.title} | VIP Parfumerie Bar Abidjan`,
    description: meta.description,
    keywords: `${meta.title.toLowerCase()} Abidjan, ${meta.title.toLowerCase()} Côte d'Ivoire, parfum luxe ${meta.title.toLowerCase()}, acheter parfum Abidjan`,
    alternates: { canonical: `${BASE_URL}/collections/${category}` },
    openGraph: {
      title: `${meta.title} — VIP Parfumerie Bar`,
      description: meta.description,
      locale: 'fr_CI',
    },
  };
}

async function getProductsByCategory(category: string): Promise<Product[]> {
  const meta = await resolveCategoryMeta(category);
  try {
    let filters: Parameters<typeof getProducts>[0];
    if (category === 'nouveautes') {
      filters = { tri: 'nouveautes' as const, limit: 48 };
    } else if (meta?.collectionId) {
      filters = { collectionId: meta.collectionId, limit: 48 };
    } else if (meta?.category) {
      filters = { category: meta.category, limit: 48 };
    } else {
      filters = { category, limit: 48 };
    }
    const { products } = await getProducts(filters);
    return products;
  } catch {
    return [];
  }
}

export default async function CategoryPage({ params }: Readonly<PageProps>) {
  const { category } = await params;
  const meta = await resolveCategoryMeta(category);

  if (!meta) notFound();

  const products = await getProductsByCategory(category);

  // Schema.org BreadcrumbList JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: `${BASE_URL}/collections` },
      { '@type': 'ListItem', position: 3, name: meta.title, item: `${BASE_URL}/collections/${category}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div style={{ minHeight: '100vh', background: 'var(--offwhite)' }}>
      {/* Banner hero */}
      <div style={{ position: 'relative', background: 'var(--noir)', overflow: 'hidden', minHeight: meta.imageUrl ? '320px' : 'auto' }}>
        {/* Image de fond */}
        {meta.imageUrl && (
          <>
            <Image
              src={meta.imageUrl}
              alt={meta.title}
              fill
              priority
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              sizes="100vw"
            />
            {/* Overlay dégradé pour lisibilité */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.7) 100%)' }} aria-hidden="true" />
          </>
        )}
        {/* Contenu header */}
        <div className="container mx-auto" style={{ position: 'relative', zIndex: 1, padding: meta.imageUrl ? '3.5rem 0 3rem' : '1.25rem 0' }}>
          <nav className="flex items-center gap-2 text-xs text-white/50 mb-3">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/collections" className="hover:text-white transition-colors">Collections</Link>
            <span>/</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{meta.title}</span>
          </nav>
          {meta.imageUrl && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
                Collection
              </span>
              <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
            </div>
          )}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-white font-light" style={{
                fontFamily: 'var(--font-serif)',
                fontSize: meta.imageUrl ? 'clamp(2rem, 5vw, 3.5rem)' : 'clamp(1.5rem, 4vw, 2.25rem)',
                letterSpacing: '0.04em',
                lineHeight: 1.1,
              }}>{meta.title}</h1>
              {meta.imageUrl && meta.description && (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '0.75rem', maxWidth: '480px', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
                  {meta.description}
                </p>
              )}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8125rem', flexShrink: 0 }}>{products.length} produit{products.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container mx-auto" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
        {/* Filter shortcuts */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/collections/${category}`}
              className="px-3 py-1.5 rounded text-xs font-medium text-white"
              style={{ background: 'var(--noir)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              Tous
            </Link>
            <Link
              href={`/produits?category=${meta.category || ''}&tri=nouveautes`}
              className="px-3 py-1.5 rounded text-xs font-medium bg-white border border-line text-txt2 hover:border-txt2 transition-colors"
              style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              Nouveautés
            </Link>
            <Link
              href={`/produits?category=${meta.category || ''}&filtre=promo`}
              className="px-3 py-1.5 rounded text-xs font-medium bg-white border border-line text-txt2 hover:border-txt2 transition-colors"
              style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              Promotions
            </Link>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-txt2 text-lg">Aucun produit dans cette collection pour le moment.</p>
            <Link href="/produits" className="btn-primary mt-6 inline-block">
              Voir tous les parfums
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.slug}
                productId={product.id}
                name={product.name}
                brand={product.brand}
                price={product.price}
                originalPrice={product.originalPrice ?? undefined}
                image={product.images[0] || '/images/products/product-placeholder.svg'}
                category={product.category || 'mixte'}
                inStock={product.stockQuantity > 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
