'use client';

import { useEffect, useId, useRef, useState } from 'react';

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface ServiceRow {
  slug: string;
  label: string;
  titre: string;
  accroche: string;
  description: string;
  details: string[];     // une ligne par item
  cta_label: string;
  tag: string;
  hero_image_url: string;
  is_active: boolean;
}

const DEFAULTS: ServiceRow[] = [
  {
    slug: 'quiz-olfactif',
    label: 'Quiz Olfactif',
    titre: 'Quiz Olfactif IA',
    accroche: 'Votre signature en 5 minutes.',
    description: 'Notre algorithme analyse vos préférences — humeur, occasion, notes aimées — et vous recommande les parfums qui vous correspondent avec précision.',
    details: [
      '5 étapes guidées',
      'Résultats personnalisés instantanés',
      'Recommandations de 3 à 6 fragrances',
      'Gratuit & sans inscription',
    ],
    cta_label: 'Démarrer le quiz',
    tag: 'Gratuit',
    hero_image_url: '',
    is_active: true,
  },
  {
    slug: 'consultation',
    label: 'Consultation',
    titre: 'Consultation Privée',
    accroche: "L'expertise à votre écoute.",
    description: 'Un rendez-vous exclusif avec notre experte parfumerie. Nous construisons ensemble votre garde-robe olfactive, selon votre personnalité, vos envies et votre budget.',
    details: [
      'Séance de 60 à 90 minutes',
      'Analyse de votre profil olfactif',
      'Sélection de 6 à 10 fragrances',
      'Disponible en présentiel ou visio',
    ],
    cta_label: 'Prendre rendez-vous',
    tag: 'Sur rendez-vous',
    hero_image_url: '',
    is_active: true,
  },
  {
    slug: 'creation-personnalisee',
    label: 'Création personnalisée',
    titre: 'Création Personnalisée',
    accroche: 'Un parfum unique, le vôtre.',
    description: 'Nous composons pour vous une fragrance exclusive — accord sur-mesure, flacon gravé, coffret cadeau. Un objet de luxe signé à votre nom.',
    details: [
      'Formulation artisanale exclusive',
      'Flacon numéroté & gravé à votre nom',
      'Coffret luxe avec certificat',
      'Idéal comme cadeau prestige',
    ],
    cta_label: 'Créer mon parfum',
    tag: 'Sur-mesure',
    hero_image_url: '',
    is_active: true,
  },
];

import { GOLD } from '@/lib/admin-theme';

/* ─── Image upload ────────────────────────────────────────────────────────── */

function ServiceImageUpload({ value, onChange }: Readonly<{ value: string; onChange: (url: string) => void }>) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragging, setDragging] = useState(false);
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
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur upload');
      onChange(json.url ?? '');
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
    borderRadius: 10,
    background: dragging ? 'rgba(197,165,90,0.08)' : 'rgba(255,255,255,0.03)',
    transition: 'border-color .2s, background .2s',
    cursor: uploading ? 'wait' : 'pointer',
    overflow: 'hidden',
    position: 'relative',
  };

  return (
    <div>
      <span style={{ color: '#A0A0A0', fontSize: 12, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
        Image de fond du hero (optionnel)
      </span>
      {value ? (
        <div style={{ ...zone, aspectRatio: '16/5', cursor: 'default' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Remplacer</button>
            <button type="button" onClick={() => onChange('')} style={{ background: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Supprimer</button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          style={{ ...zone, padding: '28px 20px', textAlign: 'center', aspectRatio: '16/5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
          onDrop={onDrop}
        >
          {uploading ? (
            <>
              <div style={{ width: 28, height: 28, border: '3px solid rgba(197,165,90,0.2)', borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Upload en cours…</span>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </>
          ) : (
            <>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={dragging ? GOLD : 'rgba(197,165,90,0.5)'} strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 15l5-5 4 4 3-3 6 6" />
                <circle cx="8.5" cy="8.5" r="1.5" fill={dragging ? GOLD : 'rgba(197,165,90,0.5)'} stroke="none" />
              </svg>
              <div>
                <span style={{ color: GOLD, fontSize: 13, fontWeight: 600 }}>Cliquer</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}> ou glisser-déposer</span>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>JPEG · PNG · WebP — max 5 Mo · Format recommandé : 1600 × 600 px</span>
            </>
          )}
        </label>
      )}
      <input id={inputId} ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden disabled={uploading} onChange={onFileChange} />
      {uploadError && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>{uploadError}</p>}
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function inputStyle(): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(197,165,90,0.3)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    padding: '10px 14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  hint,
  type = 'text',
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
  type?: string;
}>) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color: '#A0A0A0', fontSize: 12, letterSpacing: '0.04em' }}>{label}</span>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle(), resize: 'vertical' }} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle()} />
      )}
      {hint && <span style={{ color: '#555', fontSize: 11 }}>{hint}</span>}
    </label>
  );
}

