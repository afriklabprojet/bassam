'use client';

import React, { useEffect, useState } from 'react';

interface Payment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transaction_id: string | null;
  provider: string | null;
  paid_at: string | null;
  created_at: string;
  orders?: { email?: string; phone?: string } | null;
}

interface Stats {
  total_revenue: number;
  pending_amount: number;
  count_completed: number;
  count_pending: number;
  count_failed: number;
  count_refunded: number;
}

const GOLD = '#C5A55A';
const CARD_BG = 'rgba(255,255,255,0.04)';
const BORDER = '1px solid rgba(255,255,255,0.07)';

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  completed:  { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'Complété' },
  pending:    { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'En attente' },
  failed:     { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444', label: 'Échoué' },
  refunded:   { bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6', label: 'Remboursé' },
  cancelled:  { bg: 'rgba(107,114,128,0.12)',color: '#6B7280', label: 'Annulé' },
};

function fmtCFA(n: number) { return new Intl.NumberFormat('fr-FR').format(n) + ' F'; }
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPaiements() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats>({ total_revenue: 0, pending_amount: 0, count_completed: 0, count_pending: 0, count_failed: 0, count_refunded: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 50;

  useEffect(() => {
    void (async () => {
      try {
        const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
        if (statusFilter) p.set('status', statusFilter);
        const res = await fetch(`/api/admin/payments?${p}`);
        if (!res.ok) { setError(res.status === 403 ? 'Accès refusé' : 'Erreur'); return; }
        const d = await res.json();
        setPayments(d.payments ?? []);
        setStats(d.stats ?? {});
        setTotal(d.total ?? 0);
      } catch { setError('Erreur réseau'); }
      finally { setLoading(false); }
    })();
  }, [page, statusFilter]);

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="px-6 py-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>{error}</div>
    </div>
  );

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#fff' }}>Paiements</h1>
        <p style={{ color: '#666', fontSize: '0.875rem', marginTop: 2 }}>{total} transaction{total > 1 ? 's' : ''}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Revenus totaux', value: fmtCFA(stats.total_revenue), color: '#10B981', icon: '💵' },
          { label: 'En attente', value: fmtCFA(stats.pending_amount), color: '#F59E0B', icon: '⏳' },
          { label: 'Complétés', value: String(stats.count_completed), color: GOLD, icon: '✅' },
          { label: 'En attente', value: String(stats.count_pending), color: '#F59E0B', icon: '🔄' },
          { label: 'Échoués', value: String(stats.count_failed), color: '#EF4444', icon: '❌' },
          { label: 'Remboursés', value: String(stats.count_refunded), color: '#8B5CF6', icon: '↩️' },
        ].map((s) => (
          <div key={s.label + s.icon} className="rounded-xl p-5" style={{ background: CARD_BG, border: BORDER }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => { setStatusFilter(''); setPage(1); }} className="px-3.5 py-1.5 rounded-lg text-sm transition-all" style={{ background: !statusFilter ? GOLD : CARD_BG, color: !statusFilter ? '#080808' : '#999', fontWeight: !statusFilter ? 600 : 400 }}>Tous</button>
        {Object.entries(STATUS_STYLE).map(([k, v]) => (
          <button key={k} onClick={() => { setStatusFilter(k); setPage(1); }} className="px-3.5 py-1.5 rounded-lg text-sm transition-all" style={{ background: statusFilter === k ? v.bg : CARD_BG, color: statusFilter === k ? v.color : '#999', fontWeight: statusFilter === k ? 600 : 400 }}>{v.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--noir-card)', border: BORDER }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(197,165,90,0.2)', borderTopColor: GOLD }} />
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center" style={{ color: '#666' }}>Aucun paiement trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['ID transaction', 'Client', 'Montant', 'Méthode', 'Statut', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left" style={{ color: '#555', fontWeight: 500, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.pending;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-3.5" style={{ color: '#888', fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.transaction_id ?? p.id.slice(0, 8) + '…'}</td>
                      <td className="px-5 py-3.5">
                        <div style={{ color: '#fff', fontWeight: 500 }}>{p.orders?.email ?? '—'}</div>
                        <div style={{ color: '#666', fontSize: '0.7rem' }}>{p.orders?.phone ?? ''}</div>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: '#fff', fontWeight: 600 }}>{fmtCFA(p.amount)}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: '#ccc' }}>{p.method}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: '#666', fontSize: '0.75rem' }}>{fmtDate(p.paid_at ?? p.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span style={{ color: '#666', fontSize: '0.8rem' }}>Page {page} / {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: CARD_BG, color: page <= 1 ? '#444' : '#fff', border: BORDER }}>← Précédent</button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: CARD_BG, color: page >= totalPages ? '#444' : '#fff', border: BORDER }}>Suivant →</button>
          </div>
        </div>
      )}
    </div>
  );
}
