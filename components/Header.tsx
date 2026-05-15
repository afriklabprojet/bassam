'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useSiteSettings } from '@/lib/site-settings-context';

// ─── Navigation data ────────────────────────────────────────────────────────
type NavChild = { label: string; href: string; description?: string };
type NavLink = { label: string; href: string; children?: NavChild[] };

const navLinks: NavLink[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Boutique', href: '/produits' },
  { label: 'À propos', href: '/a-propos' },
  {
    label: 'Collections',
    href: '/collections',
    children: [
      { label: 'Nouveautés', href: '/collections/nouveautes', description: 'Dernières arrivées' },
      { label: 'Femme', href: '/collections/femme', description: 'Parfums & soins' },
      { label: 'Homme', href: '/collections/homme', description: 'Signatures masculines' },
      { label: 'Mixte', href: '/collections/mixte', description: 'Pour tous' },
    ],
  },
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'Quiz olfactif IA', href: '/services/quiz-olfactif', description: 'Trouvez votre signature' },
      { label: 'Consultation privée', href: '/services/consultation', description: 'Sur rendez-vous' },
      { label: 'Parfum personnalisé', href: '/services/creation-personnalisee', description: 'Création sur-mesure' },
    ],
  },
  { label: 'Contact', href: '/contact' },
];

// ─── Inline SVG icons ────────────────────────────────────────────────────────
const IconSearch = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const IconUser = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const IconBag = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
  </svg>
);
const IconClose = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconChevron = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// ─── Shared icon-button style ─────────────────────────────────────────────────
const iconBtnBaseStyle = (light: boolean): React.CSSProperties => ({
  alignItems: 'center', justifyContent: 'center',
  width: 44, height: 44, cursor: 'pointer',
  color: light ? 'var(--text-secondary)' : 'rgba(255,255,255,0.8)',
  transition: 'color 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s',
  background: 'none', border: 'none', padding: 0,
  borderRadius: '50%',
});

const iconBtnStyle = (light: boolean): React.CSSProperties => ({
  display: 'flex',
  ...iconBtnBaseStyle(light),
});

