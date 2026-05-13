'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ORDER_STATUS_KEYS, ORDER_STATUS_LABELS, getDarkOrderStatusStyle, getOrderStatusLabel } from '@/lib/order-status-theme';

/* ─── Types ────────────────────────────────────────────── */
interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalNewsletter: number;
  revenueToday: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  monthGrowth: number;
  averageOrderValue: number;
  pendingOrdersCount: number;
  lowStockCount: number;
}

interface TopProduct {
  id: string;
  name: string;
  brand: string;
  image: string;
  stock: number;
  revenue: number;
  qty: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  brand: string;
  stock: number;
  image: string;
}

interface PaymentStat {
  method: string;
  count: number;
  revenue: number;
  pct: number;
}

interface TopCustomer {
  email: string;
  total: number;
  orders: number;
}

interface RecentOrder {
  id: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  email: string;
  phone: string;
  itemsCount: number;
  createdAt: string;
}

/* ─── Payment method labels ─────────────────────────────── */
const PAYMENT_LABELS: Record<string, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  card: 'Carte bancaire',
  cash: 'Espèces',
  unknown: 'Inconnu',
};

/* ─── Constants ────────────────────────────────────────── */
/* ─── Helpers ──────────────────────────────────────────── */
function formatCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatMonthGrowth(growth: number | null | undefined): string {
  if (growth == null) return '—%';
  const sign = growth >= 0 ? '+' : '';
  return `${sign}${growth.toFixed(1)}%`;
}

function formatStockBadge(stock: number): string {
  if (stock === 0) return 'Rupture';
  const s = stock > 1 ? 's' : '';
  return `${stock} restant${s}`;
}

/* ─── Sparkline SVG component ──────────────────────────── */
function Sparkline({ color = '#C5A55A' }: Readonly<{ color?: string }>) {
  return (
    <svg width="100%" height="48" viewBox="0 0 120 48" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 38 L10 32 L20 35 L30 28 L40 30 L50 22 L60 25 L70 18 L80 20 L90 12 L100 15 L110 8 L120 10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
      <path
        d="M0 38 L10 32 L20 35 L30 28 L40 30 L50 22 L60 25 L70 18 L80 20 L90 12 L100 15 L110 8 L120 10 L120 48 L0 48Z"
        fill="url(#sparkFill)"
      />
    </svg>
  );
}

/* ─── Bento Card wrapper ───────────────────────────────── */
const CARD_BASE: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(25,25,25,0.96) 0%, rgba(17,17,17,0.98) 100%)',
  border: '1px solid rgba(197,165,90,0.08)',
  borderRadius: '18px',
  overflow: 'hidden',
  boxShadow: '0 18px 42px rgba(0,0,0,0.24)',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
};

const CARD_HOVER = 'bento-card';

