import type { Metadata } from 'next';
import Link from 'next/link';
import { getApprovedReviews } from '@/lib/supabase/reviews';
import { getServicesContent } from '@/lib/supabase/services-content';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vipparfumeriebar.com';

export const metadata: Metadata = {
  title: 'Services — VIP Parfumerie Bar Abidjan',
  description: "Quiz olfactif IA, consultation privée et création de parfum sur-mesure à Abidjan. L'expertise du luxe à votre service en Côte d'Ivoire.",
  keywords: "parfum sur-mesure Abidjan, consultation parfum Côte d'Ivoire, quiz olfactif, création parfum personnalisé Abidjan",
  alternates: { canonical: `${BASE_URL}/services` },
};

/* ─── Data ───────────────────────────────────────────────── */

const services = [
  {
    num: '01',
    slug: 'creation-personnalisee',
    titre: 'Création Personnalisée',
    accroche: 'Un parfum unique, le vôtre.',
    description:
      "Nous composons pour vous une fragrance exclusive — accord sur-mesure, numéroté. Un objet de luxe signé à votre nom.",
    details: [
      'Formulation artisanale exclusive',
      'Accord & notes sur-mesure',
      'Coffret luxe avec certificat',
      'Idéal comme cadeau prestige',
    ],
    cta: 'Créer mon parfum',
    tag: 'Sur-mesure',
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2410 100%)',
    dot: '#C5A55A',
    icon: (
      <svg width={32} height={32} fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    num: '02',
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
    gradient: 'linear-gradient(135deg, #F9EFE8 0%, #EDD9C8 100%)',
    dot: '#C5A55A',
    icon: (
      <svg width={32} height={32} fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    num: '03',
    slug: 'consultation',
    titre: 'Consultation Privée',
    accroche: 'L’expertise à votre écoute.',
    description:
      "Un rendez-vous exclusif avec notre experte parfumerie. Nous construisons ensemble votre garde-robe olfactive, selon votre personnalité et vos envies.",
    details: [
      'Séance de 60 à 90 minutes',
      'Analyse de votre profil olfactif',
      'Sélection de 6 à 10 fragrances',
      'Disponible en présentiel ou visio',
    ],
    cta: 'Prendre rendez-vous',
    tag: 'Sur rendez-vous',
    gradient: 'linear-gradient(135deg, #EEF1F5 0%, #D6DDE7 100%)',
    dot: '#7896B2',
    icon: (
      <svg width={32} height={32} fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];


/* ─── Page ───────────────────────────────────────────────── */

export default async function ServicesPage() {
  const [reviews, servicesContent] = await Promise.all([
    getApprovedReviews(1).catch(() => []),
    getServicesContent(),
  ]);
  const featuredReview = reviews[0] ?? null;

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

          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, maxWidth: 540, margin: 0 }}>
            Du quiz de découverte à la création exclusive, nos services vous guident vers
            la fragrance qui vous ressemble.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SERVICES — cartes style catalogue
      ══════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '80px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="svc-cards-grid">
            {servicesData.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="group svc-card-link"
                style={{ display: 'block', textDecoration: 'none', borderRadius: 'var(--r-lg)', border: '1px solid var(--line-light)', overflow: 'hidden', background: '#fff', transition: 'box-shadow 0.3s ease, transform 0.3s ease' }}
              >
                {/* Visuel couleur */}
                <div style={{
                  height: '11rem',
                  background: s.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div aria-hidden style={{
                    position: 'absolute', bottom: '-3rem', right: '-3rem',
                    width: '9rem', height: '9rem',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                  }} />
                  <div style={{
                    width: 72, height: 72,
                    borderRadius: '50%',
                    border: '1px solid rgba(197,165,90,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: s.slug === 'creation-personnalisee' ? 'var(--gold)' : 'var(--gold)',
                    position: 'relative', zIndex: 1,
                    background: s.slug === 'creation-personnalisee' ? 'rgba(197,165,90,0.1)' : 'rgba(255,255,255,0.6)',
                  }}>
                    {s.icon}
                  </div>
                </div>

                {/* Corps de la carte */}
                <div style={{ padding: '1.5rem', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                    <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {s.accroche}
                    </p>
                  </div>

                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {s.titre}
                  </h2>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.125rem' }}>
                    {s.description}
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {s.details.map((d) => (
                      <li key={d} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg width={12} height={12} fill="none" stroke="var(--gold)" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{d}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--line-light)' }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, background: 'var(--offwhite)', color: 'var(--text-secondary)', border: '1px solid var(--line-light)' }}>
                      {s.tag}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {s.cta}
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 52, padding: '0 32px', background: 'var(--noir)', color: '#fff', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 'var(--r-sm)' }}
          >
            Démarrer le quiz gratuit
            <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .svc-cards-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .svc-cards-grid { grid-template-columns: 1fr !important; }
        }
        .svc-card-link:hover {
          box-shadow: 0 12px 40px rgba(8,8,8,0.1);
          transform: translateY(-2px);
        }
      `}</style>
    </main>
  );
}
