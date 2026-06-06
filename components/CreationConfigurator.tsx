'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import {
  CUSTOM_CREATION_BOTTLES,
  CUSTOM_CREATION_FAMILIES,
  CUSTOM_CREATION_FORMULAS,
  CUSTOM_CREATION_NOTES,
  type CreationFormulaId,
  type CustomCreationSnapshot,
} from '@/lib/custom-creation';
import { formatPrice } from '@/lib/format';

const DRAFT_KEY = 'vip-parfumerie-custom-creation-draft';
const PLACEHOLDER_IMAGE = '/images/products/product-placeholder.svg';

type Draft = {
  formulaId: CreationFormulaId;
  familyId: string;
  intensity: string;
  audience: string;
  selectedNotes: string[];
  bottleId: string;
  perfumeName: string;
  engraving: string;
  inspiration: string;
};

type CreationConfiguratorConfig = {
  formulas: typeof CUSTOM_CREATION_FORMULAS;
  families: typeof CUSTOM_CREATION_FAMILIES;
  notes: typeof CUSTOM_CREATION_NOTES;
  bottles: typeof CUSTOM_CREATION_BOTTLES;
  intensities: string[];
  audiences: string[];
};

const defaultDraft: Draft = {
  formulaId: 'signature',
  familyId: 'oriental',
  intensity: 'Intense',
  audience: 'Pour moi',
  selectedNotes: ['Ambre', 'Vanille', 'Musc blanc'],
  bottleId: 'noir-or',
  perfumeName: '',
  engraving: '',
  inspiration: '',
};

function getDraftSnapshot(draft: Draft, cfg: CreationConfiguratorConfig): CustomCreationSnapshot {
  const formula = cfg.formulas.find((f) => f.id === draft.formulaId) ?? cfg.formulas[1] ?? cfg.formulas[0];
  const family = cfg.families.find((item) => item.id === draft.familyId) ?? cfg.families[0];
  const bottle = cfg.bottles.find((item) => item.id === draft.bottleId) ?? cfg.bottles[0];

  return {
    formulaId: formula.id,
    formulaName: formula.name,
    volume: formula.volume,
    family: family.name,
    intensity: draft.intensity,
    audience: draft.audience,
    notes: draft.selectedNotes,
    bottle: bottle.name,
    engraving: draft.engraving.trim(),
    perfumeName: draft.perfumeName.trim() || `Creation ${family.name}`,
    inspiration: draft.inspiration.trim(),
    createdAt: new Date().toISOString(),
  };
}

function cardStyle(active: boolean) {
  return {
    border: active ? '1px solid var(--gold)' : '1px solid var(--line-light)',
    background: active ? 'rgba(197,165,90,0.1)' : '#fff',
    boxShadow: active ? '0 16px 40px rgba(8,8,8,0.08)' : 'none',
  };
}

