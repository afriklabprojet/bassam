import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types/product.types';
import { getApprovedReviews } from '@/lib/supabase/reviews';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Parfums Homme | VIP Parfumerie Bar',
  description: 'Collection homme \u2014 Bois\u00e9s \u00e9l\u00e9gants, orientaux intenses, signatures fraiches. Sauvage, Bleu de Chanel, Tom Ford. Livraison Abidjan et Afrique de l\u2019Ouest.',
};

// ─── Fragrance guides ─────────────────────────────────────────────────────────
const GUIDES = [
  {
    titre: 'Le Boisé \u00c9l\u00e9gant',
    description: 'C\u00e8dre, v\u00e9tiver, santal \u2014 l\u2019arche temp\u00e9r\u00e9le du gentleman contemporain. Tenue 8-12h.',
    icone: '\u25a1',
    rep: ['Bleu de Chanel', 'Terre d\u2019Herm\u00e8s', 'Wood & Fresh TF'],
  },
  {
    titre: 'L\u2019Oriental Puissant',
    description: 'Oud, ambre, r\u00e9sine \u2014 pour ceux qui assument leur pr\u00e9sence et laissent un sillage m\u00e9morable.',
    icone: '\u25c6',
    rep: ['Oud Wood TF', 'Sauvage Elixir Dior', 'Roja Enigma'],
  },
  {
    titre: 'Le Fra\u00eecs Aquatique',
    description: 'Bergamote, c\u00e9drat, notes marines \u2014 l\u00e9ger, d\u2019une modernit\u00e9 imp\u00e9ccable. Id\u00e9al au bureau.',
    icone: '\u25cb',
    rep: ['Acqua di Gi\u00f2', 'L\u2019Homme YSL', 'Gentleman Givenchy'],
  },
  {
    titre: 'La Signature Chaude',
    description: 'Vanille, cuir, tabac \u2014 une chaleur sensuelle qui s\u2019intensifie sur la peau.',
    icone: '\u25b2',
    rep: ['Spicebomb TF', 'A*Men Mugler', 'Dior Homme Intense'],
  },
];

