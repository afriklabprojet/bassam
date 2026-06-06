'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GOLD } from '@/lib/admin-theme';

export interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  display_order?: number;
}

interface TaxonomyForm {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: string;
}

interface TaxonomyManagerProps {
  apiPath: string;
  title: string;
  subtitle: string;
  singularLabel: string;
  emptyMessage: string;
  namePlaceholder: string;
  nameHelp: string;
  slugHintTemplate: string;
  orderHelp: string;
  deleteConfirmationTemplate: string;
  deleteBlockedHint: string;
  imageLabel: string;
}

const EMPTY_FORM: TaxonomyForm = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  displayOrder: '0',
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(197,165,90,0.3)',
    borderRadius: 8,
    color: '#fff',
    padding: '10px 14px',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .2s',
  };
}

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: GOLD,
  marginBottom: 6,
  fontWeight: 600,
  letterSpacing: '.04em',
};

function renderTemplate(template: string, value: string, token: '{slug}' | '{name}') {
  return template.replaceAll(token, value || '…');
}

function truncateDescription(description: string | null | undefined) {
  if (!description) {
    return null;
  }

  return description.length > 55 ? `${description.slice(0, 55)}…` : description;
}

function TaxonomyImageUpload({
  value,
  onChange,
  label,
}: Readonly<{
  value: string;
  onChange: (url: string) => void;
  label: string;
}>) {
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

  const zoneBase: React.CSSProperties = {
    border: `2px dashed ${dragging ? GOLD : 'rgba(197,165,90,0.3)'}`,
    borderRadius: 10,
    background: dragging ? 'rgba(197,165,90,0.08)' : 'rgba(255,255,255,0.03)',
    transition: 'border-color .2s, background .2s',
    overflow: 'hidden',
    position: 'relative',
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={LABEL}>{label}</label>

      {value ? (
        <div style={{ ...zoneBase, aspectRatio: '16/7', cursor: 'default' }}>
          <img
            src={value}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 'auto 12px 12px 12px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                background: GOLD, color: '#000', border: 'none',
                borderRadius: 8, padding: '8px 16px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Remplacer
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              style={{
                background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 14px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          style={{
            ...zoneBase,
            aspectRatio: '16/7',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: uploading ? 'wait' : 'pointer',
            width: '100%',
            color: 'inherit',
          }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
          onDrop={onDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <div style={{
                width: 28, height: 28,
                border: '3px solid rgba(197,165,90,0.2)',
                borderTopColor: GOLD,
                borderRadius: '50%',
                animation: 'taxonomy-spin .7s linear infinite',
              }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Upload en cours…</span>
              <style>{`@keyframes taxonomy-spin{to{transform:rotate(360deg)}}`}</style>
            </>
          ) : (
            <>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke={dragging ? GOLD : 'rgba(197,165,90,0.45)'} strokeWidth="1.4">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 16l5-5 4 4 3-3 6 6" />
                <circle cx="8.5" cy="8.5" r="1.5" fill={dragging ? GOLD : 'rgba(197,165,90,0.45)'} stroke="none" />
              </svg>
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: GOLD, fontSize: 13, fontWeight: 600 }}>Cliquer</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}> ou glisser-déposer</span>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                JPEG · PNG · WebP · AVIF — max 5 Mo
              </span>
              <span style={{ fontSize: 11, color: 'rgba(197,165,90,0.4)' }}>
                Format recommandé : 1280 × 560 px
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            void uploadFile(file);
          }
          e.target.value = '';
        }}
      />
      {uploadError && (
        <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>{uploadError}</p>
      )}
    </div>
  );
}

export default function TaxonomyManager(config: Readonly<TaxonomyManagerProps>) {
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TaxonomyItem | null>(null);
  const [form, setForm] = useState<TaxonomyForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  async function load() {
    try {
      const res = await fetch(config.apiPath);
      const payload = await res.json();
      setItems(payload.items ?? payload.categories ?? payload.collections ?? []);
    } catch {
      showToast(false, 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [config.apiPath]);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setPanelOpen(true);
  }

  function openEdit(item: TaxonomyItem) {
    setEditTarget(item);
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description ?? '',
      imageUrl: item.image_url ?? '',
      displayOrder: String(item.display_order ?? 0),
    });
    setPanelOpen(true);
  }

  function handleField(name: keyof TaxonomyForm, value: string) {
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'name' && !editTarget) next.slug = slugify(value);
      return next;
    });
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      showToast(false, 'Nom et slug sont requis');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        imageUrl: form.imageUrl || null,
        displayOrder: Number.parseInt(form.displayOrder, 10) || 0,
      };
      const method = editTarget ? 'PATCH' : 'POST';
      const body = editTarget ? { id: editTarget.id, ...payload } : payload;
      const res = await fetch(config.apiPath, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Erreur serveur');
      }
      showToast(true, editTarget ? `${config.singularLabel} modifiée ✓` : `${config.singularLabel} créée ✓`);
      setPanelOpen(false);
      await load();
    } catch (e: unknown) {
      showToast(false, (e as Error).message ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: TaxonomyItem) {
    if (!confirm(renderTemplate(config.deleteConfirmationTemplate, item.name, '{name}'))) return;
    try {
      const res = await fetch(`${config.apiPath}?id=${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Erreur lors de la suppression');
      }
      showToast(true, `${config.singularLabel} supprimée`);
      setItems(prev => prev.filter(current => current.id !== item.id));
    } catch (e: unknown) {
      showToast(false, (e as Error).message ?? 'Erreur');
    }
  }

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(197,165,90,0.15)',
    borderRadius: 12,
    overflow: 'hidden',
  };

  const th: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 600,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  };

  const td: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 14,
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    verticalAlign: 'middle',
  };

  let saveLabel = `Créer la ${config.singularLabel.toLowerCase()}`;

  if (editTarget) {
    saveLabel = 'Enregistrer les modifications';
  }

  if (saving) {
    saveLabel = 'Enregistrement…';
  }

  let content: React.ReactNode;

  if (loading) {
    content = (
      <p style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
        Chargement…
      </p>
    );
  } else if (items.length === 0) {
    content = (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗂</div>
        <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {config.emptyMessage}
        </p>
      </div>
    );
  } else {
    content = (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 72 }}>Image</th>
            <th style={th}>Nom</th>
            <th style={th}>Slug</th>
            <th style={th}>Description</th>
            <th style={{ ...th, width: 60, textAlign: 'center' }}>Ordre</th>
            <th style={{ ...th, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const shortDescription = truncateDescription(item.description);

            return (
              <tr key={item.id}>
                <td style={{ ...td, width: 72 }}>
                  <div style={{
                    width: 56, height: 38, borderRadius: 6, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.1rem', opacity: 0.2 }}>🖼</span>
                    )}
                  </div>
                </td>

                <td style={td}>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                </td>

                <td style={td}>
                  <code style={{
                    background: 'rgba(255,255,255,0.08)',
                    padding: '2px 8px', borderRadius: 4,
                    fontSize: 12, color: GOLD,
                  }}>
                    {item.slug}
                  </code>
                </td>

                <td style={{ ...td, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                  {shortDescription ?? <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>}
                </td>

                <td style={{ ...td, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                  {item.display_order ?? 0}
                </td>

                <td style={{ ...td, textAlign: 'right' }}>
                  <button
                    onClick={() => openEdit(item)}
                    style={{
                      background: 'rgba(197,165,90,0.15)',
                      border: '1px solid rgba(197,165,90,0.3)',
                      borderRadius: 6, color: GOLD,
                      padding: '6px 14px', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', marginRight: 8,
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    style={{
                      background: 'rgba(255,100,100,0.12)',
                      border: '1px solid rgba(255,100,100,0.25)',
                      borderRadius: 6, color: '#ff6b6b',
                      padding: '6px 14px', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title={config.deleteBlockedHint}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>{config.title}</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            {config.subtitle.replace('{count}', String(items.length))}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            background: GOLD, color: '#1a1008', border: 'none',
            borderRadius: 8, padding: '11px 20px',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + Nouvelle {config.singularLabel.toLowerCase()}
        </button>
      </div>

      {toast && (
        <div style={{
          padding: '12px 18px', borderRadius: 8, marginBottom: 24,
          fontSize: 13, fontWeight: 600,
          background: toast.ok ? 'rgba(72,199,142,0.15)' : 'rgba(255,100,100,0.15)',
          border: `1px solid ${toast.ok ? 'rgba(72,199,142,0.4)' : 'rgba(255,100,100,0.4)'}`,
          color: toast.ok ? '#48c78e' : '#ff6b6b',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={card}>
        {content}
      </div>

      {panelOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le panneau"
            onClick={() => setPanelOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, border: 'none', padding: 0, cursor: 'pointer' }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 460,
            background: '#16120a',
            borderLeft: '1px solid rgba(197,165,90,0.2)',
            zIndex: 50, overflowY: 'auto', padding: 28,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {editTarget ? `Modifier la ${config.singularLabel.toLowerCase()}` : `Nouvelle ${config.singularLabel.toLowerCase()}`}
              </h2>
              <button
                onClick={() => setPanelOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <TaxonomyImageUpload
              key={editTarget?.id ?? 'new'}
              value={form.imageUrl}
              label={config.imageLabel}
              onChange={url => setForm(current => ({ ...current, imageUrl: url }))}
            />

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="taxonomy-name" style={LABEL}>Nom *</label>
              <input
                id="taxonomy-name"
                type="text"
                value={form.name}
                onChange={e => handleField('name', e.target.value)}
                placeholder={config.namePlaceholder}
                style={inputStyle()}
              />
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                {config.nameHelp}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="taxonomy-slug" style={LABEL}>Slug (URL) *</label>
              <input
                id="taxonomy-slug"
                type="text"
                value={form.slug}
                onChange={e => handleField('slug', e.target.value)}
                placeholder="slug-taxonomie"
                style={{ ...inputStyle(), fontFamily: 'monospace', fontSize: 13 }}
              />
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                {renderTemplate(config.slugHintTemplate, form.slug, '{slug}')}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="taxonomy-description" style={LABEL}>Description</label>
              <textarea
                id="taxonomy-description"
                rows={3}
                value={form.description}
                onChange={e => handleField('description', e.target.value)}
                placeholder="Description de la taxonomie…"
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label htmlFor="taxonomy-order" style={LABEL}>Ordre d&apos;affichage</label>
              <input
                id="taxonomy-order"
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={e => handleField('displayOrder', e.target.value)}
                style={{ ...inputStyle(), width: 100 }}
              />
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                {config.orderHelp}
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                background: saving ? 'rgba(197,165,90,0.3)' : GOLD,
                color: '#1a1008', border: 'none',
                borderRadius: 8, padding: 13,
                fontSize: 14, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background .2s',
              }}
            >
              {saveLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}