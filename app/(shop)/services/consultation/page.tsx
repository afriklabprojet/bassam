import type { Metadata } from 'next';
import Link from 'next/link';
import { getApprovedReviews } from '@/lib/supabase/reviews';
import ConsultationForm from '@/components/ConsultationForm';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vipparfumeriebar.com';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Consultation Olfactive Privée à Abidjan | VIP Parfumerie Bar',
  description: "Réservez une consultation olfactive privée à Abidjan avec notre experte. 60 à 90 minutes pour construire votre garde-robe parfum sur-mesure, en présentiel ou en visio.",
  keywords: "consultation parfum Abidjan, conseil olfactif Côte d'Ivoire, consultation privée parfumerie Abidjan",
  alternates: { canonical: `${SITE_URL}/services/consultation` },
  openGraph: {
    title: 'Consultation Olfactive Privée | VIP Parfumerie Bar Abidjan',
    description: "Consultation personnalisée avec une experte en parfumerie à Abidjan.",
    url: `${SITE_URL}/services/consultation`,
    type: 'website',
    locale: 'fr_CI',
  },
};

/* ─── Data ───────────────────────────────────────────────── */

const processus = [
  {
    num: '01',
    titre: "Votre profil olfactif",
    description:
      "Nous explorons ensemble vos préférences, vos souvenirs olfactifs, votre mode de vie. Cette analyse est la fondation de chaque recommandation.",
  },
  {
    num: '02',
    titre: "Exploration sensorielle",
    description:
      "Vous sentez une sélection de 8 à 12 fragrances choisies spécialement pour vous. Nous observons vos réactions, vos intuitions, vos coups de cœur.",
  },
  {
    num: '03',
    titre: "Sélection personnalisée",
    description:
      "Notre experte affine la liste à 4 à 6 parfums idéaux pour vous — avec conseils sur les occasions, les couches olfactives et les associations.",
  },
  {
    num: '04',
    titre: "Récapitulatif & suivi",
    description:
      "Vous repartez avec un récapitulatif écrit de votre profil et des liens directs vers chaque fragrance recommandée dans notre boutique.",
  },
];

const formules = [
  {
    nom: 'Découverte',
    prix: '25\u202F000 FCFA',
    duree: '45 min',
    description: 'Une introduction à votre profil olfactif. Idéal pour trouver un premier parfum signature.',
    inclus: [
      'Analyse rapide de profil',
      'Test de 6 à 8 fragrances',
      'Recommandation de 2 à 3 parfums',
      'Récapitulatif PDF envoyé par email',
    ],
    cta: 'Réserver',
    featured: false,
  },
  {
    nom: 'Signature',
    prix: '45\u202F000 FCFA',
    duree: '90 min',
    description: "Notre formule complète. Nous construisons ensemble toute votre garde-robe olfactive.",
    inclus: [
      'Analyse approfondie de profil',
      'Test de 10 à 15 fragrances',
      'Recommandation de 5 à 8 parfums',
      'Récapitulatif PDF + carte olfactive',
      'Suivi WhatsApp 30 jours',
    ],
    cta: 'Réserver \u2014 Formule signature',
    featured: true,
  },
  {
    nom: 'Cadeau',
    prix: '35\u202F000 FCFA',
    duree: '60 min',
    description: "Offrez une expérience unique. La consultation se fait pour la personne de votre choix.",
    inclus: [
      'Coffret-cadeau envoyé par email',
      'Séance de 60 min pour le bénéficiaire',
      'Sélection de 3 à 5 parfums recommandés',
      'Valable 6 mois',
    ],
    cta: 'Offrir',
    featured: false,
  },
];

