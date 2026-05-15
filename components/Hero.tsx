'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const TRUST_ITEMS = [
  'Authenticité vérifiée',
  'Livraison 24 h à Abidjan',
  'Paiement Orange Money, MTN, Wave',
  'Conseil olfactif personnalisé',
];

const HERO_STATS = [
  { value: '300+', label: 'Fragrances' },
  { value: '40+', label: 'Maisons' },
  { value: '100%', label: 'Authentique' },
];

const COLLECTION_LINKS = [
  { href: '/collections/femme', name: 'Femme', count: 'Floraux, ambrés, poudrés', tone: '#C5A55A' },
  { href: '/collections/homme', name: 'Homme', count: 'Boisés, frais, cuirés', tone: '#7896B2' },
  { href: '/collections/mixte', name: 'Mixte', count: 'Oud, santal, muscs', tone: '#A89B7A' },
];

const PRODUCT_VISUALS = [
  {
    src: '/images/products/dior-sauvage.svg',
    alt: 'Flacon Dior Sauvage disponible chez VIP Parfumerie Bar',
    className: 'hero-product hero-product-main',
  },
  {
    src: '/images/products/oud-wood.svg',
    alt: 'Flacon Tom Ford Oud Wood disponible chez VIP Parfumerie Bar',
    className: 'hero-product hero-product-side hero-product-side-left',
  },
  {
    src: '/images/products/black-opium.svg',
    alt: 'Flacon Black Opium disponible chez VIP Parfumerie Bar',
    className: 'hero-product hero-product-side hero-product-side-right',
  },
];

const BRAND_TICKER = [
  'Dior',
  'Chanel',
  'Creed',
  'Tom Ford',
  'Maison Francis Kurkdjian',
  'Le Labo',
  'Guerlain',
  'Jo Malone',
];

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, -rect.top / (rect.height * 0.7)));
        hero.style.setProperty('--hero-fade', String(1 - progress * 0.45));
        hero.style.setProperty('--hero-shift', `${progress * 32}px`);
        hero.style.setProperty('--hero-stage-shift', `${progress * -26}px`);
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const revealStyle = (delay: number) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}s, transform 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
  });

  return (
    <section ref={heroRef} className="hero-premium relative overflow-hidden bg-noir text-white">
      <div className="hero-grid-overlay" aria-hidden="true" />
      <div className="hero-top-rule" aria-hidden="true" />
      <div className="hero-monogram" aria-hidden="true">VB</div>

      <div className="container mx-auto hero-content-shell">
        <div
          className="hero-copy"
          style={{
            opacity: 'var(--hero-fade, 1)',
            transform: 'translateY(var(--hero-shift, 0px))',
          }}
        >
          <div className="hero-eyebrow" style={revealStyle(0.08)}>
            <span className="hero-eyebrow-line" aria-hidden="true" />
            <span>Haute parfumerie authentique</span>
          </div>

          <h1 className="hero-title" style={revealStyle(0.18)}>
            <span>Votre parfum signature,</span>
            <span className="hero-title-accent">choisi avec précision.</span>
          </h1>

          <p className="hero-description" style={revealStyle(0.3)}>
            Une sélection premium de maisons iconiques et de fragrances rares, livrée rapidement
            en Côte d&apos;Ivoire avec accompagnement personnalisé.
          </p>

          <div className="hero-actions" style={revealStyle(0.42)}>
            <Link href="/#top-ventes" className="btn-gold hero-primary-action">
              Voir les best-sellers
            </Link>
            <Link href="/services/quiz-olfactif" className="btn-ghost-light hero-secondary-action">
              Trouver mon parfum
            </Link>
          </div>

          <ul className="hero-trust-list" aria-label="Garanties VIP Parfumerie Bar" style={revealStyle(0.54)}>
            {TRUST_ITEMS.map((item) => (
              <li key={item}>
                <span aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          <dl className="hero-stats" aria-label="Chiffres clés" style={revealStyle(0.66)}>
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className="hero-showcase"
          style={{
            opacity: 'var(--hero-fade, 1)',
            transform: 'translateY(var(--hero-stage-shift, 0px))',
          }}
          aria-label="Sélection de parfums mise en avant"
        >
          <div className="hero-showcase-header" style={revealStyle(0.36)}>
            <span>Édition 2026</span>
            <strong>VIP Selection</strong>
          </div>

          <div className="hero-product-stage" style={revealStyle(0.48)}>
            <div className="hero-stage-line hero-stage-line-left" aria-hidden="true" />
            <div className="hero-stage-line hero-stage-line-right" aria-hidden="true" />
            {PRODUCT_VISUALS.map((product, index) => (
              <Image
                key={product.src}
                src={product.src}
                alt={product.alt}
                width={index === 0 ? 260 : 164}
                height={index === 0 ? 347 : 219}
                priority={index === 0}
                className={product.className}
              />
            ))}
          </div>

          <nav className="hero-collection-stack" aria-label="Accès rapide aux univers" style={revealStyle(0.62)}>
            {COLLECTION_LINKS.map((collection) => (
              <Link key={collection.href} href={collection.href} className="hero-collection-link">
                <span style={{ background: collection.tone }} aria-hidden="true" />
                <strong>{collection.name}</strong>
                <small>{collection.count}</small>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="hero-bottom-bar">
        <div className="hero-ticker" aria-hidden="true">
          {[...BRAND_TICKER, ...BRAND_TICKER].map((brand, index) => (
            <span key={`${brand}-${index}`}>{brand}</span>
          ))}
        </div>
        <button
          type="button"
          className="hero-scroll-button"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          aria-label="Défiler vers les collections"
        >
          Explorer
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
        </button>
      </div>
    </section>
  );
}