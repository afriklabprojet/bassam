'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Accueil',
    icon: (active: boolean) => (
      <svg className="w-5.5 h-5.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/produits',
    label: 'Boutique',
    icon: (active: boolean) => (
      <svg className="w-5.5 h-5.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    href: '/services',
    label: 'Services',
    icon: (active: boolean) => (
      <svg className="w-5.5 h-5.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 8.25L18 9.25l-.25-1a2.25 2.25 0 00-1.5-1.5l-1-.25 1-.25a2.25 2.25 0 001.5-1.5l.25-1 .25 1a2.25 2.25 0 001.5 1.5l1 .25-1 .25a2.25 2.25 0 00-1.5 1.5zM16.5 20.25l-.5 1.5-.5-1.5a2.25 2.25 0 00-1.5-1.5l-1.5-.5 1.5-.5a2.25 2.25 0 001.5-1.5l.5-1.5.5 1.5a2.25 2.25 0 001.5 1.5l1.5.5-1.5.5a2.25 2.25 0 00-1.5 1.5z" />
      </svg>
    ),
  },
  {
    href: '/compte',
    label: 'Compte',
    icon: (active: boolean) => (
      <svg className="w-5.5 h-5.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{
        background: 'rgba(255,255,255,0.97)',
        borderTop: '1px solid var(--line-light)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 relative"
              style={{
                color: isActive ? 'var(--gold)' : 'var(--text-pale)',
                textDecoration: 'none',
                transition: 'color 0.2s',
                minHeight: 52,
                padding: '8px 0',
              }}
            >
              {/* Active top bar */}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '20px',
                    height: '2px',
                    background: 'var(--gold)',
                    borderRadius: '0 0 2px 2px',
                  }}
                />
              )}

              {/* Icon */}
              <span className="relative">
                {item.icon(isActive)}
              </span>

              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: '0.04em',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
