'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getDefaultCreationConfig,
  type CreationConfig,
  type CreationConfigFormula,
  type CreationConfigFamily,
  type CreationConfigBottle,
  type CreationFormulaId,
} from '@/lib/custom-creation';

const GOLD = '#C5A55A';
const FORMULA_IDS: CreationFormulaId[] = ['essentiel', 'signature', 'prestige'];

/* ─── Styles helpers ─────────────────────────────────────────────────────── */
function inputSt(): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(197,165,90,0.25)',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    padding: '9px 12px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };
}

function labelSt(): React.CSSProperties {
  return { color: '#888', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 };
}

function cardSt(): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(197,165,90,0.15)',
    borderRadius: 10,
    padding: '18px 20px',
  };
}

function sectionTitleSt(): React.CSSProperties {
  return {
    color: GOLD,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function TextField({
  label, value, onChange, multiline = false, placeholder, hint, type = 'text',
}: Readonly<{
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string; hint?: string; type?: string;
}>) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={labelSt()}>{label}</span>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)}
          style={{ ...inputSt(), resize: 'vertical' }} placeholder={placeholder} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          style={inputSt()} placeholder={placeholder} />
      )}
      {hint && <span style={{ color: '#555', fontSize: 11 }}>{hint}</span>}
    </label>
  );
}

function NumberField({
  label, value, onChange, hint,
}: Readonly<{ label: string; value: number; onChange: (v: number) => void; hint?: string }>) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={labelSt()}>{label}</span>
      <input
        type="number"
        value={value}
        min={0}
        onChange={(e) => onChange(Number(e.target.value))}
        style={inputSt()}
      />
      {hint && <span style={{ color: '#555', fontSize: 11 }}>{hint}</span>}
    </label>
  );
}

function TagsField({
  label, value, onChange, hint,
}: Readonly<{ label: string; value: string[]; onChange: (v: string[]) => void; hint?: string }>) {
  const raw = value.join('\n');
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={labelSt()}>{label}</span>
      <textarea
        rows={4}
        value={raw}
        onChange={(e) => onChange(e.target.value.split('\n'))}
        style={{ ...inputSt(), resize: 'vertical' }}
        placeholder="Une ligne = un élément"
      />
      {hint && <span style={{ color: '#555', fontSize: 11 }}>{hint}</span>}
    </label>
  );
}

/* ─── Formula editor ─────────────────────────────────────────────────────── */
function FormulaEditor({
  formula, onChange,
}: Readonly<{
  formula: CreationConfigFormula;
  onChange: (f: CreationConfigFormula) => void;
}>) {
  function up<K extends keyof CreationConfigFormula>(k: K, v: CreationConfigFormula[K]) {
    onChange({ ...formula, [k]: v });
  }
  return (
    <div style={cardSt()}>
      <p style={sectionTitleSt()}>
        <span style={{ background: 'rgba(197,165,90,0.15)', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>
          {formula.id}
        </span>
        {formula.name}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <TextField label="Nom" value={formula.name} onChange={(v) => up('name', v)} />
        <TextField label="Volume" value={formula.volume} onChange={(v) => up('volume', v)} placeholder="50 ml" />
        <NumberField label="Prix (FCFA)" value={formula.price} onChange={(v) => up('price', v)} hint="En francs CFA" />
        <TextField label="Délai" value={formula.leadTime} onChange={(v) => up('leadTime', v)} placeholder="17–25 jours" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <TextField label="Description courte" value={formula.description} onChange={(v) => up('description', v)} multiline />
      </div>
      <TagsField
        label="Inclus (liste)"
        value={formula.included}
        onChange={(v) => up('included', v)}
        hint="Une ligne = un avantage affiché"
      />
    </div>
  );
}

/* ─── Family editor ──────────────────────────────────────────────────────── */
function FamilyEditor({
  family, onChange, onRemove,
}: Readonly<{
  family: CreationConfigFamily;
  onChange: (f: CreationConfigFamily) => void;
  onRemove: () => void;
}>) {
  function up<K extends keyof CreationConfigFamily>(k: K, v: CreationConfigFamily[K]) {
    onChange({ ...family, [k]: v });
  }
  return (
    <div style={{ ...cardSt(), position: 'relative' }}>
      <button
        type="button"
        onClick={onRemove}
        title="Supprimer cette famille"
        style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
      >
        ×
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <TextField label="ID (slug)" value={family.id} onChange={(v) => up('id', v)} placeholder="oriental" />
        <TextField label="Nom affiché" value={family.name} onChange={(v) => up('name', v)} placeholder="Oriental" />
      </div>
      <div style={{ marginBottom: 10 }}>
        <TextField label="Mood / ambiance" value={family.mood} onChange={(v) => up('mood', v)} placeholder="Chaud, sensuel, profond" />
      </div>
      <TagsField
        label="Notes pré-sélectionnées"
        value={family.notes}
        onChange={(v) => up('notes', v)}
        hint="Notes chargées par défaut quand cette famille est choisie"
      />
    </div>
  );
}

/* ─── Bottle editor ──────────────────────────────────────────────────────── */
function BottleEditor({
  bottle, onChange, onRemove,
}: Readonly<{
  bottle: CreationConfigBottle;
  onChange: (b: CreationConfigBottle) => void;
  onRemove: () => void;
}>) {
  return (
    <div style={{ ...cardSt(), position: 'relative' }}>
      <button
        type="button"
        onClick={onRemove}
        title="Supprimer"
        style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16 }}
      >
        ×
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <TextField label="ID (slug)" value={bottle.id} onChange={(v) => onChange({ ...bottle, id: v })} placeholder="noir-or" />
        <TextField label="Nom affiché" value={bottle.name} onChange={(v) => onChange({ ...bottle, name: v })} />
      </div>
      <TextField label="Description" value={bottle.description} onChange={(v) => onChange({ ...bottle, description: v })} multiline />
    </div>
  );
}

