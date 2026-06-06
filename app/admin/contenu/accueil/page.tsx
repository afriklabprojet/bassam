'use client';

import { useEffect, useState } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import {
  DEFAULT_UNIVERS,
  type UniversContent,
} from '@/lib/supabase/home-content';
import {
  DEFAULT_HOME_HERO,
  type HeroCollectionLink,
  type HeroProductVisual,
  type HeroStat,
  type HomeHeroContent,
} from '@/lib/supabase/home-hero';
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
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
}

function Field({ id, label, value, onChange, multiline, hint }: Readonly<FieldProps>) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 12, color: GOLD, marginBottom: 6, fontWeight: 600, letterSpacing: '.04em' }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{hint}</p>}
      {multiline ? (
        <textarea
          id={id}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle()}
        />
      ) : (
        <input
          id={id}
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

const HERO_VISUAL_LABELS = ['Visuel principal', 'Visuel gauche', 'Visuel droite'];

function linesToList(rawText: string) {
  return rawText.split('\n').map((line) => line.trim()).filter(Boolean);
}

function statsToText(stats: HeroStat[]) {
  return stats.map((stat) => `${stat.value} | ${stat.label}`).join('\n');
}

function textToStats(rawText: string): HeroStat[] {
  return linesToList(rawText).map((line) => {
    const [value = '', label = ''] = line.split('|').map((part) => part.trim());
    return { value, label };
  }).filter((stat) => stat.value && stat.label);
}

function collectionLinksToText(links: HeroCollectionLink[]) {
  return links.map((link) => `${link.name} | ${link.href} | ${link.count} | ${link.tone}`).join('\n');
}

function textToCollectionLinks(rawText: string): HeroCollectionLink[] {
  return linesToList(rawText).map((line) => {
    const [name = '', href = '', count = '', tone = '#C5A55A'] = line.split('|').map((part) => part.trim());
    return { name, href, count, tone };
  }).filter((link) => link.name && link.href && link.count).slice(0, 6);
}

async function fetchAdminJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Erreur API ${response.status}`);
  }
  return data as T;
}

/* ── Main page ───────────────────────────────────────────────────────────────── */

export default function AdminAccueilPage() {
  const [hero, setHero] = useState<HomeHeroContent>(DEFAULT_HOME_HERO);
  const [trustItemsText, setTrustItemsText] = useState(DEFAULT_HOME_HERO.trustItems.join('\n'));
  const [statsText, setStatsText] = useState(statsToText(DEFAULT_HOME_HERO.stats));
  const [collectionLinksText, setCollectionLinksText] = useState(collectionLinksToText(DEFAULT_HOME_HERO.collectionLinks));
  const [brandTickerText, setBrandTickerText] = useState(DEFAULT_HOME_HERO.brandTicker.join('\n'));
  const [univers, setUnivers] = useState<UniversContent[]>(DEFAULT_UNIVERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAdminJson<{ hero?: HomeHeroContent }>('/api/admin/home-hero'),
      fetchAdminJson<{ univers?: UniversContent[] }>('/api/admin/home'),
    ])
      .then(([heroData, homeData]) => {
        const nextHero = heroData.hero ?? DEFAULT_HOME_HERO;
        setHero(nextHero);
        setTrustItemsText(nextHero.trustItems.join('\n'));
        setStatsText(statsToText(nextHero.stats));
        setCollectionLinksText(collectionLinksToText(nextHero.collectionLinks));
        setBrandTickerText(nextHero.brandTicker.join('\n'));
        setUnivers(mergeUnivers(DEFAULT_UNIVERS, homeData.univers ?? []));
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : 'Erreur chargement'))
      .finally(() => setLoading(false));
  }, []);

  function updateHero<K extends keyof HomeHeroContent>(field: K, value: HomeHeroContent[K]) {
    setHero((prev) => ({ ...prev, [field]: value }));
  }

  function updateProductVisual(index: number, patch: Partial<HeroProductVisual>) {
    setHero((prev) => {
      const visuals = [...prev.productVisuals];
      const current = visuals[index] ?? DEFAULT_HOME_HERO.productVisuals[index] ?? { src: '', alt: '' };
      visuals[index] = { ...current, ...patch };
      return { ...prev, productVisuals: visuals.slice(0, 3) };
    });
  }

  function updateUnivers<K extends keyof UniversContent>(slug: string, field: K, value: UniversContent[K]) {
    setUnivers((prev) => prev.map((u) => (u.slug === slug ? { ...u, [field]: value } : u)));
  }

  function updateNotes(slug: string, rawText: string) {
    const notes = linesToList(rawText);
    updateUnivers(slug, 'notes', notes);
  }

  async function handleSave() {
    if (loadError) {
      setToast({ ok: false, msg: `Chargement incomplet : ${loadError}` });
      return;
    }

    const heroPayload: HomeHeroContent = {
      ...hero,
      productVisuals: hero.productVisuals
        .filter((visual) => visual.src.trim() && visual.alt.trim())
        .slice(0, 3),
    };

    setSaving(true);
    try {
      const [heroRes, universRes] = await Promise.all([
        fetch('/api/admin/home-hero', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(heroPayload),
        }),
        fetch('/api/admin/home', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: univers }),
        }),
      ]);
      const ok = heroRes.ok && universRes.ok;
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

  let saveButtonLabel = 'Enregistrer';
  if (saving) saveButtonLabel = 'Enregistrement…';
  if (loading) saveButtonLabel = 'Chargement…';

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>
            Page Accueil — Hero & Univers
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Modifiez le hero principal, les taglines, descriptions et notes olfactives.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading || Boolean(loadError)}
          style={{
            background: saving || loading || loadError ? 'rgba(197,165,90,0.3)' : GOLD,
            color: '#1a1008',
            border: 'none',
            borderRadius: 8,
            padding: '11px 24px',
            fontSize: 14,
            fontWeight: 700,
            cursor: saving || loading || loadError ? 'not-allowed' : 'pointer',
            transition: 'background .2s',
          }}
        >
          {saveButtonLabel}
        </button>
      </div>

      {loadError && (
        <div style={{ padding: '12px 18px', borderRadius: 8, marginBottom: 24, fontSize: 13, fontWeight: 600, background: 'rgba(255,100,100,0.15)', border: '1px solid rgba(255,100,100,0.4)', color: '#ff6b6b' }}>
          Impossible de charger le contenu actuel : {loadError}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ padding: '12px 18px', borderRadius: 8, marginBottom: 24, fontSize: 13, fontWeight: 600, background: toast.ok ? 'rgba(72,199,142,0.15)' : 'rgba(255,100,100,0.15)', border: `1px solid ${toast.ok ? 'rgba(72,199,142,0.4)' : 'rgba(255,100,100,0.4)'}`, color: toast.ok ? '#48c78e' : '#ff6b6b' }}>
          {toast.msg}
        </div>
      )}

      <div style={card}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: GOLD, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 4, height: 18, background: GOLD, borderRadius: 2, display: 'inline-block' }} />
          {' '}
          Hero principal
        </h2>

        <Field
          id="hero-eyebrow"
          label="Eyebrow"
          value={hero.eyebrow}
          onChange={(value) => updateHero('eyebrow', value)}
          hint="Petit texte au-dessus du titre."
        />
        <Field
          id="hero-title"
          label="Titre — ligne 1"
          value={hero.title}
          onChange={(value) => updateHero('title', value)}
        />
        <Field
          id="hero-title-accent"
          label="Titre — ligne accentuée"
          value={hero.titleAccent}
          onChange={(value) => updateHero('titleAccent', value)}
        />
        <Field
          id="hero-description"
          label="Description"
          value={hero.description}
          onChange={(value) => updateHero('description', value)}
          multiline
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <Field
            id="hero-primary-cta-label"
            label="CTA principal — texte"
            value={hero.primaryCtaLabel}
            onChange={(value) => updateHero('primaryCtaLabel', value)}
          />
          <Field
            id="hero-primary-cta-href"
            label="CTA principal — lien"
            value={hero.primaryCtaHref}
            onChange={(value) => updateHero('primaryCtaHref', value)}
            hint="Ex : /#top-ventes"
          />
          <Field
            id="hero-secondary-cta-label"
            label="CTA secondaire — texte"
            value={hero.secondaryCtaLabel}
            onChange={(value) => updateHero('secondaryCtaLabel', value)}
          />
          <Field
            id="hero-secondary-cta-href"
            label="CTA secondaire — lien"
            value={hero.secondaryCtaHref}
            onChange={(value) => updateHero('secondaryCtaHref', value)}
            hint="Ex : /services/quiz-olfactif"
          />
        </div>

        <Field
          id="hero-trust-items"
          label="Garanties"
          value={trustItemsText}
          onChange={(value) => {
            setTrustItemsText(value);
            updateHero('trustItems', linesToList(value));
          }}
          multiline
          hint="Une garantie par ligne. Maximum conseillé : 4."
        />

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="hero-stats" style={{ display: 'block', fontSize: 12, color: GOLD, marginBottom: 6, fontWeight: 600, letterSpacing: '.04em' }}>
            Stats
          </label>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
            Une stat par ligne — format : valeur | label
          </p>
          <textarea
            id="hero-stats"
            rows={4}
            value={statsText}
            onChange={(e) => {
              setStatsText(e.target.value);
              updateHero('stats', textToStats(e.target.value));
            }}
            style={inputStyle()}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <Field
            id="hero-showcase-eyebrow"
            label="Showcase — eyebrow"
            value={hero.showcaseEyebrow}
            onChange={(value) => updateHero('showcaseEyebrow', value)}
          />
          <Field
            id="hero-showcase-title"
            label="Showcase — titre"
            value={hero.showcaseTitle}
            onChange={(value) => updateHero('showcaseTitle', value)}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'block', fontSize: 12, color: GOLD, marginBottom: 6, fontWeight: 600, letterSpacing: '.04em' }}>
            Visuels produits
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
            Glissez-déposez ou uploadez les images. Aucun lien URL à saisir.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {HERO_VISUAL_LABELS.map((label, index) => {
              const visual = hero.productVisuals[index] ?? DEFAULT_HOME_HERO.productVisuals[index] ?? { src: '', alt: '' };
              return (
                <div key={label} style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <ImageUploadField
                    key={`${index}-${visual.src}`}
                    label={label}
                    value={visual.src}
                    onChange={(value) => updateProductVisual(index, { src: value.split('\n')[0] ?? '' })}
                    maxImages={1}
                    disabled={loading || saving}
                  />
                  <Field
                    id={`hero-product-visual-${index}-alt`}
                    label="Texte alternatif"
                    value={visual.alt}
                    onChange={(value) => updateProductVisual(index, { alt: value })}
                    hint="Décrit l'image pour l'accessibilité et le SEO."
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="hero-collection-links" style={{ display: 'block', fontSize: 12, color: GOLD, marginBottom: 6, fontWeight: 600, letterSpacing: '.04em' }}>
            Liens collections rapides
          </label>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
            Une ligne par lien — format : nom | lien | sous-texte | couleur
          </p>
          <textarea
            id="hero-collection-links"
            rows={5}
            value={collectionLinksText}
            onChange={(e) => {
              setCollectionLinksText(e.target.value);
              updateHero('collectionLinks', textToCollectionLinks(e.target.value));
            }}
            style={inputStyle()}
          />
        </div>

        <Field
          id="hero-brand-ticker"
          label="Ticker marques"
          value={brandTickerText}
          onChange={(value) => {
            setBrandTickerText(value);
            updateHero('brandTicker', linesToList(value));
          }}
          multiline
          hint="Une marque par ligne."
        />
        <Field
          id="hero-scroll-label"
          label="Bouton scroll"
          value={hero.scrollLabel}
          onChange={(value) => updateHero('scrollLabel', value)}
        />
      </div>

      {/* Info banner */}
      <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 28, fontSize: 12, background: 'rgba(197,165,90,0.08)', border: '1px solid rgba(197,165,90,0.2)', color: 'rgba(197,165,90,0.8)' }}>
        💡 Le hero principal est modifiable ci-dessus. Pour les univers, les couleurs de fond et les noms (Femme / Homme / Mixte) restent fixes ; seuls les taglines, descriptions et notes olfactives changent ici.
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
            {' '}
            {UNIVERS_LABELS[u.slug] ?? u.slug}
          </h2>

          <Field
            id={`univers-${u.slug}-tagline`}
            label="Tagline (accroche courte)"
            value={u.tagline}
            onChange={(v) => updateUnivers(u.slug, 'tagline', v)}
          />
          <Field
            id={`univers-${u.slug}-description`}
            label="Description"
            value={u.description}
            onChange={(v) => updateUnivers(u.slug, 'description', v)}
            multiline
          />
          <div style={{ marginBottom: 0 }}>
            <label htmlFor={`univers-${u.slug}-notes`} style={{ display: 'block', fontSize: 12, color: GOLD, marginBottom: 6, fontWeight: 600, letterSpacing: '.04em' }}>
              Notes olfactives
            </label>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              Une note par ligne — ex&nbsp;: Jasmin / Rose / Vanille / Oud
            </p>
            <textarea
              id={`univers-${u.slug}-notes`}
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
