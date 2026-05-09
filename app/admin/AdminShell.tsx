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
