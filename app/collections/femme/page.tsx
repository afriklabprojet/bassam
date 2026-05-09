import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types/product.types';

export const metadata: Metadata = {
  title: 'Parfums Femme | VIP Parfumerie Bar',
  description: 'Collection femme \u2014 Floraux enivrants, orientaux profonds, muscs sensuels. Les plus grandes maisons de parfumerie s\u00e9lectionn\u00e9es pour la femme moderne. Livraison Abidjan.',
};

// ─── Olfactive families ───────────────────────────────────────────────────────
const FAMILIES = [
  { nom: 'Floral', icon: '\u2726', description: 'Rose, pivoine, jasmin, fleur d\u2019oranger', exemples: ['Chanel N\u00b05', 'Miss Dior', 'La Vie est Belle'] },
  { nom: 'Oriental', icon: '\u25c6', description: 'Ambre, vanille, musc chaud, r\u00e9sines pr\u00e9cieuses', exemples: ['Black Opium YSL', 'Hypn\u00f4se Lanc\u00f4me', 'Guilty Gucci'] },
  { nom: 'Bois\u00e9 Floral', icon: '\u25cb', description: 'C\u00e8dre, santal, rose, iris', exemples: ['Mon Guerlain', 'Coco Mademoiselle', 'Flora Gucci'] },
  { nom: 'Fruité', icon: '\u25b3', description: 'P\u00eache, framboise, litchi, fruit de la passion', exemples: ['Si Armani', 'Chance Eau Vive', 'Irresistible Givenchy'] },
];

const ICONS: Record<string, string> = {
  'Floral': '\u2726',
  'Oriental': '\u25c6',
  'Bois\u00e9 Floral': '\u25cb',
  'Fruité': '\u25b3',
};

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TEMOIGNAGES = [
  { auteure: 'Ama K.', ville: 'Abidjan', texte: 'Black Opium a chang\u00e9 ma vie. Je ne peux plus m\u2019en passer. Le service \u00e9tait impeccable, livraison le lendemain.' },
  { auteure: 'Fatouma D.', ville: 'Dakar', texte: 'J\u2019ai command\u00e9 Baccarat Rouge 540 \u2014 authentique, emball\u00e9 comme un cadeau de luxe. Je recommande \u00e0 100%.' },
];

