'use client';

import { useEffect, useState } from 'react';

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface CollectionRow {
  slug: string;
  label: string;
  eyebrow: string;
  tagline: string;
  description: string;
}

const DEFAULTS: CollectionRow[] = [
  {
    slug: 'nouveautes',
    label: 'Nouveautés',
    eyebrow: 'Dernières arrivées',
    tagline: 'Ce qui vient de poser ses valises',
    description: 'Parcourez les toutes dernières créations des maisons que nous sélectionnons avec soin — des lancements mondiaux disponibles à Abidjan.',
  },
  {
    slug: 'femme',
    label: 'Femme',
    eyebrow: 'Collection féminine',
    tagline: 'Floraux enivrants, orientaux profonds',
    description: 'De la rose de Grasse aux muscs orientaux, une sélection de fragrances féminines qui incarnent l\'élégance à son sommet.',
  },
  {
    slug: 'homme',
    label: 'Homme',
    eyebrow: 'Collection masculine',
    tagline: 'Boisés élégants, signatures puissantes',
    description: 'Des sillages qui affirment sans imposer. De l\'oud pur aux accords boisés contemporains, des parfums qui définissent le gentleman moderne.',
  },
  {
    slug: 'mixte',
    label: 'Mixte',
    eyebrow: 'Au-delà des genres',
    tagline: 'La fragrance ne connaît pas de frontières',
    description: 'Des compositions olfactives qui transcendent les catégories. Pour ceux qui choisissent leur parfum à l\'instinct, sans convention.',
  },
];

import { GOLD } from '@/lib/admin-theme';

/* ─── Field ─────────────────────────────────────────────────────────────────── */
function Field({
  label,
  value,
  onChange,
  multiline = false,
  hint,
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
}>) {
  const sharedStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(197,165,90,0.3)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    padding: '10px 14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color: '#A0A0A0', fontSize: 12, letterSpacing: '0.04em' }}>
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...sharedStyle, resize: 'vertical' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(197,165,90,0.3)')}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={sharedStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(197,165,90,0.3)')}
        />
      )}
      {hint && <span style={{ color: '#666', fontSize: 11 }}>{hint}</span>}
    </label>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
type DbCollection = { slug: string; eyebrow: string; tagline: string; description: string };

function mergeCollections(defaults: CollectionRow[], dbRows: DbCollection[]): CollectionRow[] {
  return defaults.map((def) => {
    const db = dbRows.find((c) => c.slug === def.slug);
    return db ? { ...def, eyebrow: db.eyebrow, tagline: db.tagline, description: db.description } : def;
  });
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function AdminCollectionsPage() {
  const [rows, setRows] = useState<CollectionRow[]>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/collections');
        if (!res.ok) throw new Error('Fetch failed');
        const json = await res.json() as { collections: DbCollection[] };
        setRows(mergeCollections(DEFAULTS, json.collections));
      } catch {
        setToast({ ok: false, msg: 'Impossible de charger les données.' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const updateField = (slug: string, field: keyof Omit<CollectionRow, 'slug' | 'label'>, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.slug === slug ? { ...r, [field]: value } : r)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows.map(({ slug, eyebrow, tagline, description }) => ({ slug, eyebrow, tagline, description }))),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Erreur');
      }
      setToast({ ok: true, msg: 'Collections enregistrées ✓' });
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
          Contenu — Collections
        </h1>
        <p style={{ color: '#666', fontSize: 14 }}>
          Modifiez les textes des 4 cartes collections (eyebrow, accroche, description).
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

      {/* Collection sections */}
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
          <h2
            style={{
              color: GOLD,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            {row.label}
            <span style={{ color: '#555', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
              /{row.slug}
            </span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field
              label="Eyebrow (surtitre en majuscules)"
              value={row.eyebrow}
              onChange={(v) => updateField(row.slug, 'eyebrow', v)}
              hint="Ex : Nos incontournables • affiché au-dessus du titre"
            />
            <Field
              label="Accroche (titre principal)"
              value={row.tagline}
              onChange={(v) => updateField(row.slug, 'tagline', v)}
              hint="Ex : L'élégance au féminin"
            />
            <Field
              label="Description"
              value={row.description}
              onChange={(v) => updateField(row.slug, 'description', v)}
              multiline
              hint="Texte affiché sur la carte ou la page de collection"
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
            transition: 'background 0.2s',
          }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