// ─── Code vestimentaire ───────────────────────────────────────────────────────
const OCCASIONS = [
  { oc: 'Bureau', conseil: 'Pr\u00e9f\u00e9rer les frais et bois\u00e9s l\u00e9gers. Discrets mais pr\u00e9sents.', ex: 'Bleu de Chanel EDP' },
  { oc: 'Soir\u00e9e', conseil: 'Les orientaux et bois\u00e9s intenses dominent la nuit et les \u00e9v\u00e9nements.', ex: 'Sauvage Elixir' },
  { oc: 'Voyage', conseil: 'Un flacon de 50ml EDP dans votre bagage. Discret, polyvalent.', ex: 'Terre d\u2019Herm\u00e8s' },
  { oc: 'Quotidien', conseil: 'Un eau de toilette frais \u2014 rafraichissant sans sur-saturer l\u2019espace.', ex: 'Acqua di Gi\u00f2' },
];
async function getHommeProducts(): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/products?gender=homme`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function HommePage() {
  const [products, reviews] = await Promise.all([
    getHommeProducts(),
    getApprovedReviews(4).catch(() => []),
  ]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--noir)' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 0 0', position: 'relative', overflow: 'hidden' }}>
        {/* Gradient ambiance masculine — bleu nuit + or */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 75% 25%, rgba(80,100,150,0.09) 0%, transparent 55%)' }} aria-hidden="true" />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 70%, rgba(197,165,90,0.08) 0%, transparent 50%)' }} aria-hidden="true" />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197,165,90,0.2), transparent)' }} aria-hidden="true" />

        <div className="container mx-auto" style={{ position: 'relative' }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.12em' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Accueil</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <Link href="/collections" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Collections</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span style={{ color: 'var(--gold)' }}>Homme</span>
          </nav>

          <div className="homme-hero-grid">
            {/* Left — Text */}
            <div style={{ paddingBottom: '4.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
                <svg width="16" height="16" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <circle cx="20" cy="20" r="9" stroke="#C5A55A" strokeWidth="1.5"/>
                  <path d="M27 13l7-7M34 6h-5M34 6v5" stroke="#C5A55A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
                  Collection masculine
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
                Homme
              </h1>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1rem, 2vw, 1.3rem)', color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: 440 }}>
                &ldquo;Le parfum, c&rsquo;est la premi\u00e8re chose que l&rsquo;on remarque et la derni\u00e8re dont on se souvient.&rdquo;
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: 420, marginBottom: '2.5rem' }}>
                Bois\u00e9s \u00e9l\u00e9gants, orientaux intenses, fragrances fraiches \u2014 des signatures masculines qui affirment sans imposer, pour chaque occasion.
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
                <Link href="/services/consultation" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  border: '1px solid rgba(197,165,90,0.3)', color: 'var(--gold)',
                  padding: '0.8rem 1.5rem',
                  fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                  textDecoration: 'none',
                }}>
                  Conseil expert
                </Link>
              </div>
            </div>

            {/* Right — Manifest card */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(80,100,150,0.07) 0%, rgba(197,165,90,0.04) 100%)',
                border: '1px solid rgba(197,165,90,0.12)',
              }} />
              <div style={{ padding: '2.75rem', position: 'relative' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '2rem' }}>
                  Programme olfactif
                </div>
                {[
                  { step: '01', label: 'D\u00e9finissez votre style' },
                  { step: '02', label: 'Choisissez l\u2019intensit\u00e9' },
                  { step: '03', label: 'Faites le quiz' },
                  { step: '04', label: 'Commandez' },
                ].map((s) => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(197,165,90,0.07)' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 300, color: 'rgba(197,165,90,0.25)', lineHeight: 1, minWidth: 36 }}>{s.step}</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}>{s.label}</span>
                  </div>
                ))}
                <div style={{ marginTop: '1.75rem' }}>
                  <Link href="/services/quiz-olfactif" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
                    background: 'transparent', border: '1px solid rgba(197,165,90,0.3)',
                    color: 'var(--gold)', padding: '0.7rem 1rem',
                    fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase',
                    textDecoration: 'none',
                  }}>
                    Trouver ma signature
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Guide des familles ────────────────────────────────────────────── */}
      <section style={{ background: 'var(--noir-soft)', borderTop: '1px solid rgba(197,165,90,0.10)', borderBottom: '1px solid rgba(197,165,90,0.10)', padding: '4.5rem 0' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
            <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
              Guide olfactif
            </span>
          </div>
          <div className="homme-guide-grid">
            {GUIDES.map((g) => (
              <div key={g.titre} style={{ padding: '2rem', border: '1px solid rgba(197,165,90,0.10)', background: 'var(--noir)' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', color: 'var(--gold)', marginBottom: '0.75rem' }} aria-hidden="true">{g.icone}</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 400, color: 'var(--surface)', marginBottom: '0.6rem' }}>{g.titre}</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: '1.25rem' }}>{g.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {g.rep.map((r) => (
                    <span key={r} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
                      \u2014 {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Code vestimentaire ────────────────────────────────────────────── */}
      <section className="container mx-auto" style={{ padding: '4.5rem 0', borderBottom: '1px solid rgba(197,165,90,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
          <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
            Le bon parfum pour chaque moment
          </span>
        </div>
        <div className="homme-occ-grid">
          {OCCASIONS.map((oc) => (
            <div key={oc.oc} style={{ padding: '1.5rem 0', borderBottom: '1px solid rgba(197,165,90,0.08)', display: 'grid', gridTemplateColumns: '120px 1fr auto', alignItems: 'center', gap: '1.5rem' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>{oc.oc}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{oc.conseil}</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{oc.ex}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Produits ─────────────────────────────────────────────────────── */}
      <section id="produits" className="container mx-auto" style={{ padding: '5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
              <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
                Parfums Homme
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
              {products.length > 0 ? `${products.length} r\u00e9f\u00e9rence${products.length > 1 ? 's' : ''}` : 'S\u00e9lection disponible en boutique'}
            </p>
          </div>
          <Link href="/produits?gender=homme" style={{
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
            <Link href="/produits?gender=homme" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: '1px solid rgba(197,165,90,0.35)',
              color: 'var(--gold)', padding: '0.75rem 1.5rem',
              fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Voir tous les parfums homme
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
                  category={p.gender || 'homme'}
                  inStock={p.stockQuantity > 0}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <Link href="/produits?gender=homme" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: '1px solid rgba(197,165,90,0.35)', color: 'var(--gold)',
                padding: '0.8rem 2rem',
                fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}>
                Voir tous les parfums homme \u2192
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── T\u00e9moignages ──────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--noir-soft)', borderTop: '1px solid rgba(197,165,90,0.08)', padding: '4rem 0' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
            <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
              Ils en parlent
            </span>
          </div>
          <div className="homme-temo-grid">
            {reviews.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', gridColumn: '1/-1', textAlign: 'center' }}>Les premiers avis arrivent bientôt…</p>
            ) : reviews.map((t) => (
              <div key={t.id} style={{ background: 'var(--noir)', padding: '2rem', borderLeft: '2px solid var(--gold)' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: '1.25rem' }}>
                  &ldquo;{t.texte}&rdquo;
                </p>
                <div>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 500 }}>{t.name}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{t.ville}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA footer ───────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--noir)', borderTop: '1px solid rgba(197,165,90,0.08)', padding: '4rem 0' }}>
        <div className="container mx-auto" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: 'rgba(255,255,255,0.4)' }}>
            Besoin d&rsquo;un conseil personnalis\u00e9 pour trouver votre signature ?
          </p>
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
        .homme-hero-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 4rem;
          align-items: start;
        }
        .homme-guide-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(197,165,90,0.08);
        }
        .homme-occ-grid { display: block; }
        .homme-temo-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .homme-hero-grid  { grid-template-columns: 1fr; gap: 2rem; }
          .homme-guide-grid { grid-template-columns: repeat(2, 1fr); }
          .homme-occ-grid > div { grid-template-columns: 1fr !important; gap: 0.5rem !important; }
          .homme-temo-grid  { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .homme-guide-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
