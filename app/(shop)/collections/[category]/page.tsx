import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/supabase/products';
import type { Product } from '@/types/product.types';

interface PageProps {
  params: Promise<{ category: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vip-parfumerie-bar.com';

// ISR: revalidate every 5 minutes
export const revalidate = 300;

const CATEGORY_META: Record<string, { title: string; description: string; gender?: 'homme' | 'femme' | 'mixte' }> = {
  homme: {
    title: 'Parfums Homme',
    description: 'Découvrez notre sélection de parfums masculins de luxe — boisés, frais, orientaux. Livraison en Afrique.',
    gender: 'homme',
  },
  femme: {
    title: 'Parfums Femme',
    description: 'Explorez nos fragrances féminines élégantes — floraux, gourmands, orientaux. Paiement Mobile Money.',
    gender: 'femme',
  },
  mixte: {
    title: 'Parfums Mixtes',
    description: 'Des fragrances unisexes modernes qui transcendent les genres.',
    gender: 'mixte',
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORY_META[category];

  if (!meta) {
    return { title: 'Collection | VIP Parfumerie Bar' };
  }

  return {
    title: `${meta.title} | VIP Parfumerie Bar`,
    description: meta.description,
  };
}

async function getProductsByCategory(category: string): Promise<Product[]> {
  const meta = CATEGORY_META[category];
  try {
    let filters: Parameters<typeof getProducts>[0];
    if (meta?.gender) {
      filters = { gender: meta.gender, limit: 48 };
    } else if (category === 'nouveautes') {
      filters = { tri: 'nouveautes' as const, limit: 48 };
    } else {
      filters = { limit: 48 };
    }
    const { products } = await getProducts(filters);
    return products;
  } catch {
    return [];
  }
}

export default async function CategoryPage({ params }: Readonly<PageProps>) {
  const { category } = await params;
  const meta = CATEGORY_META[category];

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
      {/* Category Hero */}
      <div
        style={{ background: 'var(--noir)', padding: '4rem 0', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(197,165,90,0.08) 0%, transparent 60%)' }} aria-hidden="true" />
        <div className="container mx-auto" style={{ position: 'relative' }}>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/80">{meta.title}</span>
          </nav>
          <h1 className="heading-lg text-white" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '0.75rem' }}>{meta.title}</h1>
          <p className="text-white/70 max-w-xl text-lg">{meta.description}</p>
          <p className="mt-4 text-white/50 text-sm">{products.length} parfum{products.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Products */}
      <div className="container mx-auto py-12">
        {/* Filter shortcuts */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/collections/${category}`}
              className="px-4 py-2 rounded text-xs font-medium text-white"
              style={{ background: 'var(--noir)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              Tous
            </Link>
            <Link
              href={`/produits?gender=${meta.gender || ''}&tri=nouveautes`}
              className="px-4 py-2 rounded text-xs font-medium bg-white border border-line text-txt2 hover:border-txt2 transition-colors"
              style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              Nouveautés
            </Link>
            <Link
              href={`/produits?gender=${meta.gender || ''}&filtre=promo`}
              className="px-4 py-2 rounded text-xs font-medium bg-white border border-line text-txt2 hover:border-txt2 transition-colors"
              style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              Promotions
            </Link>
          </div>
          <Link
            href={`/produits?gender=${meta.gender || ''}`}
            style={{ fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            Filtres avancés →
          </Link>
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
                name={product.name}
                brand={product.brand}
                price={product.price}
                originalPrice={product.originalPrice ?? undefined}
                image={product.images[0] || '/images/products/product-placeholder.svg'}
                category={product.gender || 'mixte'}
                inStock={product.stockQuantity > 0}
              />
            ))}
          </div>
        )}

        {/* View all link */}
        {products.length > 0 && (
          <div className="text-center mt-12">
            <Link href={`/produits?gender=${meta.gender || ''}`} className="btn-primary inline-block">
              Voir tous les {meta.title.toLowerCase()} →
            </Link>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
