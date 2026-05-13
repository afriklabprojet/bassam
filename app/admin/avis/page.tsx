'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface Review {
  id: string;
  name: string;
  ville: string;
  texte: string;
  rating: number;
  is_approved: boolean;
  source: string;
  created_at: string;
}

function Stars({ rating }: Readonly<{ rating: number }>) {
  return (
    <span style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width="12" height="12" viewBox="0 0 24 24"
          fill={n <= rating ? '#C5A55A' : 'none'}
          stroke={n <= rating ? '#C5A55A' : '#555'}
          strokeWidth="1.5"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

type Tab = 'pending' | 'approved' | 'all';

export default function AdminAvisPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('pending');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    setActionId(id);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) return;
      await fetchReviews();
    } finally {
      setActionId(null);
    }
  };

  const filtered = reviews.filter(r => {
    if (tab === 'pending')  return !r.is_approved;
    if (tab === 'approved') return r.is_approved;
    return true;
  });

  const pending  = reviews.filter(r => !r.is_approved).length;
  const approved = reviews.filter(r => r.is_approved).length;

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '1.25rem',
  };

  function renderList() {
    if (loading) {
      return <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: '0.9375rem' }}>Chargement…</p>;
    }
    if (filtered.length === 0) {
      const emptyMsg = tab === 'pending' ? 'Aucun avis en attente.' : 'Aucun avis ici.';
      return <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: '0.9375rem' }}>{emptyMsg}</p>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(r => (
          <div key={r.id} style={{ ...card, opacity: actionId === r.id ? 0.5 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#C5A55A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#080808', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ color: '#F5F0E8', fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.2 }}>{r.name}</p>
                    <p style={{ color: 'rgba(245,240,232,0.45)', fontSize: '0.75rem' }}>{r.ville} · {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <Stars rating={r.rating} />
                <p style={{ color: 'rgba(245,240,232,0.8)', fontSize: '0.9375rem', lineHeight: 1.6, marginTop: '0.625rem', fontStyle: 'italic' }}>
                  &ldquo;{r.texte}&rdquo;
                </p>
                <span style={{ display: 'inline-block', marginTop: '0.625rem', padding: '0.2rem 0.625rem', borderRadius: 6, fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', color: 'rgba(245,240,232,0.4)' }}>
                  via {r.source}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                {r.is_approved ? (
                  <button
                    onClick={() => handleAction(r.id, 'reject')}
                    disabled={actionId === r.id}
                    style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.06)', color: 'rgba(245,240,232,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem' }}
                  >
                    Retirer
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(r.id, 'approve')}
                    disabled={actionId === r.id}
                    style={{ padding: '0.5rem 1rem', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem' }}
                  >
                    ✓ Approuver
                  </button>
                )}
                <button
                  onClick={() => handleAction(r.id, 'delete')}
                  disabled={actionId === r.id}
                  style={{ padding: '0.5rem 0.75rem', background: 'rgba(192,57,43,0.15)', color: '#e74c3c', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: '0.8125rem' }}
                  title="Supprimer définitivement"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 900 }}>
      {/* En-tête */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#F5F0E8', fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '0.375rem' }}>
          Avis clients
        </h1>
        <p style={{ color: 'rgba(245,240,232,0.5)', fontSize: '0.875rem' }}>
          Modérez les avis avant publication publique.
        </p>
      </div>

      {/* Compteurs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'En attente',  value: pending,  color: '#f39c12' },
          { label: 'Approuvés',   value: approved, color: '#27ae60' },
          { label: 'Total',       value: reviews.length, color: '#C5A55A' },
        ].map(s => (
          <div key={s.label} style={{ ...card, textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(245,240,232,0.5)', marginTop: '0.25rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
        {([
          { key: 'pending',  label: `En attente (${pending})` },
          { key: 'approved', label: `Approuvés (${approved})` },
          { key: 'all',      label: `Tous (${reviews.length})` },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t.key ? '#C5A55A' : 'rgba(255,255,255,0.05)',
              color: tab === t.key ? '#080808' : 'rgba(245,240,232,0.7)',
              fontWeight: tab === t.key ? 700 : 400, fontSize: '0.875rem',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {renderList()}
    </div>
  );
}
