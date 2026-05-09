'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  brand: string;
  discount?: number;
}

/**
 * Galerie produit immersive avec :
 * - Thumbnails cliquables
 * - Zoom fullscreen
 * - Rotation 3D au hover
 * - Animations fluides
 */
export default function ProductGallery({ images, productName, brand, discount }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const activeImage = images[activeIndex] || '/images/products/product-placeholder.svg';

  const openFullscreen = () => {
    setIsFullscreen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = '';
  };

  return (
    <>
      {/* Main gallery */}
      <div className="product-gallery">
        {/* Image principale avec 3D hover */}
        <div
          className={`relative overflow-hidden ${isRotating ? 'rotating-3d' : ''}`}
          style={{
            aspectRatio: '3/4',
            borderRadius: 'var(--r-md)',
            background: 'var(--offwhite)',
            border: '1px solid var(--line-light)',
            marginBottom: '1rem',
            cursor: 'zoom-in',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onClick={openFullscreen}
          onMouseEnter={() => setIsRotating(true)}
          onMouseLeave={() => setIsRotating(false)}
        >
          <Image
            src={activeImage}
            alt={`${brand} ${productName}`}
            fill
            className="object-cover transition-transform duration-700"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={activeIndex === 0}
          />

          {/* Badge promo */}
          {discount && discount > 0 && (
            <div
              className="absolute top-4 left-4 animate-fade-up"
              style={{ animation: 'fade-up 0.6s ease forwards' }}
            >
              <span
                style={{
                  background: 'var(--gold)',
                  color: 'var(--noir)',
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  borderRadius: 'var(--r-sm)',
                  boxShadow: '0 4px 12px rgba(197,165,90,0.3)',
                }}
              >
                -{discount}%
              </span>
            </div>
          )}

          {/* Zoom indicator */}
          <div
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: 'var(--r-sm)',
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            ZOOM
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className="thumbnail-btn"
                style={{
                  width: '80px',
                  height: '80px',
                  flexShrink: 0,
                  borderRadius: 'var(--r-sm)',
                  overflow: 'hidden',
                  border: `2px solid ${i === activeIndex ? 'var(--gold)' : 'var(--line-light)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: i === activeIndex ? 1 : 0.6,
                  transform: i === activeIndex ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <Image
                  src={img}
                  alt={`Vue ${i + 1}`}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-up"
          style={{
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={closeFullscreen}
        >
          {/* Close button */}
          <button
            onClick={closeFullscreen}
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
            className="hover:bg-white/20"
            aria-label="Fermer"
          >
            ×
          </button>

          {/* Image fullscreen */}
          <div
            className="relative max-w-5xl max-h-[90vh] aspect-3/4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeImage}
              alt={`${brand} ${productName}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i - 1 + images.length) % images.length);
                }}
                className="absolute left-8 top-1/2 -translate-y-1/2"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                }}
              >
                ←
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i + 1) % images.length);
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                }}
              >
                →
              </button>
            </>
          )}

          {/* Counter */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 'var(--r-md)',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      )}

      <style jsx>{`
        .product-gallery:hover .rotating-3d {
          transform: perspective(1000px) rotateY(5deg);
        }

        .thumbnail-btn:hover {
          transform: scale(1.08) !important;
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
}
