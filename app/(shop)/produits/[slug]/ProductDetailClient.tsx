'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import ProductGallery from '@/components/ProductGallery';
import OlfactoryPyramid from '@/components/OlfactoryPyramid';
import AddToCartCTA from '@/components/AddToCartCTA';
import { buildWhatsAppHref, hasWhatsAppSupport } from '@/lib/site-config';
import type { Product } from '@/types/product.types';

type ProductDetail = Product & {
  notes?: { top: string[]; heart: string[]; base: string[] };
  concentration?: string;
  volume?: string;
};

interface ProductDetailClientProps {
  slug: string;
  initialProduct?: ProductDetail | null;
}

function getTabLabel(tab: string): string {
  if (tab === 'notes') return 'Notes olfactives';
  if (tab === 'details') return 'Détails';
  return 'Description';
}

export default function ProductDetailClient({ slug, initialProduct }: Readonly<ProductDetailClientProps>) {
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(initialProduct ?? null);
  const [loading, setLoading] = useState(!initialProduct);
  const [activeTab, setActiveTab] = useState<'description' | 'notes' | 'details'>('description');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const hasWhatsappSupport = hasWhatsAppSupport();

  useEffect(() => {
    // Skip client fetch if data was pre-loaded by the server
    if (initialProduct !== undefined) return;
    async function load() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) { setProduct(null); return; }
        const data = await res.json();
        setProduct(data);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, initialProduct]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.images[0] || '/images/products/product-placeholder.svg',
        slug: product.slug,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/commande');
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(p);

  if (loading) {
    return (
      <div
        className="scroll-reveal"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '3px solid var(--line-light)',
            borderTopColor: 'var(--gold)',
            animation: 'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          }}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center"
        style={{ background: 'var(--surface)' }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--gold-muted)',
            border: '2px solid var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
          }}
        >
          🔍
        </div>
        <h1
          className="heading-lg"
          style={{ fontSize: '1.75rem', marginTop: '1rem' }}
        >
          Produit introuvable
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
          Ce parfum n&rsquo;existe pas ou a été retiré de notre catalogue.
        </p>
        <Link href="/produits" className="btn-gold-animated">
          Découvrir nos parfums
        </Link>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Breadcrumb premium */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--offwhite) 0%, var(--surface) 100%)',
          borderBottom: '1px solid var(--line-light)',
        }}
      >
        <div className="container mx-auto py-4">
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8125rem',
              color: 'var(--text-pale)',
              letterSpacing: '0.04em',
            }}
            aria-label="Fil d'ariane"
          >
            <Link
              href="/"
              className="breadcrumb-link"
              style={{
                color: 'var(--text-pale)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              Accueil
            </Link>
            <span style={{ color: 'var(--gold)', opacity: 0.5 }}>/</span>
            <Link
              href="/produits"
              className="breadcrumb-link"
              style={{
                color: 'var(--text-pale)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
            >
              Parfums
            </Link>
            {product.gender && (
              <>
                <span style={{ color: 'var(--gold)', opacity: 0.5 }}>/</span>
                <Link
                  href={`/collections/${product.gender}`}
                  className="breadcrumb-link"
                  style={{
                    color: 'var(--text-pale)',
                    textDecoration: 'none',
                    textTransform: 'capitalize',
                    transition: 'color 0.2s',
                  }}
                >
                  {product.gender}
                </Link>
              </>
            )}
            <span style={{ color: 'var(--gold)', opacity: 0.5 }}>/</span>
            <span
              style={{
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '30ch',
              }}
            >
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main product section */}
      <section className="container mx-auto py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: Gallery premium */}
          <div className="scroll-reveal">
            <ProductGallery
              images={product.images}
              productName={product.name}
              brand={product.brand}
              discount={discount}
            />
          </div>

          {/* Right: Product info */}
          <div className="scroll-reveal">
            {/* Brand label */}
            <p
              className="eyebrow"
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                marginBottom: '0.625rem',
              }}
            >
              {product.brand}
            </p>

            {/* Product name */}
            <h1
              className="heading-lg"
              style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                marginBottom: '1rem',
                lineHeight: 1.1,
                color: 'var(--text-primary)',
              }}
            >
              {product.name}
            </h1>

            {/* Concentration + Volume */}
            {product.concentration && (
              <p
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1.5rem',
                  letterSpacing: '0.02em',
                }}
              >
                {product.concentration}
                {product.volume && ` — ${product.volume}`}
              </p>
            )}

            {/* Price premium */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '1rem',
                marginBottom: '2rem',
                paddingBottom: '2rem',
                borderBottom: '1px solid var(--line-light)',
              }}
            >
              <span
                className="heading-lg"
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span
                    style={{
                      fontSize: '1.25rem',
                      color: 'var(--text-pale)',
                      textDecoration: 'line-through',
                    }}
                  >
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--gold)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Économisez {discount}%
                  </span>
                </div>
              )}
            </div>

            {/* Stock status premium */}
            <div
              className="flex items-center gap-3 mb-8"
              style={{
                background: product.stockQuantity > 0 ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                borderRadius: 'var(--r-md)',
                padding: '1rem 1.25rem',
                border: `1px solid ${product.stockQuantity > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              }}
            >
              {product.stockQuantity > 0 ? (
                <>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: 'rgba(34,180,70,0.9)',
                      boxShadow: '0 0 8px rgba(34,180,70,0.35)',
                    }}
                  />
                  <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'rgba(20,130,50,0.9)' }}>
                    En stock — Expédition sous 24h
                  </span>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: 'rgba(180,40,40,0.8)',
                      boxShadow: '0 0 8px rgba(180,40,40,0.3)',
                    }}
                  />
                  <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'rgba(160,20,20,0.9)' }}>
                    Rupture de stock
                  </span>
                </>
              )}
            </div>

            {/* CTA premium */}
            {product.stockQuantity > 0 && (
              <AddToCartCTA
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                quantity={quantity}
                onQuantityChange={setQuantity}
                stockQuantity={product.stockQuantity}
                price={product.price}
                isAdded={added}
              />
            )}

            {/* Advantages grid premium */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                marginTop: '3rem',
                marginBottom: '2rem',
              }}
            >
              {[
                { icon: '🚚', text: 'Livraison rapide', sub: '24-48h' },
                { icon: '💳', text: 'Paiement sécurisé', sub: 'Mobile Money & CB' },
                { icon: '🤝', text: 'Paiement à réception', sub: 'Sans engagement' },
                { icon: '↩️', text: 'Retour gratuit', sub: '7 jours' },
              ].map((item) => (
                <div
                  key={item.text}
                  className="advantage-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    background: 'var(--offwhite)',
                    borderRadius: 'var(--r-md)',
                    padding: '1rem',
                    border: '1px solid var(--line-light)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{item.icon}</span>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.125rem', lineHeight: 1.3 }}>
                    {item.text}
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', lineHeight: 1.2 }}>
                    {item.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA premium */}
            {hasWhatsappSupport ? (
              <a
                href={buildWhatsAppHref(`Bonjour! Je suis intéressé(e) par ${product.name} de ${product.brand}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-cta"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '1rem 1.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  border: '2px solid var(--line-light)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span>Questions ? Contactez-nous sur WhatsApp</span>
              </a>
            ) : (
              <Link
                href="/contact"
                className="whatsapp-cta"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '1rem 1.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  border: '2px solid var(--line-light)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <span>Besoin d’aide ? Contactez-nous</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Tabs section premium */}
      <section
        className="container mx-auto py-12"
        style={{
          borderTop: '1px solid var(--line-light)',
        }}
      >
        {/* Tabs navigation */}
        <div
          style={{
            display: 'flex',
            gap: '2.5rem',
            borderBottom: '2px solid var(--line-light)',
            marginBottom: '3rem',
          }}
        >
          {(['description', 'notes', 'details'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="tab-button"
              style={{
                paddingBottom: '1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                borderBottom:
                  activeTab === tab ? '3px solid var(--gold)' : '3px solid transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: '-2px',
              }}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="tab-content">
          {activeTab === 'description' && (
            <div
              className="max-w-3xl scroll-reveal"
              style={{
                fontSize: '1.0625rem',
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
              }}
            >
              <p style={{ marginBottom: '1.5rem' }}>
                {product.description || 'Description non disponible pour ce produit.'}
              </p>
            </div>
          )}

          {activeTab === 'notes' && 'notes' in product && product.notes && (
            <div className="scroll-reveal">
              <OlfactoryPyramid notes={product.notes} />
            </div>
          )}

          {activeTab === 'details' && (
            <div className="max-w-2xl scroll-reveal">
              <dl style={{ display: 'grid', gap: '0' }}>
                {[
                  { label: 'Marque', value: product.brand },
                  { label: 'Concentration', value: (product as { concentration?: string }).concentration || '—' },
                  { label: 'Volume', value: (product as { volume?: string }).volume || '—' },
                  {
                    label: 'Genre',
                    value: product.gender
                      ? product.gender.charAt(0).toUpperCase() + product.gender.slice(1)
                      : '—',
                  },
                  { label: 'Référence', value: product.id },
                ].map(({ label, value }, idx) => (
                  <div
                    key={label}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '200px 1fr',
                      gap: '2rem',
                      padding: '1.25rem 0',
                      borderBottom: idx < 4 ? '1px solid var(--line-light)' : 'none',
                    }}
                  >
                    <dt
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-pale)',
                        fontWeight: 400,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {label}
                    </dt>
                    <dd
                      style={{
                        fontSize: '0.9375rem',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .breadcrumb-link:hover {
          color: var(--gold) !important;
        }

        .advantage-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08), 0 0 16px rgba(197, 165, 90, 0.12);
          border-color: var(--gold);
        }

        .whatsapp-cta:hover {
          border-color: var(--gold);
          background: var(--gold-muted);
          color: var(--text-primary);
        }

        .tab-button:hover {
          color: var(--gold);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
