'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string;
  image_url: string | null;
  bg_color: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  phone: string | null;
  subscribed_at: string;
  source: string | null;
  is_active: boolean;
}

interface NewsletterCampaign {
  id: string;
  subject: string;
  preview_text: string | null;
  recipients_count: number;
  status: 'sent' | 'draft' | 'failed';
  sent_at: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const GOLD = '#C5A55A';

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  padding: '10px 14px',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '6px',
  fontWeight: 500,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
}

function getCampaignStatusLabel(status: string): string {
  if (status === 'sent') return 'Envoyée';
  if (status === 'failed') return 'Échec';
  return 'Brouillon';
}

function campaignStatusColor(status: string): string {
  if (status === 'sent') return '#4ade80';
  if (status === 'failed') return '#f87171';
  return '#facc15';
}

function campaignStatusBg(status: string): string {
  if (status === 'sent') return 'rgba(34,197,94,0.15)';
  if (status === 'failed') return 'rgba(239,68,68,0.15)';
  return 'rgba(250,204,21,0.15)';
}

// ─── Modal wrapper ──────────────────────────────────────────────────────────

function Modal({ onClose, title, children }: Readonly<{ onClose: () => void; title: string; children: React.ReactNode }>) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        style={{
          background: '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Promo Codes Tab ────────────────────────────────────────────────────────

function PromoCodesTab() {
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const BADGE: React.CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em' };
  const promoSubmitLabel = editing ? 'Mettre à jour' : 'Créer le code';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>{codes.length} code{codes.length === 1 ? '' : 's'}</p>
        <button
          onClick={openCreate}
          style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          + Nouveau code
        </button>
      </div>

      {loading && (
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0' }}>Chargement…</p>
      )}
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

// ─── Newsletter Tab ─────────────────────────────────────────────────────────

function NewsletterTab() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Compose modal
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');
  const [composeForm, setComposeForm] = useState({ subject: '', preview_text: '', body_html: '' });

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/marketing/newsletter?page=${p}&limit=50`);
    const json = await res.json();
    setSubscribers(json.subscribers ?? []);
    setTotal(json.total ?? 0);
    setTotalPages(json.totalPages ?? 1);
    setCampaigns(json.campaigns ?? []);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(page); }, [load, page]);

  function exportCSV() {
    const rows = [['Email', 'Téléphone', 'Source', 'Date inscription']];
    subscribers.forEach(s => rows.push([s.email, s.phone ?? '', s.source ?? '', formatDate(s.subscribed_at)]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  async function toggleSubscriber(s: NewsletterSubscriber) {
    await fetch('/api/admin/marketing/newsletter', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    load(page);
  }

  async function deleteSubscriber(s: NewsletterSubscriber) {
    if (confirm(`Supprimer l'abonné ${s.email} ?`)) {
      await fetch(`/api/admin/marketing/newsletter?id=${s.id}`, { method: 'DELETE' });
      load(page);
    }
  }

  async function handleSend(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSendError('');
    setSendSuccess('');
    if (!composeForm.subject.trim() || !composeForm.body_html.trim()) {
      setSendError('Sujet et contenu HTML sont requis.');
      return;
    }
    setSending(true);
    const res = await fetch('/api/admin/marketing/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(composeForm),
    });
    const json = await res.json();
    if (res.ok) {
      setSendSuccess(`Campagne envoyée à ${json.recipientsCount} abonné(s) — statut : ${json.status}`);
      setComposeForm({ subject: '', preview_text: '', body_html: '' });
      load(1);
      setTimeout(() => { setShowCompose(false); setSendSuccess(''); }, 2500);
    } else {
      setSendError(json.error ?? 'Erreur lors de l\'envoi.');
    }
    setSending(false);
  }

  const subscribersSuffix = total === 1 ? '' : 's';
  return (
    <div>
      {/* ── Header row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ background: 'rgba(197,165,90,0.1)', border: '1px solid rgba(197,165,90,0.2)', borderRadius: '12px', padding: '12px 20px' }}>
            <p style={{ color: GOLD, fontSize: '24px', fontWeight: 700, margin: 0 }}>{total}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '2px 0 0' }}>Abonnés actifs</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 20px' }}>
            <p style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>{campaigns.length}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '2px 0 0' }}>Campagnes envoyées</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={exportCSV}
            disabled={loading || subscribers.length === 0}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', cursor: 'pointer' }}
          >
            ⬇ Exporter CSV
          </button>
          <button
            onClick={() => { setShowCompose(true); setSendError(''); setSendSuccess(''); }}
            style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            ✉ Envoyer une campagne
          </button>
        </div>
      </div>

      {/* ── Subscribers list ── */}
      {loading && (
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0' }}>Chargement…</p>
      )}
      {!loading && subscribers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📧</div>
          <p style={{ margin: 0 }}>Aucun abonné</p>
        </div>
      )}
      {!loading && subscribers.length > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Email', 'Téléphone', 'Source', 'Inscrit le', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscribers.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px', color: '#fff', fontSize: '14px' }}>{s.email}</td>
                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{s.phone ?? '—'}</td>
                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{s.source ?? 'site'}</td>
                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{formatDate(s.subscribed_at)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: s.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: s.is_active ? '#4ade80' : '#f87171' }}>
                        {s.is_active ? 'Actif' : 'Désabonné'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => toggleSubscriber(s)}
                          title={s.is_active ? 'Désabonner' : 'Réactiver'}
                          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          {s.is_active ? '⏸' : '▶️'}
                        </button>
                        <button
                          onClick={() => deleteSubscriber(s)}
                          title="Supprimer"
                          style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '8px 16px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>← Prec</button>
              <span style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '8px 16px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>Suiv →</button>
            </div>
          )}
        </>
      )}

      {/* ── Campaigns history ── */}
      {campaigns.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: GOLD }}>📨</span> Historique des campagnes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {campaigns.map(c => (
              <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject}</p>
                  {c.preview_text && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.preview_text}</p>}
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{c.recipients_count} destinataire{c.recipients_count === 1 ? '' : 's'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{formatDate(c.sent_at)}</span>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: campaignStatusBg(c.status), color: campaignStatusColor(c.status) }}>
                    {getCampaignStatusLabel(c.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Compose Modal ── */}
      {showCompose && (
        <Modal onClose={() => setShowCompose(false)} title="Envoyer une campagne newsletter">
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(197,165,90,0.08)', border: '1px solid rgba(197,165,90,0.2)', borderRadius: '8px', padding: '10px 14px' }}>
              <p style={{ color: GOLD, fontSize: '13px', margin: 0 }}>
                📬 Cette campagne sera envoyée à <strong>{total}</strong> abonné{total === 1 ? '' : 's'} actif{total === 1 ? '' : 's'}.
              </p>
            </div>
            <div>
              <label htmlFor="nl-subject" style={LABEL_STYLE}>Sujet de l&apos;email *</label>
              <input
                id="nl-subject"
                required
                style={INPUT_STYLE}
                value={composeForm.subject}
                onChange={e => setComposeForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="✨ Nouveautés printemps — VIP Parfumerie Bar"
              />
            </div>
            <div>
              <label htmlFor="nl-preview" style={LABEL_STYLE}>Texte d&apos;aperçu (preheader)</label>
              <input
                id="nl-preview"
                style={INPUT_STYLE}
                value={composeForm.preview_text}
                onChange={e => setComposeForm(f => ({ ...f, preview_text: e.target.value }))}
                placeholder="Découvrez notre sélection de printemps…"
              />
            </div>
            <div>
              <label htmlFor="nl-body" style={LABEL_STYLE}>Corps de l&apos;email (HTML) *</label>
              <textarea
                id="nl-body"
                required
                rows={10}
                style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
                value={composeForm.body_html}
                onChange={e => setComposeForm(f => ({ ...f, body_html: e.target.value }))}
                placeholder={'<h1 style="color:#C5A55A">Nouveautés</h1>\n<p>Bonjour,</p>\n<p>Découvrez nos nouvelles fragrances…</p>'}
              />
            </div>
            {sendError && <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{sendError}</p>}
            {sendSuccess && <p style={{ color: '#4ade80', fontSize: '13px', margin: 0 }}>✓ {sendSuccess}</p>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={sending}
                style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}
              >
                {sending ? 'Envoi en cours…' : `✉ Envoyer à ${total} abonné${subscribersSuffix}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Banner Image Upload (drag & drop) ─────────────────────────────────────

function BannerImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setUploadError('Format non supporté (JPEG, PNG, WebP, AVIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Fichier trop lourd (max 5 Mo)');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erreur upload');
      onChange(json.url as string);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  const zone: React.CSSProperties = {
    border: `2px dashed ${dragging ? GOLD : 'rgba(197,165,90,0.3)'}`,
    borderRadius: '10px',
    background: dragging ? 'rgba(197,165,90,0.08)' : 'rgba(255,255,255,0.03)',
    transition: 'border-color .2s, background .2s',
    cursor: uploading ? 'wait' : 'pointer',
    overflow: 'hidden',
    position: 'relative',
  };

  if (value) {
    return (
      <div>
        <label style={LABEL_STYLE}>Image de bannière</label>
        <div style={{ ...zone, aspectRatio: '16/5', cursor: 'default' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0, transition: 'opacity .2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Remplacer
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              style={{ background: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Supprimer
            </button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }} />
        {uploadError && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{uploadError}</p>}
      </div>
    );
  }

  return (
    <div>
      <label style={LABEL_STYLE}>Image de bannière</label>
      <div
        style={{ ...zone, padding: '32px 20px', textAlign: 'center', aspectRatio: '16/5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
        onDrop={onDrop}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }} />
        {uploading ? (
          <>
            <div style={{ width: '28px', height: '28px', border: '3px solid rgba(197,165,90,0.2)', borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Upload en cours…</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </>
        ) : (
          <>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={dragging ? GOLD : 'rgba(197,165,90,0.5)'} strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M3 15l5-5 4 4 3-3 6 6" />
              <circle cx="8.5" cy="8.5" r="1.5" fill={dragging ? GOLD : 'rgba(197,165,90,0.5)'} stroke="none" />
            </svg>
            <div>
              <span style={{ color: GOLD, fontSize: '13px', fontWeight: 600 }}>Cliquer</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}> ou glisser-déposer</span>
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>JPEG · PNG · WebP · AVIF — max 5 Mo</span>
            <span style={{ fontSize: '11px', color: 'rgba(197,165,90,0.4)' }}>Format recommandé : 1600 × 500 px</span>
          </>
        )}
      </div>
      {uploadError && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{uploadError}</p>}
    </div>
  );
}

// ─── Banners Tab ────────────────────────────────────────────────────────────

function BannersTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    cta_text: '',
    cta_link: '/',
    image_url: '',
    bg_color: 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%)',
    display_order: '0',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/marketing/banners');
    const json = await res.json();
    setBanners(json.banners ?? []);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ title: '', subtitle: '', cta_text: '', cta_link: '/', image_url: '', bg_color: 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%)', display_order: '0' });
    setError('');
    setShowForm(true);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle ?? '',
      cta_text: b.cta_text ?? '',
      cta_link: b.cta_link,
      image_url: b.image_url ?? '',
      bg_color: b.bg_color,
      display_order: String(b.display_order),
    });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      cta_text: form.cta_text || null,
      cta_link: form.cta_link || '/',
      image_url: form.image_url || null,
      bg_color: form.bg_color,
      display_order: Number.parseInt(form.display_order) || 0,
    };
    const res = editing
      ? await fetch('/api/admin/marketing/banners', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...payload }) })
      : await fetch('/api/admin/marketing/banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (res.ok) { setShowForm(false); load(); } else { setError(json.error ?? 'Erreur'); }
    setSaving(false);
  }

  async function toggleActive(b: Banner) {
    await fetch('/api/admin/marketing/banners', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id, is_active: !b.is_active }) });
    load();
  }

  async function deleteBanner(b: Banner) {
    if (confirm(`Supprimer la bannière "${b.title}" ?`)) {
      await fetch(`/api/admin/marketing/banners?id=${b.id}`, { method: 'DELETE' });
      load();
    }
  }

  const bannerSubmitLabel = editing ? 'Mettre à jour' : 'Créer la bannière';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>{banners.length} bannière{banners.length === 1 ? '' : 's'}</p>
        <button
          onClick={openCreate}
          style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          + Nouvelle bannière
        </button>
      </div>

      {loading && (
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0' }}>Chargement…</p>
      )}
      {!loading && banners.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🖼️</div>
          <p style={{ margin: 0 }}>Aucune bannière</p>
        </div>
      )}
      {!loading && banners.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {banners.map(b => (
            <div
              key={b.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              {/* Preview swatch */}
              <div style={{ width: '64px', height: '42px', borderRadius: '8px', background: b.bg_color, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                {b.image_url && <Image src={b.image_url} alt="" width={64} height={42} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <p style={{ color: '#fff', fontWeight: 600, margin: 0, fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</p>
                  <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: b.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: b.is_active ? '#4ade80' : '#f87171', flexShrink: 0 }}>
                    {b.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {b.subtitle && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.subtitle}</p>}
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '2px 0 0' }}>Ordre: {b.display_order} • {b.cta_text ? `CTA: ${b.cta_text}` : 'Pas de CTA'}</p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => openEdit(b)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>✏️</button>
                <button onClick={() => toggleActive(b)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>{b.is_active ? '⏸' : '▶️'}</button>
                <button onClick={() => deleteBanner(b)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? 'Modifier la bannière' : 'Nouvelle bannière'}>
          <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="banner-title" style={LABEL_STYLE}>Titre *</label>
              <input id="banner-title" required style={INPUT_STYLE} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nouvelle collection printemps" />
            </div>
            <div>
              <label htmlFor="banner-subtitle" style={LABEL_STYLE}>Sous-titre</label>
              <input id="banner-subtitle" style={INPUT_STYLE} value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Texte secondaire…" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label htmlFor="banner-cta-text" style={LABEL_STYLE}>Texte CTA</label>
                <input id="banner-cta-text" style={INPUT_STYLE} value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))} placeholder="Découvrir" />
              </div>
              <div>
                <label htmlFor="banner-cta-link" style={LABEL_STYLE}>Lien CTA</label>
                <input id="banner-cta-link" style={INPUT_STYLE} value={form.cta_link} onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))} placeholder="/collections/nouveautes" />
              </div>
            </div>
            <BannerImageUpload
              value={form.image_url}
              onChange={(url) => setForm(f => ({ ...f, image_url: url }))}
            />
            <div>
              <label htmlFor="banner-bg" style={LABEL_STYLE}>Arrière-plan (CSS gradient ou couleur)</label>
              <input id="banner-bg" style={INPUT_STYLE} value={form.bg_color} onChange={e => setForm(f => ({ ...f, bg_color: e.target.value }))} placeholder="linear-gradient(135deg, #0D0D0D, #1A1A1A)" />
            </div>
            <div>
              <label htmlFor="banner-order" style={LABEL_STYLE}>Ordre d&apos;affichage</label>
              <input id="banner-order" type="number" min="0" style={INPUT_STYLE} value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} placeholder="0" />
            </div>
            {error && <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Annuler</button>
              <button type="submit" disabled={saving} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : bannerSubmitLabel}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

type Tab = 'promo' | 'newsletter' | 'banners';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'promo', label: 'Codes promo', icon: '🏷️' },
  { id: 'newsletter', label: 'Newsletter', icon: '📧' },
  { id: 'banners', label: 'Bannières', icon: '🖼️' },
];

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('promo');

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>Marketing</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>Codes promo, abonnés newsletter et bannières promotionnelles</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '4px', marginBottom: '28px', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'rgba(197,165,90,0.15)' : 'transparent',
              border: activeTab === tab.id ? `1px solid rgba(197,165,90,0.3)` : '1px solid transparent',
              color: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.5)',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
        {activeTab === 'promo' && <PromoCodesTab />}
        {activeTab === 'newsletter' && <NewsletterTab />}
        {activeTab === 'banners' && <BannersTab />}
      </div>
    </div>
  );
}
