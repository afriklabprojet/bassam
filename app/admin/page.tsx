'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Stats, TopProduct, LowStockProduct, PaymentStat, TopCustomer, RecentOrder } from './dashboard-ui';
import {
  CARD_BASE,
  getGreeting,
  HeroRevenueCard,
  QuickActionsCard,
  StatCards,
  OrdersTable,
  StatusBreakdown,
  RevenueDetailsRow,
  TopProductsTable,
  PaymentMethodsCard,
  TopCustomersTable,
  LowStockCard,
} from './dashboard-ui';

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

  useEffect(() => {
    void (async () => {
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
    })();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '2px solid rgba(197,165,90,0.1)', borderTopColor: '#C5A55A' }} />
            <div className="absolute inset-1.5 rounded-full animate-spin" style={{ border: '2px solid rgba(197,165,90,0.06)', borderBottomColor: 'rgba(197,165,90,0.4)', animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <span style={{ color: '#555', fontSize: '0.8125rem', letterSpacing: '0.04em' }}>Chargement…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="px-10 py-8 text-center" style={{ ...CARD_BASE, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', color: '#F87171' }}>
          <svg className="mx-auto mb-4" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{error}</p>
        </div>
      </div>
    );
  }

  const greeting = getGreeting(new Date().getHours());

  return (
    <>
      <style>{`
        .bento-card { position: relative; }
        .bento-card::before { content: ''; position: absolute; inset: 0; border-radius: 20px; opacity: 0; transition: opacity 0.4s ease; background: radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(197,165,90,0.04), transparent 40%); pointer-events: none; z-index: 0; }
        .bento-card:hover::before { opacity: 1; }
        .bento-card:hover { border-color: rgba(197,165,90,0.12) !important; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(197,165,90,0.06); }
        @keyframes countUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .stat-value { animation: countUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .gold-shimmer { background: linear-gradient(90deg, #C5A55A 0%, #E8D5A0 50%, #C5A55A 100%); background-size: 200% 100%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 3s ease-in-out infinite; }
      `}</style>

      <div ref={containerRef} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <HeroRevenueCard stats={stats} greeting={greeting} />
          <QuickActionsCard />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCards stats={stats} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <OrdersTable orders={recentOrders} />
          <StatusBreakdown orders={recentOrders} totalOrders={stats?.totalOrders ?? 0} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <RevenueDetailsRow stats={stats} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <TopProductsTable products={topProducts} />
          <PaymentMethodsCard paymentStats={paymentStats} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <TopCustomersTable customers={topCustomers} />
          <LowStockCard products={lowStockProducts} lowStockCount={stats?.lowStockCount ?? 0} />
        </div>
      </div>
    </>
  );
}
