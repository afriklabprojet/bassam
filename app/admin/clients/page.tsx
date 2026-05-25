'use client';

import React, { useEffect, useState } from 'react';

interface Customer {
  id: string;
  fullName: string | null;
  phone: string | null;
  address: Record<string, unknown> | null;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminClients() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: '25' });
        const res = await fetch(`/api/admin/customers?${params}`);
        if (!res.ok) { setError(res.status === 403 ? 'Accès refusé' : 'Erreur'); return; }
        const data = await res.json();
        setCustomers(data.customers);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

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
          Clients
        </h1>
        <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '2px' }}>
          {total} client{total > 1 ? 's' : ''} inscrit{total > 1 ? 's' : ''}
        </p>
      </div>

      {/* Cards grid */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--noir-card)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(197,165,90,0.2)', borderTopColor: 'var(--gold)' }} />
          </div>
        ) : customers.length === 0 ? (
          <div className="px-6 py-12 text-center" style={{ color: '#666' }}>Aucun client inscrit</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Client', 'Téléphone', 'Adresse', 'Inscription'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left" style={{ color: '#666', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', color: 'var(--noir)' }}
                        >
                          {(c.fullName ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 500 }}>{c.fullName ?? 'Sans nom'}</div>
                          <div style={{ color: '#666', fontSize: '0.7rem', fontFamily: 'monospace' }}>{c.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#ccc' }}>
                      {c.phone ?? <span style={{ color: '#444' }}>—</span>}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#999', maxWidth: '220px' }}>
                      {c.address ? (
                        <span className="truncate block" style={{ maxWidth: '220px' }}>
                          {Object.values(c.address).filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        <span style={{ color: '#444' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#999' }}>
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
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
