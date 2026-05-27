'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_STATS,
  DEFAULT_VALEURS,
  DEFAULT_ENGAGEMENTS,
  type AboutStat,
  type AboutValeur,
  type AboutEngagement,
} from '@/lib/supabase/about-content';
import { logger } from '@/lib/logger';

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
  readonly label: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly multiline?: boolean;
  readonly hint?: string;
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

/* ── Merge helpers ───────────────────────────────────────────────────────────── */

function mergeBySlug<T extends { slug: string }>(defaults: T[], dbRows: T[]): T[] {
  return defaults.map((def) => {
    const db = dbRows.find((r) => r.slug === def.slug);
    return db ? { ...def, ...db } : def;
  });
}

/* ── Section header ─────────────────────────────────────────────────────────── */

function SectionTitle({ children }: { readonly children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 16, fontWeight: 700, color: GOLD, marginBottom: 20, marginTop: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 4, height: 18, background: GOLD, borderRadius: 2, display: 'inline-block' }} />
      {children}
    </h2>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────────── */

export default function AdminAProposPage() {
  const [stats, setStats] = useState<AboutStat[]>(DEFAULT_STATS);
  const [valeurs, setValeurs] = useState<AboutValeur[]>(DEFAULT_VALEURS);
  const [engagements, setEngagements] = useState<AboutEngagement[]>(DEFAULT_ENGAGEMENTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/about')
      .then((r) => r.json())
      .then((d) => {
        setStats(mergeBySlug(DEFAULT_STATS, d.stats ?? []));
        setValeurs(mergeBySlug(DEFAULT_VALEURS, d.valeurs ?? []));
        setEngagements(mergeBySlug(DEFAULT_ENGAGEMENTS, d.engagements ?? []));
      })
      .catch((e) => logger.error('admin', 'Request failed', e))
      .finally(() => setLoading(false));
  }, []);

  function updateStat<K extends keyof AboutStat>(slug: string, field: K, value: AboutStat[K]) {
    setStats((prev) => prev.map((r) => (r.slug === slug ? { ...r, [field]: value } : r)));
  }

  function updateValeur<K extends keyof AboutValeur>(slug: string, field: K, value: AboutValeur[K]) {
    setValeurs((prev) => prev.map((r) => (r.slug === slug ? { ...r, [field]: value } : r)));
  }

  function updateEngagement<K extends keyof AboutEngagement>(slug: string, field: K, value: AboutEngagement[K]) {
    setEngagements((prev) => prev.map((r) => (r.slug === slug ? { ...r, [field]: value } : r)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch('/api/admin/about', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'stats', rows: stats }) }),
        fetch('/api/admin/about', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'valeurs', rows: valeurs }) }),
        fetch('/api/admin/about', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'engagements', rows: engagements }) }),
      ]);
      const ok = r1.ok && r2.ok && r3.ok;
      setToast({ ok, msg: ok ? 'Page À propos sauvegardée ✓' : 'Erreur lors de la sauvegarde' });
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
    marginBottom: 24,
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>
            Page À propos
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Gérez les stats, valeurs et engagements affichés sur la page À propos
          </p>
        </div>
        {(() => {
          const isDisabled = saving || loading;
          let label: string;
          if (saving) label = 'Enregistrement…';
          else if (loading) label = 'Chargement…';
          else label = 'Enregistrer tout';
          return (
            <button
              onClick={handleSave}
              disabled={isDisabled}
              style={{
                background: isDisabled ? 'rgba(197,165,90,0.3)' : GOLD,
                color: '#1a1008',
                border: 'none',
                borderRadius: 8,
                padding: '11px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'background .2s',
              }}
            >
              {label}
            </button>
          );
        })()}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ padding: '12px 18px', borderRadius: 8, marginBottom: 24, fontSize: 13, fontWeight: 600, background: toast.ok ? 'rgba(72,199,142,0.15)' : 'rgba(255,100,100,0.15)', border: `1px solid ${toast.ok ? 'rgba(72,199,142,0.4)' : 'rgba(255,100,100,0.4)'}`, color: toast.ok ? '#48c78e' : '#ff6b6b' }}>
          {toast.msg}
        </div>
      )}

      {loading && (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          Chargement des données…
        </p>
      )}

      {/* ── Section 1 : Statistiques ── */}
      <div style={card}>
        <SectionTitle>Chiffres clés (bandeau stats)</SectionTitle>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
          4 statistiques affichées sur fond doré sous la section histoire.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {stats.map((stat) => (
            <div key={stat.slug} style={{ padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(197,165,90,0.1)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{stat.slug}</p>
              <Field label="Valeur (ex: 150+)" value={stat.value} onChange={(v) => updateStat(stat.slug, 'value', v)} />
              <Field label="Libellé" value={stat.label} onChange={(v) => updateStat(stat.slug, 'label', v)} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2 : Valeurs ── */}
      <div style={card}>
        <SectionTitle>Nos valeurs</SectionTitle>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
          3 valeurs affichées avec numérotation 01 / 02 / 03.
        </p>
        {valeurs.map((v) => (
          <div key={v.slug} style={{ marginBottom: 20, padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(197,165,90,0.1)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              {v.slug} — Numéro : {v.num}
            </p>
            <Field label="Titre" value={v.titre} onChange={(val) => updateValeur(v.slug, 'titre', val)} />
            <Field label="Texte de description" value={v.texte} onChange={(val) => updateValeur(v.slug, 'texte', val)} multiline />
          </div>
        ))}
      </div>

      {/* ── Section 3 : Engagements ── */}
      <div style={card}>
        <SectionTitle>Nos engagements</SectionTitle>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
          6 engagements affichés avec icônes dans la grille.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {engagements.map((e) => (
            <div key={e.slug} style={{ padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(197,165,90,0.1)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{e.slug}</p>
              <Field label="Titre" value={e.titre} onChange={(v) => updateEngagement(e.slug, 'titre', v)} />
              <Field label="Description" value={e.texte} onChange={(v) => updateEngagement(e.slug, 'texte', v)} multiline />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
