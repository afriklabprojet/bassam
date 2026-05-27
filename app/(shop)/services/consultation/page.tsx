import type { Metadata } from 'next';
import Link from 'next/link';
import { getApprovedReviews } from '@/lib/supabase/reviews';
import { getSiteSettings } from '@/lib/site-settings';
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
    titre: "Profil olfactif",
    description: "Vos préférences, souvenirs et mode de vie — la fondation de chaque recommandation.",
  },
  {
    num: '02',
    titre: "Exploration sensorielle",
    description: "Une sélection de fragrances choisies pour vous. Nous observons vos intuitions et coups de cœur.",
  },
  {
    num: '03',
    titre: "Sélection & suivi",
    description: "4 à 8 parfums idéaux, récapitulatif écrit et suivi WhatsApp post-séance inclus.",
  },
];

const faq = [
  {
    q: "En ligne ou en présentiel ?",
    r: "Les deux. En présentiel à Abidjan sur rendez-vous, ou en visio via WhatsApp ou Google Meet — nous adaptons la sélection à votre ville.",
  },
  {
    q: "Dois-je acheter un parfum après ?",
    r: "Non. La consultation est un service indépendant, sans aucune obligation d'achat.",
  },
  {
    q: "Comment se déroule le paiement ?",
    r: "Par Mobile Money (Orange Money, MTN Money, Wave, Moov Money, Djamo). Le règlement confirme votre rendez-vous.",
  },
  {
    q: "Puis-je annuler ou reporter ?",
    r: "Oui, jusqu'à 24h avant. En cas d'annulation tardive, les frais restent acquis mais nous proposons un report dans les 3 mois.",
  },
];

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function ConsultationPage() {
  const [reviews, settings] = await Promise.all([
    getApprovedReviews(2).catch(() => []),
    getSiteSettings(),
  ]);

  const consultant = {
    name: settings.consultant_name || 'VIP Parfumerie Bar',
    photoUrl: settings.consultant_photo_url || '',
    whatsappNumber: settings.whatsapp_number || '',
    whatsappDisplay: settings.whatsapp_display || '',
    email: settings.support_email || 'contact@vipparfumeriebar.com',
  };

  return (
    <main>

      {/* ══════════════════════════════════════════════════
          HERO — compact
      ══════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--noir)',
        paddingTop: 96,
        paddingBottom: 48,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(197,165,90,0.06) 0%, transparent 50%)', pointerEvents: 'none' }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.25 }} aria-hidden="true" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Link href="/services" style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Services</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.625rem' }}>/</span>
            <span style={{ fontSize: '0.625rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Consultation</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 340px', maxWidth: 560 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
                <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Service premium</span>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
                fontWeight: 300,
                color: '#fff',
                lineHeight: 1.08,
                margin: '0 0 18px',
                letterSpacing: '-0.01em',
              }}>
                Consultation<br />
                <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Olfactive Privée.</em>
              </h1>
              <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: '0 0 32px' }}>
                Un rendez-vous sur-mesure avec notre experte pour construire votre garde-robe olfactive.
              </p>
              <a href="#reserver" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 28px', background: 'var(--gold)', color: 'var(--noir)', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 3 }}>
                Réserver ma séance ↓
              </a>
            </div>

            {/* Stats inline */}
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} className="hero-stats">
              {[
                { v: '60–90 min', l: 'durée' },
                { v: 'Visio / présentiel', l: 'format' },
                { v: '+500', l: 'séances' },
              ].map((s) => (
                <div key={s.l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(197,165,90,0.12)', padding: '14px 20px', textAlign: 'center', minWidth: 110 }}>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 300, color: 'var(--gold)', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{s.v}</p>
                  <p style={{ fontSize: '0.5625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', margin: '5px 0 0' }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FORMULAIRE RDV — priorité #1
      ══════════════════════════════════════════════════ */}
      <section id="reserver" style={{ background: 'var(--surface)', padding: '72px 0' }}>
        <div className="container">
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
                <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Réservation</span>
                <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 10px', lineHeight: 1.2 }}>
                Réservez votre{' '}
                <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>séance.</em>
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                Réponse sous 24h · Paiement Mobile Money à la confirmation
              </p>
            </div>

            <ConsultationForm siteUrl={SITE_URL} consultant={consultant} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PROCESSUS
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--offwhite)', padding: '72px 0', borderTop: '1px solid var(--line-light)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 300, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              Comment ça se passe
            </h2>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', letterSpacing: '0.05em' }}>3 étapes · 60 à 90 minutes</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }} className="processus-grid">
            {processus.map((p, i) => (
              <div key={p.num} style={{ background: '#fff', padding: '28px 24px', borderTop: `2px solid ${i === 0 ? 'var(--gold)' : 'var(--line-light)'}` }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 300, color: 'rgba(197,165,90,0.35)', display: 'block', marginBottom: 14, lineHeight: 1 }}>{p.num}</span>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px', lineHeight: 1.3 }}>{p.titre}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TÉMOIGNAGES
      ══════════════════════════════════════════════════ */}
      {reviews.length > 0 && (
        <section style={{ background: 'var(--surface)', padding: '64px 0', borderTop: '1px solid var(--line-light)' }}>
          <div className="container">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.25rem, 2vw, 1.75rem)', fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 32px', lineHeight: 1.2 }}>
              Ce qu&apos;elles en disent
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }} className="testi-grid">
              {reviews.map((t) => (
                <div key={t.id} style={{ background: '#fff', padding: '32px 28px', borderLeft: '3px solid var(--gold)' }}>
                  <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.75, margin: '0 0 20px' }}>
                    &ldquo;{t.texte}&rdquo;
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold-muted)', border: '1px solid rgba(197,165,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--gold)' }}>{t.name[0]}</span>
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
      )}

      {/* ══════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--offwhite)', padding: '64px 0', borderTop: '1px solid var(--line-light)' }}>
        <div className="container">
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.25rem, 2vw, 1.75rem)', fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 28px', lineHeight: 1.2 }}>
              Questions fréquentes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {faq.map((item) => (
                <div key={item.q} style={{ background: '#fff', padding: '20px 24px', borderLeft: '2px solid var(--line-light)' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>{item.q}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{item.r}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA bas
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--noir)', padding: '48px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: 300, color: '#fff', margin: '0 0 4px' }}>
              Pas encore certain(e) ?
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Commencez par notre quiz gratuit pour explorer votre profil.</p>
          </div>
          <Link href="/services/quiz-olfactif" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 22px', background: 'var(--gold)', color: 'var(--noir)', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 3, flexShrink: 0 }}>
            Quiz olfactif gratuit →
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 767px) {
          .hero-stats { display: none !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .processus-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 768px) and (max-width: 900px) {
          .processus-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </main>
  );
}
