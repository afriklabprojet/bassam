'use client';

import { useEffect, useState } from 'react';
import { TOAST_DURATION_MS } from '@/lib/constants';
import {
  DEFAULT_STATS,
  DEFAULT_VALEURS,
  DEFAULT_ENGAGEMENTS,
  DEFAULT_HERO,
  DEFAULT_STORY,
  DEFAULT_PAGE_CONTENT,
  type AboutStat,
  type AboutValeur,
  type AboutEngagement,
  type AboutHero,
  type AboutStory,
  type AboutPageContent,
} from '@/lib/supabase/about-content';
import { logger } from '@/lib/logger';
import { GOLD } from '@/lib/admin-theme';

/* ── Styles & helpers ───────────────────────────────────────────────────────── */

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
  const [hero, setHero] = useState<AboutHero>(DEFAULT_HERO);
  const [story, setStory] = useState<AboutStory>(DEFAULT_STORY);
  const [pageContent, setPageContent] = useState<AboutPageContent>(DEFAULT_PAGE_CONTENT);
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
        setHero({ ...DEFAULT_HERO, ...(d.hero ?? {}) });
        setStory({ ...DEFAULT_STORY, ...(d.story ?? {}) });
        setPageContent({
          ...DEFAULT_PAGE_CONTENT,
          ...(d.page ?? {}),
          brands: Array.isArray(d.page?.brands) ? d.page.brands : DEFAULT_PAGE_CONTENT.brands,
        });
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

  function updatePageContent<K extends keyof AboutPageContent>(field: K, value: AboutPageContent[K]) {
    setPageContent((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const responses = await Promise.all([
        fetch('/api/admin/about', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'hero', data: hero }) }),
        fetch('/api/admin/about', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'story', data: story }) }),
        fetch('/api/admin/about', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'page', data: pageContent }) }),
        fetch('/api/admin/about', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'stats', rows: stats }) }),
        fetch('/api/admin/about', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'valeurs', rows: valeurs }) }),
        fetch('/api/admin/about', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'engagements', rows: engagements }) }),
      ]);
      const ok = responses.every((response) => response.ok);
      setToast({ ok, msg: ok ? 'Page À propos sauvegardée ✓' : 'Erreur lors de la sauvegarde' });
    } catch {
      setToast({ ok: false, msg: 'Erreur réseau' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), TOAST_DURATION_MS);
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
            Gérez tous les textes, liens, marques, statistiques, valeurs et engagements de la page.
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
                color: 'var(--noir)',
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
        <div style={{ padding: '12px 18px', borderRadius: 8, marginBottom: 24, fontSize: 13, fontWeight: 600, background: toast.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, color: toast.ok ? 'var(--success)' : 'var(--danger)' }}>
          {toast.msg}
        </div>
      )}

      {loading && (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          Chargement des données…
        </p>
      )}

      <div style={card}>
        <SectionTitle>Référencement</SectionTitle>
        <Field label="Titre SEO" value={pageContent.meta_title} onChange={(value) => updatePageContent('meta_title', value)} />
        <Field label="Description SEO" value={pageContent.meta_description} onChange={(value) => updatePageContent('meta_description', value)} multiline />
        <Field label="Mots-clés SEO" value={pageContent.meta_keywords} onChange={(value) => updatePageContent('meta_keywords', value)} multiline />
      </div>

      <div style={card}>
        <SectionTitle>Hero de la page</SectionTitle>
        <Field label="Sur-titre" value={hero.eyebrow} onChange={(value) => setHero((prev) => ({ ...prev, eyebrow: value }))} />
        <Field label="Titre principal" value={hero.title_line1} onChange={(value) => setHero((prev) => ({ ...prev, title_line1: value }))} />
        <Field label="Titre accentué" value={hero.title_em} onChange={(value) => setHero((prev) => ({ ...prev, title_em: value }))} />
        <Field label="Introduction" value={hero.subtitle} onChange={(value) => setHero((prev) => ({ ...prev, subtitle: value }))} multiline />
      </div>

      <div style={card}>
        <SectionTitle>Histoire & fondateur</SectionTitle>
        <Field label="Sur-titre" value={story.section_eyebrow} onChange={(value) => setStory((prev) => ({ ...prev, section_eyebrow: value }))} />
        <Field label="Titre principal" value={story.title_line1} onChange={(value) => setStory((prev) => ({ ...prev, title_line1: value }))} />
        <Field label="Titre accentué" value={story.title_em} onChange={(value) => setStory((prev) => ({ ...prev, title_em: value }))} />
        <Field label="Premier paragraphe" value={story.paragraph1} onChange={(value) => setStory((prev) => ({ ...prev, paragraph1: value }))} multiline />
        <Field label="Deuxième paragraphe" value={story.paragraph2} onChange={(value) => setStory((prev) => ({ ...prev, paragraph2: value }))} multiline />
        <Field label="Troisième paragraphe" value={story.paragraph3} onChange={(value) => setStory((prev) => ({ ...prev, paragraph3: value }))} multiline />
        <Field label="Citation" value={story.quote_text} onChange={(value) => setStory((prev) => ({ ...prev, quote_text: value }))} multiline />
        <Field label="Auteur de la citation" value={story.quote_author} onChange={(value) => setStory((prev) => ({ ...prev, quote_author: value }))} />
      </div>

      <div style={card}>
        <SectionTitle>Titres des valeurs & marques</SectionTitle>
        <Field label="Sur-titre des valeurs" value={pageContent.values_eyebrow} onChange={(value) => updatePageContent('values_eyebrow', value)} />
        <Field label="Titre des valeurs" value={pageContent.values_title} onChange={(value) => updatePageContent('values_title', value)} />
        <Field label="Titre accentué des valeurs" value={pageContent.values_title_em} onChange={(value) => updatePageContent('values_title_em', value)} />
        <Field label="Titre des marques" value={pageContent.brands_eyebrow} onChange={(value) => updatePageContent('brands_eyebrow', value)} />
        <Field
          label="Marques distribuées"
          hint="Une marque par ligne."
          value={pageContent.brands.join('\n')}
          onChange={(value) => updatePageContent('brands', value.split('\n').map((brand) => brand.trim()).filter(Boolean))}
          multiline
        />
      </div>

      <div style={card}>
        <SectionTitle>Introduction des engagements</SectionTitle>
        <Field label="Sur-titre" value={pageContent.engagements_eyebrow} onChange={(value) => updatePageContent('engagements_eyebrow', value)} />
        <Field label="Titre principal" value={pageContent.engagements_title} onChange={(value) => updatePageContent('engagements_title', value)} />
        <Field label="Titre accentué" value={pageContent.engagements_title_em} onChange={(value) => updatePageContent('engagements_title_em', value)} />
        <Field label="Description" value={pageContent.engagements_description} onChange={(value) => updatePageContent('engagements_description', value)} multiline />
        <Field label="Libellé du lien" value={pageContent.engagements_cta_label} onChange={(value) => updatePageContent('engagements_cta_label', value)} />
        <Field label="Destination du lien" value={pageContent.engagements_cta_href} onChange={(value) => updatePageContent('engagements_cta_href', value)} hint="Chemin interne commençant par / ou URL HTTPS." />
      </div>

      <div style={card}>
        <SectionTitle>Appel à l’action final</SectionTitle>
        <Field label="Sur-titre" value={pageContent.cta_eyebrow} onChange={(value) => updatePageContent('cta_eyebrow', value)} />
        <Field label="Titre principal" value={pageContent.cta_title} onChange={(value) => updatePageContent('cta_title', value)} />
        <Field label="Titre accentué" value={pageContent.cta_title_em} onChange={(value) => updatePageContent('cta_title_em', value)} />
        <Field label="Description" value={pageContent.cta_description} onChange={(value) => updatePageContent('cta_description', value)} multiline />
        <Field label="Bouton principal" value={pageContent.cta_primary_label} onChange={(value) => updatePageContent('cta_primary_label', value)} />
        <Field label="Lien du bouton principal" value={pageContent.cta_primary_href} onChange={(value) => updatePageContent('cta_primary_href', value)} />
        <Field label="Bouton secondaire" value={pageContent.cta_secondary_label} onChange={(value) => updatePageContent('cta_secondary_label', value)} />
        <Field label="Lien du bouton secondaire" value={pageContent.cta_secondary_href} onChange={(value) => updatePageContent('cta_secondary_href', value)} />
      </div>

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
              {v.slug}
            </p>
            <Field label="Numéro" value={v.num} onChange={(val) => updateValeur(v.slug, 'num', val)} />
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
