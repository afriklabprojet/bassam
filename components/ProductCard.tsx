'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { normalizeProductImage } from '@/lib/product-images';

interface ProductCardProps {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: 'homme' | 'femme' | 'mixte';
  inStock: boolean;
}

export default function ProductCard({
  id,
  name,
  brand,
  price,
  originalPrice,
  image,
  category,
  inStock,
}: Readonly<ProductCardProps>) {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const categoryLabels = {
    homme: 'Homme',
    femme: 'Femme',
    mixte: 'Mixte',
  } as const;
  const catLabel = categoryLabels[category];
  const productImage = normalizeProductImage(image);

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
            background: 'linear-gradient(to top, rgba(8,8,8,0.65) 0%, rgba(8,8,8,0.15) 35%, transparent 60%)',
            opacity: 0,
            transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 1,
          }}
        />

        {/* Hover CTA */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-center product-card-cta"
          style={{
            padding: '0 16px 20px',
            opacity: 0,
            transform: 'translateY(8px)',
            transition: 'opacity 0.35s, transform 0.35s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 3,
          }}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.6875rem',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#fff',
            padding: '9px 20px',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: '3px',
            backdropFilter: 'blur(6px)',
            background: 'rgba(255,255,255,0.08)',
            transition: 'background 0.2s, border-color 0.2s',
          }}>
            Découvrir
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
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

        {/* Price row */}
        <div className="flex items-baseline gap-2" style={{ marginTop: 8 }}>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.125rem',
            fontWeight: 500,
            color: inStock ? 'var(--text-primary)' : 'var(--text-pale)',
            letterSpacing: '-0.01em',
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
            }}>
              {originalPrice.toLocaleString('fr-FR')}
            </span>
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
