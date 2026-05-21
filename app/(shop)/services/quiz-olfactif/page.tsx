'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type StepNumber = 1 | 2 | 3 | 4 | 5;

interface Choice {
  id: string;
  label: string;
  sub?: string;
  icon?: string;
  description?: string;
}

interface StepConfig {
  num: StepNumber;
  question: string;
  hint: string;
  multiple?: boolean;
  gridTwo?: boolean;
  choices: Choice[];
}

interface ProductResult {
  id: string;
  name: string;
  brand?: string;
  concentration?: string;
  description?: string;
  slug: string;
  image_url?: string;
  price: number;
  olfactive_family?: string;
}

/* ─────────────────────────────────────────────────────────────
   DONNÉES DU QUIZ — 5 ÉTAPES
───────────────────────────────────────────────────────────── */

const QUIZ_STEPS: StepConfig[] = [
  {
    num: 1,
    question: 'Pour qui est ce parfum ?',
    hint: 'Sélectionnez un profil',
    choices: [
      { id: 'femme',   label: 'Pour elle',  sub: 'Féminin' },
      { id: 'homme',   label: 'Pour lui',   sub: 'Masculin' },
      { id: 'unisex',  label: 'Unisexe',    sub: 'Sans genre' },
      { id: 'cadeau',  label: 'Un cadeau',  sub: 'Je ne sais pas encore' },
    ],
  },
  {
    num: 2,
    question: 'Quelle ambiance vous attire ?',
    hint: "Choisissez jusqu'à 2 familles olfactives",
    multiple: true,
    gridTwo: true,
    choices: [
      {
        id: 'floral',
        label: 'Floral',
        icon: '✦',
        description: 'Rose de Grasse, jasmin sambac, pivoine — la féminité en flacon',
      },
      {
        id: 'oriental',
        label: 'Oriental & Oud',
        icon: '◈',
        description: 'Oud méditerranée, ambre, encens — chaleur et mystère',
      },
      {
        id: 'boise',
        label: 'Boisé & Santal',
        icon: '◉',
        description: 'Santal Mysore, cèdre, vétiver d\'Haïti — élégance naturelle',
      },
      {
        id: 'frais',
        label: 'Frais & Hespéridé',
        icon: '◇',
        description: 'Bergamote, thé vert, aldéhydes — légèreté et énergie',
      },
      {
        id: 'gourmand',
        label: 'Gourmand & Vanille',
        icon: '◆',
        description: 'Vanille bourbon, caramel, tonka — douceur enveloppante',
      },
      {
        id: 'cuir',
        label: 'Cuir & Fumé',
        icon: '◻',
        description: 'Tabac blond, birch tar, iris — caractère affirmé',
      },
    ],
  },
  {
    num: 3,
    question: 'Pour quelle occasion ?',
    hint: 'Sélectionnez un contexte',
    choices: [
      { id: 'quotidien',  label: 'Au quotidien',           sub: 'Bureau, sorties, journée légère' },
      { id: 'soiree',     label: 'Soirée & Événements',    sub: 'Dîners, galas, cérémonies' },
      { id: 'seduction',  label: 'Séduction',               sub: 'Romantique, intime, mémorable' },
      { id: 'priere',     label: 'Prière & Spirituel',      sub: 'Encens, oud, bakhour — dimension sacrée' },
      { id: 'voyage',     label: 'Voyage & Découverte',     sub: 'Escapades, aventure, liberté' },
    ],
  },
  {
    num: 4,
    question: 'Quelle intensité souhaitez-vous ?',
    hint: 'Le sillage et la durée de tenue',
    choices: [
      { id: 'discret',   label: 'Signature discrète',   sub: 'EDT — Subtile, personnelle, 4–6h' },
      { id: 'affirme',   label: 'Présence affirmée',     sub: 'EDP — Sillage élégant, 6–10h' },
      { id: 'intense',   label: 'Empreinte intense',     sub: 'Extrait — Inoubliable, toute la journée' },
      { id: 'surprise',  label: 'Surprise-moi',          sub: 'Je fais confiance à votre nez' },
    ],
  },
  {
    num: 5,
    question: 'Quel est votre budget ?',
    hint: 'Prix en Franc CFA (XOF)',
    choices: [
      { id: 'accessible', label: 'Accessible',  sub: '10 000 – 30 000 FCFA' },
      { id: 'premium',    label: 'Premium',     sub: '30 000 – 80 000 FCFA' },
      { id: 'luxe',       label: 'Luxe',        sub: '80 000 FCFA et plus' },
      { id: 'illimite',   label: 'Pas de limite', sub: 'Je veux le meilleur' },
    ],
  },
];

