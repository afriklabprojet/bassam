'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_UNIVERS,
  type UniversContent,
} from '@/lib/supabase/home-content';

/* ── Styles & helpers ───────────────────────────────────────────────────────── */

const GOLD = '#C5A55A';

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
    transition: 'border-color .2s',
    resize: 'vertical',
    boxSizing: 'border-box',
  };
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
}

function Field({ label, value, onChange, multiline, hint }: FieldProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, color: GOLD, marginBottom: 6, fontWeight: 600, letterSpacing: '.04em' }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{hint}</p>}
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle()}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle(), resize: undefined }}
        />
      )}
    </div>
  );
}

/* ── Merge helper ────────────────────────────────────────────────────────────── */

function mergeUnivers(defaults: UniversContent[], dbRows: UniversContent[]): UniversContent[] {
  return defaults.map((def) => {
    const db = dbRows.find((r) => r.slug === def.slug);
    if (!db) return def;
    return {
      ...def,
      tagline: db.tagline || def.tagline,
      description: db.description || def.description,
      notes: Array.isArray(db.notes) && db.notes.length > 0 ? db.notes : def.notes,
    };
  });
}

/* ── Labels affichés ─────────────────────────────────────────────────────────── */

const UNIVERS_LABELS: Record<string, string> = {
  femme: '🌸 Univers Femme',
  homme: '🌿 Univers Homme',
  mixte: '✨ Univers Mixte',
};

/* ── Main page ───────────────────────────────────────────────────────────────── */

export default function AdminAccueilPage() {
  const [univers, setUnivers] = useState<UniversContent[]>(DEFAULT_UNIVERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/home')
      .then((r) => r.json())
      .then((d) => setUnivers(mergeUnivers(DEFAULT_UNIVERS, d.univers ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function updateUnivers<K extends keyof UniversContent>(slug: string, field: K, value: UniversContent[K]) {
    setUnivers((prev) => prev.map((u) => (u.slug === slug ? { ...u, [field]: value } : u)));
  }

  function updateNotes(slug: string, rawText: string) {
    const notes = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    updateUnivers(slug, 'notes', notes);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: univers }),
      });
      const ok = res.ok;
      setToast({ ok, msg: ok ? 'Page Accueil sauvegardée ✓' : 'Erreur lors de la sauvegarde' });
    } catch {
      setToast({ ok: false, msg: 'Erreur réseau' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  }

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(197,165,90,0.15)',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>
            Page Accueil — Univers
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Modifiez les taglines, descriptions et notes olfactives pour chaque univers
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          style={{
            background: saving || loading ? 'rgba(197,165,90,0.3)' : GOLD,
            color: '#1a1008',
            border: 'none',
            borderRadius: 8,
            padding: '11px 24px',
            fontSize: 14,
            fontWeight: 700,
            cursor: saving || loading ? 'not-allowed' : 'pointer',
            transition: 'background .2s',
          }}
        >
          {saving ? 'Enregistrement…' : loading ? 'Chargement…' : 'Enregistrer'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ padding: '12px 18px', borderRadius: 8, marginBottom: 24, fontSize: 13, fontWeight: 600, background: toast.ok ? 'rgba(72,199,142,0.15)' : 'rgba(255,100,100,0.15)', border: `1px solid ${toast.ok ? 'rgba(72,199,142,0.4)' : 'rgba(255,100,100,0.4)'}`, color: toast.ok ? '#48c78e' : '#ff6b6b' }}>
          {toast.msg}
        </div>
      )}

      {/* Info banner */}
      <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 28, fontSize: 12, background: 'rgba(197,165,90,0.08)', border: '1px solid rgba(197,165,90,0.2)', color: 'rgba(197,165,90,0.8)' }}>
        💡 Les couleurs de fond et les noms d'univers (Femme / Homme / Mixte) sont fixes. Seuls le tagline, la description et les notes olfactives sont modifiables ici.
      </div>

      {loading && (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          Chargement des données…
        </p>
      )}

      {/* Univers cards */}
      {univers.map((u) => (
        <div key={u.slug} style={card}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: GOLD, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 4, height: 18, background: GOLD, borderRadius: 2, display: 'inline-block' }} />
            {UNIVERS_LABELS[u.slug] ?? u.slug}
          </h2>

          <Field
            label="Tagline (accroche courte)"
            value={u.tagline}
            onChange={(v) => updateUnivers(u.slug, 'tagline', v)}
          />
          <Field
            label="Description"
            value={u.description}
            onChange={(v) => updateUnivers(u.slug, 'description', v)}
            multiline
          />
          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'block', fontSize: 12, color: GOLD, marginBottom: 6, fontWeight: 600, letterSpacing: '.04em' }}>
              Notes olfactives
            </label>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              Une note par ligne — ex&nbsp;: Jasmin / Rose / Vanille / Oud
            </p>
            <textarea
              rows={5}
              value={u.notes.join('\n')}
              onChange={(e) => updateNotes(u.slug, e.target.value)}
              style={inputStyle()}
            />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
              Actuellement : {u.notes.join(' · ')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
