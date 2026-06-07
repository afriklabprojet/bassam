'use client';

import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { shouldBypassNextImageOptimization } from '@/lib/image-optimization';
import { normalizeProductImage } from '@/lib/product-images';
import { useCart } from '@/lib/cart-context';

interface ProductCardProps {
  id: string;
  productId?: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  inStock: boolean;
}

export default function ProductCard({
  id,
  productId,
  name,
  brand,
  price,
  originalPrice,
  image,
  category,
  inStock,
}: Readonly<ProductCardProps>) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const categoryLabels: Record<string, string> = {
    homme: 'Homme',
    femme: 'Femme',
    mixte: 'Mixte',
  };
  const catLabel = categoryLabels[category] ?? category.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const productImage = normalizeProductImage(image);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || added) return;
    addItem({
      id: `${productId ?? id}-${Date.now()}`,
      productId: productId ?? id,
      name,
      brand,
      price,
      image: productImage,
      slug: id,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [inStock, added, addItem, productId, id, name, brand, price, productImage]);

  return (
    <Link
      href={`/produits/${id}`}
      className="group block product-card-premium"
      style={{ textDecoration: 'none' }}
    >
      {/* ── Image area ── */}
      <div
        className="product-card-image relative overflow-hidden"
        style={{
          aspectRatio: '3/4',
          background: 'var(--offwhite)',
          borderRadius: '8px',
          position: 'relative',
        }}
      >
        <Image
          src={productImage}
          alt={`${brand} ${name}`}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized={shouldBypassNextImageOptimization(productImage)}
        />

        {/* Badges */}
        {(discount > 0 || !inStock) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5" style={{ zIndex: 2 }}>
            {discount > 0 && (
              <span style={{
                background: 'var(--noir)',
                color: 'var(--gold)',
                fontSize: '0.625rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                padding: '4px 10px',
                borderRadius: '2px',
                border: '1px solid rgba(197,165,90,0.3)',
              }}>
                -{discount}%
              </span>
            )}
            {!inStock && (
              <span style={{
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)',
                color: 'rgba(255,255,255,0.65)',
                fontSize: '0.625rem',
                fontWeight: 500,
                letterSpacing: '0.08em',
                padding: '4px 10px',
                borderRadius: '2px',
                textTransform: 'uppercase',
              }}>
                Épuisé
              </span>
            )}
          </div>
        )}

        {/* Category badge top-right */}
        <span
          className="absolute top-3 right-3 product-card-badge"
          style={{
            fontSize: '0.5625rem',
            fontWeight: 500,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(6px)',
            padding: '3px 8px',
            borderRadius: '2px',
            opacity: 0,
            transition: 'opacity 0.3s',
            zIndex: 2,
          }}
        >
          {catLabel}
        </span>

        {/* Hover gradient overlay */}
        <div
          className="absolute inset-0 product-card-overlay"
          style={{
            background: 'linear-gradient(to top, rgba(8,8,8,0.72) 0%, rgba(8,8,8,0.15) 40%, transparent 65%)',
            opacity: 0,
            transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 1,
          }}
        />

        {/* Hover CTA — bottom zone */}
        <div
          className="absolute inset-x-0 bottom-0 product-card-cta"
          style={{
            padding: '0 12px 14px',
            opacity: 0,
            transform: 'translateY(6px)',
            transition: 'opacity 0.35s, transform 0.35s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
          }}
        >
          {/* Bouton Ajouter au panier */}
          {inStock && (
            <button
              type="button"
              onClick={handleAddToCart}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
                height: 38,
                background: added ? 'rgba(34,197,94,0.85)' : 'var(--gold)',
                color: added ? '#fff' : 'var(--noir)',
                border: 'none',
                borderRadius: '3px',
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background 0.25s',
                backdropFilter: 'blur(6px)',
              }}
            >
              {added ? (
                <>
                  <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Ajouté
                </>
              ) : (
                <>
                  <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                  Ajouter au panier
                </>
              )}
            </button>
          )}

          {/* Lien Découvrir */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: '0.6875rem',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#fff',
            padding: '8px 20px',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '3px',
            backdropFilter: 'blur(6px)',
            background: 'rgba(255,255,255,0.06)',
          }}>
            Voir le produit
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </span>
        </div>
      </div>

      {/* ── Info ── */}
      <div style={{ paddingTop: 16 }}>
        {/* Brand */}
        <p style={{
          fontSize: '0.625rem',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--gold-dark)',
          marginBottom: 4,
        }}>
          {brand}
        </p>

        {/* Name */}
        <h3
          className="product-card-name"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.0625rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            transition: 'color 0.25s',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </h3>

        {/* Price row + mobile CTA */}
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div className="flex items-baseline gap-2" style={{ minWidth: 0 }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.125rem',
              fontWeight: 500,
              color: inStock ? 'var(--text-primary)' : 'var(--text-pale)',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}>
              {price.toLocaleString('fr-FR')}{' '}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                FCFA
              </span>
            </span>
            {originalPrice && (
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-pale)',
                textDecoration: 'line-through',
                textDecorationColor: 'rgba(197,165,90,0.4)',
                whiteSpace: 'nowrap',
              }}>
                {originalPrice.toLocaleString('fr-FR')}
              </span>
            )}
          </div>

          {/* Bouton + visible sur mobile (hover: none) — caché sur desktop */}
          {inStock && (
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={added ? 'Ajouté au panier' : `Ajouter ${name} au panier`}
              className="product-card-mobile-cta"
              style={{
                flexShrink: 0,
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: `1.5px solid ${added ? 'transparent' : 'var(--gold)'}`,
                background: added ? 'var(--gold)' : 'transparent',
                color: added ? '#fff' : 'var(--gold)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.25s, color 0.25s, border-color 0.25s',
              }}
            >
              {added ? (
                <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Gold underline reveal on hover */}
        <div
          className="product-card-underline"
          style={{
            height: 1,
            marginTop: 12,
            background: 'linear-gradient(90deg, var(--gold) 0%, transparent 100%)',
            transform: 'scaleX(0)',
            transformOrigin: 'left',
            transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
