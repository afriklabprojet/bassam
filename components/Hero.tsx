'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { HomeHeroContent } from '@/lib/supabase/home-hero';

const PRODUCT_VISUAL_CLASSES = [
  'hero-product hero-product-main',
  'hero-product hero-product-side hero-product-side-left',
  'hero-product hero-product-side hero-product-side-right',
];

const PRODUCT_VISUAL_SIZES = [
  { width: 260, height: 347 },
  { width: 164, height: 219 },
  { width: 164, height: 219 },
];

interface HeroProps {
  content: HomeHeroContent;
}

export default function Hero({ content }: Readonly<HeroProps>) {
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
            <span>{content.eyebrow}</span>
          </div>

          <h1 className="hero-title" style={revealStyle(0.18)}>
            <span>{content.title}</span>
            <span className="hero-title-accent">{content.titleAccent}</span>
          </h1>

          <p className="hero-description" style={revealStyle(0.3)}>
            {content.description}
          </p>

          <div className="hero-actions" style={revealStyle(0.42)}>
            <Link href={content.primaryCtaHref} className="btn-gold hero-primary-action">
              {content.primaryCtaLabel}
            </Link>
            <Link href={content.secondaryCtaHref} className="btn-ghost-light hero-secondary-action">
              {content.secondaryCtaLabel}
            </Link>
          </div>

          <ul className="hero-trust-list" aria-label="Garanties VIP Parfumerie Bar" style={revealStyle(0.54)}>
            {content.trustItems.map((item) => (
              <li key={item}>
                <span aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          <dl className="hero-stats" aria-label="Chiffres clés" style={revealStyle(0.66)}>
            {content.stats.map((stat) => (
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
            <span>{content.showcaseEyebrow}</span>
            <strong>{content.showcaseTitle}</strong>
          </div>

          <div className="hero-product-stage" style={revealStyle(0.48)}>
            <div className="hero-stage-line hero-stage-line-left" aria-hidden="true" />
            <div className="hero-stage-line hero-stage-line-right" aria-hidden="true" />
            {content.productVisuals.slice(0, 3).map((product, index) => (
              <Image
                key={product.src}
                src={product.src}
                alt={product.alt}
                width={PRODUCT_VISUAL_SIZES[index]?.width ?? 164}
                height={PRODUCT_VISUAL_SIZES[index]?.height ?? 219}
                priority={index === 0}
                className={PRODUCT_VISUAL_CLASSES[index] ?? PRODUCT_VISUAL_CLASSES[1]}
              />
            ))}
          </div>

          <nav className="hero-collection-stack" aria-label="Accès rapide aux univers" style={revealStyle(0.62)}>
            {content.collectionLinks.map((collection) => (
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
          {[...content.brandTicker, ...content.brandTicker].map((brand, index) => (
            <span key={`${brand}-${index}`}>{brand}</span>
          ))}
        </div>
        <button
          type="button"
          className="hero-scroll-button"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          aria-label="Défiler vers les collections"
        >
          {content.scrollLabel}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
        </button>
      </div>
    </section>
  );
}