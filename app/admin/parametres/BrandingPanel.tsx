'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BRANDING_PRESETS,
  FONT_PAIR_IDS,
  FONT_PAIR_LABELS,
  type BrandingConfig,
  type BrandingPreset,
} from '@/lib/branding';
import { logger } from '@/lib/logger';

const GOLD = '#C5A55A';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapDbToConfig(raw: Record<string, string>): Partial<BrandingConfig> {
  const candidate = {
    colorAccent:      raw.brand_color_accent,
    colorAccentLight: raw.brand_color_accent_light,
    colorAccentDark:  raw.brand_color_accent_dark,
    colorAccentMuted: raw.brand_color_accent_muted,
    fontSerifFamily:  raw.brand_font_serif_family,
    fontSansFamily:   raw.brand_font_sans_family,
    fontSerifImport:  raw.brand_font_serif_import,
    fontSansImport:   raw.brand_font_sans_import,
    preset:           raw.brand_preset,
  };
  // Strip undefined entries so they don't overwrite valid defaults in state
  return Object.fromEntries(
    Object.entries(candidate).filter(([, v]) => v !== undefined)
  ) as Partial<BrandingConfig>;
}

function fontPairIdFromPreset(preset: BrandingPreset): string {
  const match = /'([^']+)'/.exec(preset.fontSerifFamily);
  const serifName = match?.[1] ?? '';
  for (const id of FONT_PAIR_IDS) {
    if (FONT_PAIR_LABELS[id].includes(serifName)) return id;
  }
  return 'cormorant_inter';
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function BrandingPanel() {
  const [current, setCurrent] = useState<BrandingConfig>(BRANDING_PRESETS[0]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // ── Chargement initial ───────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/branding')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const mapped = mapDbToConfig(data.settings);
          setCurrent((prev) => ({ ...prev, ...mapped }));
        }
      })
      .catch((e) => logger.error('admin', 'Request failed', e))
      .finally(() => setLoading(false));
  }, []);

  // ── Sélection d'un préréglage ─────────────────────────────────────────────
  const applyPreset = useCallback((preset: BrandingPreset) => {
    setCurrent({
      colorAccent:      preset.colorAccent,
      colorAccentLight: preset.colorAccentLight,
      colorAccentDark:  preset.colorAccentDark,
      colorAccentMuted: preset.colorAccentMuted,
      fontSerifFamily:  preset.fontSerifFamily,
      fontSansFamily:   preset.fontSansFamily,
      fontSerifImport:  preset.fontSerifImport,
      fontSansImport:   preset.fontSansImport,
      preset:           preset.id,
    });
  }, []);

  // ── Sélection d'une paire de polices ──────────────────────────────────────
  const applyFontPair = useCallback((pairId: string) => {
    const preset = BRANDING_PRESETS.find((p) => fontPairIdFromPreset(p) === pairId);
    if (!preset) return;
    setCurrent((prev) => ({
      ...prev,
      fontSerifFamily: preset.fontSerifFamily,
      fontSansFamily:  preset.fontSansFamily,
      fontSerifImport: preset.fontSerifImport,
      fontSansImport:  preset.fontSansImport,
    }));
  }, []);

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(current),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: '#888', textAlign: 'center' }}>
        Chargement du branding…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Section : Préréglages ─────────────────────────────────────────── */}
      <div>
        <p style={{
          fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
          color: GOLD, marginBottom: '1rem',
        }}>
          Préréglages
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '0.75rem',
        }}>
          {BRANDING_PRESETS.map((preset) => {
            const isActive = current.preset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                style={{
                  background: preset.previewBg,
                  border: isActive
                    ? `2px solid ${preset.previewAccent}`
                    : '2px solid transparent',
                  borderRadius: '10px',
                  padding: '1rem 0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.2s, transform 0.15s',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  outline: 'none',
                }}
                title={preset.description}
              >
                {/* Swatch couleur */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${preset.previewAccent}, ${preset.previewBg})`,
                  border: `2px solid ${preset.previewAccent}`,
                  marginBottom: '0.6rem',
                }} />
                {/* Nom */}
                <span style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: preset.previewAccent,
                  lineHeight: 1.2,
                }}>
                  {preset.name}
                </span>
                <span style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  color: '#666',
                  marginTop: '0.2rem',
                  lineHeight: 1.3,
                }}>
                  {preset.description}
                </span>
                {isActive && (
                  <span style={{
                    display: 'inline-block',
                    marginTop: '0.5rem',
                    fontSize: '0.6rem',
                    color: preset.previewAccent,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    ✓ Actif
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section : Couleurs personnalisées ─────────────────────────────── */}
      <div>
        <p style={{
          fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
          color: GOLD, marginBottom: '1rem',
        }}>
          Couleurs personnalisées
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(
            [
              { key: 'colorAccent',      label: 'Accent principal',     hint: '--gold' },
              { key: 'colorAccentLight', label: 'Accent clair',          hint: '--gold-light' },
              { key: 'colorAccentDark',  label: 'Accent foncé',          hint: '--gold-dark' },
            ] as const
          ).map(({ key, label, hint }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ flex: 1, color: '#aaa', fontSize: '0.82rem' }}>
                {label}
                <span style={{ color: '#555', marginLeft: '0.5rem', fontSize: '0.72rem' }}>
                  {hint}
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="color"
                  value={(current[key] ?? '').startsWith('#') ? (current[key] ?? '').substring(0, 7) : '#C5A55A'}
                  onChange={(e) => {
                    const hex = e.target.value;
                    setCurrent((prev) => ({ ...prev, [key]: hex, preset: 'custom' }));
                  }}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '2px solid #333', cursor: 'pointer',
                    background: 'none', padding: 0,
                  }}
                />
                <input
                  type="text"
                  value={current[key]}
                  onChange={(e) => {
                    setCurrent((prev) => ({ ...prev, [key]: e.target.value, preset: 'custom' }));
                  }}
                  style={{
                    width: 110, padding: '0.35rem 0.6rem',
                    background: '#1a1a1a', border: '1px solid #333',
                    borderRadius: 6, color: '#fff', fontSize: '0.82rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section : Typographie ─────────────────────────────────────────── */}
      <div>
        <p style={{
          fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
          color: GOLD, marginBottom: '1rem',
        }}>
          Typographie
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label
            htmlFor="font-pair-select"
            style={{ color: '#aaa', fontSize: '0.82rem', marginBottom: '0.3rem' }}
          >
            Paire de polices
          </label>
          <select
            id="font-pair-select"
            value={
              FONT_PAIR_IDS.find((id) =>
                current.fontSerifFamily.includes(
                  FONT_PAIR_LABELS[id].split(' + ')[0].replaceAll("'", '')
                )
              ) ?? 'cormorant_inter'
            }
            onChange={(e) => applyFontPair(e.target.value)}
            style={{
              padding: '0.5rem 0.8rem',
              background: '#1a1a1a',
              border: `1px solid ${GOLD}44`,
              borderRadius: 8,
              color: '#fff',
              fontSize: '0.85rem',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23C5A55A' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.8rem center',
              paddingRight: '2rem',
            }}
          >
            {FONT_PAIR_IDS.map((id) => (
              <option key={id} value={id}>
                {FONT_PAIR_LABELS[id]}
              </option>
            ))}
          </select>

          {/* Aperçu typographie */}
          <div style={{
            marginTop: '0.75rem',
            padding: '1rem 1.25rem',
            background: '#111',
            border: '1px solid #222',
            borderRadius: 8,
          }}>
            <p style={{
              fontFamily: current.fontSerifFamily,
              fontSize: '1.4rem',
              color: current.colorAccent,
              margin: 0,
              lineHeight: 1.2,
            }}>
              L&apos;Art du Parfum
            </p>
            <p style={{
              fontFamily: current.fontSansFamily,
              fontSize: '0.85rem',
              color: '#999',
              margin: '0.4rem 0 0',
            }}>
              Découvrez notre collection de fragrances d&apos;exception.
            </p>
          </div>
        </div>
      </div>

      {/* ── Aperçu live ──────────────────────────────────────────────────── */}
      <div>
        <p style={{
          fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
          color: GOLD, marginBottom: '1rem',
        }}>
          Aperçu couleurs
        </p>
        <div style={{
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
        }}>
          {[
            { label: 'Accent', color: current.colorAccent },
            { label: 'Clair', color: current.colorAccentLight },
            { label: 'Foncé', color: current.colorAccentDark },
          ].map(({ label, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: color, border: '2px solid #333',
                margin: '0 auto 0.3rem',
              }} />
              <span style={{ fontSize: '0.65rem', color: '#666' }}>{label}</span>
            </div>
          ))}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: current.colorAccentMuted,
              border: `2px solid ${current.colorAccent}44`,
              margin: '0 auto 0.3rem',
            }} />
            <span style={{ fontSize: '0.65rem', color: '#666' }}>Atténué</span>
          </div>
        </div>
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      {error && (
        <p style={{
          color: '#f87171', fontSize: '0.82rem',
          padding: '0.5rem 0.75rem',
          background: '#2a1010',
          borderRadius: 6, border: '1px solid #f8717144',
        }}>
          {error}
        </p>
      )}

      {(() => {
        let btnLabel: string;
        if (saving) btnLabel = 'Sauvegarde…';
        else if (saved) btnLabel = '✓ Branding enregistré';
        else btnLabel = 'Enregistrer le branding';
        return (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              alignSelf: 'flex-start',
              padding: '0.65rem 1.8rem',
              background: saved ? '#1a3a1a' : `${GOLD}22`,
              border: `1px solid ${saved ? '#4ade80' : GOLD}`,
              borderRadius: 8,
              color: saved ? '#4ade80' : GOLD,
              fontSize: '0.85rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {btnLabel}
          </button>
        );
      })()}
    </div>
  );
}
