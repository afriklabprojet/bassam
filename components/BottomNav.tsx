'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-context';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Accueil',
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/produits',
    label: 'Parfums',
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    href: '/panier',
    label: 'Panier',
    cart: true,
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
      </svg>
    ),
  },
  {
    href: '/compte',
    label: 'Compte',
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden safe-area-bottom"
      style={{
        background: 'rgba(255,255,255,0.97)',
        borderTop: '1px solid var(--line-light)',
        backdropFilter: 'blur(12px)',
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
              className="flex flex-col items-center justify-center gap-1 py-2.5 relative"
              style={{
                color: isActive ? 'var(--gold)' : 'var(--text-pale)',
                textDecoration: 'none',
                transition: 'color 0.2s',
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
                {item.cart && totalItems > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-6px',
                      minWidth: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      background: 'var(--gold)',
                      color: 'var(--noir)',
                      fontSize: '9px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                    }}
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
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
