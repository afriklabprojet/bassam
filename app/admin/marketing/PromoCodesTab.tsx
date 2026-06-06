'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCFA } from '@/lib/format';
import { GOLD } from '@/lib/admin-theme';
import { Modal, INPUT_STYLE, LABEL_STYLE, formatDate } from './marketing-shared';
import type { PromoCode } from './marketing-shared';

const BADGE: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: '20px',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.05em',
};

export function PromoCodesTab() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    min_order_amount: '',
    max_uses: '',
    expires_at: '',
    description: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/marketing/promo-codes');
    const json = await res.json();
    setCodes(json.codes ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ code: '', type: 'percentage', value: '', min_order_amount: '', max_uses: '', expires_at: '', description: '' });
    setError('');
    setShowForm(true);
  }

  function openEdit(c: PromoCode) {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      min_order_amount: String(c.min_order_amount),
      max_uses: c.max_uses == null ? '' : String(c.max_uses),
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
      description: c.description ?? '',
    });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      code: form.code,
      type: form.type,
      value: Number.parseFloat(form.value),
      min_order_amount: Number.parseFloat(form.min_order_amount) || 0,
      max_uses: form.max_uses ? Number.parseInt(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      description: form.description || null,
    };
    const res = editing
      ? await fetch('/api/admin/marketing/promo-codes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...payload }) })
      : await fetch('/api/admin/marketing/promo-codes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (res.ok) { setShowForm(false); load(); } else { setError(json.error ?? 'Erreur'); }
    setSaving(false);
  }

  async function toggleActive(c: PromoCode) {
    await fetch('/api/admin/marketing/promo-codes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, is_active: !c.is_active }) });
    load();
  }

  async function deleteCode(c: PromoCode) {
    if (confirm(`Supprimer le code "${c.code}" ?`)) {
      await fetch(`/api/admin/marketing/promo-codes?id=${c.id}`, { method: 'DELETE' });
      load();
    }
  }

  const promoSubmitLabel = editing ? 'Mettre à jour' : 'Créer le code';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>{codes.length} code{codes.length === 1 ? '' : 's'}</p>
        <button onClick={openCreate} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          + Nouveau code
        </button>
      </div>

      {loading && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0' }}>Chargement…</p>}
      {!loading && codes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏷️</div>
          <p style={{ margin: 0 }}>Aucun code promo</p>
        </div>
      )}
      {!loading && codes.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Code', 'Réduction', 'Commande min', 'Utilisations', 'Expire', 'Statut', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ color: GOLD, fontWeight: 700, fontFamily: 'monospace', fontSize: '14px' }}>{c.code}</span>
                    {c.description && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>{c.description}</p>}
                  </td>
                  <td style={{ padding: '14px 12px', color: '#fff', fontWeight: 600 }}>
                    {c.type === 'percentage' ? `${c.value}%` : formatCFA(c.value)}
                  </td>
                  <td style={{ padding: '14px 12px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                    {c.min_order_amount > 0 ? formatCFA(c.min_order_amount) : '—'}
                  </td>
                  <td style={{ padding: '14px 12px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                    {c.uses_count}{c.max_uses == null ? '' : ` / ${c.max_uses}`}
                  </td>
                  <td style={{ padding: '14px 12px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                    {c.expires_at ? formatDate(c.expires_at) : '—'}
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ ...BADGE, background: c.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: c.is_active ? '#4ade80' : '#f87171' }}>
                      {c.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(c)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>✏️</button>
                      <button onClick={() => toggleActive(c)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>{c.is_active ? '⏸' : '▶️'}</button>
                      <button onClick={() => deleteCode(c)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? 'Modifier le code' : 'Nouveau code promo'}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="promo-code" style={LABEL_STYLE}>Code *</label>
              <input id="promo-code" required style={INPUT_STYLE} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="EX: VIP20" disabled={!!editing} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="promo-type" style={LABEL_STYLE}>Type *</label>
                <select id="promo-type" required style={INPUT_STYLE} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))}>
                  <option value="percentage">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (F)</option>
                </select>
              </div>
              <div>
                <label htmlFor="promo-value" style={LABEL_STYLE}>Valeur *</label>
                <input id="promo-value" required type="number" min="0.01" step="0.01" style={INPUT_STYLE} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percentage' ? '20' : '5000'} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="promo-min-order" style={LABEL_STYLE}>Commande min (F)</label>
                <input id="promo-min-order" type="number" min="0" style={INPUT_STYLE} value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label htmlFor="promo-max-uses" style={LABEL_STYLE}>Utilisations max</label>
                <input id="promo-max-uses" type="number" min="1" style={INPUT_STYLE} value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Illimité" />
              </div>
            </div>
            <div>
              <label htmlFor="promo-expires" style={LABEL_STYLE}>Date d&apos;expiration</label>
              <input id="promo-expires" type="date" style={INPUT_STYLE} value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="promo-description" style={LABEL_STYLE}>Description (interne)</label>
              <input id="promo-description" style={INPUT_STYLE} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Note interne…" />
            </div>
            {error && <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Annuler</button>
              <button type="submit" disabled={saving} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : promoSubmitLabel}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
