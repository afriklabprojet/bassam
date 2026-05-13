'use client';

import { useCart } from '@/lib/cart-context';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

function formatPrice(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

const TRUST_STRIP = [
  { icon: '◆', label: 'Authenticité garantie' },
  { icon: '◆', label: 'Paiement sécurisé' },
  { icon: '◆', label: 'Retours acceptés' },
];

export default function CartPage() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoData, setPromoData] = useState<{ type: 'percentage' | 'fixed'; value: number } | null>(null);
  const shipping = totalPrice >= 50000 ? 0 : 2500;
  const discountAmount = promoApplied && promoData
    ? promoData.type === 'percentage'
      ? Math.round(totalPrice * promoData.value / 100)
      : Math.min(promoData.value, totalPrice)
    : 0;
  const discountDisplay = promoApplied && promoData
    ? promoData.type === 'percentage'
      ? `${promoData.value}% de réduction`
      : `${formatPrice(promoData.value)} de réduction`
    : '';
  const total = totalPrice - discountAmount + shipping;

  const sampleCount = totalPrice >= 100000 ? 4 : totalPrice >= 50000 ? 2 : 0;

  async function applyPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderAmount: totalPrice }),
      });
      const d = await res.json() as { valid?: boolean; error?: string; type?: 'percentage' | 'fixed'; value?: number };
      if (d.valid && d.type && d.value !== undefined) {
        setPromoApplied(true);
        setPromoData({ type: d.type, value: d.value });
      } else {
        setPromoError(d.error ?? 'Code promo invalide.');
      }
    } catch {
      setPromoError('Erreur lors de la vérification du code.');
    } finally {
      setPromoLoading(false);
    }
  }

  /* ── Empty State ────────────────────────────── */
  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '1px solid var(--gold-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
          <svg width="30" height="30" fill="none" stroke="var(--gold)" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
          </svg>
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Votre panier est vide</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontWeight: 300, maxWidth: '24rem' }}>
          Découvrez nos fragrances d&apos;exception et laissez-vous surprendre.
        </p>
        <Link href="/produits" className="btn-gold btn-gold-animated">
          Découvrir nos parfums
        </Link>
      </div>
    );
  }

  /* ── Full Cart ──────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--offwhite)' }}>
      {/* ── Page header — noir ────────────────── */}
      <div style={{ background: 'var(--noir)', paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="container mx-auto">
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}>Accueil</Link>
            <span style={{ color: 'var(--gold)', fontSize: '5px', verticalAlign: 'middle' }}>◆</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Mon Panier</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 400, color: '#fff', letterSpacing: '-0.01em' }}>
              Mon Panier
            </h1>
            <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-sans)', fontWeight: 300, color: 'rgba(255,255,255,0.35)' }}>
              {totalItems} article{totalItems > 1 ? 's' : ''}
            </span>
          </div>
          {/* Gold accent line */}
          <div style={{ width: '2.5rem', height: '1px', background: 'var(--gold)', marginTop: '1rem', opacity: 0.6 }} />
        </div>
      </div>

      {/* ── Content ───────────────────────────── */}
      <div className="container mx-auto py-10">
        {/* ── Samples banner ───────────────────── */}
        {sampleCount > 0 && (
          <div style={{ background: 'var(--gold-muted)', border: '1px solid rgba(197,165,90,0.25)', borderRadius: 'var(--r-md)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="var(--gold)" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1012 10.125 2.625 2.625 0 0012 4.875z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {sampleCount} échantillon{sampleCount > 1 ? 's' : ''} offert{sampleCount > 1 ? 's' : ''} avec votre commande
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 300 }}>Sélectionnés à la livraison</p>
            </div>
          </div>
        )}

        {/* ── Free shipping progress ───────────── */}
        {totalPrice >= 10000 && totalPrice < 50000 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line-light)', borderRadius: 'var(--r-md)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Plus que <strong style={{ color: 'var(--gold-dark)' }}>{formatPrice(50000 - totalPrice)}</strong> pour la livraison offerte + 2 échantillons
            </p>
            <div style={{ height: '2px', background: 'var(--line-light)', borderRadius: '1px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--gold)', borderRadius: '1px', width: `${Math.min((totalPrice / 50000) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {/* ── Grid: Items + Summary ────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Left column: items */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            <div>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="cart-page-item"
                  style={{
                    display: 'flex',
                    gap: '1.25rem',
                    padding: '1.5rem 0',
                    borderBottom: index < items.length - 1 ? '1px solid var(--line-light)' : 'none',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Image */}
                  <Link href={`/produits/${item.slug}`} style={{ flexShrink: 0 }}>
                    <div style={{ position: 'relative', width: '88px', height: '110px', borderRadius: 'var(--r-sm)', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--line-light)' }}>
                      <Image
                        src={item.image || '/images/products/product-placeholder.svg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="88px"
                      />
                    </div>
                  </Link>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-pale)', marginBottom: '0.25rem' }}>{item.brand}</p>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '0.875rem' }}>{item.name}</h3>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {/* Qty controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="cart-qty-btn"
                          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--line-light)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'border-color 0.2s, color 0.2s, background 0.2s' }}
                          aria-label="Diminuer"
                        >−</button>
                        <span style={{ width: '28px', textAlign: 'center', fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="cart-qty-btn"
                          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--line-light)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'border-color 0.2s, color 0.2s, background 0.2s' }}
                          aria-label="Augmenter"
                        >+</button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-primary)' }}>{formatPrice(item.price * item.quantity)}</span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="cart-remove-btn"
                          style={{ fontSize: '0.6875rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-pale)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
                          aria-label="Supprimer"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={clearCart}
                className="cart-remove-btn"
                style={{ marginTop: '1.5rem', fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-pale)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, alignSelf: 'flex-start', transition: 'color 0.2s' }}
              >
                Vider le panier
              </button>
            </div>

            {/* Right column: order summary */}
            <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Promo code */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 400, marginBottom: '1rem' }}>Code promotionnel</h2>
                {promoApplied ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    <svg width="16" height="16" fill="none" stroke="var(--gold)" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Code <strong style={{ fontFamily: 'var(--font-serif)' }}>{promoCode.toUpperCase()}</strong> — {discountDisplay}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Ex : VIP10"
                      className="input"
                      style={{ flex: 1 }}
                      onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                    />
                    <button onClick={applyPromo} disabled={promoLoading} className="btn-ghost" style={{ flexShrink: 0 }}>
                      {promoLoading ? '…' : 'Appliquer'}
                    </button>
                  </div>
                )}
                {promoError && <p style={{ color: '#c0392b', fontSize: '0.75rem', marginTop: '0.5rem' }}>{promoError}</p>}
              </div>

              {/* Summary */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 400, marginBottom: '1.25rem' }}>Récapitulatif</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Sous-total</span>
                    <span style={{ color: 'var(--text-primary)' }}>{formatPrice(totalPrice)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gold-dark)' }}>
                      <span>Réduction ({discountDisplay})</span>
                      <span>−{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Livraison</span>
                    <span style={shipping === 0 ? { color: 'var(--gold-dark)', fontWeight: 500 } : { color: 'var(--text-primary)' }}>
                      {shipping === 0 ? 'Offerte' : formatPrice(shipping)}
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--line-light)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.25rem' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>{formatPrice(total)}</span>
                  </div>
                </div>

                <Link
                  href="/commande"
                  className="btn-gold btn-gold-animated"
                  style={{ marginTop: '1.5rem', display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%' }}
                >
                  Passer la commande
                </Link>

                <p style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--text-pale)', marginTop: '0.75rem', fontWeight: 300 }}>
                  Paiement à la livraison · Mobile Money · Wave
                </p>
              </div>

              {/* Trust strip */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', padding: '0.75rem 0' }}>
                {TRUST_STRIP.map((t) => (
                  <span key={t.label} style={{ fontSize: '0.625rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-pale)' }}>
                    <span style={{ color: 'var(--gold)', marginRight: '0.3rem', fontSize: '5px', verticalAlign: 'middle' }}>{t.icon}</span>
                    {t.label}
                  </span>
                ))}
              </div>

              <Link href="/produits" style={{ textAlign: 'center', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', textDecoration: 'none', display: 'block', transition: 'color 0.2s' }}>
                ← Continuer les achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