const TOTAL_STEPS = QUIZ_STEPS.length;

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

function getGenderParam(genderId: string): string {
  if (genderId === 'femme') return 'femme';
  if (genderId === 'homme') return 'homme';
  if (genderId === 'unisex') return 'mixte';
  return '';
}

function buildApiParams(answers: Readonly<Record<number, string[]>>): URLSearchParams {
  const params = new URLSearchParams({ limit: '5' });

  const gender = answers[1]?.[0] ?? '';
  const genderParam = getGenderParam(gender);
  if (genderParam !== '') {
    params.set('gender', genderParam);
  }

  const ambiances = answers[2] ?? [];
  if (ambiances.length > 0) {
    const hasOriental = ambiances.includes('oriental');
    let keywords: string[];
    if (hasOriental) {
      keywords = ['oud', ...ambiances.filter((a) => a !== 'oriental')];
    } else {
      keywords = [...ambiances];
    }
    params.set('q', keywords.join(' '));
  }

  const occasion = answers[3]?.[0] ?? '';
  if (occasion === 'soiree' || occasion === 'seduction') {
    params.set('featured', 'true');
  }

  return params;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' FCFA';
}

function truncateDescription(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

function getProfileSummary(answers: Readonly<Record<number, string[]>>): {
  genre: string;
  univers: string;
  occasion: string;
  intensite: string;
  budget: string;
} {
  const step1 = answers[1]?.[0] ?? '';
  const step2 = answers[2] ?? [];
  const step3 = answers[3]?.[0] ?? '';
  const step4 = answers[4]?.[0] ?? '';
  const step5 = answers[5]?.[0] ?? '';

  const genreMap: Record<string, string> = {
    femme: 'Féminin',
    homme: 'Masculin',
    unisex: 'Unisexe',
    cadeau: 'Cadeau',
  };
  const univers2Map: Record<string, string> = {
    floral: 'Floral',
    oriental: 'Oriental & Oud',
    boise: 'Boisé & Santal',
    frais: 'Frais & Hespéridé',
    gourmand: 'Gourmand & Vanille',
    cuir: 'Cuir & Fumé',
  };
  const occasionMap: Record<string, string> = {
    quotidien: 'Quotidien',
    soiree: 'Soirée & Événements',
    seduction: 'Séduction',
    priere: 'Prière & Spirituel',
    voyage: 'Voyage & Découverte',
  };
  const intensiteMap: Record<string, string> = {
    discret: 'EDT — Signature discrète',
    affirme: 'EDP — Présence affirmée',
    intense: 'Extrait — Inoubliable',
    surprise: 'Surprise-moi',
  };
  const budgetMap: Record<string, string> = {
    accessible: '10 000 – 30 000 FCFA',
    premium: '30 000 – 80 000 FCFA',
    luxe: '80 000 FCFA+',
    illimite: 'Pas de limite',
  };

  return {
    genre: genreMap[step1] ?? '—',
    univers: step2.map((a) => univers2Map[a] ?? a).join(', ') || '—',
    occasion: occasionMap[step3] ?? '—',
    intensite: intensiteMap[step4] ?? '—',
    budget: budgetMap[step5] ?? '—',
  };
}

/* ─────────────────────────────────────────────────────────────
   COMPOSANT : ProgressDots
───────────────────────────────────────────────────────────── */

function ProgressDots({ current, total }: Readonly<{ current: number; total: number }>) {
  return (
    <div style={{ marginBottom: 40 }}>
      {/* Dots */}
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
                  border: `1.5px solid ${isActive ? 'var(--gold)' : isDone ? 'var(--gold)' : 'var(--line-light)'}`,
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
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: isActive ? '#fff' : 'var(--text-pale)',
                      lineHeight: 1,
                    }}
                  >
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
      {/* Bar */}
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

/* ─────────────────────────────────────────────────────────────
   COMPOSANT : ChoiceCard (choix simple)
───────────────────────────────────────────────────────────── */

function ChoiceCard({
  choice,
  selected,
  onClick,
}: Readonly<{
  choice: Choice;
  selected: boolean;
  onClick: () => void;
}>) {
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
        <p
          style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {choice.label}
        </p>
        {choice.sub && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-pale)', margin: '3px 0 0' }}>
            {choice.sub}
          </p>
        )}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPOSANT : OlfactiveCard (choix multiple step 2, grille 2 cols)