// ─── Announcement Bar ─────────────────────────────────────────────────────────
function AnnouncementBar({ scrolled }: Readonly<{ scrolled: boolean }>) {
  return (
    <div
      className="announcement-bar"
      style={{
        background: 'var(--noir)',
        borderBottom: '1px solid rgba(197,165,90,0.15)',
        overflow: 'hidden',
        maxHeight: scrolled ? 0 : 32,
        opacity: scrolled ? 0 : 1,
        transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
      }}
    >
      <div className="announcement-marquee" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 32, gap: 48,
        animation: 'announcement-scroll 30s linear infinite',
        whiteSpace: 'nowrap',
      }}>
        {(['first', 'second', 'third'] as const).map((id) => (
          <p key={id} style={{
            fontSize: '0.6rem', letterSpacing: '0.24em',
            color: 'var(--gold)', textTransform: 'uppercase',
            margin: 0, display: 'flex', alignItems: 'center',
            gap: 32, flexShrink: 0,
          }}>
            <span>Livraison offerte dès 50 000 XOF</span>
            <span style={{ color: 'rgba(197,165,90,0.35)' }}>✦</span>
            <span>Abidjan &amp; International</span>
            <span style={{ color: 'rgba(197,165,90,0.35)' }}>✦</span>
            <span>Authenticité garantie 100%</span>
            <span style={{ color: 'rgba(197,165,90,0.35)' }}>✦</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function getCartAriaLabel(totalItems: number): string {
  if (totalItems === 0) return 'Panier';
  return `Panier — ${totalItems} article${totalItems > 1 ? 's' : ''}`;
}

export default function Header() {
  const { totalItems, toggleCart } = useCart();
  const settings = useSiteSettings();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Scroll listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // ── Close mobile on navigation ───────────────────────────────────────────  // eslint-disable-next-line react-hooks/set-state-in-effect  useEffect(() => { setMenuOpen(false); setMobileExpanded(null); }, [pathname]);

  // ── Trap scroll when mobile is open ─────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // ── Focus search input when expanded ────────────────────────────────────
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  const isHomepage = pathname === '/';
  const isLight = scrolled || !isHomepage;
  const blurFilter = scrolled ? 'blur(24px) saturate(1.2)' : 'blur(16px)';
  const cartAriaLabel = getCartAriaLabel(totalItems);

  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      globalThis.location.href = `/produits?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      {/* ─── ANNOUNCEMENT BAR ───────────────────────────────────────────────── */}
      <AnnouncementBar scrolled={scrolled} />

      {/* ─── HEADER BAR ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: isLight
            ? 'rgba(250, 250, 248, 0.92)'
            : 'rgba(8, 8, 8, 0.55)',
          backdropFilter: blurFilter,
          WebkitBackdropFilter: blurFilter,
          borderBottom: isLight
            ? '1px solid rgba(0,0,0,0.06)'
            : '1px solid rgba(197,165,90,0.08)',
          boxShadow: scrolled
            ? '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.03)'
            : 'none',
          transition: 'all 0.45s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Gold top line when scrolled */}
        {isLight && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent 0%, var(--gold) 40%, var(--gold-light) 60%, transparent 100%)',
            opacity: scrolled ? 1 : 0,
            transition: 'opacity 0.3s',
          }} aria-hidden="true" />
        )}

        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: 24,
            height: 68,
          }}>

            {/* ── LEFT: Logo ────────────────────────────────────────────────── */}
            <Link
              href="/"
              aria-label="VIP Parfumerie Bar — accueil"
              style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}
            >
              {/* Logo */}
              <div className="header-monogram" style={{
                position: 'relative',
                width: 48, height: 48,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'box-shadow 0.3s',
                boxShadow: '0 0 0 1px rgba(197,165,90,0.35)',
              }}>
                <Image
                  src={settings.logo_url || '/images/logo.png'}
                  alt=""
                  fill
                  priority
                  sizes="48px"
                  style={{ objectFit: 'cover', objectPosition: 'center 22%' }}
                />
              </div>
              {/* Brand wordmark */}
              <div className="hidden md:flex flex-col" style={{ gap: 1 }}>
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1rem',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  color: isLight ? 'var(--text-primary)' : '#fff',
                  lineHeight: 1.1,
                  transition: 'color 0.3s',
                }}>
                  VIP Parfumerie
                </span>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.5625rem',
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: isLight ? 'var(--gold-dark)' : 'var(--gold)',
                  lineHeight: 1,
                  transition: 'color 0.3s',
                }}>
                  Bar
                </span>
              </div>
            </Link>

            {/* ── CENTER: Desktop nav ───────────────────────────────────────── */}
            <nav
              className="hidden lg:flex items-center justify-center"
              aria-label="Navigation principale"
              style={{ gap: 0 }}
            >
              {navLinks.map((link) => (
                <NavItem key={link.href} link={link} isLight={isLight} pathname={pathname} />
              ))}
            </nav>

            {/* ── RIGHT: actions ────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', justifySelf: 'end', gap: 2, flexShrink: 0 }}>
              {/* Search */}
              {searchOpen ? (
                <form onSubmit={handleSearch} className="hidden lg:flex" style={{ alignItems: 'center' }}>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un parfum…"
                    aria-label="Rechercher"
                    style={{
                      width: 190, height: 34, padding: '0 12px',
                      fontSize: '0.8125rem',
                      border: `1px solid ${isLight ? 'var(--line-light)' : 'rgba(197,165,90,0.35)'}`,
                      borderRight: 'none',
                      borderRadius: '3px 0 0 3px',
                      outline: 'none',
                      background: isLight ? 'var(--offwhite)' : 'rgba(255,255,255,0.08)',
                      color: isLight ? 'var(--text-primary)' : '#fff',
                    }}
                  />
                  <button
                    type="submit"
                    aria-label="Valider"
                    style={{
                      width: 34, height: 34,
                      background: 'var(--gold)', color: 'var(--noir)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '0 3px 3px 0', flexShrink: 0,
                    }}
                  >
                    <IconSearch size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    style={{ ...iconBtnStyle(isLight), marginLeft: 2 }}
                    aria-label="Fermer"
                  >
                    <IconClose size={15} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  style={iconBtnBaseStyle(isLight)}
                  className="hidden lg:flex"
                  aria-label="Rechercher"
                >
                  <IconSearch size={18} />
                </button>
              )}

              {/* Account */}
              <Link
                href="/compte"
                style={iconBtnBaseStyle(isLight)}
                className="hidden lg:flex"
                aria-label="Mon compte"
              >
                <IconUser size={18} />
              </Link>

              {/* Cart */}
              <button
                onClick={toggleCart}
                style={{ ...iconBtnStyle(isLight), position: 'relative' }}
                aria-label={cartAriaLabel}
              >
                <IconBag size={18} />
                {totalItems > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute', top: 1, right: 1,
                      minWidth: 15, height: 15,
                      background: 'var(--gold)', color: 'var(--noir)',
                      fontSize: 8, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 2, padding: '0 2px', lineHeight: 1,
                    }}
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(true)}
                style={{ ...iconBtnBaseStyle(isLight), marginLeft: 4 }}
                className="flex lg:hidden"
                aria-label="Ouvrir le menu"
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
                  <line x1="3" y1="6.5" x2="21" y2="6.5" strokeLinecap="round" />
                  <line x1="3" y1="12" x2="15" y2="12" strokeLinecap="round" />
                  <line x1="3" y1="17.5" x2="21" y2="17.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </header>

      <MobileDrawer
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        handleSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        mobileExpanded={mobileExpanded}
        setMobileExpanded={setMobileExpanded}
        pathname={pathname}
      />
    </>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────
function MobileDrawer({
  menuOpen, setMenuOpen, handleSearch, searchQuery, setSearchQuery,
  mobileExpanded, setMobileExpanded, pathname,
}: Readonly<{
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  handleSearch: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  mobileExpanded: string | null;
  setMobileExpanded: (v: string | null) => void;
  pathname: string;
}>) {
  const settings = useSiteSettings();
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 49,
          background: 'rgba(8,8,8,0.65)',
          opacity: menuOpen ? 1 : 0,
          visibility: menuOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.35s, visibility 0.35s',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />
      {/* Drawer */}
      <dialog
        open
        aria-modal={menuOpen}
        aria-hidden={!menuOpen}
        aria-label="Menu de navigation"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
          margin: 0, border: 'none', padding: 0, maxWidth: 'none', maxHeight: 'none',
          width: 'min(320px, 88vw)',
          background: 'var(--noir)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.38s cubic-bezier(0.77,0,0.175,1)',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          boxShadow: '4px 0 48px rgba(8,8,8,0.35), 0 0 0 1px rgba(197,165,90,0.08)',
        }}
      >
        {/* Drawer header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 72,
          borderBottom: '1px solid rgba(197,165,90,0.12)', flexShrink: 0,
          background: 'transparent',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 1px rgba(197,165,90,0.4)' }}>
              <Image
                src={settings.logo_url || '/images/logo.png'}
                alt=""
                fill
                sizes="36px"
                style={{ objectFit: 'cover', objectPosition: 'center 22%' }}
              />
            </div>
            <span style={{ fontFamily: 'var(--font-serif)', color: '#fff', fontSize: '0.875rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              VIP Parfumerie
            </span>
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer le menu"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Drawer search */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(197,165,90,0.1)', flexShrink: 0 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex' }}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un parfum…"
              style={{
                flex: 1, height: 40, padding: '0 14px',
                fontSize: '0.8125rem',
                border: '1px solid rgba(197,165,90,0.2)', borderRight: 'none',
                borderRadius: '4px 0 0 4px',
                outline: 'none', background: 'rgba(255,255,255,0.06)', color: '#fff',
                letterSpacing: '0.02em',
              }}
            />
            <button type="submit" style={{ width: 40, height: 40, background: 'var(--gold)', color: 'var(--noir)', border: 'none', borderRadius: '0 4px 4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-label="Rechercher">
              <IconSearch size={14} />
            </button>
          </form>
        </div>

        {/* Drawer links */}
        <nav aria-label="Navigation mobile" style={{ flex: 1, padding: '6px 0' }}>
          {navLinks.map((link, idx) => (
            <div key={link.href} style={{ borderBottom: idx < navLinks.length - 1 ? '1px solid rgba(197,165,90,0.08)' : 'none' }}>
              {link.children ? (
                <>
                  <button
                    onClick={() => setMobileExpanded(mobileExpanded === link.href ? null : link.href)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 24px', border: 'none', background: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', letterSpacing: '0.14em',
                      textTransform: 'uppercase', fontWeight: 500, textAlign: 'left',
                      fontFamily: 'var(--font-sans)',
                      transition: 'color 0.2s',
                    }}
                    aria-expanded={mobileExpanded === link.href}
                  >
                    {link.label}
                    <span style={{ transform: mobileExpanded === link.href ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)', color: 'var(--gold)' }}>
                      <IconChevron size={11} />
                    </span>
                  </button>
                  {mobileExpanded === link.href && (
                    <div style={{ background: 'rgba(197,165,90,0.04)' }}>
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '13px 24px 13px 36px',
                            fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)',
                            textDecoration: 'none', borderTop: '1px solid rgba(197,165,90,0.06)',
                            transition: 'color 0.2s',
                          }}
                        >
                          <span>{child.label}</span>
                          {child.description && (
                            <span style={{ fontSize: '0.6rem', color: 'rgba(197,165,90,0.5)', fontStyle: 'italic', letterSpacing: '0.04em' }}>{child.description}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={link.href}
                  style={{
                    display: 'block', padding: '16px 24px',
                    fontSize: '0.75rem', color: pathname === link.href ? 'var(--gold)' : 'rgba(255,255,255,0.85)',
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    fontWeight: 500, textDecoration: 'none',
                    fontFamily: 'var(--font-sans)',
                    transition: 'color 0.2s',
                  }}
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Drawer footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(197,165,90,0.1)', flexShrink: 0 }}>
          <Link
            href="/compte"
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px',
              border: '1px solid rgba(197,165,90,0.25)', borderRadius: 4,
              fontSize: '0.75rem', color: 'var(--gold)', textDecoration: 'none',
              letterSpacing: '0.08em', background: 'rgba(197,165,90,0.06)',
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            <IconUser size={15} />
            Mon compte
          </Link>
          <p style={{ textAlign: 'center', fontSize: '0.5rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 18 }}>
            © VIP Parfumerie Bar
          </p>
        </div>
      </dialog>
    </>
  );
}

// ─── Desktop nav item ────────────────────────────────────────────────────────
function NavItem({ link, isLight, pathname }: Readonly<{ link: NavLink; isLight: boolean; pathname: string }>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isActive = link.href === '/'
    ? pathname === '/'
    : pathname === link.href || pathname.startsWith(link.href + '/');

  const activeColor = isLight ? 'var(--text-primary)' : '#fff';
  const inactiveColor = isLight ? 'var(--text-secondary)' : 'rgba(255,255,255,0.68)';
  const textColor = isActive ? activeColor : inactiveColor;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') { setOpen(false); return; }
      if (e instanceof MouseEvent && ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', handler); };
  }, [open]);

  return (
    <div
      ref={ref}
      role="none"
      style={{ position: 'relative' }}
      onMouseEnter={() => link.children && setOpen(true)}
      onMouseLeave={() => link.children && setOpen(false)}
      onFocus={() => link.children && setOpen(true)}
      onBlur={(e) => { if (link.children && !ref.current?.contains(e.relatedTarget)) setOpen(false); }}
    >
      <Link
        href={link.href}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '0 16px', height: 68,
          fontSize: '0.6875rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: isActive ? 600 : 500,
          textDecoration: 'none',
          color: textColor,
          transition: 'color 0.18s',
          position: 'relative',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Active dot */}
        {isActive && (
          <span style={{
            width: 4, height: 4, borderRadius: '50%',
            background: 'var(--gold)',
            flexShrink: 0,
            marginRight: 2,
          }} aria-hidden="true" />
        )}
        {link.label}
        {link.children && (
          <span style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'none',
            opacity: 0.55,
            display: 'flex',
            marginLeft: -2,
          }}>
            <IconChevron size={9} />
          </span>
        )}
        {/* Bottom underline */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: 0, left: 16, right: 16,
            height: '1.5px',
            background: isLight ? 'var(--gold)' : 'var(--gold-light)',
            transform: isActive || open ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: isActive ? 'left' : 'center',
            transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </Link>

      {/* Dropdown */}
      {link.children && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 0px)', left: '50%',
            transform: open ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)',
            minWidth: 230,
            background: '#fff',
            border: '1px solid var(--line-light)',
            borderTop: '2px solid var(--gold)',
            borderRadius: '0 0 6px 6px',
            padding: '6px 0',
            opacity: open ? 1 : 0,
            visibility: open ? 'visible' : 'hidden',
            transition: 'opacity 0.2s, visibility 0.2s, transform 0.2s',
            zIndex: 100,
            boxShadow: '0 12px 32px rgba(8,8,8,0.1), 0 2px 8px rgba(8,8,8,0.06)',
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          {/* Dropdown arrow */}
          <div style={{
            position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
            width: 10, height: 6, overflow: 'hidden',
          }}>
            <div style={{
              width: 10, height: 10,
              background: 'var(--gold)',
              transform: 'rotate(45deg) translateY(5px)',
            }} />
          </div>
          {link.children.map((child, i) => (
            <DropdownLink key={child.href} child={child} isLast={i === (link.children?.length ?? 0) - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownLink({ child, isLast }: Readonly<{ child: NavChild; isLast: boolean }>) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={child.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 18px',
        textDecoration: 'none',
        borderBottom: isLast ? 'none' : '1px solid var(--line-light)',
        background: hovered ? 'var(--offwhite)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {/* Left accent */}
      <div style={{
        width: 2, height: 28, borderRadius: 1,
        background: hovered ? 'var(--gold)' : 'var(--line-light)',
        flexShrink: 0, transition: 'background 0.15s',
      }} />
      <div>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.03em', transition: 'color 0.15s' }}>
          {child.label}
        </p>
        {child.description && (
          <p style={{ margin: 0, fontSize: '0.625rem', color: 'var(--text-pale)', letterSpacing: '0.04em', marginTop: 1, fontStyle: 'italic' }}>
            {child.description}
          </p>
        )}
      </div>
    </Link>
  );
}

