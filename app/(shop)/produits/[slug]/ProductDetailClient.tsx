'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import ProductGallery from '@/components/ProductGallery';
import OlfactoryPyramid from '@/components/OlfactoryPyramid';
import AddToCartCTA from '@/components/AddToCartCTA';
import ProductCard from '@/components/ProductCard';
import { buildWhatsAppHref, hasWhatsAppSupport } from '@/lib/site-config';
import { normalizeProductImage } from '@/lib/product-images';
import type { Product } from '@/types/product.types';

type ProductDetail = Product & {
  notes?: { top: string[]; heart: string[]; base: string[] };
  concentration?: string;
  volume?: string;
};

interface ProductDetailClientProps {
  slug: string;
  initialProduct?: ProductDetail | null;
  relatedProducts?: Product[];
}

function getTabLabel(tab: string): string {
  if (tab === 'notes') return 'Notes olfactives';
  if (tab === 'details') return 'Détails';
  return 'Description';
}

function getGenderLabel(gender: Product['gender']): string {
  if (gender === 'homme') return 'Homme';
  if (gender === 'femme') return 'Femme';
  if (gender === 'mixte') return 'Mixte';
  return 'Signature';
}

function getNotePreview(product: ProductDetail): string[] {
  const notes = product.notes;
  if (!notes) return [];

  return [...notes.top, ...notes.heart, ...notes.base].filter(Boolean).slice(0, 5);
}