// ─── Data ─────────────────────────────────────────────────────────────────────
async function getFemmeProducts(): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/products?gender=femme`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function FemmePage() {
  const products = await getFemmeProducts();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--noir)' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 0 0', position: 'relative', overflow: 'hidden' }}>
        {/* Gradient ambiance féminine — rose-gold */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 30%, rgba(197,130,130,0.10) 0%, transparent 55%)' }} aria-hidden="true" />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 80%, rgba(197,165,90,0.09) 0%, transparent 50%)' }} aria-hidden="true" />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197,165,90,0.2), transparent)' }} aria-hidden="true" />

        <div className="container mx-auto" style={{ position: 'relative' }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.12em' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Accueil</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <Link href="/collections" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Collections</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span style={{ color: 'var(--gold)' }}>Femme</span>
          </nav>

          <div className="femme-hero-grid">
            {/* Left — Text */}
            <div style={{ paddingBottom: '4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
                <svg width="16" height="16" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <circle cx="20" cy="16" r="9" stroke="#C5A55A" strokeWidth="1.5"/>
                  <path d="M20 25v10M15 30h10" stroke="#C5A55A" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
                  Collection f\u00e9minine
                </span>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                fontWeight: 300,
                color: 'var(--surface)',
                lineHeight: 1.0,
                letterSpacing: '-0.02em',
                marginBottom: '1.5rem',
              }}>
                Femme
              </h1>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1rem, 2vw, 1.3rem)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: 440 }}>
                &ldquo;Un parfum est un v\u00eatement invisible, la plus belle robe que vous puissiez porter.&rdquo;
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: 420, marginBottom: '2.5rem' }}>
                Des floraux enivrants aux orientaux profonds, chaque fragrance de notre s\u00e9lection f\u00e9minine a \u00e9t\u00e9 choisie pour son aura, sa tenue et son caracт\u00e8re.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href="#produits" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--gold)', color: 'var(--noir)',
                  padding: '0.8rem 1.75rem',
                  fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
                  textDecoration: 'none',
                }}>
                  Voir la collection
                </Link>
                <Link href="/services/quiz-olfactif" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  border: '1px solid rgba(197,165,90,0.3)', color: 'var(--gold)',
                  padding: '0.8rem 1.5rem',
                  fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                  textDecoration: 'none',
                }}>
                  Quiz olfactif
                </Link>
              </div>
            </div>

            {/* Right — Editorial card */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(197,130,130,0.06) 0%, rgba(197,165,90,0.04) 50%, transparent 100%)',
                border: '1px solid rgba(197,165,90,0.12)',
              }} />
              <div style={{ padding: '3rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '0.25rem' }}>Collection</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--surface)' }}>Femme 2026</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 300, color: 'rgba(197,165,90,0.12)', lineHeight: 1 }}>\u2640</div>
                </div>
                <div style={{ borderTop: '1px solid rgba(197,165,90,0.12)', paddingTop: '2rem' }}>
                  {[
                    { label: 'Maisons repr\u00e9sent\u00e9es', val: '24' },
                    { label: 'Familles olfactives', val: '8' },
                    { label: 'Concentration', val: 'EDP \u00b7 EDP Intense \u00b7 Extrait' },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(197,165,90,0.07)' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>{row.label}</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 500 }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Familles olfactives ───────────────────────────────────────────── */}
      <section style={{ border: 'none', borderTop: '1px solid rgba(197,165,90,0.10)', borderBottom: '1px solid rgba(197,165,90,0.10)', background: 'var(--noir-soft)', padding: '4rem 0' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
            <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
              Familles olfactives
            </span>
          </div>
          <div className="femme-fam-grid">
            {FAMILIES.map((fam) => (
              <div key={fam.nom} style={{ padding: '1.75rem', border: '1px solid rgba(197,165,90,0.10)', background: 'var(--noir)' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '0.75rem' }} aria-hidden="true">{fam.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 400, color: 'var(--surface)', marginBottom: '0.4rem' }}>{fam.nom}</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7125rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, marginBottom: '1rem' }}>{fam.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {fam.exemples.map((ex) => (
                    <span key={ex} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
                      \u2014 {ex}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Produits ─────────────────────────────────────────────────────── */}
      <section id="produits" className="container mx-auto" style={{ padding: '5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
              <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
                Parfums Femme
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
              {products.length > 0 ? `${products.length} r\u00e9f\u00e9rence${products.length > 1 ? 's' : ''}` : 'S\u00e9lection disponible en boutique'}
            </p>
          </div>
          <Link href="/produits?gender=femme" style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
          }}>
            Filtres avanc\u00e9s \u2192
          </Link>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.1rem', color: 'rgba(255,255,255,0.3)', marginBottom: '2rem' }}>
              Chargement de la collection en cours\u2026
            </p>
            <Link href="/produits?gender=femme" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: '1px solid rgba(197,165,90,0.35)',
              color: 'var(--gold)', padding: '0.75rem 1.5rem',
              fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Voir tous les parfums femme
            </Link>
          </div>
        ) : (
          <>
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
                  category={p.gender || 'femme'}
                  inStock={p.stockQuantity > 0}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <Link href="/produits?gender=femme" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: '1px solid rgba(197,165,90,0.35)', color: 'var(--gold)',
                padding: '0.8rem 2rem',
                fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}>
                Voir tous les parfums femme \u2192
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── T\u00e9moignages ──────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--noir-soft)', borderTop: '1px solid rgba(197,165,90,0.08)', padding: '5rem 0' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
            <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
              Elles en parlent
            </span>
          </div>
          <div className="femme-temo-grid">
            {TEMOIGNAGES.map((t, i) => (
              <div key={i} style={{ background: 'var(--noir)', padding: '2rem', borderLeft: '2px solid var(--gold)' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: '1.25rem' }}>
                  &ldquo;{t.texte}&rdquo;
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 500, letterSpacing: '0.08em' }}>{t.auteure}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>{t.ville}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA footer ───────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--noir)', borderTop: '1px solid rgba(197,165,90,0.08)', padding: '4rem 0' }}>
        <div className="container mx-auto" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: 'rgba(255,255,255,0.45)' }}>
              Pas s\u00fbre de votre choix ? Une experte vous guide.
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
              D\u00e9couvrir mon parfum
            </Link>
            <Link href="/services/consultation" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '1px solid rgba(197,165,90,0.35)', color: 'var(--gold)',
              padding: '0.75rem 1.5rem',
              fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Consultation priv\u00e9e
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .femme-hero-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 4rem;
          align-items: start;
        }
        .femme-fam-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(197,165,90,0.08);
        }
        .femme-temo-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .femme-hero-grid { grid-template-columns: 1fr; gap: 2rem; }
          .femme-fam-grid  { grid-template-columns: repeat(2, 1fr); }
          .femme-temo-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .femme-fam-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