export default function CreationConfigurator({ config }: Readonly<{ config: CreationConfiguratorConfig }>) {
  const cfg = config;
  const router = useRouter();
  const { addItem } = useCart();
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [activeStep, setActiveStep] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const restoreTimer = globalThis.setTimeout(() => {
      try {
        const stored = localStorage.getItem(DRAFT_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored) as Partial<Draft>;
        setDraft({ ...defaultDraft, ...parsed });
      } catch {
        // Ignore draft restore failures.
      }
    }, 0);

    return () => globalThis.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Ignore draft persistence failures.
    }
  }, [draft]);

  const formula = cfg.formulas.find((f) => f.id === draft.formulaId) ?? cfg.formulas[1] ?? cfg.formulas[0];
  const family = cfg.families.find((item) => item.id === draft.familyId) ?? cfg.families[0];
  const bottle = cfg.bottles.find((item) => item.id === draft.bottleId) ?? cfg.bottles[0];
  const progress = Math.round(((activeStep + 1) / 4) * 100);

  const validation = useMemo(() => {
    const missing: string[] = [];
    if (!draft.perfumeName.trim()) missing.push('nom du parfum');
    if (draft.selectedNotes.length < 2) missing.push('au moins 2 notes');
    if (!draft.inspiration.trim()) missing.push('brief d’inspiration');
    return missing;
  }, [draft]);

  function update(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function toggleNote(note: string) {
    setDraft((current) => {
      const exists = current.selectedNotes.includes(note);
      const selectedNotes = exists
        ? current.selectedNotes.filter((item) => item !== note)
        : [...current.selectedNotes, note].slice(0, 6);
      return { ...current, selectedNotes };
    });
  }

  function addCreationToCart(goToCheckout = false) {
    if (validation.length > 0) return;

    const snapshot = getDraftSnapshot(draft, cfg);
    const lineId = `custom-creation-${Date.now()}`;

    addItem({
      id: lineId,
      productId: `custom-creation-${snapshot.formulaId}`,
      isCustom: true,
      customization: snapshot,
      name: `Creation personnalisée - ${snapshot.perfumeName}`,
      brand: 'VIP Parfumerie Bar',
      price: formula.price,
      image: PLACEHOLDER_IMAGE,
      slug: 'services/creation-personnalisee',
    });

    setAdded(true);
    localStorage.removeItem(DRAFT_KEY);
    setTimeout(() => setAdded(false), 1800);
    if (goToCheckout) router.push('/commande');
  }

  return (
    <section id="commander" style={{ background: 'var(--surface)', padding: '88px 0' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 42 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Configurateur premium</span>
            <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
            Composez, visualisez, ajoutez au panier.
          </h2>
        </div>

        <div className="creation-config-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)', gap: 28, alignItems: 'start' }}>
          <div style={{ background: '#fff', border: '1px solid var(--line-light)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid var(--line-light)', background: 'var(--offwhite)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
                <p style={{ fontSize: '0.6875rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Etape {activeStep + 1} / 4</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gold-dark)', fontWeight: 600 }}>{progress}% pret</p>
              </div>
              <div style={{ height: 3, background: 'var(--line-light)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gold)', transition: 'width 0.25s ease' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '18px 24px 0' }}>
              {['Accord', 'Notes', 'Formule', 'Signature'].map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  style={{
                    border: activeStep === index ? '1px solid var(--noir)' : '1px solid var(--line-light)',
                    background: activeStep === index ? 'var(--noir)' : '#fff',
                    color: activeStep === index ? '#fff' : 'var(--text-secondary)',
                    borderRadius: 999,
                    padding: '8px 13px',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ padding: 24 }}>
              {/* Étape 0 — Accord */}
              {activeStep === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                    {cfg.families.map((item) => (
                      <button key={item.id} type="button" onClick={() => update({ familyId: item.id, selectedNotes: item.notes.slice(0, 3) })} style={{ ...cardStyle(draft.familyId === item.id), borderRadius: 'var(--r-md)', padding: 16, textAlign: 'left', cursor: 'pointer' }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 400, marginBottom: 6 }}>{item.name}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{item.mood}</p>
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {cfg.intensities.map((item) => (
                      <button key={item} type="button" onClick={() => update({ intensity: item })} className={draft.intensity === item ? 'btn-primary' : 'btn-ghost'} style={{ padding: '0.75rem 1rem' }}>{item}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {cfg.audiences.map((item) => (
                      <button key={item} type="button" onClick={() => update({ audience: item })} style={{ border: draft.audience === item ? '1px solid var(--gold)' : '1px solid var(--line-light)', background: draft.audience === item ? 'var(--gold-muted)' : '#fff', borderRadius: 999, padding: '0.7rem 1rem', cursor: 'pointer' }}>{item}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Étape 1 — Notes */}
              {activeStep === 1 && (
                <div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 18 }}>Choisissez 2 a 6 notes. La selection nourrit directement votre brief et le recapitulatif panier.</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {cfg.notes.map((note) => {
                      const active = draft.selectedNotes.includes(note);
                      return (
                        <button key={note} type="button" onClick={() => toggleNote(note)} style={{ border: active ? '1px solid var(--noir)' : '1px solid var(--line-light)', background: active ? 'var(--noir)' : '#fff', color: active ? '#fff' : 'var(--text-primary)', borderRadius: 999, padding: '0.75rem 1rem', cursor: 'pointer' }}>
                          {note}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Étape 2 — Formule */}
              {activeStep === 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
                  {cfg.formulas.map((item) => (
                    <button key={item.id} type="button" onClick={() => update({ formulaId: item.id })} style={{ ...cardStyle(draft.formulaId === item.id), textAlign: 'left', borderRadius: 'var(--r-md)', padding: 18, cursor: 'pointer' }}>
                      <p style={{ fontSize: '0.625rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-pale)', marginBottom: 6 }}>{item.volume}</p>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, marginBottom: 6 }}>{item.name}</h3>
                      <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-dark)', fontSize: '1.25rem', marginBottom: 10 }}>{formatPrice(item.price)}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.55 }}>{item.description}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Étape 3 — Signature */}
              {activeStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label htmlFor="perfumeName" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 7 }}>Nom du parfum *</label>
                    <input id="perfumeName" className="input" value={draft.perfumeName} onChange={(event) => update({ perfumeName: event.target.value })} placeholder="Ex : Nuit d'Abidjan" maxLength={42} />
                  </div>
                  <div>
                    <label htmlFor="engraving" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 7 }}>Gravure flacon</label>
                    <input id="engraving" className="input" value={draft.engraving} onChange={(event) => update({ engraving: event.target.value })} placeholder="Initiales, date, phrase courte" maxLength={34} />
                  </div>
                  <div>
                    <label htmlFor="inspiration" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 7 }}>Brief d&apos;inspiration *</label>
                    <textarea id="inspiration" className="input" value={draft.inspiration} onChange={(event) => update({ inspiration: event.target.value })} placeholder="Ambiance, souvenirs, parfums a eviter, personne a qui le parfum est destine..." rows={5} style={{ resize: 'vertical', lineHeight: 1.6 }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 28 }}>
                <button type="button" className="btn-ghost" onClick={() => setActiveStep((step) => Math.max(0, step - 1))} disabled={activeStep === 0} style={{ opacity: activeStep === 0 ? 0.35 : 1 }}>Retour</button>
                {activeStep < 3 ? (
                  <button type="button" className="btn-primary" onClick={() => setActiveStep((step) => Math.min(3, step + 1))}>Continuer</button>
                ) : (
                  <button type="button" className="btn-primary" onClick={() => addCreationToCart(false)} disabled={validation.length > 0} style={{ opacity: validation.length > 0 ? 0.45 : 1 }}>
                    {added ? 'Ajoute au panier' : 'Ajouter au panier'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside style={{ position: 'sticky', top: 96, background: 'var(--noir)', color: '#fff', borderRadius: 'var(--r-md)', padding: 24, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(197,165,90,0.16), transparent 55%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <p style={{ fontSize: '0.625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Apercu live</p>
              <div style={{ minHeight: 170, border: '1px solid rgba(197,165,90,0.25)', borderRadius: 4, display: 'grid', placeItems: 'center', marginBottom: 22, background: 'rgba(255,255,255,0.035)' }}>
                <div style={{ width: 84, height: 122, border: '1px solid rgba(197,165,90,0.6)', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', fontSize: '0.75rem', textAlign: 'center', padding: '0 8px' }}>{draft.perfumeName || family.name}</span>
                  <span style={{ width: 28, height: 1, background: 'rgba(197,165,90,0.5)' }} />
                  <span style={{ fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{bottle.name}</span>
                </div>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 300, marginBottom: 4 }}>{draft.perfumeName || 'Votre creation'}</h3>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 18 }}>{formula.name} · {formula.volume} · {family.name} · {draft.intensity}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                {draft.selectedNotes.map((note) => (
                  <span key={note} style={{ border: '1px solid rgba(197,165,90,0.28)', color: 'rgba(255,255,255,0.72)', borderRadius: 999, padding: '6px 9px', fontSize: '0.7rem' }}>{note}</span>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8125rem' }}>Total creation</span>
                <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.55rem', color: 'var(--gold)', fontWeight: 400 }}>{formatPrice(formula.price)}</strong>
              </div>
              {validation.length > 0 && (
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: 14 }}>
                  A completer : {validation.join(', ')}.
                </p>
              )}
              <button type="button" className="btn-gold" onClick={() => addCreationToCart(true)} disabled={validation.length > 0} style={{ width: '100%', opacity: validation.length > 0 ? 0.5 : 1 }}>
                Commander cette creation
              </button>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .creation-config-grid { grid-template-columns: 1fr !important; }
          .creation-config-grid aside { position: static !important; }
        }
      `}</style>
    </section>
  );
}