export default function ProductDetailClient({
  slug,
  initialProduct,
  relatedProducts = [],
}: Readonly<ProductDetailClientProps>) {
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
        image: normalizeProductImage(product.images[0]),
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
  const notePreview = getNotePreview(product);
  const profileItems = [
    { label: 'Univers', value: getGenderLabel(product.gender) },
    { label: 'Concentration', value: product.concentration ?? 'Eau de parfum' },
    { label: 'Format', value: product.volume ?? 'Flacon signature' },
  ];
  const purchaseBenefits = [
    { label: 'Authenticité', value: 'Produit vérifié avant expédition' },
    { label: 'Livraison', value: '24h à Abidjan selon disponibilité' },
    { label: 'Paiement', value: 'Orange Money, MTN, Wave, Moov, Djamo' },
    { label: 'Conseil', value: 'Assistance WhatsApp avant achat' },
  ];

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
                marginBottom: '0.75rem',
                lineHeight: 1.1,
                color: 'var(--text-primary)',
              }}
            >
              {product.name}
            </h1>

            <p
              style={{
                maxWidth: '40rem',
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                lineHeight: 1.75,
                marginBottom: '1.5rem',
              }}
            >
              {product.description || 'Une fragrance sélectionnée pour son équilibre, sa tenue et son caractère.'}
            </p>

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

            <div
              className="product-profile-card"
              style={{
                display: 'grid',
                gap: '1rem',
                padding: '1.25rem',
                marginBottom: '2rem',
                background: '#fff',
                border: '1px solid var(--line-light)',
                borderRadius: 'var(--r-md)',
                boxShadow: '0 14px 35px rgba(0,0,0,0.04)',
              }}
            >
              <div className="product-profile-grid">
                {profileItems.map((item) => (
                  <div key={item.label}>
                    <p className="product-profile-label">{item.label}</p>
                    <p className="product-profile-value">{item.value}</p>
                  </div>
                ))}
              </div>
              {notePreview.length > 0 && (
                <div style={{ borderTop: '1px solid var(--line-light)', paddingTop: '1rem' }}>
                  <p className="product-profile-label" style={{ marginBottom: '0.625rem' }}>
                    Notes clés
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {notePreview.map((note) => (
                      <span key={note} className="product-note-chip">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
              <div className="purchase-panel">
                <AddToCartCTA
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  stockQuantity={product.stockQuantity}
                  price={product.price}
                  isAdded={added}
                />
              </div>
            )}

            <div className="purchase-benefits-grid" aria-label="Garanties d'achat">
              {purchaseBenefits.map((benefit) => (
                <div key={benefit.label} className="purchase-benefit-card">
                  <p className="purchase-benefit-label">{benefit.label}</p>
                  <p className="purchase-benefit-value">{benefit.value}</p>
                </div>
              ))}
            </div>

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
                borderWidth: 0,
                borderBottomWidth: '3px',
                borderBottomStyle: 'solid',
                borderBottomColor: activeTab === tab ? 'var(--gold)' : 'transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: 'none',
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

      {relatedProducts.length > 0 && (
        <section
          className="container mx-auto py-12 lg:py-16 related-products-section"
          aria-labelledby="related-products-title"
        >
          <div className="related-products-header">
            <div>
              <p className="eyebrow related-products-eyebrow">Sélection VIP</p>
              <h2 id="related-products-title" className="heading-lg related-products-title">
                Vous aimerez peut-être aussi
              </h2>
              <p className="related-products-copy">
                Des parfums choisis dans le même esprit pour comparer les signatures, les notes et les occasions.
              </p>
            </div>
            <Link href="/produits" className="related-products-link">
              Voir tout le catalogue
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
              </svg>
            </Link>
          </div>

          <div className="related-products-grid">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                id={relatedProduct.slug}
                name={relatedProduct.name}
                brand={relatedProduct.brand}
                price={relatedProduct.price}
                originalPrice={relatedProduct.originalPrice ?? undefined}
                image={relatedProduct.images[0] || '/images/products/product-placeholder.svg'}
                category={relatedProduct.gender ?? 'mixte'}
                inStock={relatedProduct.stockQuantity > 0}
              />
            ))}
          </div>
        </section>
      )}

      {product.stockQuantity > 0 && (
        <div className="mobile-product-bar" aria-label="Achat rapide">
          <div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', lineHeight: 1 }}>
              {product.brand}
            </p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {formatPrice(product.price)}
            </p>
          </div>
          <button type="button" onClick={handleAddToCart} className="mobile-product-bar-button">
            {added ? 'Ajouté' : 'Ajouter'}
          </button>
        </div>
      )}

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

        .related-products-section {
          border-top: 1px solid var(--line-light);
        }

        .related-products-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .related-products-eyebrow {
          margin-bottom: 0.75rem;
          color: var(--gold);
        }

        .related-products-title {
          margin: 0;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          color: var(--text-primary);
        }

        .related-products-copy {
          max-width: 42rem;
          margin-top: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.975rem;
          line-height: 1.7;
        }

        .related-products-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          flex: 0 0 auto;
          min-height: 2.75rem;
          padding: 0 1rem;
          border: 1px solid var(--line-light);
          border-radius: var(--r-sm);
          color: var(--text-primary);
          text-decoration: none;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: border-color 0.25s, color 0.25s, background 0.25s;
        }

        .related-products-link:hover {
          border-color: var(--gold);
          background: var(--gold-muted);
          color: var(--gold-dark);
        }

        .related-products-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1.5rem;
        }

        .product-profile-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }

        .product-profile-label,
        .purchase-benefit-label {
          margin: 0 0 0.25rem;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--gold-dark);
        }

        .product-profile-value,
        .purchase-benefit-value {
          margin: 0;
          color: var(--text-primary);
          font-size: 0.9rem;
          line-height: 1.45;
        }

        .product-note-chip {
          display: inline-flex;
          align-items: center;
          min-height: 2rem;
          padding: 0.35rem 0.75rem;
          border: 1px solid var(--line-light);
          border-radius: 999px;
          background: var(--offwhite);
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .purchase-panel {
          padding: 1.25rem;
          background: #fff;
          border: 1px solid var(--line-light);
          border-radius: var(--r-md);
          box-shadow: 0 18px 45px rgba(0,0,0,0.06);
        }

        .purchase-benefits-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
          margin-bottom: 2rem;
        }

        .purchase-benefit-card {
          min-height: 6rem;
          padding: 1rem;
          background: #fff;
          border: 1px solid var(--line-light);
          border-radius: var(--r-md);
        }

        .mobile-product-bar {
          display: none;
        }

        .mobile-product-bar-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 8.5rem;
          min-height: 2.75rem;
          padding: 0 1rem;
          border: 1px solid var(--gold);
          border-radius: var(--r-sm);
          background: var(--gold);
          color: var(--noir);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        @media (max-width: 767px) {
          .related-products-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 1.25rem;
          }

          .related-products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1rem;
          }

          .product-profile-grid,
          .purchase-benefits-grid {
            grid-template-columns: 1fr;
          }

          .mobile-product-bar {
            position: fixed;
            left: 0.75rem;
            right: 0.75rem;
            bottom: 5rem;
            z-index: 40;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 0.75rem;
            background: rgba(255,255,255,0.96);
            border: 1px solid var(--line-light);
            border-radius: var(--r-md);
            box-shadow: 0 18px 50px rgba(0,0,0,0.14);
            backdrop-filter: blur(14px);
          }
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
