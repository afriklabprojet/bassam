'use client';

import React, { useState } from 'react';

interface AddToCartCTAProps {
  onAddToCart: () => void;
  onBuyNow: () => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  stockQuantity: number;
  price: number;
  isAdded: boolean;
}

/**
 * CTA premium avec :
 * - Animations de confirmation
 * - Effet de pulse sur ajout
 * - Gradient animé
 * - Micro-interactions
 */
export default function AddToCartCTA({
  onAddToCart,
  onBuyNow,
  quantity,
  onQuantityChange,
  stockQuantity,
  price,
  isAdded,
}: AddToCartCTAProps) {
  const [isPulsing, setIsPulsing] = useState(false);

  const handleAdd = () => {
    onAddToCart();
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 600);
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(p);

  const total = price * quantity;

  return (
    <div className="add-to-cart-cta space-y-5">
      {/* Quantity selector premium */}
      <div>
        <label
          className="block mb-2 text-sm font-medium"
          style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em' }}
        >
          Quantité
        </label>
        <div
          className="quantity-selector"
          style={{
            display: 'inline-flex',
            alignItems: 'stretch',
            border: '2px solid var(--line-light)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
            background: '#fff',
            transition: 'all 0.3s ease',
          }}
        >
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="qty-btn"
            style={{
              padding: '0 1.25rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: 300,
            }}
            aria-label="Diminuer"
          >
            −
          </button>
          <div
            style={{
              padding: '1rem 1.5rem',
              minWidth: '80px',
              textAlign: 'center',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              borderLeft: '1px solid var(--line-light)',
              borderRight: '1px solid var(--line-light)',
            }}
          >
            {quantity}
          </div>
          <button
            onClick={() => onQuantityChange(Math.min(stockQuantity, quantity + 1))}
            disabled={quantity >= stockQuantity}
            className="qty-btn"
            style={{
              padding: '0 1.25rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: 300,
            }}
            aria-label="Augmenter"
          >
            +
          </button>
        </div>

        {/* Stock indicator */}
        <p
          className="mt-2 text-xs"
          style={{ color: 'var(--text-pale)' }}
        >
          {stockQuantity} unités disponibles
        </p>
      </div>

      {/* Total price */}
      {quantity > 1 && (
        <div
          className="animate-fade-up"
          style={{
            background: 'var(--gold-muted)',
            borderRadius: 'var(--r-md)',
            padding: '1rem 1.25rem',
            border: '1px solid var(--gold)',
          }}
        >
          <div className="flex items-baseline justify-between">
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
              }}
            >
              Total ({quantity} articles)
            </span>
            <span
              className="heading-lg"
              style={{
                fontSize: '1.5rem',
                color: 'var(--gold-dark)',
              }}
            >
              {formatPrice(total)}
            </span>
          </div>
        </div>
      )}

      {/* Add to cart button */}
      <button
        onClick={handleAdd}
        className={`btn-gold-animated w-full ${isPulsing ? 'pulse-animation' : ''}`}
        style={{
          padding: '1.125rem 2rem',
          fontSize: '0.9375rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          position: 'relative',
          overflow: 'hidden',
          transform: isAdded ? 'scale(0.98)' : 'scale(1)',
          transition: 'transform 0.2s ease',
        }}
      >
        {isAdded ? (
          <span className="flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Ajouté au panier !
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Ajouter au panier
          </span>
        )}
      </button>

      {/* Buy now button */}
      <button
        onClick={onBuyNow}
        className="btn-ghost w-full"
        style={{
          padding: '1.125rem 2rem',
          fontSize: '0.9375rem',
          fontWeight: 500,
          letterSpacing: '0.06em',
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 3h18v18H3zM12 8v8m-4-4h8" />
          </svg>
          Commander maintenant
        </span>
      </button>

      <style jsx>{`
        .qty-btn:hover:not(:disabled) {
          color: var(--gold);
          background: var(--gold-muted);
        }

        .qty-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .quantity-selector:focus-within {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(197, 165, 90, 0.1);
        }

        .pulse-animation {
          animation: pulse 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
