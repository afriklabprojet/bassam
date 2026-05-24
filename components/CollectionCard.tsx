import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { shouldBypassNextImageOptimization } from '@/lib/image-optimization';

interface CollectionCardProps {
  name: string;
  description: string;
  image: string;
  slug: string;
  productsCount: number;
}

export default function CollectionCard({
  name,
  description,
  image,
  slug,
  productsCount,
}: CollectionCardProps) {
  return (
    <Link
      href={`/collections/${slug}`}
      className="group block relative overflow-hidden collection-card-premium"
      style={{
        borderRadius: '4px',
        textDecoration: 'none',
      }}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '4/5' }}
      >
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized={shouldBypassNextImageOptimization(image)}
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background:
              'linear-gradient(to top, rgba(8,8,8,0.85) 0%, rgba(8,8,8,0.35) 35%, rgba(8,8,8,0.08) 65%, transparent 100%)',
          }}
        />
        {/* Gold line top */}
        <div
          className="collection-card-line"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
            transform: 'scaleX(0)',
            transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* Content — pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0" style={{ padding: '2rem' }}>
        {/* Product count */}
        <p style={{
          fontSize: '0.6rem',
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          marginBottom: '0.5rem',
        }}>
          {productsCount} produits
        </p>

        {/* Name */}
        <h3
          className="collection-card-name"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
            fontWeight: 300,
            color: '#fff',
            marginBottom: '0.375rem',
            lineHeight: 1.2,
            transition: 'color 0.3s',
          }}
        >
          {name}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 300,
            lineHeight: 1.6,
            marginBottom: '1.25rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </p>

        {/* Arrow CTA */}
        <div
          className="collection-card-cta flex items-center gap-2"
          style={{
            fontSize: '0.65rem',
            fontWeight: 500,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
            transition: 'color 0.3s, gap 0.3s',
          }}
        >
          <span>Découvrir</span>
          <svg
            className="collection-card-arrow"
            width={14}
            height={14}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            style={{ transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