const faq = [
  {
    q: "La consultation se fait en ligne ou en présentiel ?",
    r: "Les deux options sont disponibles. En présentiel à Abidjan (sur rendez-vous), ou en visio via WhatsApp ou Google Meet — auquel cas nous sélectionnons des fragrances disponibles dans votre ville.",
  },
  {
    q: "Dois-je acheter un parfum après la consultation ?",
    r: "Absolument pas. La consultation est un service indépendant. Si vous souhaitez commander par la suite, nos prix habituels s'appliquent, sans aucune obligation.",
  },
  {
    q: "Comment se déroule le paiement de la consultation ?",
    r: "Paiement par Mobile Money (Orange Money, MTN Money, Wave, Moov Money, Djamo). Le règlement confirme votre rendez-vous.",
  },
  {
    q: "Puis-je annuler ou reporter mon rendez-vous ?",
    r: "Oui, jusqu'à 24h avant la séance. En cas d'annulation tardive, les frais restent acquis mais nous vous proposons un report dans les 3 mois.",
  },
];

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function ConsultationPage() {
  const reviews = await getApprovedReviews(2).catch(() => []);
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
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 60%, rgba(197,165,90,0.07) 0%, transparent 55%)', pointerEvents: 'none' }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.3 }} aria-hidden="true" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <Link href="/services" style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Services</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.6875rem' }}>/</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Consultation</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'end' }} className="hero-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 24, height: '1px', background: 'var(--gold)' }} />
                <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Service premium</span>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.25rem, 5vw, 4rem)',
                fontWeight: 300,
                color: '#fff',
                lineHeight: 1.05,
                margin: '0 0 22px',
                letterSpacing: '-0.01em',
              }}>
                Consultation<br />
                <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Privée.</em>
              </h1>
              <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, maxWidth: 500, margin: '0 0 40px' }}>
                Un rendez-vous exclusif avec notre experte parfumerie. Nous construisons ensemble
                votre garde-robe olfactive — pour que chaque parfum soit une expression de qui vous êtes.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href="#reserver" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 28px', background: 'var(--gold)', color: 'var(--noir)', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 3 }}>
                  Réserver une séance
                </a>
                <a href="#formules" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, borderRadius: 3 }}>
                  Voir les formules
                </a>
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="hero-badges">
              {[
                { v: '60–90', l: 'minutes' },
                { v: 'Visio', l: 'ou présentiel' },
                { v: '+500', l: 'consultations' },
              ].map((b) => (
                <div key={b.l} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(197,165,90,0.15)', borderRadius: 3, padding: '16px 22px', textAlign: 'center', minWidth: 120 }}>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 300, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>{b.v}</p>
                  <p style={{ fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '6px 0 0' }}>{b.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PROCESSUS
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', padding: '88px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
              <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Comment ça se passe</span>
              <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              Votre séance,{' '}
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>étape par étape.</em>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, position: 'relative' }}>
            {/* Ligne de connexion */}
            <div style={{ position: 'absolute', top: 40, left: '12.5%', right: '12.5%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197,165,90,0.3) 20%, rgba(197,165,90,0.3) 80%, transparent)', zIndex: 0 }} aria-hidden="true" />

            {processus.map((p) => (
              <div key={p.num} style={{ background: '#fff', padding: '32px 24px 28px', borderTop: '2px solid var(--line-light)', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 48, height: 48,
                  border: '1px solid rgba(197,165,90,0.3)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                  background: '#fff',
                }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', fontWeight: 400, color: 'var(--gold)' }}>{p.num}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px', lineHeight: 1.3 }}>{p.titre}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FORMULES
      ══════════════════════════════════════════════════ */}
      <section id="formules" style={{ background: 'var(--noir)', padding: '88px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
              <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Tarifs</span>
              <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300, color: '#fff', margin: 0, lineHeight: 1.2 }}>
              Choisissez votre{' '}
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>formule.</em>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }} className="formules-grid">
            {formules.map((f) => (
              <div key={f.nom} style={{
                background: f.featured ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                border: f.featured ? 'none' : '1px solid rgba(197,165,90,0.12)',
                borderRadius: 3,
                padding: '40px 32px',
                position: 'relative',
              }}>
                {f.featured && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--noir)', color: 'var(--gold)', fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '4px 14px', border: '1px solid rgba(197,165,90,0.4)', borderRadius: 20 }}>
                    Recommandée
                  </div>
                )}
                <p style={{ fontSize: '0.5625rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: f.featured ? 'rgba(8,8,8,0.6)' : 'var(--text-pale)', margin: '0 0 8px', fontWeight: 500 }}>{f.duree}</p>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 300, color: f.featured ? 'var(--noir)' : '#fff', margin: '0 0 4px' }}>{f.nom}</h3>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: f.featured ? 'var(--noir)' : 'var(--gold)', margin: '0 0 12px' }}>{f.prix}</p>
                <div style={{ width: 30, height: '1px', background: f.featured ? 'rgba(8,8,8,0.2)' : 'rgba(197,165,90,0.3)', margin: '0 0 16px' }} aria-hidden="true" />
                <p style={{ fontSize: '0.8125rem', color: f.featured ? 'rgba(8,8,8,0.65)' : 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: '0 0 24px' }}>{f.description}</p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {f.inclus.map((item) => (
                    <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <svg width={13} height={13} fill="none" stroke={f.featured ? 'var(--noir)' : 'var(--gold)'} strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span style={{ fontSize: '0.8125rem', color: f.featured ? 'rgba(8,8,8,0.7)' : 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#reserver"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    height: 46, borderRadius: 3,
                    background: f.featured ? 'var(--noir)' : 'transparent',
                    border: f.featured ? 'none' : '1px solid rgba(197,165,90,0.35)',
                    color: f.featured ? '#fff' : 'var(--gold)',
                    textDecoration: 'none',
                    fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
                  }}
                >
                  {f.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TÉMOIGNAGES
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--offwhite)', padding: '72px 0', borderTop: '1px solid var(--line-light)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }} className="testi-grid">
            {reviews.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-pale)', gridColumn: '1/-1', textAlign: 'center' }}>Les premiers témoignages arrivent bientôt…</p>
            ) : reviews.map((t) => (
              <div key={t.id} style={{ background: '#fff', padding: '36px 32px', borderLeft: '3px solid var(--gold)' }}>
                <svg width={20} height={20} fill="var(--gold)" viewBox="0 0 24 24" style={{ marginBottom: 16, opacity: 0.4 }} aria-hidden="true">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.7, margin: '0 0 20px' }}>
                  &ldquo;{t.texte}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold-muted)', border: '1px solid rgba(197,165,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)' }}>{t.name[0]}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', margin: 0 }}>{t.ville}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FORMULAIRE RDV
      ══════════════════════════════════════════════════ */}
      <section id="reserver" style={{ background: 'var(--surface)', padding: '88px 0' }}>
        <div className="container">
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
                <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Réservation</span>
                <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                Réservez votre{' '}
                <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>séance.</em>
              </h2>
            </div>

            <ConsultationForm siteUrl={SITE_URL} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--offwhite)', padding: '72px 0', borderTop: '1px solid var(--line-light)' }}>
        <div className="container">
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 36px', lineHeight: 1.2 }}>
              Questions fréquentes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {faq.map((item, i) => (
                <div key={i} style={{ background: '#fff', padding: '24px 28px', borderLeft: '2px solid var(--line-light)' }}>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>{item.q}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{item.r}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA bas
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--noir)', padding: '56px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 300, color: '#fff', margin: '0 0 6px' }}>
              Pas encore certain(e) ?
            </p>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Commencez par notre quiz gratuit.</p>
          </div>
          <Link href="/services/quiz-olfactif" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 24px', background: 'var(--gold)', color: 'var(--noir)', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 3, flexShrink: 0 }}>
            Quiz olfactif gratuit →
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 767px) {
          .hero-badges { display: none; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .formules-grid { grid-template-columns: 1fr !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .processus-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </main>
  );
}
