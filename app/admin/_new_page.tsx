'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ORDER_STATUS_KEYS,
  getDarkOrderStatusStyle,
  getOrderStatusLabel,
} from '@/lib/order-status-theme';

/* ─── Types ─────────────────────────────────────────────────────────── */

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

interface RecentOrder {
  id: string;
  reference: string;
  customerEmail: string;
  customerName?: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  itemsCount: number;
  createdAt: string;
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

/* ─── Helpers ────────────────────────────────────────────────────────── */

function formatCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function formatPct(n: number) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  mobile_money: 'Mobile Money',
  card: 'Carte bancaire',
  cash_on_delivery: 'À la livraison',
};

const PAYMENT_METHOD_ICON: Record<string, string> = {
  mobile_money: '📱',
  card: '💳',
  cash_on_delivery: '💵',
};

/* ─── Design constants ───────────────────────────────────────────────── */

const CARD_BASE: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(25,25,25,0.96) 0%, rgba(17,17,17,0.98) 100%)',
  border: '1px solid rgba(197,165,90,0.08)',
  borderRadius: '18px',
  overflow: 'hidden',
  boxShadow: '0 18px 42px rgba(0,0,0,0.24)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

/* ─── Reusable sub-components ────────────────────────────────────────── */

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
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
      <path
        d="M0 38 L10 32 L20 35 L30 28 L40 30 L50 22 L60 25 L70 18 L80 20 L90 12 L100 15 L110 8 L120 10 L120 48 L0 48Z"
        fill="url(#sparkFill)"
      />
    </svg>
  );
}

function KpiCard({
  label, value, sub, color = '#C5A55A', icon, badge,
}: Readonly<{
  label: string; value: string; sub?: string;
  color?: string; icon: string;
  badge?: { text: string; positive: boolean };
}>) {
  return (
    <div
      className="bento-card"
      style={{
        ...CARD_BASE,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
            background: badge.positive ? '#10B98122' : '#EF444422',
            color: badge.positive ? '#10B981' : '#EF4444',
          }}>
            {badge.text}
          </span>
        )}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.1, fontFamily: 'var(--font-serif)' }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#555' }}>{sub}</div>}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */

function getStockColor(stock: number): string {
  if (stock === 0) return '#EF4444';
  if (stock <= 3) return '#F59E0B';
  return '#10B981';
}