/* ─── Main Component ───────────────────────────────────── */
export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStat[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) {
        setError(res.status === 403 ? 'Accès refusé — vous devez être administrateur' : 'Erreur de chargement');
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setRecentOrders(data.recentOrders);
      setTopProducts(data.topProducts ?? []);
      setLowStockProducts(data.lowStockProducts ?? []);
      setPaymentStats(data.paymentStats ?? []);
      setTopCustomers(data.topCustomers ?? []);
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleMouseMove = (e: MouseEvent) => {
      const cards = el.querySelectorAll('.bento-card');
      cards.forEach((card) => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        (card as HTMLElement).style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    };
    el.addEventListener('mousemove', handleMouseMove);
    return () => el.removeEventListener('mousemove', handleMouseMove);
  }, []);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{ border: '2px solid rgba(197,165,90,0.1)', borderTopColor: '#C5A55A' }}
            />
            <div
              className="absolute inset-1.5 rounded-full animate-spin"
              style={{ border: '2px solid rgba(197,165,90,0.06)', borderBottomColor: 'rgba(197,165,90,0.4)', animationDirection: 'reverse', animationDuration: '1.5s' }}
            />
          </div>
          <span style={{ color: '#555', fontSize: '0.8125rem', letterSpacing: '0.04em' }}>Chargement…</span>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div
          className="px-10 py-8 text-center"
          style={{
            ...CARD_BASE,
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.1)',
            color: '#F87171',
          }}
        >
          <svg className="mx-auto mb-4" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{error}</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = getGreeting(hour);

  return (
    <>
      {/* ── Scoped styles for hover / animations ── */}
      <style>{`
        .bento-card {
          position: relative;
        }
        .bento-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          opacity: 0;
          transition: opacity 0.4s ease;
          background: radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(197,165,90,0.04), transparent 40%);
          pointer-events: none;
          z-index: 0;
        }
        .bento-card:hover::before {
          opacity: 1;
        }
        .bento-card:hover {
          border-color: rgba(197,165,90,0.12) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(197,165,90,0.06);
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stat-value {
          animation: countUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .gold-shimmer {
          background: linear-gradient(90deg, #C5A55A 0%, #E8D5A0 50%, #C5A55A 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>

      <div ref={containerRef} className="space-y-5">
        {/* ═══════════ ROW 1 — Hero Revenue (span 8) + Quick Actions (span 4) ═══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Hero Revenue Card ── */}
          <div
            className={`${CARD_HOVER} lg:col-span-8 relative`}
            style={{
              ...CARD_BASE,
              background: 'linear-gradient(135deg, rgba(197,165,90,0.06) 0%, rgba(255,255,255,0.015) 50%, rgba(197,165,90,0.03) 100%)',
              border: '1px solid rgba(197,165,90,0.1)',
              padding: 0,
            }}
          >
            {/* Radial glow */}
            <div style={{
              position: 'absolute', top: '-80px', right: '-40px',
              width: '300px', height: '300px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(197,165,90,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div className="relative z-10 p-8 pb-0">
              <div className="flex items-center justify-between mb-1">
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(197,165,90,0.6)',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                }}>
                  {greeting} — Chiffre d&apos;affaires total
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                  style={{
                    fontSize: '0.6875rem', fontWeight: 500, color: '#D9BE80',
                    background: 'rgba(197,165,90,0.08)', border: '1px solid rgba(197,165,90,0.12)',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M1 7L5 3L9 7" />
                  </svg>
                  Actif
                </span>
              </div>
              <div className="stat-value" style={{
                fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700,
                fontFamily: 'var(--font-serif)', lineHeight: 1.1,
                marginTop: '8px',
              }}>
                <span className="gold-shimmer">{formatCFA(stats?.totalRevenue ?? 0)}</span>
              </div>
            </div>

            {/* Sparkline at bottom */}
            <div className="relative z-10 mt-4" style={{ height: '48px', opacity: 0.6 }}>
              <Sparkline color="#C5A55A" />
            </div>
          </div>

          {/* ── Quick Actions Card ── */}
          <div
            className={`${CARD_HOVER} lg:col-span-4 flex flex-col`}
            style={{ ...CARD_BASE, padding: '28px' }}
          >
            <span style={{
              fontSize: '0.6875rem', fontWeight: 600, color: '#555',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px',
            }}>
              Actions rapides
            </span>
            <div className="flex flex-col gap-3 flex-1">
              {[
                { label: 'Nouveau produit', href: '/admin/produits', icon: 'M12 5v14M5 12h14', color: '#C5A55A' },
                { label: 'Voir commandes', href: '/admin/commandes', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: '#D9BE80' },
                { label: 'Gérer clients', href: '/admin/clients', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', color: '#E8D9C0' },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group/action"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(197,165,90,0.08)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover/action:scale-110"
                    style={{ background: `${action.color}12`, border: `1px solid ${action.color}20` }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={action.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d={action.icon} />
                    </svg>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: '#ccc', fontWeight: 500 }}>{action.label}</span>
                  <svg
                    className="ml-auto opacity-0 group-hover/action:opacity-100 transition-all duration-200 group-hover/action:translate-x-0.5"
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth={2}
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              label: 'Commandes', value: stats?.totalOrders ?? 0,
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>,
              accent: '#D9BE80', href: '/admin/commandes',
            },
            {
              label: 'Produits', value: stats?.totalProducts ?? 0,
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><circle cx="7" cy="7" r="1" fill="currentColor" /></svg>,
              accent: '#C5A55A', href: '/admin/produits',
            },
            {
              label: 'Clients', value: stats?.totalCustomers ?? 0,
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
              accent: '#E8D9C0', href: '/admin/clients',
            },
            {
              label: 'Newsletter', value: stats?.totalNewsletter ?? 0,
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
              accent: '#9B7B38',
            },
          ].map((card, i) => (
            <div
              key={card.label}
              className={`${CARD_HOVER} group relative`}
              style={{
                ...CARD_BASE,
                padding: '24px',
                animationDelay: `${i * 0.08}s`,
              }}
            >
              {/* Accent line top */}
              <div style={{
                position: 'absolute', top: 0, left: '24px', right: '24px', height: '1px',
                background: `linear-gradient(90deg, transparent, ${card.accent}30, transparent)`,
              }} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${card.accent}10`, color: card.accent }}
                  >
                    {card.icon}
                  </div>
                  {card.href && (
                    <Link
                      href={card.href}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0"
                      style={{ color: card.accent, fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.04em' }}
                    >
                      Voir →
                    </Link>
                  )}
                </div>
                <div className="stat-value" style={{
                  fontSize: '2rem', fontWeight: 700, color: '#F0ECE4', lineHeight: 1,
                  fontFamily: 'var(--font-serif)',
                }}>
                  {card.value}
                </div>
                <span style={{
                  fontSize: '0.75rem', color: '#555', fontWeight: 500,
                  display: 'block', marginTop: '6px',
                }}>
                  {card.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ═══════════ ROW 3 — Orders Table (span 8) + Status Breakdown (span 4) ═══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Orders Table ── */}
          <div
            className={`${CARD_HOVER} lg:col-span-8`}
            style={{ ...CARD_BASE, padding: 0 }}
          >
            <div
              className="flex items-center justify-between px-7 py-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div>
                <h2 style={{
                  fontSize: '1.0625rem', fontWeight: 600, color: '#F0ECE4',
                  fontFamily: 'var(--font-serif)',
                }}>
                  Commandes récentes
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#444', marginTop: '2px', display: 'block' }}>
                  {recentOrders.length} dernière{recentOrders.length > 1 ? 's' : ''} commande{recentOrders.length > 1 ? 's' : ''}
                </span>
              </div>
              <Link
                href="/admin/commandes"
                className="transition-all duration-200 hover:brightness-110"
                style={{
                  fontSize: '0.75rem', color: '#C5A55A', fontWeight: 500,
                  padding: '7px 16px', borderRadius: '10px',
                  background: 'rgba(197,165,90,0.06)',
                  border: '1px solid rgba(197,165,90,0.1)',
                }}
              >
                Tout voir
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-7 py-20 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth={1.5}>
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </div>
                <p style={{ color: '#555', fontSize: '0.875rem', fontWeight: 500 }}>Aucune commande</p>
                <p style={{ color: '#333', fontSize: '0.75rem', marginTop: '4px' }}>Les nouvelles commandes apparaîtront ici</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {['Réf.', 'Client', 'Montant', 'Statut', 'Date'].map((h) => (
                        <th
                          key={h}
                          className="px-7 py-3.5 text-left"
                          style={{
                            color: '#444', fontWeight: 600, fontSize: '0.6875rem',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, i) => {
                      const sc = getDarkOrderStatusStyle(order.status);
                      return (
                        <tr
                          key={order.id}
                          className="transition-colors duration-150 hover:bg-white/1.5"
                          style={{
                            borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                          }}
                        >
                          <td className="px-7 py-4">
                            <span style={{ color: '#666', fontFamily: 'monospace', fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: '6px' }}>
                              #{order.id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="px-7 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(197,165,90,0.1), rgba(197,165,90,0.05))',
                                  border: '1px solid rgba(197,165,90,0.1)',
                                  color: '#C5A55A', fontSize: '0.6875rem', fontWeight: 700,
                                }}
                              >
                                {(order.email?.[0] ?? '?').toUpperCase()}
                              </div>
                              <span style={{ color: '#bbb', fontSize: '0.8125rem' }}>{order.email}</span>
                            </div>
                          </td>
                          <td className="px-7 py-4" style={{ color: '#F0ECE4', fontWeight: 600, fontFamily: 'var(--font-serif)' }}>
                            {formatCFA(order.totalAmount)}
                          </td>
                          <td className="px-7 py-4">
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                              style={{ background: sc.bg, color: sc.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot, boxShadow: `0 0 6px ${sc.dot}40` }} />
                              {getOrderStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-7 py-4" style={{ color: '#555', fontSize: '0.75rem' }}>
                            {formatDate(order.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Status Breakdown / Activity Panel ── */}
          <div
            className={`${CARD_HOVER} lg:col-span-4 flex flex-col`}
            style={{ ...CARD_BASE, padding: '28px' }}
          >
            <span style={{
              fontSize: '0.6875rem', fontWeight: 600, color: '#555',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px',
            }}>
              Répartition statuts
            </span>

            {/* Status bars */}
            <div className="flex flex-col gap-4 flex-1">
              {ORDER_STATUS_KEYS.map((key) => {
                const label = ORDER_STATUS_LABELS[key];
                const count = recentOrders.filter((o) => o.status === key).length;
                const pct = recentOrders.length > 0 ? (count / recentOrders.length) * 100 : 0;
                const sc = getDarkOrderStatusStyle(key);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: sc.dot, boxShadow: `0 0 6px ${sc.dot}30` }} />
                        <span style={{ fontSize: '0.8125rem', color: '#999' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: '0.8125rem', color: '#ccc', fontWeight: 600, fontFamily: 'var(--font-serif)' }}>
                        {count}
                      </span>
                    </div>
                    <div
                      className="w-full rounded-full overflow-hidden"
                      style={{ height: '4px', background: 'rgba(255,255,255,0.04)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          background: `linear-gradient(90deg, ${sc.dot}, ${sc.dot}80)`,
                          boxShadow: `0 0 8px ${sc.dot}20`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div
              className="mt-6 pt-5 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
            >
              <span style={{ fontSize: '0.75rem', color: '#555' }}>Total commandes</span>
              <span style={{
                fontSize: '1.5rem', fontWeight: 700, color: '#F0ECE4',
                fontFamily: 'var(--font-serif)',
              }}>
                {stats?.totalOrders ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════ ROW 4 — Revenue Details ═══════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              label: "Aujourd'hui",
              value: formatCFA(stats?.revenueToday ?? 0),
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
              accent: '#C5A55A',
            },
            {
              label: 'Ce mois',
              value: formatCFA(stats?.revenueThisMonth ?? 0),
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
              accent: '#D9BE80',
            },
            {
              label: 'Croissance mois',
              value: formatMonthGrowth(stats?.monthGrowth),
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
              accent: (stats?.monthGrowth ?? 0) >= 0 ? '#6EE7B7' : '#F87171',
              textColor: (stats?.monthGrowth ?? 0) >= 0 ? '#6EE7B7' : '#F87171',
            },
            {
              label: 'Panier moyen',
              value: formatCFA(stats?.averageOrderValue ?? 0),
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>,
              accent: '#E8D9C0',
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`${CARD_HOVER} relative`}
              style={{ ...CARD_BASE, padding: '20px 24px' }}
            >
              <div style={{
                position: 'absolute', top: 0, left: '20px', right: '20px', height: '1px',
                background: `linear-gradient(90deg, transparent, ${card.accent}25, transparent)`,
              }} />
              <div className="flex items-center gap-2 mb-3">
                <div style={{ color: card.accent }}>{card.icon}</div>
                <span style={{ fontSize: '0.6875rem', color: '#555', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {card.label}
                </span>
              </div>
              <div className="stat-value" style={{
                fontSize: '1.25rem', fontWeight: 700,
                color: ('textColor' in card && card.textColor) ? card.textColor : '#F0ECE4',
                fontFamily: 'var(--font-serif)',
              }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* ═══════════ ROW 5 — Top Products (8) + Payment Methods (4) ═══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Top Products ── */}
          <div
            className={`${CARD_HOVER} lg:col-span-8`}
            style={{ ...CARD_BASE, padding: 0 }}
          >
            <div
              className="flex items-center justify-between px-7 py-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#F0ECE4', fontFamily: 'var(--font-serif)' }}>
                  Top Produits
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#444', display: 'block', marginTop: '2px' }}>
                  Par chiffre d&apos;affaires généré
                </span>
              </div>
              <Link
                href="/admin/produits"
                style={{ fontSize: '0.75rem', color: '#C5A55A', fontWeight: 500, padding: '7px 16px', borderRadius: '10px', background: 'rgba(197,165,90,0.06)', border: '1px solid rgba(197,165,90,0.1)' }}
              >
                Gérer →
              </Link>
            </div>

            {topProducts.length === 0 ? (
              <div className="px-7 py-16 text-center">
                <p style={{ color: '#555', fontSize: '0.875rem' }}>Aucune donnée de vente disponible</p>
              </div>
            ) : (
              <div className="divide-y divide-white/3">
                {topProducts.map((product, i) => {
                  const maxRevenue = topProducts[0]?.revenue ?? 1;
                  const pct = (product.revenue / maxRevenue) * 100;
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-5 px-7 py-4 transition-colors duration-150 hover:bg-white/1.5"
                    >
                      {/* Rank */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{
                          background: i === 0 ? 'rgba(197,165,90,0.12)' : 'rgba(255,255,255,0.04)',
                          color: i === 0 ? '#C5A55A' : '#444',
                          border: i === 0 ? '1px solid rgba(197,165,90,0.2)' : '1px solid transparent',
                        }}
                      >
                        {i + 1}
                      </div>

                      {/* Image */}
                      <div
                        className="w-10 h-10 rounded-xl shrink-0 overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        {product.image ? (
                          <Image src={product.image} alt={product.name} width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth={1.5}>
                              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="min-w-0">
                            <p style={{ fontSize: '0.875rem', color: '#e0ddd6', fontWeight: 500 }} className="truncate">{product.name}</p>
                            <p style={{ fontSize: '0.6875rem', color: '#555' }}>{product.brand} · {product.qty} vendu{product.qty > 1 ? 's' : ''}</p>
                          </div>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#C5A55A', fontFamily: 'var(--font-serif)', flexShrink: 0, marginLeft: '12px' }}>
                            {formatCFA(product.revenue)}
                          </span>
                        </div>
                        <div className="w-full rounded-full overflow-hidden" style={{ height: '3px', background: 'rgba(255,255,255,0.04)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg, rgba(197,165,90,0.6), rgba(197,165,90,0.2))',
                            }}
                          />
                        </div>
                      </div>

                      {/* Stock badge */}
                      <div
                        className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: product.stock <= 5 ? 'rgba(239,68,68,0.08)' : 'rgba(110,231,183,0.06)',
                          color: product.stock <= 5 ? '#F87171' : '#6EE7B7',
                          border: `1px solid ${product.stock <= 5 ? 'rgba(239,68,68,0.12)' : 'rgba(110,231,183,0.1)'}`,
                        }}
                      >
                        {product.stock} en stock
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Payment Methods ── */}
          <div
            className={`${CARD_HOVER} lg:col-span-4 flex flex-col`}
            style={{ ...CARD_BASE, padding: '28px' }}
          >
            <span style={{
              fontSize: '0.6875rem', fontWeight: 600, color: '#555',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px',
            }}>
              Méthodes de paiement
            </span>

            {paymentStats.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p style={{ color: '#444', fontSize: '0.8125rem' }}>Aucune donnée</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5 flex-1">
                {paymentStats.toSorted((a, b) => b.pct - a.pct).map((pm, i) => {
                  const colors = ['#C5A55A', '#D9BE80', '#E8D9C0', '#9B7B38'];
                  const color = colors[i % colors.length];
                  return (
                    <div key={pm.method}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          <span style={{ fontSize: '0.8125rem', color: '#aaa' }}>
                            {PAYMENT_LABELS[pm.method] ?? pm.method}
                          </span>
                        </div>
                        <div className="text-right">
                          <span style={{ fontSize: '0.8125rem', color: '#ccc', fontWeight: 600 }}>{pm.count}</span>
                          <span style={{ fontSize: '0.6875rem', color: '#555', marginLeft: '6px' }}>{pm.pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="w-full rounded-full overflow-hidden" style={{ height: '4px', background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(pm.pct, 2)}%`,
                            background: `linear-gradient(90deg, ${color}, ${color}60)`,
                            boxShadow: `0 0 6px ${color}20`,
                          }}
                        />
                      </div>
                      <p style={{ fontSize: '0.6875rem', color: '#444', marginTop: '4px' }}>{formatCFA(pm.revenue)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ ROW 6 — Top Customers (8) + Low Stock (4) ═══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Top Customers ── */}
          <div
            className={`${CARD_HOVER} lg:col-span-8`}
            style={{ ...CARD_BASE, padding: 0 }}
          >
            <div
              className="flex items-center justify-between px-7 py-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#F0ECE4', fontFamily: 'var(--font-serif)' }}>
                  Meilleurs Clients
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#444', display: 'block', marginTop: '2px' }}>
                  Par volume d&apos;achat total
                </span>
              </div>
              <Link
                href="/admin/clients"
                style={{ fontSize: '0.75rem', color: '#C5A55A', fontWeight: 500, padding: '7px 16px', borderRadius: '10px', background: 'rgba(197,165,90,0.06)', border: '1px solid rgba(197,165,90,0.1)' }}
              >
                Tout voir →
              </Link>
            </div>

            {topCustomers.length === 0 ? (
              <div className="px-7 py-16 text-center">
                <p style={{ color: '#555', fontSize: '0.875rem' }}>Aucun client enregistré</p>
              </div>
            ) : (
              <div className="divide-y divide-white/3">
                {topCustomers.map((customer, i) => {
                  const maxTotal = topCustomers[0]?.total ?? 1;
                  const pct = (customer.total / maxTotal) * 100;
                  const initials = customer.email.slice(0, 2).toUpperCase();
                  const avatarColors = [
                    { bg: 'rgba(197,165,90,0.12)', color: '#C5A55A', border: 'rgba(197,165,90,0.2)' },
                    { bg: 'rgba(217,190,128,0.08)', color: '#D9BE80', border: 'rgba(217,190,128,0.15)' },
                    { bg: 'rgba(232,217,192,0.06)', color: '#E8D9C0', border: 'rgba(232,217,192,0.12)' },
                    { bg: 'rgba(155,123,56,0.08)', color: '#9B7B38', border: 'rgba(155,123,56,0.15)' },
                    { bg: 'rgba(255,255,255,0.04)', color: '#666', border: 'rgba(255,255,255,0.06)' },
                  ];
                  const av = avatarColors[i % avatarColors.length];
                  return (
                    <div
                      key={customer.email}
                      className="flex items-center gap-4 px-7 py-4 transition-colors duration-150 hover:bg-white/1.5"
                    >
                      {/* Rank */}
                      <span style={{ fontSize: '0.6875rem', color: '#444', fontWeight: 600, width: '16px', textAlign: 'center', flexShrink: 0 }}>
                        {i + 1}
                      </span>

                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ background: av.bg, color: av.color, border: `1px solid ${av.border}` }}
                      >
                        {initials}
                      </div>

                      {/* Info + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="min-w-0">
                            <p style={{ fontSize: '0.875rem', color: '#ccc' }} className="truncate">{customer.email}</p>
                            <p style={{ fontSize: '0.6875rem', color: '#555' }}>
                              {customer.orders} commande{customer.orders > 1 ? 's' : ''}
                            </p>
                          </div>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#C5A55A', fontFamily: 'var(--font-serif)', flexShrink: 0, marginLeft: '12px' }}>
                            {formatCFA(customer.total)}
                          </span>
                        </div>
                        <div className="w-full rounded-full overflow-hidden" style={{ height: '3px', background: 'rgba(255,255,255,0.04)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, rgba(197,165,90,0.5), rgba(197,165,90,0.15))' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Low Stock Alerts ── */}
          <div
            className={`${CARD_HOVER} lg:col-span-4 flex flex-col`}
            style={{ ...CARD_BASE, padding: 0 }}
          >
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth={2}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#F0ECE4' }}>Stock faible</h2>
                  {(stats?.lowStockCount ?? 0) > 0 && (
                    <span style={{ fontSize: '0.6875rem', color: '#F87171' }}>
                      {stats?.lowStockCount} produit{(stats?.lowStockCount ?? 0) > 1 ? 's' : ''} critique{(stats?.lowStockCount ?? 0) > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href="/admin/produits"
                style={{ fontSize: '0.6875rem', color: '#F87171', fontWeight: 500, opacity: 0.7 }}
              >
                Gérer →
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 px-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.1)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth={1.5}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p style={{ color: '#6EE7B7', fontSize: '0.875rem', fontWeight: 500 }}>Stocks OK</p>
                <p style={{ color: '#444', fontSize: '0.75rem', marginTop: '4px', textAlign: 'center' }}>Tous les produits sont bien approvisionnés</p>
              </div>
            ) : (
              <div className="divide-y divide-white/3 flex-1">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 px-6 py-3.5 transition-colors duration-150 hover:bg-white/1.5"
                  >
                    {/* Image */}
                    <div
                      className="w-9 h-9 rounded-lg shrink-0 overflow-hidden"
                      style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}
                    >
                      {product.image ? (
                        <Image src={product.image} alt={product.name} width={36} height={36} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth={1.5} strokeOpacity={0.5}>
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '0.8125rem', color: '#ccc', fontWeight: 500 }} className="truncate">{product.name}</p>
                      <p style={{ fontSize: '0.6875rem', color: '#555' }}>{product.brand}</p>
                    </div>

                    {/* Stock count */}
                    <div
                      className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: product.stock === 0 ? 'rgba(239,68,68,0.12)' : 'rgba(251,146,60,0.08)',
                        color: product.stock === 0 ? '#F87171' : '#FB923C',
                        border: `1px solid ${product.stock === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(251,146,60,0.12)'}`,
                      }}
                    >
                      {formatStockBadge(product.stock)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