───────────────────────────────────────────────────────────── */

function OlfactiveCard({
  choice,
  selected,
  onClick,
  disabled,
}: Readonly<{
  choice: Choice;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}>) {
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
        <span
          aria-hidden="true"
          style={{
            fontSize: '1.5rem',
            color: selected ? 'var(--gold)' : 'var(--text-pale)',
            lineHeight: 1,
            transition: 'color 0.18s',
          }}
        >
          {choice.icon}
        </span>
      )}
      <p
        style={{
          fontSize: '0.9rem',
          fontWeight: 700,
          color: selected ? 'var(--text-primary)' : 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {choice.label}
      </p>
      {choice.description && (
        <p
          style={{
            fontSize: '0.6875rem',
            color: 'var(--text-pale)',
            margin: 0,
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}
        >
          {choice.description}
        </p>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPOSANT : GoldSpinner
───────────────────────────────────────────────────────────── */

function GoldSpinner() {
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
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-pale)',
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          margin: 0,
        }}
      >
        Sélection de vos fragrances…
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPOSANT : ProfilCard (résumé olfactif)
───────────────────────────────────────────────────────────── */

function ProfilCard({
  answers,
}: Readonly<{
  answers: Record<number, string[]>;
}>) {
  const profile = getProfileSummary(answers);

  return (
    <div
      style={{
        background: 'var(--noir)',
        border: '1px solid rgba(197,165,90,0.35)',
        borderRadius: 4,
        padding: '32px 36px',
        marginBottom: 56,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(197,165,90,0.08) 0%, transparent 55%)',
        }}
        aria-hidden="true"
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
          <span
            style={{
              fontSize: '0.5625rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              fontWeight: 500,
            }}
          >
            Votre profil olfactif
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px 32px',
          }}
        >
          {[
            { label: 'Genre', value: profile.genre },
            { label: 'Univers', value: profile.univers },
            { label: 'Occasion', value: profile.occasion },
            { label: 'Intensité', value: profile.intensite },
            { label: 'Budget', value: profile.budget },
          ].map(({ label, value }) => (
            <div key={label}>
              <p
                style={{
                  fontSize: '0.5625rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
                  margin: '0 0 4px',
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#fff',
                  margin: 0,
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMPOSANT : ProductCard
───────────────────────────────────────────────────────────── */

function ProductCard({
  product,
  index,
}: Readonly<{
  product: ProductResult;
  index: number;
}>) {
  return (
    <div
      style={{
        background: '#fff',
        padding: '32px 28px',
        borderTop: '2px solid var(--line-light)',
        position: 'relative',
      }}
    >
      <span
        style={{
          fontSize: '0.625rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
        }}
      >
        Recommandation {String(index + 1).padStart(2, '0')}
      </span>

      {product.olfactive_family && (
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.5625rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#fff',
            background: 'var(--gold)',
            borderRadius: 2,
            padding: '2px 8px',
            marginLeft: 10,
            verticalAlign: 'middle',
          }}
        >
          {product.olfactive_family}
        </span>
      )}

      <h3
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.375rem',
          fontWeight: 400,
          color: 'var(--text-primary)',
          margin: '8px 0 2px',
          lineHeight: 1.2,
        }}
      >
        {product.name}
      </h3>

      <p
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-pale)',
          margin: '0 0 6px',
        }}
      >
        {product.brand && product.concentration
          ? `${product.brand} · ${product.concentration}`
          : product.brand ?? product.concentration ?? ''}
      </p>

      <div
        style={{
          width: 24,
          height: '1px',
          background: 'var(--gold)',
          margin: '12px 0',
          opacity: 0.5,
        }}
        aria-hidden="true"
      />

      {product.description && (
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            margin: '0 0 16px',
          }}
        >
          {truncateDescription(product.description, 120)}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        {product.price > 0 && (
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {formatPrice(product.price)}
          </span>
        )}
        <Link
          href={`/produits/${product.slug}`}
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            textDecoration: 'none',
            fontWeight: 600,
            borderBottom: '1px solid rgba(197,165,90,0.35)',
            paddingBottom: 3,
          }}
        >
          Voir le produit →
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ÉCRAN : Résultats
───────────────────────────────────────────────────────────── */

