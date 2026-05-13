import type { Metadata } from 'next';
import Link from 'next/link';
import { getAboutStats, getAboutValeurs, getAboutEngagements } from '@/lib/supabase/about-content';

// ISR — revalide toutes les 5 minutes
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'À propos — VIP Parfumerie Bar',
  description:
    "Découvrez l\u2019histoire de VIP Parfumerie Bar, votre maison de parfums de luxe authentiques au cœur de l\u2019Afrique de l\u2019Ouest.",
};

/* ─── Données (DB avec fallback sur les défauts) ──────────── */

/* ─── Composants ─────────────────────────────────────────── */

function GoldRule() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(197,165,90,0.3)' }} />
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', opacity: 0.7 }} />
      <div style={{ flex: 1, height: '1px', background: 'rgba(197,165,90,0.3)' }} />
    </div>
  );
}

function SectionEyebrow({ label }: Readonly<{ label: string }>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{ width: 28, height: '1px', background: 'var(--gold)' }} />
      <span style={{
        fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase',
        color: 'var(--gold)', fontFamily: 'var(--font-sans)', fontWeight: 500,
      }}>{label}</span>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default async function AProposPage() {
  const [stats, valeurs, engagements] = await Promise.all([
    getAboutStats(),
    getAboutValeurs(),
    getAboutEngagements(),
  ]);

  return (
    <main>

      {/* ══════════════════════════════════════════════════════
          HERO — Editorial full-width
      ══════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--noir)',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 120,
        paddingBottom: 100,
      }}>
        {/* Motif radial or */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at 70% 40%, rgba(197,165,90,0.08) 0%, transparent 55%), radial-gradient(circle at 20% 90%, rgba(197,165,90,0.05) 0%, transparent 45%)',
        }} aria-hidden="true" />

        {/* Ligne déco horizontale haut */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--gold) 70%, transparent 100%)', opacity: 0.35 }} aria-hidden="true" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 780 }}>
            <SectionEyebrow label="Notre histoire" />

            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 300,
              color: '#fff',
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              margin: '0 0 28px',
            }}>
              L&apos;excellence olfactive,{' '}
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>au cœur de l&apos;Afrique.</em>
            </h1>

            <p style={{
              fontSize: '1.0625rem',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.8,
              maxWidth: 580,
              margin: '0 0 44px',
            }}>
              VIP Parfumerie Bar est né d&apos;une conviction simple : chaque personne mérite d&apos;accéder
              aux plus beaux parfums du monde, ici, en Afrique de l&apos;Ouest, sans compromis sur
              l&apos;authenticité ni sur l&apos;expérience.
            </p>

            <GoldRule />

            {/* Stats inline */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '2px',
              marginTop: 48,
            }} className="stats-grid">
              {stats.map((s) => (
                <div key={s.slug} className="about-stat" style={{
                  padding: '24px 16px',
                  borderTop: '1px solid rgba(197,165,90,0.2)',
                  transition: 'background 0.3s ease, border-color 0.3s ease',
                  borderRadius: 3,
                }}>
                  <p style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '2.25rem',
                    fontWeight: 300,
                    color: 'var(--gold)',
                    margin: '0 0 4px',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}>{s.value}</p>
                  <p style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          L'HISTOIRE — Texte + déco latérale
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', padding: '96px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }} className="story-grid">

            {/* Texte */}
            <div>
              <SectionEyebrow label="Fondation" />
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3vw, 2.75rem)',
                fontWeight: 300,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                margin: '0 0 28px',
                letterSpacing: '0.01em',
              }}>
                Une maison née de la<br />passion du <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>parfum rare.</em>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                  Fondée à Abidjan en 2022, VIP Parfumerie Bar est née de la frustration de ne pas trouver, en Afrique,
                  des parfums de luxe authentiques à des prix honnêtes. Trop souvent, les Africains se voyaient proposer
                  des contrefaçons, ou devaient faire confiance à des revendeurs opaques.
                </p>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                  Notre fondatrice a décidé de changer cela. Forte de ses connexions avec les distributeurs officiels
                  en Europe, elle a construit une chaîne d&apos;approvisionnement rigoureuse, transparente et traçable —
                  directement depuis les maisons de parfumerie jusqu&apos;à votre porte.
                </p>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                  Aujourd&apos;hui, VIP Parfumerie Bar est la référence des amateurs de beaux parfums en Côte d&apos;Ivoire
                  et au-delà. Plus de 5 000 clients font confiance à notre sélection, notre service et notre engagement
                  pour l&apos;authenticité.
                </p>
              </div>
            </div>

            {/* Déco droite */}
            <div style={{ position: 'relative' }}>
              {/* Grand carré noir */}
              <div style={{
                background: 'var(--noir)',
                borderRadius: 3,
                padding: '52px 44px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Motif radial */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(197,165,90,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} aria-hidden="true" />

                <GoldRule />
                <blockquote style={{ margin: '28px 0' }}>
                  <p style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.5rem',
                    fontWeight: 300,
                    color: '#fff',
                    lineHeight: 1.45,
                    letterSpacing: '0.02em',
                    margin: 0,
                    fontStyle: 'italic',
                  }}>
                    « Le luxe ne devrait pas avoir de frontières. Notre mission est de vous apporter
                    le monde des parfums, ici, chez vous. »
                  </p>
                </blockquote>
                <GoldRule />
                <p style={{ margin: '20px 0 0', fontSize: '0.6875rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
                  La Fondatrice — VIP Parfumerie Bar
                </p>
              </div>

              {/* Petit carré flottant en bas-gauche */}
              <div style={{
                position: 'absolute',
                bottom: -20,
                left: -20,
                width: 80,
                height: 80,
                background: 'var(--gold)',
                opacity: 0.12,
                borderRadius: 3,
              }} aria-hidden="true" />
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          NOS VALEURS — 3 piliers
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--offwhite)', padding: '96px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 64px' }}>
            <SectionEyebrow label="Ce qui nous guide" />
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 300,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: '0.01em',
            }}>
              Trois piliers,{' '}
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>une promesse.</em>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }} className="valeurs-grid">
            {valeurs.map((v) => (
              <div key={v.slug} className="about-valeur" style={{
                background: '#fff',
                padding: '44px 36px',
                borderTop: v.slug === 'valeur-excellence' ? '2px solid var(--gold)' : '2px solid var(--line-light)',
                transition: 'border-color 0.35s ease, transform 0.35s ease, box-shadow 0.35s ease',
              }}>
                <span style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '3rem',
                  fontWeight: 300,
                  color: 'var(--line-light)',
                  lineHeight: 1,
                  marginBottom: 20,
                  letterSpacing: '-0.03em',
                }}>{v.num}</span>
                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.375rem',
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                  margin: '0 0 16px',
                  lineHeight: 1.25,
                }}>{v.titre}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>{v.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          LES MARQUES — Bandeau défilant (statique)
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--noir)', padding: '56px 0', borderTop: '1px solid rgba(197,165,90,0.15)', borderBottom: '1px solid rgba(197,165,90,0.15)' }}>
        <div className="container">
          <p style={{ textAlign: 'center', fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(197,165,90,0.55)', margin: '0 0 32px' }}>
            Maisons que nous distribuons
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '10px 20px',
          }}>
            {['Chanel', 'Dior', 'Yves Saint Laurent', 'Guerlain', 'Givenchy', 'Lancôme', 'Hermès', 'Tom Ford', 'Creed', 'Giorgio Armani', 'Versace', 'Paco Rabanne', 'Carolina Herrera', 'Jo Malone', 'Maison Margiela'].map((m) => (
              <span key={m} className="brand-tag" style={{
                fontSize: '0.625rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                padding: '8px 16px',
                border: '1px solid rgba(197,165,90,0.1)',
                borderRadius: 2,
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                transition: 'color 0.3s ease, border-color 0.3s ease, background 0.3s ease',
              }}>{m}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          NOS ENGAGEMENTS — Grille 2×3
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', padding: '96px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '80px', alignItems: 'start' }} className="engagements-grid">

            {/* Texte accroche tête de colonne */}
            <div style={{ position: 'sticky', top: 100 }}>
              <SectionEyebrow label="Nos engagements" />
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                fontWeight: 300,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                margin: '0 0 20px',
              }}>
                Ce que nous vous<br />
                <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>promettons.</em>
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.75, margin: '0 0 32px' }}>
                Chaque engagement ci-contre est une promesse tenue au quotidien. Notre réputation se construit
                sur votre confiance.
              </p>
              <Link
                href="/contact"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontSize: '0.6875rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--gold)', textDecoration: 'none', fontWeight: 500,
                  borderBottom: '1px solid rgba(197,165,90,0.35)', paddingBottom: 4,
                }}
              >
                Nous contacter
                <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </Link>
            </div>

            {/* Grille engagements */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {engagements.map((e) => (
                <div key={e.slug} className="about-engagement" style={{
                  background: 'var(--offwhite)',
                  padding: '32px 28px',
                  borderLeft: '2px solid var(--line-light)',
                  transition: 'border-color 0.35s ease, transform 0.3s ease, background 0.3s ease',
                }}>
                  <span style={{ display: 'block', fontSize: '0.5rem', color: 'var(--gold)', marginBottom: 14, letterSpacing: 2 }}>◆</span>
                  <h3 style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: '0 0 10px',
                    letterSpacing: '0.02em',
                  }}>{e.titre}</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{e.texte}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA — Rejoindre
      ══════════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--noir)',
        padding: '88px 0',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(197,165,90,0.07) 0%, transparent 65%)',
        }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.3 }} aria-hidden="true" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 620, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 32, height: '1px', background: 'rgba(197,165,90,0.4)' }} />
              <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)' }}>Rejoignez-nous</span>
              <div style={{ width: 32, height: '1px', background: 'rgba(197,165,90,0.4)' }} />
            </div>

            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 4vw, 3.25rem)',
              fontWeight: 300,
              color: '#fff',
              lineHeight: 1.15,
              margin: '0 0 20px',
              letterSpacing: '-0.01em',
            }}>
              Prêt(e) à découvrir votre<br />
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>signature olfactive ?</em>
            </h2>

            <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 44px' }}>
              Explorez nos collections, passez notre quiz olfactif IA ou prenez rendez-vous pour
              une consultation privée. L&apos;expérience VIP commence ici.
            </p>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/produits"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  height: 50, padding: '0 32px',
                  background: 'var(--gold)',
                  color: 'var(--noir)',
                  textDecoration: 'none',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  borderRadius: 3,
                }}
              >
                Voir les collections
                <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                </svg>
              </Link>
              <Link
                href="/services/quiz-olfactif"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  height: 50, padding: '0 32px',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                Quiz olfactif IA
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 1023px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .story-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .valeurs-grid { grid-template-columns: 1fr !important; }
          .engagements-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
        @media (max-width: 639px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </main>
  );
}
