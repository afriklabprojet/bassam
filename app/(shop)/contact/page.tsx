import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSettings, hasWhatsApp, buildWhatsAppHref, getPhoneHref, type SiteSettings } from '@/lib/site-settings';
import ContactForm from '@/components/ContactForm';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vip-parfumerie-bar.com';

export const metadata: Metadata = {
  title: 'Contact \u2014 VIP Parfumerie Bar Abidjan',
  description: 'Contactez VIP Parfumerie Bar \u00e0 Abidjan pour vos parfums de luxe. WhatsApp, t\u00e9l\u00e9phone, email \u2014 r\u00e9ponse en moins de 2h. Livraison C\u00f4te d\'Ivoire.',
  keywords: 'contact parfumerie Abidjan, boutique parfum Abidjan t\u00e9l\u00e9phone, VIP Parfumerie Bar contact',
  alternates: { canonical: `${BASE_URL}/contact` },
};

/* ─── Données ───────────────────────────────────────────── */

function buildCanaux(s: SiteSettings) {
  const canaux = [];
  const phoneHref = getPhoneHref(s);
  const whatsappValue = s.whatsapp_display || (s.whatsapp_number ? `+${s.whatsapp_number}` : '');
  const phoneValue = s.support_phone_display || (s.support_phone ? `+${s.support_phone}` : '');

  if (hasWhatsApp(s)) {
    canaux.push({
      icon: (
        <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
        </svg>
      ),
      titre: 'WhatsApp',
      valeur: whatsappValue,
      sous: 'Réponse en moins de 2h — 7j/7',
      href: buildWhatsAppHref(s, 'Bonjour VIP Parfumerie Bar, je souhaite vous contacter.'),
      label: 'Écrire sur WhatsApp',
      extern: true,
    });
  }

  canaux.push({
    icon: (
      <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    titre: 'Email',
    valeur: s.support_email,
    sous: 'Réponse sous 24h ouvrées',
    href: `mailto:${s.support_email}`,
    label: 'Envoyer un email',
    extern: false,
  });

  if (phoneHref && phoneValue) {
    canaux.push({
      icon: (
        <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      ),
      titre: 'Téléphone',
      valeur: phoneValue,
      sous: 'Lun–Sam, 8h–18h',
      href: phoneHref,
      label: 'Appeler',
      extern: false,
    });
  }

  canaux.push({
    icon: (
      <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.3} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    titre: 'Adresse',
    valeur: s.address_display,
    sous: s.address_detail,
    href: undefined,
    label: undefined,
    extern: false,
  });

  return canaux;
}

const faq = [
  {
    q: 'Vos parfums sont-ils 100\u00A0% authentiques\u00A0?',
    r: 'Oui, absolument. Chaque produit est sourcé directement auprès des distributeurs officiels en Europe. Nous fournissons un certificat d\u2019authenticité avec chaque commande.',
  },
  {
    q: 'Quels sont les délais de livraison\u00A0?',
    r: '24 à 72h pour Abidjan. 3 à 5 jours ouvrés pour le reste de l\u2019Afrique de l\u2019Ouest. La livraison est offerte à partir de 50\u00A0000 FCFA d\u2019achat.',
  },
  {
    q: 'Quels modes de paiement acceptez-vous\u00A0?',
    r: 'Orange Money, MTN Money, Wave, Moov Money, Djamo. Toutes les transactions sont sécurisées.',
  },
  {
    q: 'Puis-je retourner un parfum\u00A0?',
    r: 'Oui, dans les 7 jours suivant la réception, si le flacon est non ouvert et dans son emballage d\u2019origine. Contactez-nous par WhatsApp pour initier le retour.',
  },
  {
    q: 'Proposez-vous des consultations olfactives\u00A0?',
    r: 'Oui ! Vous pouvez prendre rendez-vous pour une consultation privée avec notre experte, ou utiliser notre quiz olfactif IA disponible en ligne.',
  },
];

/* ─── Sous-composants ────────────────────────────────────── */

function GoldRule() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(197,165,90,0.3)' }} />
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', opacity: 0.7 }} />
      <div style={{ flex: 1, height: '1px', background: 'rgba(197,165,90,0.3)' }} />
    </div>
  );
}

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <div style={{ width: 24, height: '1px', background: 'var(--gold)' }} />
      <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const canaux = buildCanaux(settings);

  return (
    <main>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--noir)',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 120,
        paddingBottom: 80,
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at 80% 30%, rgba(197,165,90,0.07) 0%, transparent 55%)',
        }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.3 }} aria-hidden="true" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <SectionEyebrow label="Nous écrire" />
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.25rem, 5vw, 4rem)',
            fontWeight: 300,
            color: '#fff',
            lineHeight: 1.1,
            margin: '0 0 20px',
            letterSpacing: '-0.01em',
          }}>
            Parlons{' '}
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>parfum.</em>
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.75,
            maxWidth: 520,
            margin: 0,
          }}>
            Une question sur une commande, un conseil olfactif, une demande de partenariat —
            notre équipe est disponible et répond rapidement par WhatsApp ou email.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CANAUX DE CONTACT — grille 2×2
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', padding: '80px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }} className="canaux-grid">
            {canaux.map((c, i) => (
              <div key={i} className="contact-channel" style={{
                background: '#fff',
                padding: '40px 36px',
                borderTop: '2px solid var(--line-light)',
                position: 'relative',
                transition: 'border-color 0.35s ease, transform 0.35s ease, box-shadow 0.35s ease',
              }}>
                {/* Icône */}
                <div style={{
                  width: 48, height: 48,
                  border: '1px solid var(--line-light)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                  color: 'var(--gold)',
                }}>
                  {c.icon}
                </div>

                <p style={{ fontSize: '0.625rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-pale)', margin: '0 0 6px', fontWeight: 500 }}>
                  {c.titre}
                </p>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', color: 'var(--text-primary)', margin: '0 0 6px', fontWeight: 400 }}>
                  {c.valeur}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 22px', lineHeight: 1.5 }}>
                  {c.sous}
                </p>

                {c.href && c.label && (
                  <a
                    href={c.href}
                    {...(c.extern ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--gold)', textDecoration: 'none', fontWeight: 600,
                      borderBottom: '1px solid rgba(197,165,90,0.35)', paddingBottom: 3,
                    }}
                  >
                    {c.label}
                    <svg width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FORMULAIRE + INFOS
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--offwhite)', padding: '88px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '72px', alignItems: 'start' }} className="form-grid">

            {/* Colonne gauche — texte + services rapide */}
            <div>
              <SectionEyebrow label="Formulaire" />
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                fontWeight: 300,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                margin: '0 0 20px',
              }}>
                Envoyez-nous<br />
                <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>votre message.</em>
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.75, margin: '0 0 40px' }}>
                Décrivez votre besoin ci-contre et nous vous répondrons dans les meilleurs délais.
                {hasWhatsApp(settings) ? ' Pour une réponse immédiate, privilégiez WhatsApp.' : ' Pour une réponse rapide, privilégiez l’email.'}
              </p>

              <GoldRule />

              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Commandes & livraisons', desc: 'Suivi, modification, retour' },
                  { label: 'Conseil olfactif', desc: 'Recommandations personnalisées' },
                  { label: 'Partenariats & B2B', desc: 'Revendeurs, grossistes, cadeaux entreprise' },
                  { label: 'Quiz & consultation', desc: 'Prise de rendez-vous privée' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', opacity: 0.5, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-pale)', margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 40 }}>
                <p style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-pale)', margin: '0 0 14px', fontWeight: 500 }}>
                  Horaires de disponibilité
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Lundi – Samedi · 8h00 – 18h00 (GMT)<br />
                  <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{hasWhatsApp(settings) ? 'WhatsApp disponible 7j/7' : 'Réponse email sous 24h ouvrées'}</span>
                </p>
              </div>
            </div>

            {/* Colonne droite — formulaire */}
            <div>
              <ContactForm />
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', textAlign: 'center', lineHeight: 1.5, margin: '12px 0 0' }}>
                Pour une réponse immédiate :{' '}
                {hasWhatsApp(settings) ? (
                  <a href={buildWhatsAppHref(settings, 'Bonjour, j\'ai une question suite à mon message de contact.')} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>WhatsApp</a>
                ) : (
                  <span style={{ color: 'var(--gold)', fontWeight: 500 }}>email</span>
                )}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--noir)', padding: '88px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <SectionEyebrow label="Questions fréquentes" />
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 300,
              color: '#fff',
              lineHeight: 1.2,
              margin: 0,
            }}>
              Vous avez des{' '}
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>questions ?</em>
            </h2>
          </div>

          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {faq.map((item, i) => (
              <div key={i} className="contact-faq" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(197,165,90,0.1)',
                borderRadius: 3,
                padding: '28px 32px',
                transition: 'border-color 0.35s ease, background 0.35s ease, transform 0.3s ease',
              }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--gold)', opacity: 0.5, flexShrink: 0, lineHeight: 1.3, fontWeight: 300 }}>
                    0{i + 1}
                  </span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', fontWeight: 600, color: '#fff', margin: '0 0 10px', lineHeight: 1.4 }}>
                      {item.q}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>
                      {item.r}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA — Services
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', padding: '72px 0', borderTop: '1px solid var(--line-light)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.6875rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', margin: '0 0 16px' }}>
            Aller plus loin
          </p>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem', fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 24px', lineHeight: 1.2 }}>
            Explorez nos services personnalisés
          </h3>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/services/quiz-olfactif" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 44, padding: '0 22px', background: 'var(--noir)', color: '#fff', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderRadius: 3 }}>
              Quiz olfactif IA
            </Link>
            <Link href="/services/consultation" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 44, padding: '0 22px', background: 'transparent', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderRadius: 3, border: '1px solid var(--line-light)' }}>
              Consultation privée
            </Link>
            <Link href="/produits" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 44, padding: '0 22px', background: 'transparent', color: 'var(--gold)', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderRadius: 3, border: '1px solid rgba(197,165,90,0.35)' }}>
              Nos collections
            </Link>
          </div>
        </div>
      </section>

      {/* Responsive */}
      <style>{`
        @media (max-width: 767px) {
          .canaux-grid { grid-template-columns: 1fr !important; }
          .form-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </main>
  );
}