function ResultsScreen({
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
      {/* Hero */}
      <section
        style={{
          background: 'var(--noir)',
          padding: '100px 0 56px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(197,165,90,0.07) 0%, transparent 65%)',
          }}
          aria-hidden="true"
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.3 }} aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '1px solid rgba(197,165,90,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--gold)',
            }}
          >
            <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 300,
              color: '#fff',
              margin: '0 0 12px',
            }}
          >
            Votre sélection{' '}
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>personnalisée</em>
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Basé sur vos réponses, voici les fragrances faites pour vous.
          </p>
        </div>
      </section>

      {/* Contenu */}
      <section style={{ background: 'var(--surface)', padding: '72px 0 96px' }}>
        <div className="container">
          {/* Profil olfactif */}
          <ProfilCard answers={answers} />

          {/* Produits */}
          {loading ? (
            <GoldSpinner />
          ) : products.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 2,
                marginBottom: 56,
              }}
            >
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '56px 24px',
                border: '1px solid var(--line-light)',
                borderRadius: 4,
                marginBottom: 56,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: '1px solid rgba(197,165,90,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <span style={{ fontSize: '1.25rem' }} aria-hidden="true">✦</span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '1.125rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                }}
              >
                Aucun produit ne correspond exactement à votre profil pour l&rsquo;instant.
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-pale)', marginBottom: 24 }}>
                Notre experte peut vous guider vers la fragrance idéale lors d&rsquo;une consultation personnalisée.
              </p>
              <Link
                href="/services/consultation"
                style={{
                  fontSize: '0.6875rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                  fontWeight: 600,
                  borderBottom: '1px solid rgba(197,165,90,0.35)',
                  paddingBottom: 3,
                  textDecoration: 'none',
                }}
              >
                Réserver une consultation →
              </Link>
            </div>
          )}

          {/* CTA */}
          <div
            style={{
              textAlign: 'center',
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/services/consultation"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 48,
                padding: '0 24px',
                background: 'var(--noir)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                borderRadius: 3,
              }}
            >
              Affiner avec une experte
            </Link>
            <Link
              href="/services/creation-personnalisee"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 48,
                padding: '0 24px',
                background: 'var(--gold)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                borderRadius: 3,
              }}
            >
              Créer sur-mesure
            </Link>
            <button
              type="button"
              onClick={onRestart}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 48,
                padding: '0 24px',
                background: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--line-light)',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              Refaire le quiz
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE PRINCIPALE
───────────────────────────────────────────────────────────── */