function DetailsField({
  value,
  onChange,
}: Readonly<{ value: string[]; onChange: (v: string[]) => void }>) {
  const raw = value.join('\n');
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color: '#A0A0A0', fontSize: 12, letterSpacing: '0.04em' }}>
        Points clés (liste à puces)
      </span>
      <textarea
        rows={5}
        value={raw}
        onChange={(e) => onChange(e.target.value.split('\n'))}
        style={{ ...inputStyle(), resize: 'vertical' }}
        placeholder="Une ligne = un point&#10;Ex : Conseils personnalisés&#10;Ex : Suivi sous 24h"
      />
      <span style={{ color: '#555', fontSize: 11 }}>
        Chaque ligne devient un point dans la liste (puces). Lignes vides ignorées.
      </span>
    </label>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
type DbService = {
  slug: string; titre: string; accroche: string; description: string;
  details: string[]; cta_label: string; tag: string; hero_image_url: string; is_active: boolean;
};

function mergeServices(defaults: ServiceRow[], dbRows: DbService[]): ServiceRow[] {
  return defaults.map((def) => {
    const db = dbRows.find((s) => s.slug === def.slug);
    if (!db) return def;
    return {
      ...def,
      titre: db.titre ?? '',
      accroche: db.accroche ?? '',
      description: db.description ?? '',
      details: Array.isArray(db.details) ? db.details : [],
      cta_label: db.cta_label ?? '',
      tag: db.tag ?? '',
      hero_image_url: db.hero_image_url ?? '',
      is_active: db.is_active ?? true,
    };
  });
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function AdminServicesPage() {
  const [rows, setRows] = useState<ServiceRow[]>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/services');
        if (!res.ok) throw new Error('Fetch failed');
        const json = await res.json() as { services: DbService[] };
        setRows(mergeServices(DEFAULTS, json.services));
      } catch {
        setToast({ ok: false, msg: 'Impossible de charger les données.' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const update = <K extends keyof ServiceRow>(slug: string, field: K, value: ServiceRow[K]) => {
    setRows((prev) => prev.map((r) => (r.slug === slug ? { ...r, [field]: value } : r)));
  };

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const payload = rows.map(({ slug, titre, accroche, description, details, cta_label, tag, hero_image_url, is_active }) => ({
        slug,
        titre,
        accroche,
        description,
        details: details.filter((l) => l.trim() !== ''),
        cta_label,
        tag,
        hero_image_url,
        is_active,
      }));
      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Erreur');
      }
      setToast({ ok: true, msg: 'Services enregistrés ✓' });
    } catch (err) {
      setToast({ ok: false, msg: err instanceof Error ? err.message : 'Erreur inconnue' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  if (loading) {
    return <div style={{ color: '#666', padding: 40, textAlign: 'center' }}>Chargement…</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 300, letterSpacing: '0.08em', marginBottom: 6 }}>
          Contenu — Services
        </h1>
        <p style={{ color: '#666', fontSize: 14 }}>
          Modifiez les textes des 3 services proposés (titre, accroche, description, liste, CTA).
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            background: toast.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: toast.ok ? '#86efac' : '#fca5a5',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Service sections */}
      {rows.map((row) => (
        <section
          key={row.slug}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(197,165,90,0.2)',
            borderRadius: 12,
            padding: '24px 28px',
            marginBottom: 20,
          }}
        >
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2
              style={{
                color: GOLD,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              {row.label}
              <span style={{ color: '#555', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                /{row.slug}
              </span>
            </h2>

            {/* Active toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#888', fontSize: 13 }}>Actif</span>
              <button
                type="button"
                role="switch"
                aria-checked={row.is_active}
                aria-label={`Service ${row.label} : ${row.is_active ? 'actif' : 'inactif'}`}
                onClick={() => update(row.slug, 'is_active', !row.is_active)}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); update(row.slug, 'is_active', !row.is_active); } }}
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  background: row.is_active ? GOLD : '#333',
                  border: 'none',
                  position: 'relative',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: row.is_active ? 20 : 3,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field
                label="Titre"
                value={row.titre}
                onChange={(v) => update(row.slug, 'titre', v)}
                hint="Titre principal du service"
              />
              <Field
                label="Tag (badge)"
                value={row.tag}
                onChange={(v) => update(row.slug, 'tag', v)}
                hint="Ex : Gratuit, Sur RDV, Exclusif"
              />
            </div>

            <Field
              label="Accroche (sous-titre)"
              value={row.accroche}
              onChange={(v) => update(row.slug, 'accroche', v)}
              hint="Phrase courte affichée sous le titre"
            />

            <Field
              label="Description"
              value={row.description}
              onChange={(v) => update(row.slug, 'description', v)}
              multiline
              hint="Texte descriptif principal"
            />

            <DetailsField
              value={row.details}
              onChange={(v) => update(row.slug, 'details', v)}
            />

            <Field
              label="Texte du bouton CTA"
              value={row.cta_label}
              onChange={(v) => update(row.slug, 'cta_label', v)}
              hint="Ex : Réserver • Commencer • En savoir plus"
            />

            <ServiceImageUpload
              value={row.hero_image_url}
              onChange={(v) => update(row.slug, 'hero_image_url', v)}
            />
          </div>
        </section>
      ))}

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          style={{
            background: saving ? 'rgba(197,165,90,0.4)' : GOLD,
            color: '#0D0D0D',
            border: 'none',
            borderRadius: 8,
            padding: '12px 32px',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.06em',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
