import type { Metadata } from 'next';
import Link from 'next/link';
import { getProductCountsByGender } from '@/lib/supabase/products';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Collections | VIP Parfumerie Bar',
  description: 'Explorez nos collections de parfums de luxe — Femme, Homme, Mixte et les dernières nouveautés. Livraison en Afrique de l\u2019Ouest.',
};

// ─── Data ────────────────────────────────────────────────────────────────────

const COLLECTIONS = [
  {
    slug: 'nouveautes',
    label: 'Nouveaut\u00e9s',
    eyebrow: 'Derni\u00e8res arriv\u00e9es',
    tagline: 'Ce qui vient de poser ses valises',
    description: 'Parcourez les toutes derni\u00e8res cr\u00e9ations des maisons que nous s\u00e9lectionnons avec soin — des lancements mondiaux disponibles \u00e0 Abidjan.',
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
    eyebrow: 'Collection f\u00e9minine',
    tagline: 'Floraux enivrants, orientaux profonds',
    description: 'De la rose de Grasse aux muscs orientaux, discover une s\u00e9lection de fragrances f\u00e9minines qui incarnent l\u2019\u00e9l\u00e9gance \u00e0 son sommet.',
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
    tagline: 'Bois\u00e9s \u00e9l\u00e9gants, signatures puissantes',
    description: 'Des sillages qui affirment sans imposer. De l\u2019ud pur aux accord\u00e9ons bois\u00e9s contemporains, des parfums qui d\u00e9finissent le gentleman moderne.',
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
    eyebrow: 'Au-del\u00e0 des genres',
    tagline: 'La fragrance ne conna\u00eet pas de fronti\u00e8res',
    description: 'Des compositions olfactives qui transcendent les cat\u00e9gories. Pour ceux qui choisissent leur parfum \u00e0 l\u2019instinct, sans convention.',
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

const FEATURED_BRANDS = [
  { name: 'Dior', abbr: 'D' },
  { name: 'Chanel', abbr: 'Ch' },
  { name: 'Tom Ford', abbr: 'TF' },
  { name: 'Maison Francis\nKurkdjian', abbr: 'MFK' },
  { name: 'Amouage', abbr: 'Am' },
  { name: 'Creed', abbr: 'Cr' },
  { name: 'Initio', abbr: 'In' },
  { name: 'YSL', abbr: 'YSL' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CollectionsPage() {
  let counts: Record<string, number> = {};
  try {
    counts = await getProductCountsByGender();
  } catch {
    // non-blocking: counts stay empty
  }

  const collectionsWithCounts = COLLECTIONS.map((col) => ({
    ...col,
    count: col.slug === 'nouveautes'
      ? null
      : counts[col.slug] ?? null,
  }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--noir)' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '7rem 0 5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(197,165,90,0.12) 0%, transparent 65%)' }} aria-hidden="true" />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(197,165,90,0.3), transparent)' }} aria-hidden="true" />
        <div className="container mx-auto" style={{ position: 'relative', textAlign: 'center', maxWidth: 760 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
            <span style={{ display: 'block', width: 32, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
              VIP Parfumerie Bar
            </span>
            <span style={{ display: 'block', width: 32, height: '1px', background: 'var(--gold)' }} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.8rem, 7vw, 5rem)',
            fontWeight: 300,
            color: 'var(--surface)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            marginBottom: '1.5rem',
          }}>
            Nos Collections
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1.0625rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, maxWidth: 540, margin: '0 auto 2.5rem' }}>
            Des s\u00e9lections pens\u00e9es pour chaque personnali\u00e9, chaque moment, chaque \u00e9motion. Choisissez votre univers olfactif.
          </p>
          <Link href="/services/quiz-olfactif" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--gold)', textDecoration: 'none', fontWeight: 500,
          }}>
            Pas s\u00fbr(e) de votre collection ? Faites le quiz olfactif
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </Link>
        </div>
      </section>

      {/* ── Collection Cards ─────────────────────────────────────────────── */}
      <section className="container mx-auto" style={{ padding: '0 var(--px, 1.5rem) 6rem' }}>
        <div className="coll-grid">
          {collectionsWithCounts.map((col, i) => (
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
                  D\u00e9couvrir
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

      {/* ── Marques ──────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--noir-soft)', padding: '4rem 0', borderTop: '1px solid rgba(197,165,90,0.12)', borderBottom: '1px solid rgba(197,165,90,0.12)' }}>
        <div className="container mx-auto">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
              Maisons s\u00e9lectionn\u00e9es
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem 0' }}>
            {FEATURED_BRANDS.map((brand, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(0.85rem, 1.5vw, 1.05rem)', fontWeight: 300, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                  {brand.name}
                </span>
                {i < FEATURED_BRANDS.length - 1 && (
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(197,165,90,0.4)', display: 'inline-block', margin: '0 0.75rem' }} />
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Editorial band ───────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Notre s\u00e9lection</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 300, color: 'var(--surface)', lineHeight: 1.2, marginBottom: '1.25rem' }}>
              Un acc\u00e8s privil\u00e9gi\u00e9<br />aux plus grandes maisons
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: '2rem' }}>
              Chaque r\u00e9f\u00e9rence est s\u00e9lectionn\u00e9e \u00e0 la main par notre \u00e9quipe de sp\u00e9cialistes. Authenticit\u00e9 garantie, livraison s\u00e9curis\u00e9e partout en Afrique de l\u2019Ouest.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/collections/nouveautes" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--gold)', color: 'var(--noir)',
                padding: '0.75rem 1.5rem',
                fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
                textDecoration: 'none',
              }}>
                Voir les nouveaut\u00e9s
              </Link>
              <Link href="/services/consultation" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: '1px solid rgba(197,165,90,0.35)', color: 'var(--gold)',
                padding: '0.75rem 1.5rem',
                fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500,
                textDecoration: 'none',
              }}>
                Consulter un expert
              </Link>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { val: '500+', label: 'R\u00e9f\u00e9rences' },
              { val: '100%', label: 'Authenticit\u00e9' },
              { val: '48h', label: 'Livraison Abidjan' },
              { val: '5\u2605', label: 'Service client' },
            ].map(stat => (
              <div key={stat.val} className="coll-stat" style={{
                padding: '1.5rem',
                border: '1px solid rgba(197,165,90,0.12)',
                textAlign: 'center',
                transition: 'border-color 0.3s, background 0.3s',
              }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--gold)', lineHeight: 1, marginBottom: '0.4rem' }}>{stat.val}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quiz CTA ─────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--noir-soft)', borderTop: '1px solid rgba(197,165,90,0.10)', padding: '4rem 0' }}>
        <div className="container mx-auto" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: 'rgba(255,255,255,0.55)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            &ldquo;Un parfum, c&rsquo;est avant tout une \u00e9motion. Laissez-nous vous aider \u00e0 trouver la v\u00f4tre.&rdquo;
          </p>
          <Link href="/services/quiz-olfactif" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--gold)', textDecoration: 'none', fontWeight: 500,
          }}>
            D\u00e9couvrez votre signature olfactive \u2014 Quiz gratuit
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
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 380px;
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
        .coll-stat:hover {
          border-color: rgba(197,165,90,0.3);
          background: rgba(197,165,90,0.04);
        }
        @media (max-width: 640px) {
          .coll-grid { grid-template-columns: 1fr; }
          .coll-card { min-height: 280px; padding: 2rem; }
        }
      `}</style>
    </div>
  );
}
