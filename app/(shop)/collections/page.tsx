import { SITE_URL as BASE_URL } from '@/lib/site-config';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getProductCountsByCategory } from '@/lib/supabase/products';
import { getCollectionsContent } from '@/lib/supabase/collections-content';
import { getPublicCategories } from '@/lib/supabase/taxonomies';

export const revalidate = 300;


export const metadata: Metadata = {
  title: 'Collections de Parfums à Abidjan -- Femme, Homme, Mixte | VIP Parfumerie Bar',
  description: "Explorez nos collections de parfums de luxe à Abidjan -- Femme, Homme, Mixte, Nouveautés. Les plus grandes maisons. Livraison Côte d'Ivoire et Afrique de l'Ouest.",
  keywords: "collections parfums Abidjan, parfumerie Côte d'Ivoire, collection parfum luxe Abidjan, catalogue parfum Abidjan",
  alternates: { canonical: `${BASE_URL}/collections` },
  openGraph: {
    title: 'Collections de Parfums | VIP Parfumerie Bar Abidjan',
    description: "Femme, Homme, Mixte -- toutes nos collections disponibles à Abidjan.",
    url: `${BASE_URL}/collections`,
    type: 'website',
    locale: 'fr_CI',
  },
};

// ─── Data ────────────────────────────────────────────────────────────────────

const COLLECTIONS = [
  {
    slug: 'nouveautes',
    label: 'Nouveautés',
    eyebrow: 'Dernières arrivées',
    tagline: 'Ce qui vient de poser ses valises',
    description: 'Parcourez les toutes dernières créations des maisons que nous sélectionnons avec soin -- des lancements mondiaux disponibles à Abidjan.',
    accent: 'rgba(197,165,90,0.18)',
    textLight: false,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M20 4l2.5 10h10l-8 5.5 3 10-7.5-5.5-7.5 5.5 3-10-8-5.5h10z" stroke="#C5A55A" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    bg: '#0F0F0D',
    count: null,
  },
  {
    slug: 'femme',
    label: 'Femme',
    eyebrow: 'Collection féminine',
    tagline: 'Floraux enivrants, orientaux profonds',
    description: "De la rose de Grasse aux muscs orientaux, une sélection de fragrances féminines qui incarnent l'élégance à son sommet.",
    accent: 'rgba(197,165,90,0.12)',
    textLight: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="16" r="9" stroke="#C5A55A" strokeWidth="1.5"/>
        <path d="M20 25v10M15 30h10" stroke="#C5A55A" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    bg: '#0D0A0F',
    count: null,
  },
  {
    slug: 'homme',
    label: 'Homme',
    eyebrow: 'Collection masculine',
    tagline: 'Boisés élégants, signatures puissantes',
    description: "Des sillages qui affirment sans imposer. De l'oud pur aux accords boisés contemporains, des parfums qui définissent le gentleman moderne.",
    accent: 'rgba(197,165,90,0.10)',
    textLight: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="9" stroke="#C5A55A" strokeWidth="1.5"/>
        <path d="M27 13l7-7M34 6h-5M34 6v5" stroke="#C5A55A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    bg: '#08090F',
    count: null,
  },
  {
    slug: 'mixte',
    label: 'Mixte',
    eyebrow: 'Au-delà des genres',
    tagline: 'La fragrance ne connaît pas de frontières',
    description: "Des compositions olfactives qui transcendent les catégories. Pour ceux qui choisissent leur parfum à l'instinct, sans convention.",
    accent: 'rgba(197,165,90,0.10)',
    textLight: true,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M14 20c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6z" stroke="#C5A55A" strokeWidth="1.5"/>
        <path d="M10 10l5 5M30 10l-5 5M10 30l5-5M30 30l-5-5" stroke="#C5A55A" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    bg: '#0A0D0A',
    count: null,
  },
];


// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CollectionsPage() {
  let counts: Record<string, number> = {};
  let content: Awaited<ReturnType<typeof getCollectionsContent>> = {};
  let categoryRows: Awaited<ReturnType<typeof getPublicCategories>> = [];
  try {
    [counts, content, categoryRows] = await Promise.all([
      getProductCountsByCategory(),
      getCollectionsContent(),
      getPublicCategories(),
    ]);
  } catch {
    // non-blocking
  }

  const collectionsWithCounts = COLLECTIONS.map((col) => ({
    ...col,
    eyebrow: content[col.slug]?.eyebrow ?? col.eyebrow,
    tagline: content[col.slug]?.tagline ?? col.tagline,
    description: content[col.slug]?.description ?? col.description,
    count: col.slug === 'nouveautes'
      ? null
      : counts[col.slug] ?? null,
  }));

  const dynamicCategories = categoryRows
    .filter((category) => !collectionsWithCounts.some((existing) => existing.slug === category.slug))
    .map((category) => ({
      slug: category.slug,
      label: category.name,
      eyebrow: 'Catégorie produit',
      tagline: category.description ?? `Découvrez ${category.name}`,
      description: category.description ?? `Explorez les produits de la catégorie ${category.name}.`,
      accent: 'rgba(197,165,90,0.10)',
      textLight: true,
      icon: (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <rect x="8" y="10" width="24" height="20" rx="4" stroke="#C5A55A" strokeWidth="1.5" />
          <path d="M14 18h12M14 23h8" stroke="#C5A55A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      bg: '#0B0B0B',
      count: counts[category.slug] ?? null,
    }));

  const cards = [...collectionsWithCounts, ...dynamicCategories];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--noir)' }}>

      {/* ── Hero compact ─────────────────────────────────────────────────── */}
      <section style={{ padding: '3rem 0 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(197,165,90,0.3), transparent)' }} aria-hidden="true" />
        <div className="container mx-auto" style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: '0.875rem' }}>
            <span style={{ display: 'block', width: 24, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
              VIP Parfumerie Bar
            </span>
            <span style={{ display: 'block', width: 24, height: '1px', background: 'var(--gold)' }} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 300,
            color: 'var(--surface)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
          }}>
            Nos Collections
          </h1>
        </div>
      </section>

      {/* ── Collection Cards ─────────────────────────────────────────────── */}
      <section className="container mx-auto" style={{ padding: '0 var(--px, 1.5rem) 6rem' }}>
        <div className="coll-grid">
          {cards.map((col, i) => (
            <Link
              key={col.slug}
              href={`/collections/${col.slug}`}
              className="coll-card"
              style={{ background: col.bg, textDecoration: 'none', '--accent': col.accent } as React.CSSProperties}
            >
              {/* Glow overlay */}
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 30%, ${col.accent}, transparent 70%)`, pointerEvents: 'none' }} aria-hidden="true" />

              {/* Number */}
              <span style={{
                position: 'absolute', top: '1.5rem', right: '1.5rem',
                fontFamily: 'var(--font-serif)', fontSize: '4.5rem', fontWeight: 300,
                color: 'rgba(197,165,90,0.08)', lineHeight: 1, userSelect: 'none',
              }} aria-hidden="true">0{i + 1}</span>

              {/* Content */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ marginBottom: '1.25rem' }}>{col.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                  <span style={{ display: 'block', width: 16, height: '1px', background: 'var(--gold)' }} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
                    {col.eyebrow}
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300, color: 'var(--surface)', marginBottom: '0.5rem', lineHeight: 1.15 }}>
                  {col.label}
                </h2>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.9375rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  {col.tagline}
                </p>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75 }}>
                  {col.description}
                </p>
                {col.count !== null && (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(197,165,90,0.6)', marginTop: '1rem' }}>
                    {col.count} parfum{col.count > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* CTA */}
              <div style={{ position: 'relative', zIndex: 1, marginTop: '2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="coll-discover" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
                  Découvrir
                </span>
                <span className="coll-arrow" style={{ display: 'flex', alignItems: 'center', color: 'var(--gold)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </span>
              </div>

              {/* Bottom border */}
              <div className="coll-border" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'var(--gold)', transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.4s ease' }} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Quiz CTA compact ─────────────────────────────────────────────── */}
      <section style={{ padding: '2.5rem 0', borderTop: '1px solid rgba(197,165,90,0.10)' }}>
        <div className="container mx-auto" style={{ textAlign: 'center' }}>
          <Link href="/services/quiz-olfactif" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--gold)', textDecoration: 'none', fontWeight: 500,
          }}>
            Pas s&ucirc;r(e) de votre collection&nbsp;? Faites le quiz olfactif gratuit
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </Link>
        </div>
      </section>

      <style>{`
        .coll-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: rgba(197,165,90,0.08);
        }
        .coll-card {
          position: relative;
          overflow: hidden;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 300px;
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s ease;
        }
        .coll-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 50%, rgba(197,165,90,0.06) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
          z-index: 0;
        }
        .coll-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .coll-card:hover::before { opacity: 1; }
        .coll-card:hover .coll-border { transform: scaleX(1) !important; }
        .coll-card:hover .coll-arrow { transform: translateX(6px); }
        .coll-card:hover .coll-discover { color: var(--gold-light); }
        .coll-arrow { transition: transform 0.35s cubic-bezier(0.4,0,0.2,1); }
        .coll-discover { transition: color 0.3s ease; }
        @media (max-width: 640px) {
          .coll-grid { grid-template-columns: 1fr; }
          .coll-card { min-height: 220px; padding: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
