'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ORDER_STATUS_KEYS, ORDER_STATUS_LABELS, getDarkOrderStatusStyle } from '@/lib/order-status-theme';
import { formatCFA, formatDateTime as formatDate } from '@/lib/format';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: { name: string; brand: string; slug: string } | null;
}

interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  country?: string;
}

interface Order {
  id: string;
  userId: string | null;
  status: string;
  totalAmount: number;
  paymentMethod: string | null;
  paymentStatus: string | null;
  shippingAddress: ShippingAddress | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mobile_money: 'Mobile Money',
  card: 'Carte bancaire',
  cash_on_delivery: 'Paiement à la livraison',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payé',
  failed: 'Échoué',
  refunded: 'Remboursé',
};

function CustomerBadge({ phone, orderId }: { phone: string; orderId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/admin/orders?phone=${encodeURIComponent(phone)}&excludeId=${orderId}`)
      .then(r => r.json())
      .then((d: { previousCount?: number }) => setCount(d.previousCount ?? 0))
      .catch(() => setCount(null));
  }, [phone, orderId]);

  if (count === null) return null;

  if (count === 0) {
    return (
      <span style={{
        display: 'inline-block', padding: '1px 7px', borderRadius: 99,
        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em',
        background: 'rgba(72,199,142,0.15)', color: '#48c78e',
        border: '1px solid rgba(72,199,142,0.3)',
      }}>
        NOUVEAU
      </span>
    );
  }

  return (
    <span style={{
      display: 'inline-block', padding: '1px 7px', borderRadius: 99,
      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em',
      background: 'rgba(197,165,90,0.15)', color: '#C5A55A',
      border: '1px solid rgba(197,165,90,0.3)',
    }}>
      {count} cmd. précédente{count > 1 ? 's' : ''}
    </span>
  );
}

function OrderDetail({ order }: { order: Order }) {
  const addr = order.shippingAddress;
  const fullName = [addr?.firstName, addr?.lastName].filter(Boolean).join(' ') || '—';

  return (
    <div style={{ display: 'grid', gap: 12 }}>

      {/* Client info */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Client
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', fontSize: '0.8125rem' }}>
          <div>
            <span style={{ color: '#555', display: 'block', fontSize: '0.7rem', marginBottom: 2 }}>Nom</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{fullName}</span>
          </div>
          {order.phone && (
            <div>
              <span style={{ color: '#555', display: 'block', fontSize: '0.7rem', marginBottom: 2 }}>Téléphone</span>
              <a href={`tel:${order.phone}`} style={{ color: '#C5A55A', fontWeight: 600, textDecoration: 'none' }}>
                {order.phone}
              </a>
            </div>
          )}
          {order.email && (
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#555', display: 'block', fontSize: '0.7rem', marginBottom: 2 }}>Email</span>
              <a href={`mailto:${order.email}`} style={{ color: '#C5A55A', textDecoration: 'none' }}>{order.email}</a>
            </div>
          )}
          {order.phone && (
            <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
              <CustomerBadge phone={order.phone} orderId={order.id} />
            </div>
          )}
        </div>
      </div>

      {/* Livraison */}
      {addr && (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Livraison
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#ccc', lineHeight: 1.7 }}>
            {addr.address && <div>{addr.address}</div>}
            {addr.city && <div>{addr.city}{addr.country ? `, ${addr.country}` : ''}</div>}
          </div>
        </div>
      )}

      {/* Paiement */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Paiement
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8125rem' }}>
          <div>
            <span style={{ color: '#555', display: 'block', fontSize: '0.7rem', marginBottom: 2 }}>Méthode</span>
            <span style={{ color: '#fff' }}>
              {order.paymentMethod ? (PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod) : '—'}
            </span>
          </div>
          <div>
            <span style={{ color: '#555', display: 'block', fontSize: '0.7rem', marginBottom: 2 }}>Statut paiement</span>
            <span style={{ color: order.paymentStatus === 'paid' ? '#48c78e' : '#999' }}>
              {order.paymentStatus ? (PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus) : '—'}
            </span>
          </div>
          <div>
            <span style={{ color: '#555', display: 'block', fontSize: '0.7rem', marginBottom: 2 }}>Total</span>
            <span style={{ color: '#fff', fontWeight: 700 }}>{formatCFA(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Articles ({order.items.length})
        </div>
        {order.items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <div style={{ color: '#fff', fontSize: '0.8125rem', fontWeight: 500 }}>
                    {item.product?.name ?? `Produit #${item.productId.slice(0, 8)}`}
                  </div>
                  {item.product?.brand && (
                    <div style={{ color: '#555', fontSize: '0.7rem' }}>{item.product.brand}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: '#999', fontSize: '0.75rem' }}>
                    {item.quantity} × {formatCFA(item.unitPrice)}
                  </div>
                  <div style={{ color: '#C5A55A', fontSize: '0.8125rem', fontWeight: 600 }}>
                    {formatCFA(item.quantity * item.unitPrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span style={{ color: '#666', fontSize: '0.8125rem' }}>Aucun article enregistré</span>
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Notes
          </div>
          <p style={{ color: '#ccc', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
            {order.notes}
          </p>
        </div>
      )}
    </div>
  );
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

  const load = useCallback(async () => {
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
  }, [page, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setUpdating(null);
    void load();
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
                  {['Réf.', 'Client', 'Téléphone', 'Date', 'Montant', 'Statut', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left" style={{ color: '#666', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const addr = o.shippingAddress;
                  const fullName = [addr?.firstName, addr?.lastName].filter(Boolean).join(' ') || '—';
                  const isOpen = expanded === o.id;

                  return (
                    <React.Fragment key={o.id}>
                      <tr
                        className="transition-colors duration-150 cursor-pointer"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isOpen ? 'rgba(197,165,90,0.04)' : 'transparent' }}
                        onClick={() => setExpanded(isOpen ? null : o.id)}
                      >
                        <td className="px-5 py-3.5" style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {o.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div style={{ color: '#fff', fontWeight: 500 }}>{fullName}</div>
                          <div style={{ color: '#666', fontSize: '0.7rem' }}>{o.email ?? ''}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          {o.phone ? (
                            <a
                              href={`tel:${o.phone}`}
                              onClick={e => e.stopPropagation()}
                              style={{ color: '#C5A55A', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}
                            >
                              {o.phone}
                            </a>
                          ) : (
                            <span style={{ color: '#555' }}>—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5" style={{ color: '#999' }}>{formatDate(o.createdAt)}</td>
                        <td className="px-5 py-3.5" style={{ color: '#fff', fontWeight: 600 }}>{formatCFA(o.totalAmount)}</td>
                        <td className="px-5 py-3.5">
                          <select
                            value={o.status}
                            onChange={(e) => { e.stopPropagation(); void updateStatus(o.id, e.target.value); }}
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
                            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={7} className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <OrderDetail order={o} />
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