/* ─── Section wrapper ────────────────────────────────────────────────────── */
function Section({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 500, letterSpacing: '0.06em', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid rgba(197,165,90,0.15)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ ok, msg }: Readonly<{ ok: boolean; msg: string }>) {
  return (
    <div style={{
      background: ok ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      border: `1px solid ${ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
      color: ok ? '#86efac' : '#fca5a5',
      borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14,
    }}>
      {msg}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function AdminCreationPage() {
  const [config, setConfig] = useState<CreationConfig>(getDefaultCreationConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'formulas' | 'families' | 'notes' | 'bottles' | 'options'>('formulas');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/creation-configurator');
        if (!res.ok) throw new Error('Fetch failed');
        const json = await res.json() as { config: CreationConfig };
        setConfig(json.config);
      } catch {
        setToast({ ok: false, msg: 'Impossible de charger la configuration.' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch('/api/admin/creation-configurator', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Erreur');
      }
      setToast({ ok: true, msg: 'Configuration enregistrée ✓' });
    } catch (err) {
      setToast({ ok: false, msg: err instanceof Error ? err.message : 'Erreur inconnue' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }, [config]);

  function updateFormula(id: string, updated: CreationConfigFormula) {
    setConfig((c) => ({ ...c, formulas: c.formulas.map((f) => (f.id === id ? updated : f)) }));
  }

  function addFamily() {
    const newFam: CreationConfigFamily = { id: `famille-${Date.now()}`, name: 'Nouvelle famille', notes: [], mood: '' };
    setConfig((c) => ({ ...c, families: [...c.families, newFam] }));
  }

  function updateFamily(idx: number, updated: CreationConfigFamily) {
    setConfig((c) => ({ ...c, families: c.families.map((f, i) => (i === idx ? updated : f)) }));
  }

  function removeFamily(idx: number) {
    setConfig((c) => ({ ...c, families: c.families.filter((_, i) => i !== idx) }));
  }

  function addBottle() {
    const newB: CreationConfigBottle = { id: `flacon-${Date.now()}`, name: 'Nouveau flacon', description: '' };
    setConfig((c) => ({ ...c, bottles: [...c.bottles, newB] }));
  }

  function updateBottle(idx: number, updated: CreationConfigBottle) {
    setConfig((c) => ({ ...c, bottles: c.bottles.map((b, i) => (i === idx ? updated : b)) }));
  }

  function removeBottle(idx: number) {
    setConfig((c) => ({ ...c, bottles: c.bottles.filter((_, i) => i !== idx) }));
  }

  function handleReset() {
    if (!globalThis.confirm('Réinitialiser toute la configuration aux valeurs par défaut ?')) return;
    setConfig(getDefaultCreationConfig());
  }

  if (loading) {
    return <div style={{ color: '#666', padding: 40, textAlign: 'center' }}>Chargement…</div>;
  }

  const TABS: { id: typeof activeTab; label: string }[] = [
    { id: 'formulas', label: 'Formules (3)' },
    { id: 'families', label: `Familles (${config.families.length})` },
    { id: 'notes', label: `Notes (${config.notes.length})` },
    { id: 'bottles', label: `Flacons (${config.bottles.length})` },
    { id: 'options', label: 'Options' },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 300, letterSpacing: '0.06em', margin: '0 0 6px' }}>
            Configurateur Premium
          </h1>
          <p style={{ color: '#555', fontSize: 13, margin: 0 }}>
            Gérez les formules, familles olfactives, notes, flacons et options du configurateur sur-mesure.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleReset}
            style={{ background: 'none', border: '1px solid #333', color: '#666', borderRadius: 7, padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            style={{
              background: saving ? 'rgba(197,165,90,0.4)' : GOLD,
              color: '#0D0D0D', border: 'none', borderRadius: 7,
              padding: '9px 24px', fontSize: 13, fontWeight: 600,
              letterSpacing: '0.04em', cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {toast && <Toast ok={toast.ok} msg={toast.msg} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? GOLD : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.id ? '#0D0D0D' : '#888',
              border: `1px solid ${activeTab === tab.id ? GOLD : 'rgba(197,165,90,0.15)'}`,
              borderRadius: 6, padding: '8px 14px',
              fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400,
              letterSpacing: '0.04em', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab : Formules ── */}
      {activeTab === 'formulas' && (
        <Section title="Formules tarifaires">
          <p style={{ color: '#555', fontSize: 13, marginBottom: 20 }}>
            Les 3 formules sont fixes (essentiel, signature, prestige). Vous pouvez modifier leur nom, prix, volume, délai et avantages.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FORMULA_IDS.map((id) => {
              const f = config.formulas.find((x) => x.id === id);
              if (!f) return null;
              return (
                <FormulaEditor
                  key={id}
                  formula={f}
                  onChange={(updated) => updateFormula(id, updated)}
                />
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Tab : Familles ── */}
      {activeTab === 'families' && (
        <Section title="Familles olfactives">
          <p style={{ color: '#555', fontSize: 13, marginBottom: 20 }}>
            Chaque famille correspond à une ambiance. Les notes listées sont pré-sélectionnées quand le client choisit cette famille.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {config.families.map((fam, idx) => (
              <FamilyEditor
                key={`${fam.id}-${idx}`}
                family={fam}
                onChange={(updated) => updateFamily(idx, updated)}
                onRemove={() => removeFamily(idx)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addFamily}
            style={{ marginTop: 14, background: 'none', border: `1px dashed ${GOLD}`, color: GOLD, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer', width: '100%' }}
          >
            + Ajouter une famille
          </button>
        </Section>
      )}

      {/* ── Tab : Notes ── */}
      {activeTab === 'notes' && (
        <Section title="Palette de notes">
          <p style={{ color: '#555', fontSize: 13, marginBottom: 16 }}>
            Liste complète des notes disponibles dans le sélecteur. Une par ligne.
          </p>
          <TagsField
            label="Notes disponibles"
            value={config.notes}
            onChange={(v) => setConfig((c) => ({ ...c, notes: v }))}
            hint="Chaque ligne = une note. Le client peut en choisir 2 à 6."
          />
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {config.notes.filter((n) => n.trim()).map((note) => (
              <span key={note} style={{ background: 'rgba(197,165,90,0.1)', border: '1px solid rgba(197,165,90,0.2)', color: GOLD, borderRadius: 999, padding: '4px 10px', fontSize: 12 }}>
                {note}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* ── Tab : Flacons ── */}
      {activeTab === 'bottles' && (
        <Section title="Flacons disponibles">
          <p style={{ color: '#555', fontSize: 13, marginBottom: 20 }}>
            Options de flacon proposées à l&apos;étape 4 du configurateur.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {config.bottles.map((b, idx) => (
              <BottleEditor
                key={`${b.id}-${idx}`}
                bottle={b}
                onChange={(updated) => updateBottle(idx, updated)}
                onRemove={() => removeBottle(idx)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addBottle}
            style={{ marginTop: 14, background: 'none', border: `1px dashed ${GOLD}`, color: GOLD, borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer', width: '100%' }}
          >
            + Ajouter un flacon
          </button>
        </Section>
      )}

      {/* ── Tab : Options ── */}
      {activeTab === 'options' && (
        <Section title="Options — Intensités & Audiences">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <TagsField
              label="Intensités"
              value={config.intensities}
              onChange={(v) => setConfig((c) => ({ ...c, intensities: v }))}
              hint="Niveaux de sillage proposés (une ligne = une option)"
            />
            <TagsField
              label="Pour qui (audiences)"
              value={config.audiences}
              onChange={(v) => setConfig((c) => ({ ...c, audiences: v }))}
              hint="Ex : Pour moi, A offrir, Mariage…"
            />
          </div>
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <p style={{ ...labelSt(), marginBottom: 10 }}>Aperçu intensités</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {config.intensities.filter((i) => i.trim()).map((i) => (
                  <span key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', borderRadius: 999, padding: '5px 12px', fontSize: 12 }}>{i}</span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ ...labelSt(), marginBottom: 10 }}>Aperçu audiences</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {config.audiences.filter((a) => a.trim()).map((a) => (
                  <span key={a} style={{ background: 'rgba(197,165,90,0.1)', border: '1px solid rgba(197,165,90,0.2)', color: GOLD, borderRadius: 999, padding: '5px 12px', fontSize: 12 }}>{a}</span>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Save sticky footer */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(13,13,13,0.9)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(197,165,90,0.12)', padding: '14px 0', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 32 }}>
        <button
          type="button"
          onClick={handleReset}
          style={{ background: 'none', border: '1px solid #333', color: '#666', borderRadius: 7, padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}
        >
          Réinitialiser
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          style={{
            background: saving ? 'rgba(197,165,90,0.4)' : GOLD,
            color: '#0D0D0D', border: 'none', borderRadius: 7,
            padding: '9px 28px', fontSize: 13, fontWeight: 600,
            letterSpacing: '0.04em', cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer tout'}
        </button>
      </div>
    </div>
  );
}
