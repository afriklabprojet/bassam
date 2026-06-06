'use client';

import React, { useEffect, useState } from 'react';
import { ORDER_STATUS_KEYS, ORDER_STATUS_LABELS, getDarkOrderStatusStyle } from '@/lib/order-status-theme';
import { formatCFA, formatDateTime as formatDate } from '@/lib/format';

interface OrderItem {
  quantity: number;
  unitPrice: number;
  productName: string;
}

interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  shippingAddress: Record<string, unknown> | null;
  items: OrderItem[];
  createdAt: string;
  customerEmail: string | null;
  customerName: string | null;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) { setError(res.status === 403 ? 'Accès refusé' : 'Erreur'); return; }
      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`/api/admin/orders?${params}`);
        if (!res.ok) { setError(res.status === 403 ? 'Accès refusé' : 'Erreur'); return; }
        const data = await res.json();
        setOrders(data.orders);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    })();
  }, [page, statusFilter]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setUpdating(null);
    load();
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="px-6 py-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#fff' }}>
          Commandes
        </h1>
        <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '2px' }}>
          {total} commande{total > 1 ? 's' : ''}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className="px-3.5 py-1.5 rounded-lg text-sm transition-all duration-200"
          style={{
            background: !statusFilter ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
            color: !statusFilter ? 'var(--noir)' : '#999',
            fontWeight: !statusFilter ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          Toutes
        </button>
        {ORDER_STATUS_KEYS.map((s) => {
          const statusStyle = getDarkOrderStatusStyle(s);
          return (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className="px-3.5 py-1.5 rounded-lg text-sm transition-all duration-200"
            style={{
              background: statusFilter === s ? statusStyle.bg : 'rgba(255,255,255,0.06)',
              color: statusFilter === s ? statusStyle.color : '#999',
              fontWeight: statusFilter === s ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {ORDER_STATUS_LABELS[s]}
          </button>
        );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--noir-card)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(197,165,90,0.2)', borderTopColor: 'var(--gold)' }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-12 text-center" style={{ color: '#666' }}>Aucune commande trouvée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Ref', 'Client', 'Date', 'Montant', 'Statut', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left" style={{ color: '#666', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <React.Fragment key={o.id}>
                    <tr
                      className="transition-colors duration-150 cursor-pointer"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                    >
                      <td className="px-5 py-3.5" style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {o.id.slice(0, 8)}…
                      </td>
                      <td className="px-5 py-3.5">
                        <div style={{ color: '#fff', fontWeight: 500 }}>{o.customerName ?? '—'}</div>
                        <div style={{ color: '#666', fontSize: '0.75rem' }}>{o.customerEmail ?? ''}</div>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: '#999' }}>{formatDate(o.createdAt)}</td>
                      <td className="px-5 py-3.5" style={{ color: '#fff', fontWeight: 600 }}>{formatCFA(o.totalAmount)}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={o.status}
                          onChange={(e) => { e.stopPropagation(); updateStatus(o.id, e.target.value); }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={updating === o.id}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium outline-none cursor-pointer"
                          style={{
                            background: getDarkOrderStatusStyle(o.status).bg,
                            color: getDarkOrderStatusStyle(o.status).color,
                            border: 'none',
                          }}
                        >
                          {ORDER_STATUS_KEYS.map((s) => (
                            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={1.5}
                          style={{ transform: expanded === o.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </td>
                    </tr>
                    {/* Expanded row — order items */}
                    {expanded === o.id && (
                      <tr>
                        <td colSpan={6} className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <div className="mb-2" style={{ color: '#666', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Articles
                          </div>
                          {o.items && o.items.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {o.items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                  <span style={{ color: '#ccc' }}>{item.productName}</span>
                                  <span style={{ color: '#999', fontSize: '0.75rem' }}>
                                    {item.quantity} × {formatCFA(item.unitPrice)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#666', fontSize: '0.8125rem' }}>Détails non disponibles</span>
                          )}
                          {o.shippingAddress && (
                            <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                              <div style={{ color: '#666', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                                Adresse de livraison
                              </div>
                              <div style={{ color: '#999', fontSize: '0.8125rem' }}>
                                {Object.values(o.shippingAddress).filter(Boolean).join(', ')}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: '#666', fontSize: '0.8125rem' }}>Page {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#999', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}
              >
                ← Préc.
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#999', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}
              >
                Suiv. →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
