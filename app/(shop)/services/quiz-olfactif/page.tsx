'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/* ─── Types ──────────────────────────────────────────────── */

type Step = 1 | 2 | 3 | 4 | 5;

interface Choice { id: string; label: string; sub?: string }

/* ─── Quiz Data ──────────────────────────────────────────── */

const steps: {
  num: Step;
  question: string;
  hint: string;
  multiple?: boolean;
  choices: Choice[];
}[] = [
  {
    num: 1,
    question: "Pour qui est ce parfum ?",
    hint: "Sélectionnez un profil",
    choices: [
      { id: 'femme', label: 'Pour elle', sub: 'Féminin' },
      { id: 'homme', label: 'Pour lui', sub: 'Masculin' },
      { id: 'unisex', label: 'Sans genre', sub: 'Mixte / Unisexe' },
    ],
  },
  {
    num: 2,
    question: "Quelle ambiance vous attire ?",
    hint: "Choisissez jusqu'à 2",
    multiple: true,
    choices: [
      { id: 'floral', label: 'Floral', sub: 'Rose, jasmin, pivoine' },
      { id: 'oriental', label: 'Oriental', sub: 'Oud, vanille, ambre' },
      { id: 'frais', label: 'Frais & Aquatique', sub: 'Cèdre, thé, agrumes' },
      { id: 'boise', label: 'Boisé', sub: 'Santal, vétiver, mousse' },
      { id: 'gourmand', label: 'Gourmand', sub: 'Caramel, chocolat, miel' },
      { id: 'cuir', label: 'Cuir & Poudreux', sub: 'Tabac, iris, encens' },
    ],
  },
  {
    num: 3,
    question: "Pour quelle occasion ?",
    hint: "Sélectionnez un contexte",
    choices: [
      { id: 'quotidien', label: 'Quotidien', sub: 'Bureau, courses, sorties légères' },
      { id: 'soiree', label: 'Soirée & Événements', sub: 'Dîners, fêtes, galas' },
      { id: 'seduction', label: 'Séduction', sub: 'Romantique, intime' },
      { id: 'voyage', label: 'Voyage & Découverte', sub: 'Escapades, aventure' },
    ],
  },
  {
    num: 4,
    question: "Quel sillage préférez-vous ?",
    hint: "L'intensité de votre fragrance",
    choices: [
      { id: 'discret', label: 'Discret', sub: 'Subtil, personnel — EDT légère' },
      { id: 'modere', label: 'Modéré', sub: 'Présent sans envahir — EDP' },
      { id: 'intense', label: 'Intense', sub: 'Affirmé, mémorable — Extrait' },
      { id: 'surprise', label: 'Surprenez-moi !', sub: 'Je fais confiance à votre expert' },
    ],
  },
];

/* ─── Mapping quiz → paramètres API ─────────────────────── */

interface ProductResult {
  id: string;
  name: string;
  brand?: string;
  concentration?: string;
  description?: string;
  slug: string;
  image_url?: string;
  price: number;
}

function buildApiParams(answers: Record<number, string[]>): URLSearchParams {
  const params = new URLSearchParams({ limit: '5' });

  const gender = answers[1]?.[0];
  if (gender === 'femme') params.set('gender', 'femme');
  else if (gender === 'homme') params.set('gender', 'homme');
  else if (gender === 'unisex') params.set('gender', 'mixte');

  const ambiances = answers[2] ?? [];
  if (ambiances.length > 0) {
    params.set('q', ambiances[0]);
  }

  const featured = answers[3]?.[0] === 'soiree' || answers[3]?.[0] === 'seduction';
  if (featured) params.set('featured', 'true');

  return params;
}

/* ─── Composants internes ────────────────────────────────── */

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ height: 2, background: 'var(--line-light)', borderRadius: 1, overflow: 'hidden', marginBottom: 48 }}>
      <div
        style={{
          height: '100%',
          background: 'var(--gold)',
          width: `${(current / total) * 100}%`,
          transition: 'width 0.4s ease',
          borderRadius: 1,
        }}
      />
    </div>
  );
}

function ChoiceCard({
  choice,
  selected,
  onClick,
}: {
  choice: Choice;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '20px 24px',
        border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--line-light)'}`,
        borderRadius: 3,
        background: selected ? 'rgba(197,165,90,0.06)' : '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
      }}
    >
      {/* Radio dot */}
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--line-light)'}`,
        background: selected ? 'var(--gold)' : 'transparent',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s',
      }}>
        {selected && (
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </div>
      <div>
        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: selected ? 'var(--text-primary)' : 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{choice.label}</p>
        {choice.sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-pale)', margin: '3px 0 0' }}>{choice.sub}</p>}
      </div>
    </button>
  );
}

/* ─── Page principale ────────────────────────────────────── */

