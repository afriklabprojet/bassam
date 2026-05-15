import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types/product.types';

export const metadata: Metadata = {
  title: 'Parfums Mixtes | VIP Parfumerie Bar',
  description: 'Collection mixte — Fragrances unisexes qui transcendent les genres. Baccarat Rouge, Oud Wood, Bvlgari Man. Pour ceux qui choisissent à l’instinct.',
};

// ─── Manifesto sections ───────────────────────────────────────────────────────
const PHILOSOPHIE = [
  {
    num: '01',
    titre: 'Au-delà des codes',
    texte: 'La parfumerie unisexe refuse la catégorisation binaire. Elle valorise l’essence pure de la fragrance, sans contexte de genre.',
  },
  {
    num: '02',
    titre: 'La peau comme territoire',
    texte: 'Sur chaque peau, un parfum mixte donne un résultat différent. C’est ce qui rend ces compositions si intimes.',
  },
  {
    num: '03',
    titre: 'Sélectionné à la main',
    texte: 'Nous choisissons uniquement les mixtes de caractère — ceux qui ont leur propre signature, reconnaissables entre mille.',
  },
];

// ─── Signature accords ────────────────────────────────────────────────────────
const ACCORDS = [
  { accord: 'Oud & Vanille', profil: 'Chaud · Enveloppant · Sensuel', repere: 'Baccarat Rouge 540' },
  { accord: 'Boisé Sec', profil: 'Austere · Moderne · Durable', repere: 'Oud Wood TF' },
  { accord: 'Iris & Musc', profil: 'Poudré · Délicat · Signature', repere: 'Infusion d’Iris Prada' },
  { accord: 'Agrumes & Ambre', profil: 'Vivant · Solaire · Élégant', repere: 'Neroli Portofino TF' },
  { accord: 'Cuir & Rose', profil: 'Fort · Dramatique · Contrasté', repere: 'Portrait of a Lady Frederic Malle' },
  { accord: 'Cédre & Musc', profil: 'Propre · Minimal · Inédit', repere: 'Escentric 01' },
];

// ─── Marques mixtes phares ────────────────────────────────────────────────────
const MAISONS = [
  { nom: 'Maison Francis Kurkdjian', specialite: 'L’avant-garde olfactive' },
  { nom: 'Tom Ford', specialite: 'Luxe hédoniste' },
  { nom: 'Le Labo', specialite: 'Minimalisme signature' },
  { nom: 'Byredo', specialite: 'Identité sensorielle' },
  { nom: 'Initio Parfums', specialite: 'Aphrodiésiaques scientifiques' },
  { nom: 'Frederic Malle', specialite: 'Haute couture olfactive' },
];

