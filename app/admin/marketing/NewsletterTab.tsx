'use client';

import { useState, useEffect, useCallback } from 'react';
import { GOLD } from '@/lib/admin-theme';
import { Modal, INPUT_STYLE, LABEL_STYLE, formatDate, getCampaignStatusLabel, campaignStatusColor, campaignStatusBg } from './marketing-shared';
import type { NewsletterSubscriber, NewsletterCampaign } from './marketing-shared';

export function NewsletterTab() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

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
    await fetch('/api/admin/marketing/newsletter', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, is_active: !s.is_active }) });
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
    const res = await fetch('/api/admin/marketing/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(composeForm) });
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
          <button onClick={exportCSV} disabled={loading || subscribers.length === 0} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', cursor: 'pointer' }}>
            ⬇ Exporter CSV
          </button>
          <button onClick={() => { setShowCompose(true); setSendError(''); setSendSuccess(''); }} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            ✉ Envoyer une campagne
          </button>
        </div>
      </div>

      {loading && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0' }}>Chargement…</p>}
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
                        <button onClick={() => toggleSubscriber(s)} title={s.is_active ? 'Désabonner' : 'Réactiver'} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>
                          {s.is_active ? '⏸' : '▶️'}
                        </button>
                        <button onClick={() => deleteSubscriber(s)} title="Supprimer" style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>🗑</button>
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
              <input id="nl-subject" required style={INPUT_STYLE} value={composeForm.subject} onChange={e => setComposeForm(f => ({ ...f, subject: e.target.value }))} placeholder="✨ Nouveautés printemps — VIP Parfumerie Bar" />
            </div>
            <div>
              <label htmlFor="nl-preview" style={LABEL_STYLE}>Texte d&apos;aperçu (preheader)</label>
              <input id="nl-preview" style={INPUT_STYLE} value={composeForm.preview_text} onChange={e => setComposeForm(f => ({ ...f, preview_text: e.target.value }))} placeholder="Découvrez notre sélection de printemps…" />
            </div>
            <div>
              <label htmlFor="nl-body" style={LABEL_STYLE}>Corps de l&apos;email (HTML) *</label>
              <textarea id="nl-body" required rows={10} style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }} value={composeForm.body_html} onChange={e => setComposeForm(f => ({ ...f, body_html: e.target.value }))} placeholder={'<h1 style="color:#C5A55A">Nouveautés</h1>\n<p>Bonjour,</p>'} />
            </div>
            {sendError && <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{sendError}</p>}
            {sendSuccess && <p style={{ color: '#4ade80', fontSize: '13px', margin: 0 }}>✓ {sendSuccess}</p>}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCompose(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Annuler</button>
              <button type="submit" disabled={sending} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Envoi en cours…' : `✉ Envoyer à ${total} abonné${subscribersSuffix}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
