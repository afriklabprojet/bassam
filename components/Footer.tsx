'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { shouldBypassNextImageOptimization } from '@/lib/image-optimization';
import { useSiteSettings } from '@/lib/site-settings-context';
import { buildWhatsAppHref, hasWhatsApp } from '@/lib/site-settings';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type SocialLink = {
  label: string;
  href: string;
  d: string;
};

// ─── Footer data ─────────────────────────────────────────────────────────────
const COLLECTION_LINKS: FooterLink[] = [
  { label: 'Nouveautés', href: '/collections/nouveautes' },
  { label: 'Parfums Femme', href: '/collections/femme' },
  { label: 'Parfums Homme', href: '/collections/homme' },
  { label: 'Collections Mixtes', href: '/collections/mixte' },
  { label: 'Promotions', href: '/produits?filtre=promo' },
];

const ACCOUNT_LINKS: FooterLink[] = [
  { label: 'Se connecter', href: '/auth/login' },
  { label: 'Créer un compte', href: '/auth/signup' },
  { label: 'Mes commandes', href: '/compte?tab=commandes' },
  { label: 'Ma Wishlist', href: '/compte?tab=wishlist' },
  { label: 'Programme fidélité', href: '/compte?tab=fidelite' },
];

const SERVICE_LINKS: FooterLink[] = [
  { label: 'Quiz olfactif IA', href: '/services/quiz-olfactif' },
  { label: 'Consultation privée', href: '/services/consultation' },
  { label: 'Parfum personnalisé', href: '/services/creation-personnalisee' },
  { label: 'Nous contacter', href: '/contact' },
];

const SOCIALS_DEFS: { label: string; key: 'instagram_url' | 'facebook_url' | 'tiktok_url'; d: string }[] = [
  { label: 'Instagram', key: 'instagram_url', d: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2zm-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z' },
  { label: 'Facebook', key: 'facebook_url', d: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
  { label: 'TikTok', key: 'tiktok_url', d: 'M9 12a4 4 0 104 4V4a5 5 0 005 5' },
];

const LEGAL = [
  { label: 'Confidentialité', href: '/confidentialite' },
  { label: 'CGV', href: '/cgv' },
  { label: 'Mentions légales', href: '/mentions' },
];

export default function Footer() {
  const settings = useSiteSettings();

  const socials: SocialLink[] = SOCIALS_DEFS
    .map((def) => ({ label: def.label, href: settings[def.key], d: def.d }))
    .filter((s) => s.href);
  const footerColumns: Record<string, FooterLink[]> = {
    Collections: COLLECTION_LINKS,
    'Mon Compte': ACCOUNT_LINKS,
    Services: hasWhatsApp(settings)
      ? [
          ...SERVICE_LINKS,
          {
            label: 'WhatsApp',
            href: buildWhatsAppHref(settings, 'Bonjour VIP Parfumerie Bar, je souhaite des informations sur vos parfums.'),
            external: true,
          },
        ]
      : SERVICE_LINKS,
  };

  return (
    <footer style={{ background: 'var(--noir)', position: 'relative' }}>
      {/* ── Gold top line ── */}
      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(197,165,90,0.4) 30%, var(--gold) 50%, rgba(197,165,90,0.4) 70%, transparent 100%)',
        }}
      />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* ════ MAIN SECTION ════ */}
        <div
          className="grid gap-y-12"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            paddingTop: '4.5rem',
            paddingBottom: '4rem',
          }}
        >
          {/* ── Brand column ── */}
          <div style={{ gridColumn: 'span 2', maxWidth: 300 }} className="max-w-xs">
            {/* Monogram + wordmark */}
            <Link
              href="/"
              className="flex items-center gap-3"
              style={{ textDecoration: 'none', marginBottom: 24 }}
            >
              <div style={{ position: 'relative', width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 1px rgba(197,165,90,0.3)' }}>
                <Image
                  src={settings.logo_url || '/images/logo.png'}
                  alt=""
                  fill
                  sizes="60px"
                  unoptimized={shouldBypassNextImageOptimization(settings.logo_url)}
                  style={{ objectFit: 'cover', objectPosition: 'center 22%' }}
                />
              </div>
              <div className="flex flex-col" style={{ gap: 2 }}>
                <span style={{
                  fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 500,
                  letterSpacing: '0.06em', color: 'rgba(255,255,255,0.9)', lineHeight: 1.1,
                }}>VIP Parfumerie</span>
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: '0.5625rem',
                  letterSpacing: '0.28em', textTransform: 'uppercase',
                  color: 'var(--gold)', lineHeight: 1,
                }}>Bar</span>
              </div>
            </Link>

            {/* Tagline */}
            <p style={{
              fontSize: '0.8125rem', lineHeight: 1.8,
              color: 'rgba(255,255,255,0.3)', fontWeight: 300,
              marginBottom: 28, letterSpacing: '0.01em',
            }}>
              Les plus grandes maisons de parfumerie, livrées chez vous en
              Afrique de l&rsquo;Ouest. Authenticité garantie.
            </p>

            {/* Social icons */}
            {socials.length > 0 && (
              <div className="flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="footer-social-icon"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 38, height: 38,
                      border: '1px solid rgba(197,165,90,0.2)',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.3)',
                      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  >
                    <svg width={16} height={16} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={s.d} />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ── Link columns ── */}
          {Object.entries(footerColumns).map(([section, links]) => (
            <div key={section}>
              <h3 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.625rem', fontWeight: 600,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--gold)', marginBottom: 20,
              }}>
                {section}
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((link) => {
                  const isExternal = 'external' in link && (link as { external?: boolean }).external;
                  const Tag = isExternal ? 'a' : Link;
                  const extraProps = isExternal
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {};
                  return (
                    <li key={link.href}>
                      <Tag
                        href={link.href}
                        className="footer-link"
                        style={{
                          fontSize: '0.8125rem',
                          color: 'rgba(255,255,255,0.35)',
                          textDecoration: 'none',
                          transition: 'color 0.25s, padding-left 0.25s',
                          display: 'inline-block',
                        }}
                        {...extraProps}
                      >
                        {link.label}
                      </Tag>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* ════ TRUST BAR ════ */}
        <div style={{
          borderTop: '1px solid rgba(197,165,90,0.08)',
          padding: '28px 0',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32,
        }}>
          {[
            { icon: '🔒', text: 'Paiement sécurisé' },
            { icon: '✈️', text: 'Livraison Afrique & monde' },
            { icon: '💳', text: 'Mobile Money accepté' },
            { icon: '✓', text: '100% authentique' },
          ].map((item) => (
            <div
              key={item.text}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.04em',
              }}
            >
              <span style={{ fontSize: '0.75rem' }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        {/* ════ BOTTOM BAR ════ */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.04)',
          padding: '22px 0 28px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
        }}>
          <p style={{
            fontSize: '0.6875rem', color: 'rgba(255,255,255,0.18)',
            letterSpacing: '0.04em', margin: 0,
          }}>
            © {new Date().getFullYear()} VIP Parfumerie Bar — Abidjan, Côte d&rsquo;Ivoire
          </p>
          <div className="flex flex-wrap gap-6">
            {LEGAL.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="footer-link"
                style={{
                  fontSize: '0.6875rem',
                  color: 'rgba(255,255,255,0.18)',
                  textDecoration: 'none',
                  transition: 'color 0.25s',
                  letterSpacing: '0.02em',
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