// ─── Data ─────────────────────────────────────────────────────────────────────
async function getMixteProducts(): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/products?gender=mixte`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function MixtePage() {
  const products = await getMixteProducts();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--noir)' }}>

      {/* ── Hero — full width manifesto ────────────────────────────────────── */}
      <section style={{ padding: '7rem 0 5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Gradient — vert nuit + or */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(60,90,60,0.08) 0%, transparent 55%)' }} aria-hidden="true" />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 60%, rgba(197,165,90,0.07) 0%, transparent 50%)' }} aria-hidden="true" />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197,165,90,0.2), transparent)' }} aria-hidden="true" />

        <div className="container mx-auto" style={{ position: 'relative' }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.12em' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Accueil</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <Link href="/collections" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Collections</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span style={{ color: 'var(--gold)' }}>Mixte</span>
          </nav>

          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path d="M14 20c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6z" stroke="#C5A55A" strokeWidth="1.5"/>
                <path d="M10 10l5 5M30 10l-5 5M10 30l5-5M30 30l-5-5" stroke="#C5A55A" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
                Au-delà des genres
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(3rem, 7vw, 5.5rem)',
              fontWeight: 300,
              color: 'var(--surface)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              marginBottom: '1.5rem',
            }}>
              Mixte
            </h1>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1rem, 2vw, 1.35rem)', color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              &ldquo;Un parfum n&rsquo;a pas de genre. Il a une âme.&rdquo;
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: '2.5rem' }}>
              Des compositions olfactives qui transcendent les catégories. Pour ceux qui choisissent leur parfum à l’instinct, sans compromis, sans convention.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="#produits" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--gold)', color: 'var(--noir)',
                padding: '0.8rem 1.75rem',
                fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
                textDecoration: 'none',
              }}>
                Découvrir la collection
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
        </div>
      </section>

      {/* ── Philosophie ──────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--noir-soft)', borderTop: '1px solid rgba(197,165,90,0.10)', borderBottom: '1px solid rgba(197,165,90,0.10)', padding: '4.5rem 0' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
            <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
              Notre approche
            </span>
          </div>
          <div className="mixte-phil-grid">
            {PHILOSOPHIE.map((p) => (
              <div key={p.num} style={{ padding: '2rem', border: '1px solid rgba(197,165,90,0.10)', background: 'var(--noir)' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 300, color: 'rgba(197,165,90,0.15)', display: 'block', marginBottom: '1rem', lineHeight: 1 }}>{p.num}</span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 400, color: 'var(--surface)', marginBottom: '0.75rem' }}>{p.titre}</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.75 }}>{p.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Accords signatures ────────────────────────────────────────────── */}
      <section className="container mx-auto" style={{ padding: '4.5rem 0', borderBottom: '1px solid rgba(197,165,90,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
          <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
            Accords signatures
          </span>
        </div>
        <div className="mixte-accords-grid">
          {ACCORDS.map((a) => (
            <div key={a.accord} style={{ padding: '1.5rem', border: '1px solid rgba(197,165,90,0.09)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 400, color: 'var(--surface)' }}>{a.accord}</h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{a.profil}</p>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.28)', marginTop: '0.25rem' }}>{a.repere}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Maisons ──────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--noir-soft)', borderBottom: '1px solid rgba(197,165,90,0.08)', padding: '4rem 0' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
            <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
              Maisons représentées
            </span>
          </div>
          <div className="mixte-maisons-grid">
            {MAISONS.map((m) => (
              <div key={m.nom} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(197,165,90,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 400, color: 'var(--surface)' }}>{m.nom}</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.3)' }}>{m.specialite}</span>
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
                Parfums Mixtes
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
              {products.length > 0 ? `${products.length} référence${products.length > 1 ? 's' : ''}` : 'Sélection disponible en boutique'}
            </p>
          </div>
          <Link href="/produits?gender=mixte" style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
          }}>
            Filtres avancés →
          </Link>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.1rem', color: 'rgba(255,255,255,0.3)', marginBottom: '2rem' }}>
              Chargement de la collection mixte…
            </p>
            <Link href="/produits?gender=mixte" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: '1px solid rgba(197,165,90,0.35)',
              color: 'var(--gold)', padding: '0.75rem 1.5rem',
              fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Voir les parfums mixtes
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
                  category={p.gender || 'mixte'}
                  inStock={p.stockQuantity > 0}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <Link href="/produits?gender=mixte" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: '1px solid rgba(197,165,90,0.35)', color: 'var(--gold)',
                padding: '0.8rem 2rem',
                fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}>
                Voir tous les parfums mixtes →
              </Link>
            </div>
          </>
        )}
      </section>

      {/* ── CTA footer ───────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--noir-soft)', borderTop: '1px solid rgba(197,165,90,0.08)', padding: '4.5rem 0' }}>
        <div className="container mx-auto" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
                La création sur-mesure
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, color: 'var(--surface)', lineHeight: 1.25, marginBottom: '1rem' }}>
              Votre fragrance mixte unique, conçue rien que pour vous
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginBottom: '1.75rem' }}>
              Avec notre service de création personnalisée, nos parfumeurs composent un accord exclusif sur votre peau, pour une signature vraiment unique.
            </p>
            <Link href="/services/creation-personnalisee" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--gold)', color: 'var(--noir)',
              padding: '0.8rem 1.75rem',
              fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
              textDecoration: 'none',
            }}>
              Création personnalisée
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Brief créatif', desc: 'Vous décrivez votre univers' },
              { label: 'Formulation', desc: 'Nos parfumeurs composent' },
              { label: 'Livraison', desc: 'Votre flacon gravué' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', border: '1px solid rgba(197,165,90,0.10)', background: 'var(--noir)' }}>
                <div style={{ width: 4, height: 4, background: 'var(--gold)', borderRadius: '50%', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .mixte-phil-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(197,165,90,0.08);
        }
        .mixte-accords-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(197,165,90,0.08);
        }
        .mixte-maisons-grid { display: block; }
        @media (max-width: 900px) {
          .mixte-phil-grid    { grid-template-columns: 1fr; }
          .mixte-accords-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .mixte-accords-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
