import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types/product.types';

export const metadata: Metadata = {
  title: 'Nouveaut\u00e9s | VIP Parfumerie Bar',
  description: 'D\u00e9couvrez les derni\u00e8res arriv\u00e9es chez VIP Parfumerie Bar — fragrances de luxe et soins premium disponibles \u00e0 Abidjan et livraison Afrique de l\u2019Ouest.',
};

// ─── Featured arrivals ────────────────────────────────────────────────────────
const FEATURED: { num: string; nom: string; maison: string; famille: string; note: string }[] = [
  { num: '01', nom: 'Sauvage Elixir', maison: 'Christian Dior', famille: 'Bois\u00e9 Aromatique', note: 'Lavande, Bois de Santal, Ambre' },
  { num: '02', nom: 'Baccarat Rouge 540', maison: 'Maison Francis Kurkdjian', famille: 'Floral Ambr\u00e9', note: 'Safran, C\u00e8dre, Musc' },
  { num: '03', nom: 'Black Phantom', maison: 'Kilian Paris', famille: 'Oriental Gourmand', note: 'Rhum, Caramel, Vanille' },
  { num: '04', nom: 'Oud Satin Mood', maison: 'Maison Francis Kurkdjian', famille: 'Oriental Bois\u00e9', note: 'Oud, Rose, Vanille' },
];

// ─── Data fetcher ─────────────────────────────────────────────────────────────
async function getNewArrivals(): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/products?sort=newest&limit=8`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function NouveautesPage() {
  const products = await getNewArrivals();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--noir)' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 0 4rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 60%, rgba(197,165,90,0.10) 0%, transparent 55%)' }} aria-hidden="true" />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 20%, rgba(197,165,90,0.06) 0%, transparent 50%)' }} aria-hidden="true" />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197,165,90,0.25), transparent)' }} aria-hidden="true" />
        <div className="container mx-auto" style={{ position: 'relative' }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.12em' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Accueil</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <Link href="/collections" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Collections</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span style={{ color: 'var(--gold)' }}>Nouveaut\u00e9s</span>
          </nav>

          <div style={{ maxWidth: 680 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
              <svg width="18" height="18" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path d="M20 4l2.5 10h10l-8 5.5 3 10-7.5-5.5-7.5 5.5 3-10-8-5.5h10z" stroke="#C5A55A" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
                Derni\u00e8res arriv\u00e9es
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 300,
              color: 'var(--surface)',
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              marginBottom: '1.25rem',
            }}>
              Nouveaut\u00e9s
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, maxWidth: 520, marginBottom: '2rem' }}>
              Ce qui vient de poser ses valises chez nous \u2014 les lancements mondiaux les plus exclusifs, disponibles d\u00e8s aujourd&rsquo;hui \u00e0 Abidjan.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>Mis \u00e0 jour chaque semaine</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured ribbon ───────────────────────────────────────────────── */}
      <section style={{ background: 'var(--noir-soft)', borderBottom: '1px solid rgba(197,165,90,0.10)', padding: '3.5rem 0' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
            <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
              S\u00e9lection de la semaine
            </span>
          </div>
          <div className="nov-feat-grid">
            {FEATURED.map((item) => (
              <div key={item.num} className="nov-feat-card" style={{ border: '1px solid rgba(197,165,90,0.12)', padding: '1.75rem' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 300, color: 'rgba(197,165,90,0.15)', lineHeight: 1, display: 'block', marginBottom: '0.75rem' }}>
                  {item.num}
                </span>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  {item.maison}
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, color: 'var(--surface)', marginBottom: '0.5rem' }}>
                  {item.nom}
                </h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                  {item.famille}
                </p>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product grid ─────────────────────────────────────────────────── */}
      <section className="container mx-auto" style={{ padding: '5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
              <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
                Toutes les nouveaut\u00e9s
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
              {products.length > 0 ? `${products.length} r\u00e9f\u00e9rence${products.length > 1 ? 's' : ''}` : 'Collection en cours de chargement'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['Tous', 'Femme', 'Homme', 'Mixte'].map((f) => (
              <Link
                key={f}
                href={f === 'Tous' ? '/collections/nouveautes' : `/collections/${f.toLowerCase()}`}
                style={{
                  display: 'inline-block',
                  padding: '0.4rem 1rem',
                  fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: f === 'Tous' ? 'var(--noir)' : 'rgba(255,255,255,0.5)',
                  background: f === 'Tous' ? 'var(--gold)' : 'transparent',
                  border: f === 'Tous' ? 'none' : '1px solid rgba(197,165,90,0.2)',
                  textDecoration: 'none', fontWeight: f === 'Tous' ? 600 : 400,
                }}
              >
                {f}
              </Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.2rem', color: 'rgba(255,255,255,0.3)', marginBottom: '2rem' }}>
              Nos nouvelles acquisitions arrivent tr\u00e8s bient\u00f4t.
            </p>
            <Link href="/produits" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: '1px solid rgba(197,165,90,0.35)',
              color: 'var(--gold)', padding: '0.75rem 1.5rem',
              fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Voir toute la collection
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.slug}
                name={p.name}
                brand={p.brand}
                price={p.price}
                originalPrice={p.originalPrice ?? undefined}
                image={p.images[0] || '/images/products/product-placeholder.svg'}
                category={p.gender || 'mixte'}
                inStock={p.stockQuantity > 0}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--noir-soft)', borderTop: '1px solid rgba(197,165,90,0.10)', padding: '4rem 0' }}>
        <div className="container mx-auto" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Recevez les nouveaut\u00e9s en avant-premi\u00e8re.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/services/quiz-olfactif" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--gold)', color: 'var(--noir)',
              padding: '0.75rem 1.5rem',
              fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
              textDecoration: 'none',
            }}>
              Quiz olfactif
            </Link>
            <Link href="/collections" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '1px solid rgba(197,165,90,0.35)', color: 'var(--gold)',
              padding: '0.75rem 1.5rem',
              fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Toutes les collections
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .nov-feat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(197,165,90,0.08);
        }
        .nov-feat-card { background: var(--noir); transition: background 0.2s; }
        .nov-feat-card:hover { background: var(--noir-soft); }
        @media (max-width: 900px) {
          .nov-feat-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .nov-feat-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
