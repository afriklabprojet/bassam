'use client';

import Image from 'next/image';
import { shouldBypassNextImageOptimization } from '@/lib/image-optimization';
import { useState, useEffect, useCallback, useRef, useId } from 'react';
import { GOLD } from '@/lib/admin-theme';
import { Modal, INPUT_STYLE, LABEL_STYLE } from './marketing-shared';
import type { Banner } from './marketing-shared';

/* ── BannerImageUpload ─────────────────────────────────────────────────────── */

function BannerImageUpload({ value, onChange }: Readonly<{ value: string; onChange: (url: string) => void }>) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) { setUploadError('Format non supporté (JPEG, PNG, WebP, AVIF)'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError('Fichier trop lourd (max 5 Mo)'); return; }
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
    if (file) void uploadFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (file) void uploadFile(file);
    e.currentTarget.value = '';
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
        <p style={LABEL_STYLE}>Image de bannière</p>
        <div className="group" style={{ ...zone, aspectRatio: '16/5', cursor: 'default' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Remplacer</button>
            <button type="button" onClick={() => onChange('')} style={{ background: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Supprimer</button>
          </div>
        </div>
        <input id={inputId} ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={onFileChange} />
        {uploadError && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{uploadError}</p>}
      </div>
    );
  }

  return (
    <div>
      <p style={LABEL_STYLE}>Image de bannière</p>
      <label
        htmlFor={inputId}
        style={{ ...zone, padding: '32px 20px', textAlign: 'center', aspectRatio: '16/5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
        onDrop={onDrop}
      >
        <input id={inputId} ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden disabled={uploading} onChange={onFileChange} />
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
      </label>
      {uploadError && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{uploadError}</p>}
    </div>
  );
}

/* ── BannersTab ────────────────────────────────────────────────────────────── */

export function BannersTab() {
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

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ title: '', subtitle: '', cta_text: '', cta_link: '/', image_url: '', bg_color: 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%)', display_order: '0' });
    setError('');
    setShowForm(true);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle ?? '', cta_text: b.cta_text ?? '', cta_link: b.cta_link, image_url: b.image_url ?? '', bg_color: b.bg_color, display_order: String(b.display_order) });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { title: form.title, subtitle: form.subtitle || null, cta_text: form.cta_text || null, cta_link: form.cta_link || '/', image_url: form.image_url || null, bg_color: form.bg_color, display_order: Number.parseInt(form.display_order) || 0 };
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
        <button onClick={openCreate} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          + Nouvelle bannière
        </button>
      </div>

      {loading && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px 0' }}>Chargement…</p>}
      {!loading && banners.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🖼️</div>
          <p style={{ margin: 0 }}>Aucune bannière</p>
        </div>
      )}
      {!loading && banners.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {banners.map(b => (
            <div key={b.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '42px', borderRadius: '8px', background: b.bg_color, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                {b.image_url && <Image src={b.image_url} alt="" width={64} height={42} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} unoptimized={shouldBypassNextImageOptimization(b.image_url)} />}
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
            <BannerImageUpload value={form.image_url} onChange={(url) => setForm(f => ({ ...f, image_url: url }))} />
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
