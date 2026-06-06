'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import type { Choice, ProductResult } from '@/lib/quiz-data';
import { getProfileSummary, truncateDescription } from '@/lib/quiz-data';

/* ── ProgressDots ──────────────────────────────────────────────────────────── */

export function ProgressDots({ current, total }: Readonly<{ current: number; total: number }>) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          marginBottom: 12,
        }}
      >
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const isActive = n === current;
          const isDone = n < current;
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: isActive ? 32 : 28,
                  height: isActive ? 32 : 28,
                  borderRadius: '50%',
                  border: `1.5px solid ${isActive || isDone ? 'var(--gold)' : 'var(--line-light)'}`,
                  background: isActive ? 'var(--gold)' : isDone ? 'rgba(197,165,90,0.15)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s ease',
                  flexShrink: 0,
                }}
              >
                {isDone ? (
                  <svg width={10} height={10} fill="none" stroke={isActive ? '#fff' : 'var(--gold)'} strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, color: isActive ? '#fff' : 'var(--text-pale)', lineHeight: 1 }}>
                    {n}
                  </span>
                )}
              </div>
              {n < total && (
                <div
                  style={{
                    width: 32,
                    height: 1,
                    background: isDone ? 'var(--gold)' : 'var(--line-light)',
                    opacity: isDone ? 0.6 : 1,
                    transition: 'background 0.25s ease',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ height: 2, background: 'var(--line-light)', borderRadius: 1, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            background: 'var(--gold)',
            width: `${((current - 1) / (total - 1)) * 100}%`,
            transition: 'width 0.4s ease',
            borderRadius: 1,
          }}
        />
      </div>
    </div>
  );
}

/* ── ChoiceCard ────────────────────────────────────────────────────────────── */

export function ChoiceCard({
  choice,
  selected,
  onClick,
}: Readonly<{ choice: Choice; selected: boolean; onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '18px 22px',
        border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--line-light)'}`,
        borderRadius: 3,
        background: selected ? 'rgba(197,165,90,0.05)' : '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--line-light)'}`,
          background: selected ? 'var(--gold)' : 'transparent',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.18s',
        }}
      >
        {selected && (
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </div>
      <div>
        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
          {choice.label}
        </p>
        {choice.sub && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-pale)', margin: '3px 0 0' }}>{choice.sub}</p>
        )}
      </div>
    </button>
  );
}

/* ── OlfactiveCard ─────────────────────────────────────────────────────────── */

export function OlfactiveCard({
  choice,
  selected,
  onClick,
  disabled,
}: Readonly<{ choice: Choice; selected: boolean; onClick: () => void; disabled: boolean }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !selected}
      style={{
        padding: '20px 18px',
        border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--line-light)'}`,
        borderRadius: 3,
        background: selected ? 'rgba(197,165,90,0.06)' : '#fff',
        cursor: disabled && !selected ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s ease',
        opacity: disabled && !selected ? 0.45 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {choice.icon && (
        <span aria-hidden="true" style={{ fontSize: '1.5rem', color: selected ? 'var(--gold)' : 'var(--text-pale)', lineHeight: 1, transition: 'color 0.18s' }}>
          {choice.icon}
        </span>
      )}
      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
        {choice.label}
      </p>
      {choice.description && (
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
          {choice.description}
        </p>
      )}
    </button>
  );
}

/* ── GoldSpinner ───────────────────────────────────────────────────────────── */

export function GoldSpinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '60px 20px' }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '2px solid var(--line-light)',
          borderTopColor: 'var(--gold)',
          animation: 'spin 0.8s linear infinite',
        }}
        aria-hidden="true"
      />
      <p style={{ fontSize: '0.875rem', color: 'var(--text-pale)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', margin: 0 }}>
        Sélection de vos fragrances…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── ProfilCard ────────────────────────────────────────────────────────────── */

