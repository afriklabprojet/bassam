import type { Metadata } from 'next';
import Link from 'next/link';
import { getApprovedReviews } from '@/lib/supabase/reviews';
import { getServicesContent } from '@/lib/supabase/services-content';

export const metadata: Metadata = {
  title: 'Services \u2014 VIP Parfumerie Bar',
  description:
    "Découvrez nos services premium : quiz olfactif IA, consultation privée et création de parfum sur-mesure. L'expertise du luxe à votre service.",
};

/* ─── Data ───────────────────────────────────────────────── */

const services = [
  {
    num: '01',
    slug: 'quiz-olfactif',
    titre: 'Quiz Olfactif IA',
    accroche: 'Votre signature en 5 minutes.',
    description:
      "Notre algorithme analyse vos préférences — humeur, occasion, notes aimées — et vous recommande les parfums qui vous correspondent avec précision.",
    details: [
      '5 étapes guidées',
      'Résultats personnalisés instantanés',
      'Recommandations de 3 à 6 fragrances',
      'Gratuit & sans inscription',
    ],
    cta: 'Démarrer le quiz',
    tag: 'Gratuit',
    icon: (
      <svg width={28} height={28} fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    bg: 'var(--noir)',
    light: false,
  },
  {
    num: '02',
    slug: 'consultation',
    titre: 'Consultation Privée',
    accroche: 'L\u2019expertise à votre écoute.',
    description:
      "Un rendez-vous exclusif avec notre experte parfumerie. Nous construisons ensemble votre garde-robe olfactive, selon votre personnalité, vos envies et votre budget.",
    details: [
      'Séance de 60 à 90 minutes',
      'Analyse de votre profil olfactif',
      'Sélection de 6 à 10 fragrances',
      'Disponible en présentiel ou visio',
    ],
    cta: 'Prendre rendez-vous',
    tag: 'Sur rendez-vous',
    icon: (
      <svg width={28} height={28} fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    bg: 'var(--offwhite)',
    light: true,
  },
  {
    num: '03',
    slug: 'creation-personnalisee',
    titre: 'Création Personnalisée',
    accroche: 'Un parfum unique, le vôtre.',
    description:
      "Nous composons pour vous une fragrance exclusive — accord sur-mesure, flacon gravé, coffret cadeau. Un objet de luxe signé à votre nom.",
    details: [
      'Formulation artisanale exclusive',
      'Flacon numéroté & gravé à votre nom',
      'Coffret luxe avec certificat',
      'Idéal comme cadeau prestige',
    ],
    cta: 'Créer mon parfum',
    tag: 'Sur-mesure',
    icon: (
      <svg width={28} height={28} fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    bg: 'var(--noir-soft)',
    light: false,
  },
];

const stats = [
  { v: '2\u202Fmin', l: 'Temps moyen quiz' },
  { v: '98%', l: 'Satisfaction clients' },
  { v: '500+', l: 'Consultations réalisées' },
  { v: '3', l: 'Services exclusifs' },
];

/* ─── Page ───────────────────────────────────────────────── */

export default async function ServicesPage() {
  const [reviews, servicesContent] = await Promise.all([
    getApprovedReviews(1).catch(() => []),
    getServicesContent(),
  ]);
  const featuredReview = reviews[0] ?? null;

  // Merge DB content over hardcoded fallbacks
  const servicesData = services.map((s) => {
    const db = servicesContent.find((c) => c.slug === s.slug);
    return {
      ...s,
      titre: db?.titre ?? s.titre,
      accroche: db?.accroche ?? s.accroche,
      description: db?.description ?? s.description,
      details: db?.details ?? s.details,
      cta: db?.cta_label ?? s.cta,
      tag: db?.tag ?? s.tag,
    };
  });

  return (
    <main>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--noir)',
        paddingTop: 120,
        paddingBottom: 88,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 40%, rgba(197,165,90,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.3 }} aria-hidden="true" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 24, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Expertise & Services</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 300,
            color: '#fff',
            lineHeight: 1.05,
            margin: '0 0 24px',
            letterSpacing: '-0.02em',
          }}>
            L&rsquo;art du parfum,{' '}
            <br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>à votre mesure.</em>
          </h1>

          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, maxWidth: 540, margin: '0 0 52px' }}>
            Du quiz de découverte à la création exclusive, nos services vous guident vers
            la fragrance qui vous ressemble. Une expérience olfactive personnalisée,
            pensée pour vous.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            {stats.map((s) => (
              <div key={s.l} className="svc-stat">
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>{s.v}</p>
                <p style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '5px 0 0', transition: 'color 0.3s ease' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SERVICES — cards empilées
      ══════════════════════════════════════════════════ */}
      {servicesData.map((s, i) => (
        <section key={s.slug} style={{ background: s.bg, padding: '96px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="container">
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '80px',
              alignItems: 'center',
            }} className={`svc-grid${i}`}>

              {/* Texte */}
              <div style={{ order: i % 2 === 0 ? 0 : 1 }} className="svc-txt">
                {/* Numéro + eyebrow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <span style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '4rem',
                    fontWeight: 300,
                    color: s.light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)',
                    lineHeight: 1,
                  }}>{s.num}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 18, height: '1px', background: 'var(--gold)' }} />
                      <span style={{ fontSize: '0.5625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>{s.tag}</span>
                    </div>
                  </div>
                </div>

                <h2 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                  fontWeight: 300,
                  color: s.light ? 'var(--text-primary)' : '#fff',
                  lineHeight: 1.1,
                  margin: '0 0 8px',
                }}>
                  {s.titre}
                </h2>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--gold)', margin: '0 0 20px' }}>{s.accroche}</p>

                <p style={{ fontSize: '0.9375rem', color: s.light ? 'var(--text-secondary)' : 'rgba(255,255,255,0.5)', lineHeight: 1.8, margin: '0 0 32px', maxWidth: 440 }}>
                  {s.description}
                </p>

                {/* Liste détails */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {s.details.map((d) => (
                    <li key={d} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width={14} height={14} fill="none" stroke="var(--gold)" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span style={{ fontSize: '0.875rem', color: s.light ? 'var(--text-secondary)' : 'rgba(255,255,255,0.55)' }}>{d}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/services/${s.slug}`}
                  className="svc-cta-gold"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    height: 48, padding: '0 28px',
                    background: 'var(--gold)', color: 'var(--noir)',
                    textDecoration: 'none',
                    fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
                    borderRadius: 3,
                    transition: 'background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                >
                  {s.cta}
                  <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                  </svg>
                </Link>
              </div>

              {/* Carte visuelle */}
              <div
                style={{ order: i % 2 === 0 ? 1 : 0 }}
                className="svc-card svc-card-premium"
              >
                <div className="svc-card-inner" style={{
                  aspectRatio: '4/5',
                  maxHeight: 520,
                  background: s.light ? 'var(--noir)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${s.light ? 'transparent' : 'rgba(197,165,90,0.12)'}`,
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 24,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
                }}>
                  {/* Background glow */}
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(197,165,90,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} aria-hidden="true" />
                  {/* Corner ornaments */}
                  <div style={{ position: 'absolute', top: 16, left: 16, width: 30, height: 30, borderTop: '1px solid rgba(197,165,90,0.4)', borderLeft: '1px solid rgba(197,165,90,0.4)' }} aria-hidden="true" />
                  <div style={{ position: 'absolute', bottom: 16, right: 16, width: 30, height: 30, borderBottom: '1px solid rgba(197,165,90,0.4)', borderRight: '1px solid rgba(197,165,90,0.4)' }} aria-hidden="true" />

                  {/* Icon */}
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    border: '1px solid rgba(197,165,90,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--gold)',
                    position: 'relative', zIndex: 1,
                  }}>
                    {s.icon}
                  </div>

                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 32px' }}>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 300, color: '#fff', margin: '0 0 8px' }}>{s.titre}</p>
                    <p style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>{s.tag}</p>
                  </div>

                  {/* Decorative horizontal rule */}
                  <div style={{ width: 40, height: '1px', background: 'rgba(197,165,90,0.4)', position: 'relative', zIndex: 1 }} aria-hidden="true" />
                </div>
              </div>

            </div>
          </div>
        </section>
      ))}

      {/* ══════════════════════════════════════════════════
          TESTIMONIAL BAND
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--noir)', padding: '72px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <p style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', margin: '0 0 20px' }}>Ce que disent nos clientes</p>
            {featuredReview ? (
              <>
                <blockquote style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.375rem, 3vw, 2rem)', fontWeight: 300, fontStyle: 'italic', color: '#fff', lineHeight: 1.5, margin: '0 0 24px' }}>
                  &ldquo;{featuredReview.texte}&rdquo;
                </blockquote>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: '1px', background: 'var(--gold)', opacity: 0.4 }} aria-hidden="true" />
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{featuredReview.name}{featuredReview.ville ? ` — ${featuredReview.ville}` : ''}</span>
                  <div style={{ width: 32, height: '1px', background: 'var(--gold)', opacity: 0.4 }} aria-hidden="true" />
                </div>
              </>
            ) : (
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1rem, 2vw, 1.375rem)', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Rejoignez des centaines de clientes satisfaites.</p>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', padding: '72px 0', borderTop: '1px solid var(--line-light)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.5625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', margin: '0 0 14px' }}>Par où commencer ?</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 14px', lineHeight: 1.2 }}>
            Commencez par le quiz.
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', margin: '0 0 36px' }}>Gratuit, rapide, sans engagement.</p>
          <Link
            href="/services/quiz-olfactif"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 52, padding: '0 32px', background: 'var(--noir)', color: '#fff', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 3 }}
          >
            Démarrer le quiz gratuit
            <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 767px) {
          .svc-grid0, .svc-grid1, .svc-grid2 { grid-template-columns: 1fr !important; gap: 40px !important; }
          .svc-card { display: none; }
        }
      `}</style>
    </main>
  );
}
