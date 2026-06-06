'use client';

import React, { useEffect, useState } from 'react';
import { GOLD } from '@/lib/admin-theme';

interface Refund {
  id: string;
  order_id: string | null;
  payment_id: string | null;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'cancelled';
  refund_method: string | null;
  notes: string | null;
  transaction_id: string | null;
  processed_at: string | null;
  created_at: string;
  orders?: { email?: string; phone?: string } | null;
}

interface Stats {
  pending: number; approved: number; rejected: number; processed: number; cancelled: number;
  total_pending_amount: number; total_processed_amount: number;
}

const CARD_BG = 'rgba(255,255,255,0.04)';
const BORDER = '1px solid rgba(255,255,255,0.07)';

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'En attente' },
  approved:  { bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6', label: 'Approuvé' },
  rejected:  { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444', label: 'Rejeté' },
  processed: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'Traité' },
  cancelled: { bg: 'rgba(107,114,128,0.12)',color: '#6B7280', label: 'Annulé' },
};

function fmtCFA(n: number) { return new Intl.NumberFormat('fr-FR').format(n) + ' F'; }
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminRemboursements() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, processed: 0, cancelled: 0, total_pending_amount: 0, total_processed_amount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newRefund, setNewRefund] = useState({ order_id: '', amount: 0, currency: 'XOF', reason: '', refund_method: 'original', notes: '' });
  const LIMIT = 50;

  async function load() {
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter) p.set('status', statusFilter);
      const res = await fetch(`/api/admin/refunds?${p}`);
      if (!res.ok) { setError(res.status === 403 ? 'Accès refusé' : 'Erreur'); return; }
      const d = await res.json();
      setRefunds(d.refunds ?? []);
      setStats(d.stats ?? {});
      setTotal(d.total ?? 0);
    } catch { setError('Erreur réseau'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void (async () => {
      try {
        const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
        if (statusFilter) p.set('status', statusFilter);
        const res = await fetch(`/api/admin/refunds?${p}`);
        if (!res.ok) { setError(res.status === 403 ? 'Accès refusé' : 'Erreur'); return; }
        const d = await res.json();
        setRefunds(d.refunds ?? []);
        setStats(d.stats ?? {});
        setTotal(d.total ?? 0);
      } catch { setError('Erreur réseau'); }
      finally { setLoading(false); }
    })();
  }, [page, statusFilter]);

  async function updateStatus(id: string, status: string) {
    setSaving(id);
    await fetch('/api/admin/refunds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setSaving(null);
    load();
  }

  async function addRefund() {
    setSaving('new');
    await fetch('/api/admin/refunds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRefund),
    });
    setSaving(null);
    setShowAdd(false);
    setNewRefund({ order_id: '', amount: 0, currency: 'XOF', reason: '', refund_method: 'original', notes: '' });
    load();
  }

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="px-6 py-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>{error}</div>
    </div>
  );

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#fff' }}>Remboursements</h1>
          <p style={{ color: '#666', fontSize: '0.875rem', marginTop: 2 }}>{total} demande{total > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg,#C5A55A,#A68B3E)', color: '#080808' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14" /></svg>
          Nouvelle demande
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'En attente', value: stats.pending, amount: stats.total_pending_amount, color: '#F59E0B', icon: '⏳' },
          { label: 'Approuvés', value: stats.approved, amount: null, color: '#3B82F6', icon: '✓' },
          { label: 'Traités', value: stats.processed, amount: stats.total_processed_amount, color: '#10B981', icon: '💸' },
          { label: 'Rejetés', value: stats.rejected, amount: null, color: '#EF4444', icon: '✗' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-5" style={{ background: CARD_BG, border: BORDER }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</span>
              <span style={{ color: s.color, fontWeight: 700 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            {s.amount !== null && <div style={{ color: '#777', fontSize: '0.75rem', marginTop: 2 }}>{fmtCFA(s.amount)}</div>}
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => { setStatusFilter(''); setPage(1); }} className="px-3.5 py-1.5 rounded-lg text-sm transition-all" style={{ background: !statusFilter ? GOLD : CARD_BG, color: !statusFilter ? '#080808' : '#999', fontWeight: !statusFilter ? 600 : 400 }}>Toutes</button>
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
        ) : refunds.length === 0 ? (
          <div className="py-12 text-center" style={{ color: '#666' }}>Aucune demande de remboursement</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Client', 'Motif', 'Montant', 'Méthode', 'Statut', 'Date', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left" style={{ color: '#555', fontWeight: 500, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => {
                  const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      >
                        <td className="px-5 py-3.5">
                          <div style={{ color: '#fff', fontWeight: 500 }}>{r.orders?.email ?? '—'}</div>
                          <div style={{ color: '#666', fontSize: '0.7rem' }}>{r.orders?.phone ?? ''}</div>
                        </td>
                        <td className="px-5 py-3.5" style={{ color: '#ccc', maxWidth: 200 }}>
                          <div className="truncate">{r.reason}</div>
                        </td>
                        <td className="px-5 py-3.5" style={{ color: '#fff', fontWeight: 600 }}>{fmtCFA(r.amount)}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: '#bbb' }}>{r.refund_method ?? '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={r.status}
                            onChange={(e) => { e.stopPropagation(); updateStatus(r.id, e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                            disabled={saving === r.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold outline-none cursor-pointer"
                            style={{ background: s.bg, color: s.color, border: 'none' }}
                          >
                            {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-3.5" style={{ color: '#666', fontSize: '0.75rem' }}>{fmtDate(r.created_at)}</td>
                        <td className="px-5 py-3.5">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth={1.5} style={{ transform: expanded === r.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </td>
                      </tr>
                      {expanded === r.id && (
                        <tr>
                          <td colSpan={7} className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <div className="grid grid-cols-2 gap-4" style={{ fontSize: '0.8rem' }}>
                              <div>
                                <div style={{ color: '#555', marginBottom: 2 }}>ID commande</div>
                                <div style={{ color: '#ccc', fontFamily: 'monospace' }}>{r.order_id ?? '—'}</div>
                              </div>
                              {r.notes && (
                                <div>
                                  <div style={{ color: '#555', marginBottom: 2 }}>Notes admin</div>
                                  <div style={{ color: '#ccc' }}>{r.notes}</div>
                                </div>
                              )}
                              {r.processed_at && (
                                <div>
                                  <div style={{ color: '#555', marginBottom: 2 }}>Traité le</div>
                                  <div style={{ color: '#ccc' }}>{fmtDate(r.processed_at)}</div>
                                </div>
                              )}
                              {r.transaction_id && (
                                <div>
                                  <div style={{ color: '#555', marginBottom: 2 }}>ID transaction remb.</div>
                                  <div style={{ color: '#ccc', fontFamily: 'monospace' }}>{r.transaction_id}</div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#111', border: `1px solid rgba(197,165,90,0.2)` }}>
            <h2 className="mb-5" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#fff' }}>Nouvelle demande de remboursement</h2>
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="ID commande" value={newRefund.order_id} onChange={(e) => setNewRefund({ ...newRefund, order_id: e.target.value })} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff', fontFamily: 'monospace' }} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div style={{ color: '#555', fontSize: '0.7rem', marginBottom: 4 }}>Montant *</div>
                  <input type="number" min={0} value={newRefund.amount || ''} onChange={(e) => setNewRefund({ ...newRefund, amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }} />
                </div>
                <div>
                  <div style={{ color: '#555', fontSize: '0.7rem', marginBottom: 4 }}>Méthode</div>
                  <select value={newRefund.refund_method} onChange={(e) => setNewRefund({ ...newRefund, refund_method: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }}>
                    {['original', 'bank_transfer', 'cash', 'credit', 'mobile_money'].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <input type="text" placeholder="Motif du remboursement *" value={newRefund.reason} onChange={(e) => setNewRefund({ ...newRefund, reason: e.target.value })} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }} />
              <textarea placeholder="Notes admin" value={newRefund.notes} onChange={(e) => setNewRefund({ ...newRefund, notes: e.target.value })} rows={3} className="px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={addRefund} disabled={saving === 'new' || !newRefund.amount || !newRefund.reason} className="flex-1 py-2.5 rounded-xl font-semibold text-sm" style={{ background: `linear-gradient(135deg,${GOLD},#A68B3E)`, color: '#080808' }}>
                {saving === 'new' ? 'Enregistrement…' : 'Créer la demande'}
              </button>
              <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl text-sm" style={{ background: CARD_BG, color: '#999', border: BORDER }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
