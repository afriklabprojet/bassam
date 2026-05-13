'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface StockAlert {
  id: string;
  inventory_id: string | null;
  product_name: string;
  sku: string | null;
  current_quantity: number;
  threshold: number;
  severity: 'critical' | 'warning';
  status: 'pending' | 'acknowledged' | 'resolved';
  acknowledged_at: string | null;
  resolved_at: string | null;
  notes: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  acknowledged: number;
  resolved: number;
  critical: number;
}

const GOLD = '#C5A55A';
const CARD_BG = 'rgba(255,255,255,0.04)';
const BORDER = '1px solid rgba(255,255,255,0.07)';

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:      { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', label: 'En attente' },
  acknowledged: { bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6', label: 'Accusée' },
  resolved:     { bg: 'rgba(16,185,129,0.12)',  color: '#10B981', label: 'Résolue' },
};

const SEVERITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444', label: 'Critique' },
  warning:  { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'Avertissement' },
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Badge({ style }: { style: { bg: string; color: string; label: string } }) {
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    }}>
      {style.label}
    </span>
  );
}

export default function AlertesStockPage() {
  const [alerts, setAlerts]       = useState<StockAlert[]>([]);
  const [stats, setStats]         = useState<Stats>({ total: 0, pending: 0, acknowledged: 0, resolved: 0, critical: 0 });
  const [loading, setLoading]     = useState(true);
  const [checking, setChecking]   = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [saving, setSaving]       = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [toast, setToast]         = useState<string | null>(null);
  const [statusFilter, setStatusFilter]     = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (statusFilter)   p.set('status',   statusFilter);
      if (severityFilter) p.set('severity', severityFilter);
      const res = await fetch(`/api/admin/stock-alerts?${p}`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Erreur chargement');
        return;
      }
      const d = await res.json();
      setAlerts(d.alerts ?? []);
      setStats(d.stats ?? { total: 0, pending: 0, acknowledged: 0, resolved: 0, critical: 0 });
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleCheck() {
    setChecking(true);
    try {
      const res = await fetch('/api/admin/stock-alerts?action=check', { method: 'POST' });
      const d   = await res.json();
      if (!res.ok) { showToast(d.error ?? 'Erreur'); return; }
      showToast(d.created > 0
        ? `${d.created} nouvelle${d.created > 1 ? 's' : ''} alerte${d.created > 1 ? 's' : ''} créée${d.created > 1 ? 's' : ''}.`
        : (d.message ?? 'Aucune nouvelle alerte.'));
      load();
    } catch { showToast('Erreur réseau'); }
    finally { setChecking(false); }
  }

  async function handleNotify() {
    setNotifying(true);
    try {
      const res = await fetch('/api/admin/stock-alerts?action=notify', { method: 'POST' });
      const d   = await res.json();
      if (!res.ok) { showToast(d.error ?? 'Erreur'); return; }
      showToast(d.updated > 0
        ? `${d.updated} alerte${d.updated > 1 ? 's' : ''} marquée${d.updated > 1 ? 's' : ''} comme accusée${d.updated > 1 ? 's' : ''}.`
        : (d.message ?? 'Aucune alerte en attente.'));
      load();
    } catch { showToast('Erreur réseau'); }
    finally { setNotifying(false); }
  }

  async function updateStatus(id: string, status: string) {
    setSaving(id);
    try {
      const res = await fetch('/api/admin/stock-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) { const d = await res.json(); showToast(d.error ?? 'Erreur'); return; }
      load();
    } catch { showToast('Erreur réseau'); }
    finally { setSaving(null); }
  }

  async function deleteAlert(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/stock-alerts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); showToast(d.error ?? 'Erreur'); return; }
      showToast('Alerte supprimée.');
      load();
    } catch { showToast('Erreur réseau'); }
    finally { setDeleting(null); }
  }

  const statCards = [
    { label: 'Total',     value: stats.total,        color: '#9CA3AF' },
    { label: 'En attente', value: stats.pending,     color: '#F59E0B' },
    { label: 'Accusées',  value: stats.acknowledged, color: '#3B82F6' },
    { label: 'Résolues',  value: stats.resolved,     color: '#10B981' },
    { label: 'Critiques', value: stats.critical,     color: '#EF4444' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>
            🔔 Alertes de stock
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 6, fontSize: 14 }}>
            Surveillance des niveaux de stock et gestion des alertes
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleCheck}
            disabled={checking}
            style={{
              background: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD,
              padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
              fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
              opacity: checking ? 0.6 : 1,
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {checking ? 'Vérification…' : 'Vérifier les stocks'}
          </button>
          <button
            onClick={handleNotify}
            disabled={notifying || stats.pending === 0}
            style={{
              background: stats.pending > 0 ? GOLD : CARD_BG,
              border: `1px solid ${stats.pending > 0 ? GOLD : 'rgba(255,255,255,0.12)'}`,
              color: stats.pending > 0 ? '#000' : 'rgba(255,255,255,0.3)',
              padding: '10px 20px', borderRadius: 8, cursor: stats.pending > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
              opacity: notifying ? 0.6 : 1,
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {notifying ? 'Envoi…' : 'Envoyer les notifications'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: '#1a1a1a', border: `1px solid ${GOLD}`,
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', fontSize: 14,
        }}>
          {toast}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map(({ label, value, color }) => (
          <div key={label} style={{
            background: CARD_BG, border: BORDER, borderRadius: 12,
            padding: '20px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: CARD_BG, border: BORDER, color: '#fff', padding: '8px 14px',
            borderRadius: 8, fontSize: 14, cursor: 'pointer',
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="acknowledged">Accusées</option>
          <option value="resolved">Résolues</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          style={{
            background: CARD_BG, border: BORDER, color: '#fff', padding: '8px 14px',
            borderRadius: 8, fontSize: 14, cursor: 'pointer',
          }}
        >
          <option value="">Toutes les sévérités</option>
          <option value="critical">Critiques</option>
          <option value="warning">Avertissements</option>
        </select>
        {(statusFilter || severityFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setSeverityFilter(''); }}
            style={{
              background: 'transparent', border: BORDER, color: 'rgba(255,255,255,0.5)',
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', padding: '12px 16px', borderRadius: 8, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: CARD_BG, border: BORDER, borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            Chargement…
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ color: '#10B981', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Aucune alerte
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
              Cliquez sur « Vérifier les stocks » pour scanner les niveaux de stock.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: BORDER }}>
                  {['Produit', 'SKU', 'Qté / Seuil', 'Sévérité', 'Statut', 'Créée le', 'Actions'].map((h) => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left', fontSize: 12,
                      fontWeight: 600, color: 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} style={{ borderBottom: BORDER }}>
                    <td style={{ padding: '14px 16px', color: '#fff', fontWeight: 600 }}>
                      {a.product_name}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                      {a.sku ?? '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ color: a.current_quantity === 0 ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                        {a.current_quantity}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>/</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{a.threshold}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Badge style={SEVERITY_STYLE[a.severity]} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Badge style={STATUS_STYLE[a.status]} />
                    </td>
                    <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                      {fmtDate(a.created_at)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {a.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(a.id, 'acknowledged')}
                            disabled={saving === a.id}
                            style={{
                              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
                              color: '#3B82F6', padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                              fontSize: 12, fontWeight: 600, opacity: saving === a.id ? 0.5 : 1,
                            }}
                          >
                            Accuser
                          </button>
                        )}
                        {a.status !== 'resolved' && (
                          <button
                            onClick={() => updateStatus(a.id, 'resolved')}
                            disabled={saving === a.id}
                            style={{
                              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                              color: '#10B981', padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                              fontSize: 12, fontWeight: 600, opacity: saving === a.id ? 0.5 : 1,
                            }}
                          >
                            Résoudre
                          </button>
                        )}
                        <button
                          onClick={() => deleteAlert(a.id)}
                          disabled={deleting === a.id}
                          style={{
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                            color: '#EF4444', padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                            fontSize: 12, opacity: deleting === a.id ? 0.5 : 1,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 16, textAlign: 'right' }}>
        {alerts.length} alerte{alerts.length > 1 ? 's' : ''} affichée{alerts.length > 1 ? 's' : ''}
      </p>
    </div>
  );
}
