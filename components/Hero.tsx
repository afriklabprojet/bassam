'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

const TRUST_ITEMS = [
  'Authenticité garantie',
  'Livraison offerte dès 50 000 XOF',
  'Paiement Mobile Money',
  'Conseil parfum sur mesure',
];

const FLOATING_DOTS = [
  { id: 0, size: 2.5, x: 15, y: 20, duration: 10, delay: 0 },
  { id: 1, size: 3.5, x: 72, y: 35, duration: 14, delay: 1.5 },
  { id: 2, size: 2,   x: 45, y: 75, duration: 12, delay: 3 },
  { id: 3, size: 4,   x: 85, y: 55, duration: 16, delay: 0.8 },
  { id: 4, size: 3,   x: 30, y: 48, duration: 11, delay: 2.2 },
  { id: 5, size: 2.8, x: 60, y: 15, duration: 18, delay: 4 },
];

/*
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * VIDEO HERO — Cinéma Parfum (style Byredo / Dior)
 *
 * Remplace le fichier vidéo par le vôtre :
 *   → public/videos/hero-bg.mp4  (1920×1080, ≤ 5 Mo)
 *   → public/videos/hero-bg.webm (optionnel, meilleure compression)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Staggered entrance on mount */
  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Scroll-driven parallax: video slows + content shifts */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, -rect.top / (rect.height * 0.6)));
        hero.style.setProperty('--hero-fade', String(1 - progress * 0.7));
        hero.style.setProperty('--hero-shift', `${progress * 40}px`);
        hero.style.setProperty('--video-scale', String(1 + progress * 0.08));
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleVideoReady = useCallback(() => setVideoLoaded(true), []);

  const wordDelay = (i: number) => `${150 + i * 90}ms`;

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen bg-noir flex flex-col overflow-hidden"
    >
      {/* ── VIDEO BACKGROUND ─────────────────────── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          transform: 'scale(var(--video-scale, 1))',
          transition: 'transform 0.15s linear',
        }}
      >
        {/* Fallback animé — visible quand la vidéo n'est pas encore chargée */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: videoLoaded ? 0 : 1,
            transition: 'opacity 1.5s cubic-bezier(0.4,0,0.2,1)',
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(197,165,90,0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(197,165,90,0.05) 0%, transparent 50%),
              linear-gradient(160deg, #0e0c0a 0%, #060606 40%, #0b0a08 100%)
            `,
            animation: 'hero-ambient-pulse 8s ease-in-out infinite',
          }}
        />

        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlayThrough={handleVideoReady}
          className="hero-video-bg"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: videoLoaded ? 1 : 0,
            transition: 'opacity 1.5s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Fichiers locaux — priorité haute */}
          <source src="/videos/hero-bg.webm" type="video/webm" />
          <source src="/videos/hero-bg.mp4"  type="video/mp4" />
          {/* Vidéo de démo Pexels — chargée si aucun fichier local n'existe */}
          <source
            src="https://videos.pexels.com/video-files/3769697/3769697-uhd_2560_1440_25fps.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* ── CINEMATIC OVERLAY ────────────────────── */}
      {/* Multi-layer gradient: darkens edges, keeps center slightly lit */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background: `
            linear-gradient(180deg, rgba(8,8,8,0.45) 0%, rgba(8,8,8,0.2) 35%, rgba(8,8,8,0.55) 80%, rgba(8,8,8,0.85) 100%),
            linear-gradient(90deg, rgba(8,8,8,0.6) 0%, transparent 50%, rgba(8,8,8,0.35) 100%)
          `,
        }}
        aria-hidden="true"
      />

      {/* Gold vignette — cinematic warmth */}
      <div
        className="absolute inset-0 z-2 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 60%, rgba(197,165,90,0.06) 0%, transparent 55%)',
        }}
        aria-hidden="true"
      />

      {/* ── ATMOSPHERE LAYERS (over video) ────────── */}

      {/* Film grain */}
      <div
        className="absolute inset-0 z-3 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px',
          mixBlendMode: 'overlay',
        }}
        aria-hidden="true"
      />

      {/* Top edge glow — gold line */}
      <div
        className="absolute top-0 left-0 right-0 z-3 pointer-events-none"
        style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent 10%, rgba(197,165,90,0.5) 50%, transparent 90%)',
          opacity: videoLoaded ? 0.6 : 0,
          transition: 'opacity 1.2s 0.5s',
        }}
        aria-hidden="true"
      />

      {/* Floating gold particles — over everything */}
      {FLOATING_DOTS.map((d) => (
        <div
          key={d.id}
          className="absolute rounded-full pointer-events-none z-3"
          style={{
            width: d.size,
            height: d.size,
            left: `${d.x}%`,
            top: `${d.y}%`,
            background: 'var(--gold)',
            opacity: 0.18,
            animation: `hero-particle-float ${d.duration}s ease-in-out ${d.delay}s infinite`,
          }}
          aria-hidden="true"
        />
      ))}

      {/* Diagonal gold line accent */}
      <div
        className="absolute pointer-events-none z-3"
        style={{
          top: '15%',
          right: '8%',
          width: '1px',
          height: '0%',
          background: 'linear-gradient(to bottom, transparent, rgba(197,165,90,0.4), transparent)',
          animation: isVisible ? 'hero-line-draw 1.5s cubic-bezier(0.4,0,0.2,1) 0.8s forwards' : 'none',
        }}
        aria-hidden="true"
      />

      {/* Background watermark */}
      <div
        className="absolute pointer-events-none select-none z-3"
        style={{
          right: '-2%',
          bottom: '10%',
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(10rem, 20vw, 22rem)',
          fontStyle: 'italic',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.02)',
          lineHeight: 0.85,
          letterSpacing: '-0.04em',
        }}
        aria-hidden="true"
      >
        VB
      </div>

      {/* ── MAIN CONTENT ─────────────────────────── */}
      <div
        className="relative z-10 flex-1 flex items-center"
        style={{
          opacity: 'var(--hero-fade, 1)',
          transform: 'translateY(var(--hero-shift, 0px))',
          transition: 'opacity 0.1s, transform 0.1s',
        }}
      >
        <div className="container mx-auto py-32 md:py-40">
          <div className="max-w-4xl">
            {/* Eyebrow — animated gold line + text */}
            <div
              className="flex items-center gap-3"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
                transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.1s',
              }}
            >
              <span
                style={{
                  width: isVisible ? 32 : 0,
                  height: 1,
                  background: 'var(--gold)',
                  transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1) 0.3s',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span className="label" style={{ color: 'var(--gold)' }}>
                Collection Printemps — Été 2026
              </span>
            </div>

            {/* Heading — staggered word reveal */}
            <h1
              className="heading-display mt-10"
              style={{
                fontSize: 'clamp(3.25rem, 7.5vw, 6.5rem)',
                color: '#fff',
                textShadow: '0 2px 40px rgba(0,0,0,0.5)',
              }}
            >
              {['L\'art', 'du', 'parfum,'].map((word, i) => (
                <span
                  key={word}
                  className="inline-block"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${wordDelay(i)}`,
                    marginRight: '0.3em',
                  }}
                >
                  {word}
                </span>
              ))}
              <br />
              <em
                className="not-italic inline-block"
                style={{
                  color: 'var(--gold)',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                  transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.55s',
                  textShadow: '0 2px 30px rgba(197,165,90,0.3)',
                }}
              >
                réinventé.
              </em>
            </h1>

            {/* Gold divider line — draws itself */}
            <div
              style={{
                height: 1,
                width: isVisible ? '5rem' : '0',
                background: 'var(--gold)',
                marginTop: '2.5rem',
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1) 0.7s',
              }}
            />

            {/* Description */}
            <p
              className="mt-10 leading-relaxed max-w-lg"
              style={{
                fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.55)',
                textShadow: '0 1px 12px rgba(0,0,0,0.4)',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.8s',
              }}
            >
              Parfums de luxe authentiques des plus grandes maisons. Livraison
              24&nbsp;h en Côte d&apos;Ivoire&nbsp;·&nbsp;Paiement Orange Money, MTN, Wave.
            </p>

            {/* CTAs */}
            <div
              className="mt-14 flex flex-wrap gap-5"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.95s',
              }}
            >
              <Link href="/#top-ventes" className="btn-gold btn-gold-animated">
                Acheter les best-sellers
              </Link>
              <Link href="/services/quiz-olfactif" className="btn-ghost-light">
                Faire le quiz olfactif
              </Link>
            </div>

            {/* Trust strip — each item staggers */}
            <ul className="mt-20 flex flex-wrap gap-x-10 gap-y-4">
              {TRUST_ITEMS.map((item, i) => (
                <li
                  key={item}
                  className="flex items-center gap-2"
                  style={{
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    color: 'rgba(255,255,255,0.35)',
                    textShadow: '0 1px 8px rgba(0,0,0,0.3)',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                    transition: `all 0.5s cubic-bezier(0.4,0,0.2,1) ${1.1 + i * 0.08}s`,
                  }}
                >
                  <span style={{ color: 'var(--gold)', fontSize: '6px', lineHeight: 1 }}>◆</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────── */}
      <div
        className="relative z-10 py-4"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          background: 'rgba(8,8,8,0.3)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.6s 1.4s',
        }}
      >
        <div className="container mx-auto flex items-center justify-between">
          <p
            className="text-white/20"
            style={{ fontSize: '0.6875rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            VIP Parfumerie Bar
          </p>

          {/* Mute / unmute toggle */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                const v = videoRef.current;
                if (v) v.muted = !v.muted;
              }}
              className="hero-sound-toggle flex items-center gap-1.5 text-white/25 hover:text-white/50 transition-colors"
              style={{ fontSize: '0.625rem', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              aria-label="Activer / couper le son"
            >
              <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              <span>Son</span>
            </button>
            <button
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              className="flex items-center gap-1.5 text-white/25 hover:text-white/50 transition-colors"
              style={{ fontSize: '0.6875rem', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Défiler vers le bas"
            >
              <span style={{ letterSpacing: '0.1em' }}>Explorez</span>
              <svg className="w-3 h-3 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