export default function QuizOlfactifPage() {
  const [step, setStep] = useState<Step>(1);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [done, setDone] = useState(false);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const currentStep = steps.find((s) => s.num === step)!;
  const currentAnswers = answers[step] ?? [];

  function toggle(id: string) {
    if (currentStep.multiple) {
      const max = 2;
      if (currentAnswers.includes(id)) {
        setAnswers({ ...answers, [step]: currentAnswers.filter((a) => a !== id) });
      } else if (currentAnswers.length < max) {
        setAnswers({ ...answers, [step]: [...currentAnswers, id] });
      }
    } else {
      setAnswers({ ...answers, [step]: [id] });
    }
  }

  function next() {
    if (step < 4) {
      setStep((step + 1) as Step);
    } else {
      setDone(true);
    }
  }

  function prev() {
    if (step > 1) setStep((step - 1) as Step);
  }

  function restart() {
    setStep(1);
    setAnswers({});
    setDone(false);
    setProducts([]);
  }

  useEffect(() => {
    if (!done) return;
    setLoadingResults(true);
    const params = buildApiParams(answers);
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingResults(false));
  }, [done]);

  const canAdvance = currentAnswers.length > 0;

  /* ── Écran résultats ── */
  if (done) {
    return (
      <main>
        <section style={{ background: 'var(--noir)', padding: '100px 0 56px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(197,165,90,0.07) 0%, transparent 65%)' }} aria-hidden="true" />
          <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '1px solid rgba(197,165,90,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--gold)' }}>
              <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300, color: '#fff', margin: '0 0 12px' }}>
              Votre sélection <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>personnalisée</em>
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Basé sur vos réponses, voici les fragrances faites pour vous.
            </p>
          </div>
        </section>

        <section style={{ background: 'var(--surface)', padding: '72px 0' }}>
          <div className="container">
            {loadingResults ? (
              <p style={{ textAlign: 'center', color: 'var(--text-pale)', fontSize: '0.9375rem', padding: '40px 0' }}>
                Sélection de vos fragrances…
              </p>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
              {products.length > 0 ? products.map((r, i) => (
                <div key={r.id} style={{ background: '#fff', padding: '32px 28px', borderTop: '2px solid var(--line-light)', position: 'relative' }}>
                  <span style={{ fontSize: '0.625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold)' }}>Recommandation {String(i + 1).padStart(2, '0')}</span>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, color: 'var(--text-primary)', margin: '8px 0 2px', lineHeight: 1.2 }}>{r.name}</h3>
                  <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-pale)', margin: '0 0 6px' }}>
                    {r.brand ? `${r.brand}${r.concentration ? ` · ${r.concentration}` : ''}` : r.concentration ?? ''}
                  </p>
                  <div style={{ width: 24, height: '1px', background: 'var(--gold)', margin: '12px 0', opacity: 0.5 }} aria-hidden="true" />
                  {r.description && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 20px' }}>
                      {r.description.length > 120 ? r.description.slice(0, 120) + '…' : r.description}
                    </p>
                  )}
                  <Link href={`/produits/${r.slug}`} style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none', fontWeight: 600, borderBottom: '1px solid rgba(197,165,90,0.35)', paddingBottom: 3 }}>
                    Voir le produit →
                  </Link>
                </div>
              )) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Aucun produit ne correspond exactement à votre profil pour l&rsquo;instant.
                  </p>
                  <Link href="/produits" style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600, borderBottom: '1px solid rgba(197,165,90,0.35)', paddingBottom: 3, textDecoration: 'none' }}>
                    Voir tout le catalogue →
                  </Link>
                </div>
              )}
            </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 56, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/services/consultation" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px', background: 'var(--noir)', color: '#fff', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderRadius: 3 }}>
                Affiner avec une experte
              </Link>
              <button
                type="button"
                onClick={restart}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--line-light)', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderRadius: 3, cursor: 'pointer' }}
              >
                Refaire le quiz
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /* ── Quiz ── */
  return (
    <main>
      {/* Header sombre */}
      <section style={{ background: 'var(--noir)', padding: '80px 0 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(197,165,90,0.06) 0%, transparent 55%)' }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.3 }} aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 24, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Quiz Olfactif IA</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 300, color: '#fff', margin: '0 0 10px', lineHeight: 1.1 }}>
            Trouvez votre{' '}
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>signature olfactive.</em>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            4 questions · 5 minutes · 100% gratuit
          </p>
        </div>
      </section>

      {/* Formulaire quiz */}
      <section style={{ background: 'var(--surface)', padding: '56px 0 88px' }}>
        <div className="container">
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {/* Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-pale)' }}>
                Étape {step} sur {steps.length}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--gold)' }}>{Math.round((step / steps.length) * 100)}%</span>
            </div>
            <ProgressBar current={step} total={steps.length} />

            {/* Question */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 6px', lineHeight: 1.2 }}>
                {currentStep.question}
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-pale)', margin: 0 }}>
                {currentStep.hint}
                {currentStep.multiple && <span style={{ color: 'var(--gold)' }}> (max 2)</span>}
              </p>
            </div>

            {/* Choices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
              {currentStep.choices.map((c) => (
                <ChoiceCard
                  key={c.id}
                  choice={c}
                  selected={currentAnswers.includes(c.id)}
                  onClick={() => toggle(c.id)}
                />
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 12 }}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prev}
                  style={{ height: 48, padding: '0 22px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--line-light)', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderRadius: 3, cursor: 'pointer' }}
                >
                  ← Précédent
                </button>
              )}
              <button
                type="button"
                onClick={next}
                disabled={!canAdvance}
                style={{
                  flex: 1, height: 48, padding: '0 24px',
                  background: canAdvance ? 'var(--noir)' : 'var(--line-light)',
                  color: canAdvance ? '#fff' : 'var(--text-pale)',
                  border: 'none',
                  fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
                  borderRadius: 3, cursor: canAdvance ? 'pointer' : 'not-allowed',
                  transition: 'all 0.18s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {step === 4 ? 'Voir mes résultats' : 'Continuer'}
                {canAdvance && (
                  <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