export function ProfilCard({ answers }: Readonly<{ answers: Record<number, string[]> }>) {
  const profile = getProfileSummary(answers);
  const rows = [
    { label: 'Genre', value: profile.genre },
    { label: 'Univers', value: profile.univers },
    { label: 'Occasion', value: profile.occasion },
    { label: 'Intensité', value: profile.intensite },
    { label: 'Budget', value: profile.budget },
  ];

  return (
    <div style={{ background: 'var(--noir)', border: '1px solid rgba(197,165,90,0.35)', borderRadius: 4, padding: '32px 36px', marginBottom: 56, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(197,165,90,0.08) 0%, transparent 55%)' }} aria-hidden="true" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
          <span style={{ fontSize: '0.5625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
            Votre profil olfactif
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px 32px' }}>
          {rows.map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 4px' }}>
                {label}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#fff', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ProductCard ───────────────────────────────────────────────────────────── */

export function ProductCard({ product, index }: Readonly<{ product: ProductResult; index: number }>) {
  const brandLine = product.brand && product.concentration
    ? `${product.brand} · ${product.concentration}`
    : product.brand ?? product.concentration ?? '';

  return (
    <div style={{ background: '#fff', padding: '32px 28px', borderTop: '2px solid var(--line-light)', position: 'relative' }}>
      <span style={{ fontSize: '0.625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)' }}>
        Recommandation {String(index + 1).padStart(2, '0')}
      </span>
      {product.olfactive_family && (
        <span style={{ display: 'inline-block', fontSize: '0.5625rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', background: 'var(--gold)', borderRadius: 2, padding: '2px 8px', marginLeft: 10, verticalAlign: 'middle' }}>
          {product.olfactive_family}
        </span>
      )}
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, color: 'var(--text-primary)', margin: '8px 0 2px', lineHeight: 1.2 }}>
        {product.name}
      </h3>
      <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-pale)', margin: '0 0 6px' }}>
        {brandLine}
      </p>
      <div style={{ width: 24, height: '1px', background: 'var(--gold)', margin: '12px 0', opacity: 0.5 }} aria-hidden="true" />
      {product.description && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 16px' }}>
          {truncateDescription(product.description, 120)}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        {product.price > 0 && (
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {formatPrice(product.price)}
          </span>
        )}
        <Link href={`/produits/${product.slug}`} style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600, borderBottom: '1px solid rgba(197,165,90,0.35)', paddingBottom: 3 }}>
          Voir le produit →
        </Link>
      </div>
    </div>
  );
}

/* ── ResultsScreen ─────────────────────────────────────────────────────────── */

export function ResultsScreen({
  answers,
  products,
  loading,
  onRestart,
}: Readonly<{
  answers: Record<number, string[]>;
  products: ProductResult[];
  loading: boolean;
  onRestart: () => void;
}>) {
  return (
    <main>
      <section style={{ background: 'var(--noir)', padding: '100px 0 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(197,165,90,0.07) 0%, transparent 65%)' }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.3 }} aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', border: '1px solid rgba(197,165,90,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--gold)' }}>
            <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300, color: '#fff', margin: '0 0 12px' }}>
            Votre sélection <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>personnalisée</em>
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Basé sur vos réponses, voici les fragrances faites pour vous.
          </p>
        </div>
      </section>

      <section style={{ background: 'var(--surface)', padding: '72px 0 96px' }}>
        <div className="container">
          <ProfilCard answers={answers} />

          {loading ? (
            <GoldSpinner />
          ) : products.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2, marginBottom: 56 }}>
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '56px 24px', border: '1px solid var(--line-light)', borderRadius: 4, marginBottom: 56 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(197,165,90,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <span style={{ fontSize: '1.25rem' }} aria-hidden="true">✦</span>
              </div>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Aucun produit ne correspond exactement à votre profil pour l&rsquo;instant.
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-pale)', marginBottom: 24 }}>
                Notre experte peut vous guider vers la fragrance idéale lors d&rsquo;une consultation personnalisée.
              </p>
              <Link href="/services/consultation" style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, borderBottom: '1px solid rgba(197,165,90,0.35)', paddingBottom: 3, textDecoration: 'none' }}>
                Réserver une consultation →
              </Link>
            </div>
          )}

          <div style={{ textAlign: 'center', display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/services/consultation" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px', background: 'var(--noir)', color: '#fff', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderRadius: 3 }}>
              Affiner avec une experte
            </Link>
            <Link href="/services/creation-personnalisee" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px', background: 'var(--gold)', color: '#fff', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderRadius: 3 }}>
              Créer sur-mesure
            </Link>
            <button
              type="button"
              onClick={onRestart}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--line-light)', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderRadius: 3, cursor: 'pointer' }}
            >
              Refaire le quiz
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
