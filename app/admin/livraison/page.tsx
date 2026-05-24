'use client';

import { useEffect, useId, useState } from 'react';
import type { DeliveryMode, ShippingConfig } from '@/lib/shipping';
import { DEFAULT_SHIPPING_CONFIG } from '@/lib/shipping';

const GOLD = '#C5A55A';

function inputStyle(disabled = false): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(197,165,90,0.3)',
    borderRadius: 8, color: disabled ? '#555' : '#fff',
    fontSize: 14, padding: '9px 13px', outline: 'none', width: '100%',
    transition: 'border-color 0.2s',
  };
}

function Toggle({ value, onChange }: Readonly<{ value: boolean; onChange: (v: boolean) => void }>) {
  return (
    <div
      role="switch"
      aria-checked={value}
      tabIndex={0}
      onClick={() => onChange(!value)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onChange(!value); }}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        background: value ? GOLD : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: value ? '#0D0D0D' : '#666', transition: 'left 0.2s',
      }} />
    </div>
  );
}

function FocusInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputStyle(props.disabled), ...style }}
      onFocus={e => { e.currentTarget.style.borderColor = GOLD; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(197,165,90,0.3)'; }}
    />
  );
}

function ModeRow({
  mode,
  index,
  total,
  onChange,
  onDelete,
  onMove,
}: Readonly<{
  mode: DeliveryMode;
  index: number;
  total: number;
  onChange: (m: DeliveryMode) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}>) {
  const typeIcon = mode.type === 'pickup' ? '🏪' : '🚚';

  return (
    <div style={{
      border: `1px solid ${mode.enabled ? 'rgba(197,165,90,0.25)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 10, padding: '18px 18px 14px',
      opacity: mode.enabled ? 1 : 0.55,
      transition: 'opacity 0.2s, border-color 0.2s',
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Reorder arrows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button type="button" onClick={() => onMove(-1)} disabled={index === 0}
              style={{ background: 'none', border: 'none', color: index === 0 ? '#333' : '#666', cursor: index === 0 ? 'default' : 'pointer', padding: 2, lineHeight: 1 }}>
              ▲
            </button>
            <button type="button" onClick={() => onMove(1)} disabled={index === total - 1}
              style={{ background: 'none', border: 'none', color: index === total - 1 ? '#333' : '#666', cursor: index === total - 1 ? 'default' : 'pointer', padding: 2, lineHeight: 1 }}>
              ▼
            </button>
          </div>
          <span style={{ fontSize: 18 }}>{typeIcon}</span>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{mode.label || <em style={{ color: '#555' }}>Sans titre</em>}</span>
          <span style={{
            fontSize: 10, letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 4,
            background: mode.type === 'pickup' ? 'rgba(197,165,90,0.15)' : 'rgba(99,179,237,0.15)',
            color: mode.type === 'pickup' ? GOLD : '#90cdf4', textTransform: 'uppercase',
          }}>
            {mode.type === 'pickup' ? 'retrait' : 'livraison'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Toggle value={mode.enabled} onChange={v => onChange({ ...mode, enabled: v })} />
          <button type="button" onClick={onDelete} title="Supprimer"
            style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
        <div>
          <label style={{ display: 'block', color: '#888', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 5 }}>Libellé *</label>
          <FocusInput
            type="text" value={mode.label} placeholder="ex: Livraison Express"
            onChange={e => onChange({ ...mode, label: e.target.value })}
          />
        </div>
        <div>
          <label style={{ display: 'block', color: '#888', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 5 }}>Frais (FCFA) *</label>
          <div style={{ position: 'relative' }}>
            <FocusInput
              type="number" min={0} step={100} value={mode.fee}
              style={{ paddingRight: 46 }}
              onChange={e => onChange({ ...mode, fee: Math.max(0, Number(e.target.value)) })}
            />
            <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 11, pointerEvents: 'none' }}>FCFA</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', color: '#888', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 5 }}>Description / délai</label>
          <FocusInput
            type="text" value={mode.description}
            placeholder="ex: 24 à 48h — Abidjan uniquement"
            onChange={e => onChange({ ...mode, description: e.target.value })}
          />
        </div>
        <div>
          <label style={{ display: 'block', color: '#888', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 5 }}>Type</label>
          <select
            value={mode.type}
            onChange={e => onChange({ ...mode, type: e.target.value as 'delivery' | 'pickup' })}
            style={{ ...inputStyle(), width: 130 }}
          >
            <option value="delivery">🚚 Livraison</option>
            <option value="pickup">🏪 Retrait</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default function LivraisonPage() {
  const uid = useId();
  const [config, setConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/shipping');
        if (!res.ok) throw new Error('Fetch failed');
        const json = await res.json() as { config: ShippingConfig };
        setConfig(json.config);
      } catch {
        setToast({ ok: false, msg: 'Impossible de charger la configuration.' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  function addMode(type: 'delivery' | 'pickup') {
    const id = `mode-${uid}-${Date.now()}`;
    const newMode: DeliveryMode = {
      id,
      label: type === 'pickup' ? 'Retrait en boutique' : 'Nouveau mode',
      description: '',
      fee: type === 'pickup' ? 0 : 1500,
      enabled: true,
      type,
    };
    setConfig(c => ({ modes: [...c.modes, newMode] }));
  }

  function updateMode(id: string, updated: DeliveryMode) {
    setConfig(c => ({ modes: c.modes.map(m => m.id === id ? updated : m) }));
  }

  function deleteMode(id: string) {
    setConfig(c => ({ modes: c.modes.filter(m => m.id !== id) }));
  }

  function moveMode(index: number, dir: -1 | 1) {
    const next = index + dir;
    setConfig(c => {
      const modes = [...c.modes];
      const tmp = modes[index];
      modes[index] = modes[next];
      modes[next] = tmp;
      return { modes };
    });
  }

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Erreur');
      setToast({ ok: true, msg: 'Configuration enregistrée ✓' });
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
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 300, letterSpacing: '0.08em', marginBottom: 6 }}>Modes de livraison</h1>
        <p style={{ color: '#666', fontSize: 14 }}>Configurez les options proposées à vos clients — sans redéploiement.</p>
      </div>

      {toast && (
        <div style={{
          background: toast.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: toast.ok ? '#86efac' : '#fca5a5',
          borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => addMode('delivery')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: GOLD, color: '#0D0D0D', border: 'none',
          borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une livraison
        </button>
        <button type="button" onClick={() => addMode('pickup')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.06)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un retrait
        </button>
      </div>

      {/* Modes list */}
      {config.modes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#444', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
          <p style={{ marginBottom: 8, fontSize: 14 }}>Aucun mode configuré.</p>
          <p style={{ fontSize: 12, color: '#333' }}>Ajoutez au moins un mode pour que les clients puissent commander.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {config.modes.map((mode, i) => (
            <ModeRow
              key={mode.id}
              mode={mode}
              index={i}
              total={config.modes.length}
              onChange={updated => updateMode(mode.id, updated)}
              onDelete={() => deleteMode(mode.id)}
              onMove={dir => moveMode(i, dir)}
            />
          ))}
        </div>
      )}

      <p style={{ color: '#444', fontSize: 12, marginTop: 16 }}>
        💡 Mettez 0 FCFA pour un mode gratuit (ex: retrait en boutique). L&apos;ordre d&apos;affichage correspond à l&apos;ordre ici.
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          style={{
            background: saving ? 'rgba(197,165,90,0.4)' : GOLD,
            color: '#0D0D0D', border: 'none', borderRadius: 8,
            padding: '12px 32px', fontSize: 14, fontWeight: 600,
            letterSpacing: '0.06em', cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