function getStockLabel(stock: number): string {
  if (stock === 0) return 'Rupture';
  return `${stock} restant${stock > 1 ? 's' : ''}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStat[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) {
          setError(res.status === 403 ? 'Accès refusé — administrateur requis' : 'Erreur de chargement');
          return;
        }
        const data = await res.json();
        setStats(data.stats);
        setRecentOrders(data.recentOrders ?? []);
        setTopProducts(data.topProducts ?? []);
        setLowStockProducts(data.lowStockProducts ?? []);
        setPaymentStats(data.paymentStats ?? []);
        setTopCustomers(data.topCustomers ?? []);
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full animate-spin"
              style={{ border: '2px solid rgba(197,165,90,0.1)', borderTopColor: '#C5A55A' }} />
          </div>
          <span style={{ color: '#555', fontSize: '0.8125rem', letterSpacing: '0.04em' }}>Chargement…</span>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="px-10 py-8 text-center" style={{ ...CARD_BASE, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', color: '#F87171' }}>
          <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>⚠️ {error}</p>
          <button onClick={() => globalThis.location.reload()} style={{ marginTop: 16, background: '#C5A55A', color: '#000', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const totalOrders = recentOrders.length;

  return (
    <>
      <style>{`
        .bento-card { position: relative; }
        .bento-card:hover {
          border-color: rgba(197,165,90,0.14) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(197,165,90,0.06);
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
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stat-value { animation: countUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      <div className="space-y-5">

        {/* ── Alert: pending orders ── */}
        {stats && stats.pendingOrdersCount > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#FCD34D', fontWeight: 600, fontSize: 13 }}>
              ⏳ {stats.pendingOrdersCount} commande{stats.pendingOrdersCount > 1 ? 's' : ''} en attente de traitement
            </span>
            <Link href="/admin/commandes" style={{ background: '#F59E0B', color: '#000', borderRadius: 8, padding: '5px 14px', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
              Traiter →
            </Link>
          </div>
        )}

        {/* ── Alert: low stock ── */}
        {stats && stats.lowStockCount > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#FCA5A5', fontWeight: 600, fontSize: 13 }}>
              ⚠️ {stats.lowStockCount} produit{stats.lowStockCount > 1 ? 's' : ''} avec stock faible (≤ 5 unités)
            </span>
            <Link href="/admin/produits" style={{ background: '#EF4444', color: '#fff', borderRadius: 8, padding: '5px 14px', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
              Voir →
            </Link>
          </div>
        )}

        {/* ══════════════ ROW 1 — Hero Revenue + Quick Actions ══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Hero Revenue */}
          <div
            className="bento-card lg:col-span-8 relative"
            style={{
              ...CARD_BASE,
              background: 'linear-gradient(135deg, rgba(197,165,90,0.06) 0%, rgba(255,255,255,0.015) 50%, rgba(197,165,90,0.03) 100%)',
              border: '1px solid rgba(197,165,90,0.1)',
              padding: 0,
            }}
          >
            <div style={{ position: 'absolute', top: -80, right: -40, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(197,165,90,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div className="relative z-10 p-8 pb-0">
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(197,165,90,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {greeting} — Chiffre d&apos;affaires total
                </span>
                {stats && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                    background: stats.monthGrowth >= 0 ? '#10B98122' : '#EF444422',
                    color: stats.monthGrowth >= 0 ? '#10B981' : '#EF4444',
                  }}>
                    {formatPct(stats.monthGrowth)} ce mois
                  </span>
                )}
              </div>
              <div className="stat-value" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 700, fontFamily: 'var(--font-serif)', lineHeight: 1.1, marginTop: 8 }}>
                <span className="gold-shimmer">{formatCFA(stats?.totalRevenue ?? 0)}</span>
              </div>
              <p style={{ color: '#555', fontSize: 13, marginTop: 12 }}>
                Aujourd&apos;hui&nbsp;: <strong style={{ color: '#C5A55A' }}>{formatCFA(stats?.revenueToday ?? 0)}</strong>&nbsp;&nbsp;|&nbsp;&nbsp;Panier moyen&nbsp;: <strong style={{ color: '#D9BE80' }}>{formatCFA(Math.round(stats?.averageOrderValue ?? 0))}</strong>
              </p>
            </div>
            <div className="relative z-10 mt-4" style={{ height: 48, opacity: 0.5 }}>
              <Sparkline color="#C5A55A" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bento-card lg:col-span-4 flex flex-col" style={{ ...CARD_BASE, padding: 28 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
              Actions rapides
            </span>
            <div className="flex flex-col gap-3 flex-1">
              {[
                { label: 'Nouveau produit', href: '/admin/produits', icon: '➕' },
                { label: 'Voir commandes', href: '/admin/commandes', icon: '📦' },
                { label: 'Gérer clients', href: '/admin/clients', icon: '👥' },
              ].map((a) => (
                <Link key={a.href} href={a.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                  borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(197,165,90,0.08)',
                  color: '#ccc', textDecoration: 'none', fontSize: 13, fontWeight: 500,
                  transition: 'background 0.2s',
                }}>
                  <span style={{ fontSize: 16 }}>{a.icon}</span>
                  {a.label}
                  <span style={{ marginLeft: 'auto', color: '#444', fontSize: 12 }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════ ROW 2 — 5 KPI mini-cards ══════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          <KpiCard icon="☀️" label="Aujourd'hui" value={formatCFA(stats?.revenueToday ?? 0)} />
          <KpiCard
            icon="📅" label="Ce mois-ci"
            value={formatCFA(stats?.revenueThisMonth ?? 0)}
            badge={stats ? { text: formatPct(stats.monthGrowth), positive: stats.monthGrowth >= 0 } : undefined}
          />
          <KpiCard icon="🗓️" label="Mois précédent" value={formatCFA(stats?.revenueLastMonth ?? 0)} color="#888" />
          <KpiCard icon="🎯" label="Panier moyen" value={formatCFA(Math.round(stats?.averageOrderValue ?? 0))} color="#A78BFA" />
          <KpiCard
            icon="⏳" label="En attente"
            value={String(stats?.pendingOrdersCount ?? 0)}
            color={stats && stats.pendingOrdersCount > 0 ? '#F59E0B' : '#10B981'}
            sub={stats && stats.pendingOrdersCount > 0 ? 'À traiter' : 'Tout traité ✓'}
          />
        </div>

        {/* ══════════════ ROW 3 — 4 global stat cards ══════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Commandes', value: stats?.totalOrders ?? 0, icon: '📦', color: '#3B82F6', href: '/admin/commandes' },
            { label: 'Produits', value: stats?.totalProducts ?? 0, icon: '🧴', color: '#C5A55A', href: '/admin/produits' },
            { label: 'Clients', value: stats?.totalCustomers ?? 0, icon: '👥', color: '#10B981', href: '/admin/clients' },
            { label: 'Newsletter', value: stats?.totalNewsletter ?? 0, icon: '📧', color: '#8B5CF6' },
          ].map((card) => (
            <div key={card.label} className="bento-card" style={{ ...CARD_BASE, display: 'flex', alignItems: 'center', gap: 16, padding: '20px 22px' }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: card.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {card.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div className="stat-value" style={{ fontSize: 26, fontWeight: 800, color: card.color, fontFamily: 'var(--font-serif)' }}>
                  {card.value.toLocaleString('fr-FR')}
                </div>
                <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</div>
              </div>
              {card.href && (
                <Link href={card.href} style={{ color: '#444', fontSize: 12, textDecoration: 'none' }}>→</Link>
              )}
            </div>
          ))}
        </div>

        {/* ══════════════ ROW 4 — Recent Orders + Status Breakdown ══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Orders Table */}
          <div className="bento-card lg:col-span-8" style={{ ...CARD_BASE, padding: 0 }}>
            <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#F0ECE4', fontFamily: 'var(--font-serif)' }}>Commandes récentes</h2>
                <span style={{ fontSize: 12, color: '#444', display: 'block', marginTop: 2 }}>
                  {recentOrders.length} dernière{recentOrders.length > 1 ? 's' : ''} commande{recentOrders.length > 1 ? 's' : ''}
                </span>
              </div>
              <Link href="/admin/commandes" style={{ fontSize: 12, color: '#C5A55A', fontWeight: 600, padding: '7px 16px', borderRadius: 10, background: 'rgba(197,165,90,0.06)', border: '1px solid rgba(197,165,90,0.1)', textDecoration: 'none' }}>
                Tout voir →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-7 py-20 text-center">
                <p style={{ color: '#555', fontSize: 14 }}>Aucune commande</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {['Réf.', 'Client', 'Articles', 'Montant', 'Paiement', 'Statut', 'Date'].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left" style={{ color: '#444', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, i) => {
                      const sc = getDarkOrderStatusStyle(order.status);
                      return (
                        <tr key={order.id} style={{ borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                          <td className="px-5 py-3.5">
                            <span style={{ color: '#C5A55A', fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>
                              #{(order.reference ?? order.id).slice(-6).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-5 py-3.5" style={{ color: '#bbb', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.customerName || order.customerEmail}
                          </td>
                          <td className="px-5 py-3.5" style={{ color: '#666', textAlign: 'center' }}>
                            {order.itemsCount}
                          </td>
                          <td className="px-5 py-3.5" style={{ color: '#F0ECE4', fontWeight: 600, fontFamily: 'var(--font-serif)', whiteSpace: 'nowrap' }}>
                            {formatCFA(order.totalAmount)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600,
                              background: order.paymentStatus === 'paid' ? '#10B98122' : '#F59E0B22',
                              color: order.paymentStatus === 'paid' ? '#10B981' : '#F59E0B',
                            }}>
                              {order.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: sc.bg, color: sc.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                              {getOrderStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5" style={{ color: '#555', fontSize: 12, whiteSpace: 'nowrap' }}>
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

          {/* Status Breakdown */}
          <div className="bento-card lg:col-span-4 flex flex-col" style={{ ...CARD_BASE, padding: 28 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>
              Répartition statuts
            </span>
            <div className="flex flex-col gap-4 flex-1">
              {ORDER_STATUS_KEYS.map((key) => {
                const count = recentOrders.filter((o) => o.status === key).length;
                const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                const sc = getDarkOrderStatusStyle(key);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: sc.dot, boxShadow: `0 0 6px ${sc.dot}30` }} />
                        <span style={{ fontSize: 13, color: '#999' }}>{getOrderStatusLabel(key)}</span>
                      </div>
                      <span style={{ fontSize: 13, color: '#ccc', fontWeight: 600, fontFamily: 'var(--font-serif)' }}>{count}</span>
                    </div>
                    <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.04)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: `linear-gradient(90deg, ${sc.dot}, ${sc.dot}80)`, transition: 'width 0.7s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-5 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 12, color: '#555' }}>Total commandes</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#F0ECE4', fontFamily: 'var(--font-serif)' }}>{stats?.totalOrders ?? 0}</span>
            </div>
          </div>
        </div>

        {/* ══════════════ ROW 5 — Top Products + Payment Methods + Top Customers ══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Top Products */}
          <div className="bento-card lg:col-span-5" style={{ ...CARD_BASE, padding: '24px 28px' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F0ECE4', fontFamily: 'var(--font-serif)' }}>🏆 Top produits</h3>
              <Link href="/admin/produits" style={{ fontSize: 12, color: '#C5A55A', textDecoration: 'none', fontWeight: 600 }}>Voir tout →</Link>
            </div>
            {topProducts.length === 0 ? (
              <p style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucune donnée disponible</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topProducts.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.025)' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? 'rgba(197,165,90,0.2)' : '#2a2a2a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800,
                      color: i === 0 ? '#C5A55A' : '#555',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#555' }}>{p.brand} · {p.qty} vendus</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#C5A55A', whiteSpace: 'nowrap' }}>{formatCFA(Math.round(p.revenue))}</div>
                      <div style={{ fontSize: 10, color: getStockColor(p.stock) }}>
                        Stock: {p.stock}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="bento-card lg:col-span-4" style={{ ...CARD_BASE, padding: '24px 28px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F0ECE4', fontFamily: 'var(--font-serif)', marginBottom: 20 }}>
              💳 Modes de paiement
            </h3>
            {paymentStats.length === 0 ? (
              <p style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucune donnée disponible</p>
            ) : (
              <div className="flex flex-col gap-5">
                {[...paymentStats].sort((a, b) => b.pct - a.pct).map((s) => (
                  <div key={s.method}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span style={{ fontSize: 12, color: '#aaa', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {PAYMENT_METHOD_ICON[s.method] ?? '💰'} {PAYMENT_METHOD_LABEL[s.method] ?? s.method}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#C5A55A' }}>{s.pct.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 6, background: '#1e1e1e', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.pct}%`, background: 'linear-gradient(90deg, #C5A55A, #E8D5A3)', borderRadius: 6, transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#444', marginTop: 3 }}>
                      {s.count} commande{s.count === 1 ? '' : 's'} · {formatCFA(Math.round(s.revenue))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Customers */}
          <div className="bento-card lg:col-span-3" style={{ ...CARD_BASE, padding: '24px 28px' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F0ECE4', fontFamily: 'var(--font-serif)' }}>👑 Top clients</h3>
              <Link href="/admin/clients" style={{ fontSize: 12, color: '#C5A55A', textDecoration: 'none', fontWeight: 600 }}>Voir →</Link>
            </div>
            {topCustomers.length === 0 ? (
              <p style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucune donnée disponible</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topCustomers.map((c, i) => (
                  <div key={c.email} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.025)' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? '#C5A55A' : '#2a2a2a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                      color: i === 0 ? '#000' : '#555',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                      <div style={{ fontSize: 10, color: '#444' }}>{c.orders} commande{c.orders === 1 ? '' : 's'}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#C5A55A', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {(c.total / 1000).toFixed(0)}k
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════ ROW 6 — Low Stock (conditionnel) ══════════════ */}
        {lowStockProducts.length > 0 && (
          <div className="bento-card" style={{ ...CARD_BASE, padding: '24px 28px' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F0ECE4', fontFamily: 'var(--font-serif)' }}>
                ⚠️ Stocks faibles — Action requise
              </h3>
              <Link href="/admin/produits" style={{ fontSize: 12, color: '#EF4444', textDecoration: 'none', fontWeight: 600 }}>
                Gérer les stocks →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {lowStockProducts.map((p) => (
                <div key={p.id} style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: p.stock === 0 ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.05)',
                  border: `1px solid ${p.stock === 0 ? '#EF444430' : '#F59E0B30'}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ddd', lineHeight: 1.2, marginBottom: 3 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>{p.brand}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: p.stock === 0 ? '#EF4444' : '#F59E0B' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.stock === 0 ? '#EF4444' : '#F59E0B', display: 'inline-block' }} />
                    {getStockLabel(p.stock)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
