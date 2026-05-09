'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';

const fmt = (p: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(p);

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const panelRef = useRef<HTMLElement>(null);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeCart]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* Trap focus inside panel */
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  const shipping = totalPrice >= 50_000 ? 0 : 2_500;
  const freeShippingPct = Math.min((totalPrice / 50_000) * 100, 100);
  const freeShippingLeft = 50_000 - totalPrice;

  return (
    <>
      {/* ── Overlay — blur + fade ────────────────── */}
      <div
        className="cart-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(8,8,8,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* ── Panel ────────────────────────────────── */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Votre sélection"
        tabIndex={-1}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: '100%',
          maxWidth: '440px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          boxShadow: isOpen ? '-12px 0 60px rgba(0,0,0,0.18)' : 'none',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* ── Header ─────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--line-light)',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 400,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Votre sélection
            </h2>
            {totalItems > 0 && (
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.15rem' }}>
                {totalItems} article{totalItems > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={closeCart}
            className="cart-close-btn"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid var(--line-light)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            aria-label="Fermer le panier"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Free shipping progress ─────────────── */}
        {items.length > 0 && totalPrice < 50_000 && (
          <div style={{ padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--line-light)', background: 'var(--offwhite)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Plus que <strong style={{ color: 'var(--gold-dark)' }}>{fmt(freeShippingLeft)}</strong> pour la livraison offerte
            </p>
            <div style={{ height: '2px', background: 'var(--line-light)', borderRadius: '1px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--gold)', borderRadius: '1px', width: `${freeShippingPct}%`, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
          </div>
        )}
        {items.length > 0 && totalPrice >= 50_000 && (
          <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--line-light)', background: 'var(--offwhite)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="14" height="14" fill="none" stroke="var(--gold)" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <p style={{ fontSize: '0.75rem', color: 'var(--gold-dark)', fontWeight: 500 }}>Livraison offerte</p>
          </div>
        )}

        {/* ── Items ──────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '1px solid var(--line-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <svg width="28" height="28" fill="none" stroke="var(--text-pale)" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
              </div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Votre panier est vide</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 300, marginBottom: '2rem' }}>Découvrez nos fragrances d&apos;exception.</p>
              <Link href="/produits" onClick={closeCart} className="btn-primary">
                Découvrir nos parfums
              </Link>
            </div>
          ) : (
            <ul>
              {items.map((item, idx) => (
                <li
                  key={item.id}
                  className="cart-item-row"
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1.25rem 1.5rem',
                    borderBottom: idx < items.length - 1 ? '1px solid var(--line-light)' : 'none',
                    alignItems: 'flex-start',
                    animation: `cart-item-enter 0.35s cubic-bezier(0.16,1,0.3,1) ${idx * 0.05}s both`,
                  }}
                >
                  {/* Thumbnail */}
                  <Link href={`/produits/${item.slug}`} onClick={closeCart} style={{ flexShrink: 0 }}>
                    <div
                      style={{
                        position: 'relative',
                        width: '76px',
                        height: '95px',
                        borderRadius: 'var(--r-sm)',
                        overflow: 'hidden',
                        background: 'var(--offwhite)',
                        border: '1px solid var(--line-light)',
                      }}
                    >
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="76px" />
                    </div>
                  </Link>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-pale)', marginBottom: '0.2rem' }}>{item.brand}</p>
                    <Link
                      href={`/produits/${item.slug}`}
                      onClick={closeCart}
                      style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.35, textDecoration: 'none', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {item.name}
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Qty */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="cart-qty-btn"
                          style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--line-light)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'border-color 0.2s, color 0.2s' }}
                          aria-label="Diminuer"
                        >−</button>
                        <span style={{ width: '24px', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="cart-qty-btn"
                          style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--line-light)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'border-color 0.2s, color 0.2s' }}
                          aria-label="Augmenter"
                        >+</button>
                      </div>

                      {/* Price + Remove */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)' }}>{fmt(item.price * item.quantity)}</span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="cart-remove-btn"
                          style={{ padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-pale)', transition: 'color 0.2s' }}
                          aria-label={`Supprimer ${item.name}`}
                        >
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Footer ─────────────────────────────── */}
        {items.length > 0 && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid var(--line-light)',
              background: 'var(--surface)',
            }}
          >
            {/* Subtotal row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Sous-total</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-primary)' }}>{fmt(totalPrice)}</span>
            </div>

            <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', fontWeight: 300, marginBottom: '1.25rem' }}>
              {shipping === 0 ? 'Livraison offerte' : `Livraison : ${fmt(shipping)}`} · Taxes incluses
            </p>

            {/* Gold CTA — goes to full cart page */}
            <Link
              href="/panier"
              onClick={closeCart}
              className="btn-gold btn-gold-animated"
              style={{ display: 'block', textAlign: 'center', width: '100%', textDecoration: 'none' }}
            >
              Voir le panier
            </Link>

            {/* Ghost CTA — direct checkout */}
            <Link
              href="/commande"
              onClick={closeCart}
              className="btn-ghost"
              style={{ display: 'block', textAlign: 'center', width: '100%', marginTop: '0.625rem', textDecoration: 'none' }}
            >
              Commander directement
            </Link>

            {/* Trust micro-strip */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--line-light)' }}>
              {['Paiement sécurisé', 'Mobile Money'].map((t) => (
                <span key={t} style={{ fontSize: '0.625rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-pale)' }}>
                  <span style={{ color: 'var(--gold)', marginRight: '0.25rem', fontSize: '5px', verticalAlign: 'middle' }}>◆</span>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
