'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Produits',
    href: '/admin/produits',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth={3} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Commandes',
    href: '/admin/commandes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    label: 'Clients',
    href: '/admin/clients',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: 'Avis clients',
    href: '/admin/avis',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth={2.5} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Marketing',
    href: '/admin/marketing',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Inventaire',
    href: '/admin/inventaire',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
      </svg>
    ),
  },
  {
    label: 'Alertes stock',
    href: '/admin/alertes-stock',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    label: 'Paiements',
    href: '/admin/paiements',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Maintenance',
    href: '/admin/maintenance',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Codes-barres',
    href: '/admin/codes-barres',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4m10-16h-4a2 2 0 00-2 2v4m6 6h-4a2 2 0 00-2 2v4" />
        <line x1="7" y1="8" x2="7" y2="16" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="17" y1="8" x2="17" y2="16" />
      </svg>
    ),
  },
  {
    label: 'Remboursements',
    href: '/admin/remboursements',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  },
  {
    label: 'Catégories',
    href: '/admin/categories',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
      </svg>
    ),
  },
  {
    label: 'Collections',
    href: '/admin/contenu/collections',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h6" />
      </svg>
    ),
  },
  {
    label: 'Services',
    href: '/admin/contenu/services',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
      </svg>
    ),
  },
  {
    label: 'À propos',
    href: '/admin/contenu/a-propos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    label: 'Accueil / Hero',
    href: '/admin/contenu/accueil',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Design',
    href: '/admin/branding',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="13.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="10.5" r="2.5" />
        <circle cx="8.5" cy="7.5" r="2.5" />
        <circle cx="6.5" cy="12.5" r="2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22c-4.418 0-8-1.343-8-3 0-1.105 1.432-2.09 3.636-2.658" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.364 16.342C18.568 16.91 20 17.895 20 19c0 1.657-3.582 3-8 3" />
      </svg>
    ),
  },
  {
    label: 'Paramètres',
    href: '/admin/parametres',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    globalThis.location.href = '/admin/login';
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--noir)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 lg:hidden w-full cursor-default"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 flex flex-col
          transform transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'linear-gradient(180deg, #0D0D0D 0%, #0A0A0A 100%)',
          borderRight: '1px solid rgba(197,165,90,0.1)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3.5 px-7 h-18 shrink-0"
          style={{ borderBottom: '1px solid rgba(197,165,90,0.1)' }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #C5A55A 0%, #A68B3E 100%)',
              boxShadow: '0 2px 12px rgba(197,165,90,0.25)',
            }}
          >
            <span style={{ color: '#080808', fontWeight: 800, fontSize: '0.8125rem', letterSpacing: '0.02em' }}>VP</span>
          </div>
          <div className="flex flex-col">
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#F5F0E8',
                letterSpacing: '0.03em',
              }}
            >
              VIP Admin
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Parfumerie Bar
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-8 px-4 flex flex-col gap-1">
          <span style={{ fontSize: '0.625rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, padding: '0 12px', marginBottom: '8px' }}>
            Gestion
          </span>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(197,165,90,0.15), rgba(197,165,90,0.05))'
                    : 'transparent',
                  color: isActive ? '#C5A55A' : '#777',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.875rem',
                  border: isActive ? '1px solid rgba(197,165,90,0.15)' : '1px solid transparent',
                }}
              >
                <span
                  className="transition-all duration-200"
                  style={{
                    opacity: isActive ? 1 : 0.5,
                    filter: isActive ? 'drop-shadow(0 0 6px rgba(197,165,90,0.3))' : 'none',
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-5 rounded-full"
                    style={{ background: 'linear-gradient(180deg, #C5A55A, #A68B3E)' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          className="shrink-0 px-4 py-5 flex flex-col gap-3"
          style={{ borderTop: '1px solid rgba(197,165,90,0.08)' }}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200"
            style={{
              color: '#555',
              fontSize: '0.8125rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Retour à la boutique
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 w-full text-left"
            style={{
              color: '#EF4444',
              fontSize: '0.8125rem',
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.08)',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="sticky top-0 z-30 h-18 flex items-center justify-between px-8"
          style={{
            background: 'rgba(8,8,8,0.9)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(197,165,90,0.06)',
          }}
        >
          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2.5 -ml-2 rounded-xl transition-colors"
            style={{ color: '#888', background: 'rgba(255,255,255,0.04)' }}
            aria-label="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="hidden lg:block" />

          {/* Right side */}
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-end">
              <span style={{ color: '#bbb', fontSize: '0.8125rem', fontWeight: 500 }}>Admin</span>
              <span style={{ color: '#555', fontSize: '0.6875rem' }}>admin@vip-parfumerie.com</span>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(197,165,90,0.2), rgba(197,165,90,0.08))',
                border: '1px solid rgba(197,165,90,0.2)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C5A55A" strokeWidth={1.5}>
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