export default function QuizOlfactifPage() {
  const [step, setStep] = useState<StepNumber>(1);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(true);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const currentStep = QUIZ_STEPS.find((s) => s.num === step)!;
  const currentAnswers = answers[step] ?? [];
  const isMultiple = currentStep.multiple === true;
  const isGridTwo = currentStep.gridTwo === true;
  const maxReached = isMultiple && currentAnswers.length >= 2;
  const canAdvance = currentAnswers.length > 0;

  /* ── Transition helper ── */
  const transitionTo = useCallback((fn: () => void) => {
    setVisible(false);
    setTimeout(() => {
      fn();
      setVisible(true);
    }, 150);
  }, []);

  /* ── Navigation ── */
  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      transitionTo(() => setStep((s) => (s + 1) as StepNumber));
    } else {
      setDone(true);
    }
  }, [step, transitionTo]);

  const goPrev = useCallback(() => {
    if (step > 1) {
      transitionTo(() => setStep((s) => (s - 1) as StepNumber));
    }
  }, [step, transitionTo]);

  const restart = useCallback(() => {
    setDone(false);
    setProducts([]);
    setAnswers({});
    setStep(1);
    setVisible(true);
  }, []);

  /* ── Toggle d'un choix ── */
  function toggle(id: string) {
    if (isMultiple) {
      if (currentAnswers.includes(id)) {
        setAnswers((prev) => ({ ...prev, [step]: currentAnswers.filter((a) => a !== id) }));
      } else if (!maxReached) {
        setAnswers((prev) => ({ ...prev, [step]: [...currentAnswers, id] }));
      }
    } else {
      setAnswers((prev) => ({ ...prev, [step]: [id] }));
    }
  }

  /* ── Auto-advance sur choix unique ── */
  useEffect(() => {
    if (isMultiple) return;
    if (currentAnswers.length === 0) return;

    const timer = setTimeout(() => {
      goNext();
    }, 350);

    return () => clearTimeout(timer);
  }, [currentAnswers, isMultiple, goNext]);

  /* ── Fetch résultats ── */
  useEffect(() => {
    if (!done) return;
    void (async () => {
      setLoadingResults(true);
      const params = buildApiParams(answers);
      try {
        const r = await fetch(`/api/products?${params.toString()}`);
        const d = await r.json() as { products?: ProductResult[] };
        setProducts(d.products ?? []);
      } catch {
        setProducts([]);
      } finally {
        setLoadingResults(false);
      }
    })();
  }, [done, answers]);

  /* ── Écran résultats ── */
  if (done) {
    return (
      <ResultsScreen
        answers={answers}
        products={products}
        loading={loadingResults}
        onRestart={restart}
      />
    );
  }

  /* ── Quiz ── */
  return (
    <main>
      {/* Header sombre */}
      <section
        style={{
          background: 'var(--noir)',
          padding: '80px 0 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(197,165,90,0.06) 0%, transparent 55%)',
          }}
          aria-hidden="true"
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
            opacity: 0.3,
          }}
          aria-hidden="true"
        />
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 24, height: '1px', background: 'var(--gold)' }} />
            <span
              style={{
                fontSize: '0.5625rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                fontWeight: 500,
              }}
            >
              Quiz Olfactif IA
            </span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
              fontWeight: 300,
              color: '#fff',
              margin: '0 0 10px',
              lineHeight: 1.1,
            }}
          >
            Trouvez votre{' '}
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>signature olfactive.</em>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            5 questions · 5 minutes · 100% gratuit
          </p>
        </div>
      </section>

      {/* Formulaire */}
      <section style={{ background: 'var(--surface)', padding: '56px 0 88px' }}>
        <div className="container">
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            {/* Progress dots */}
            <ProgressDots current={step} total={TOTAL_STEPS} />

            {/* Contenu de l'étape avec transition opacité */}
            <div
              style={{
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.15s ease',
              }}
            >
              {/* Question */}
              <div style={{ marginBottom: 28 }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                    fontWeight: 300,
                    color: 'var(--text-primary)',
                    margin: '0 0 6px',
                    lineHeight: 1.2,
                  }}
                >
                  {currentStep.question}
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-pale)', margin: 0 }}>
                  {currentStep.hint}
                  {isMultiple && (
                    <span style={{ color: 'var(--gold)' }}>
                      {' '}(max 2 — {currentAnswers.length}/2 sélectionné{currentAnswers.length > 1 ? 's' : ''})
                    </span>
                  )}
                </p>
              </div>

              {/* Choix — grille 2 colonnes pour étape 2, colonne unique sinon */}
              {isGridTwo ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 10,
                    marginBottom: 40,
                  }}
                >
                  {currentStep.choices.map((c) => (
                    <OlfactiveCard
                      key={c.id}
                      choice={c}
                      selected={currentAnswers.includes(c.id)}
                      onClick={() => toggle(c.id)}
                      disabled={maxReached}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginBottom: 40,
                  }}
                >
                  {currentStep.choices.map((c) => (
                    <ChoiceCard
                      key={c.id}
                      choice={c}
                      selected={currentAnswers.includes(c.id)}
                      onClick={() => toggle(c.id)}
                    />
                  ))}
                </div>
              )}

              {/* Navigation — masquée pour les étapes auto-advance (non-multiple) si un choix est fait */}
              <div style={{ display: 'flex', gap: 12 }}>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={goPrev}
                    style={{
                      height: 48,
                      padding: '0 22px',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--line-light)',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      borderRadius: 3,
                      cursor: 'pointer',
                    }}
                  >
                    ← Précédent
                  </button>
                )}
                {isMultiple && (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canAdvance}
                    style={{
                      flex: 1,
                      height: 48,
                      padding: '0 24px',
                      background: canAdvance ? 'var(--noir)' : 'var(--line-light)',
                      color: canAdvance ? '#fff' : 'var(--text-pale)',
                      border: 'none',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      borderRadius: 3,
                      cursor: canAdvance ? 'pointer' : 'not-allowed',
                      transition: 'all 0.18s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {step === TOTAL_STEPS ? 'Voir mes résultats' : 'Continuer'}
                    {canAdvance && (
                      <svg
                        width={12}
                        height={12}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                      </svg>
                    )}
                  </button>
                )}
                {!isMultiple && !canAdvance && (
                  <div
                    style={{
                      flex: 1,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--text-pale)',
                      fontStyle: 'italic',
                    }}
                  >
                    Sélectionnez une option pour continuer
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
