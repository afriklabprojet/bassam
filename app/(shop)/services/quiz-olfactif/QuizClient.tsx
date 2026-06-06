'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { QUIZ_STEPS, TOTAL_STEPS, buildApiParams } from '@/lib/quiz-data';
import type { StepNumber, ProductResult } from '@/lib/quiz-data';
import { ProgressDots, ChoiceCard, OlfactiveCard, ResultsScreen } from './quiz-ui';

export default function QuizClient() {
  const [step, setStep] = useState<StepNumber>(1);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(true);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const currentStep = QUIZ_STEPS.find((s) => s.num === step) ?? QUIZ_STEPS[0]!;
  const currentAnswers = useMemo(() => answers[step] ?? [], [answers, step]);
  const isMultiple = currentStep.multiple === true;
  const isGridTwo = currentStep.gridTwo === true;
  const maxReached = isMultiple && currentAnswers.length >= 2;
  const canAdvance = currentAnswers.length > 0;

  const transitionTo = useCallback((fn: () => void) => {
    setVisible(false);
    setTimeout(() => { fn(); setVisible(true); }, 150);
  }, []);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      transitionTo(() => setStep((s) => (s + 1) as StepNumber));
    } else {
      setDone(true);
    }
  }, [step, transitionTo]);

  const goPrev = useCallback(() => {
    if (step > 1) transitionTo(() => setStep((s) => (s - 1) as StepNumber));
  }, [step, transitionTo]);

  const restart = useCallback(() => {
    setDone(false);
    setProducts([]);
    setAnswers({});
    setStep(1);
    setVisible(true);
  }, []);

  function toggle(id: string) {
    if (isMultiple) {
      if (currentAnswers.includes(id)) {
        setAnswers((prev) => ({ ...prev, [step]: currentAnswers.filter((a) => a !== id) }));
      } else if (!maxReached) {
        setAnswers((prev) => ({ ...prev, [step]: [...currentAnswers, id] }));
      }
    } else {
      setAnswers((prev) => ({ ...prev, [step]: [id] }));
    }
  }

  useEffect(() => {
    if (isMultiple || currentAnswers.length === 0) return;
    const timer = setTimeout(() => { goNext(); }, 350);
    return () => clearTimeout(timer);
  }, [currentAnswers, isMultiple, goNext]);

  useEffect(() => {
    if (!done) return;
    void (async () => {
      setLoadingResults(true);
      const params = buildApiParams(answers);
      try {
        const r = await fetch(`/api/products?${params.toString()}`);
        const d = await r.json() as { products?: ProductResult[] };
        setProducts(d.products ?? []);
      } catch {
        setProducts([]);
      } finally {
        setLoadingResults(false);
      }
    })();
  }, [done, answers]);

  if (done) {
    return <ResultsScreen answers={answers} products={products} loading={loadingResults} onRestart={restart} />;
  }

  return (
    <main>
      <section style={{ background: 'var(--noir)', padding: '80px 0 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(197,165,90,0.06) 0%, transparent 55%)' }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.3 }} aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 24, height: '1px', background: 'var(--gold)' }} />
            <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
              Quiz Olfactif IA
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 300, color: '#fff', margin: '0 0 10px', lineHeight: 1.1 }}>
            Trouvez votre <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>signature olfactive.</em>
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            5 questions · 5 minutes · 100% gratuit
          </p>
        </div>
      </section>

      <section style={{ background: 'var(--surface)', padding: '56px 0 88px' }}>
        <div className="container">
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <ProgressDots current={step} total={TOTAL_STEPS} />

            <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 6px', lineHeight: 1.2 }}>
                  {currentStep.question}
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-pale)', margin: 0 }}>
                  {currentStep.hint}
                  {isMultiple && (
                    <span style={{ color: 'var(--gold)' }}>
                      {' '}(max 2 — {currentAnswers.length}/2 sélectionné{currentAnswers.length > 1 ? 's' : ''})
                    </span>
                  )}
                </p>
              </div>

              {isGridTwo ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 40 }}>
                  {currentStep.choices.map((c) => (
                    <OlfactiveCard key={c.id} choice={c} selected={currentAnswers.includes(c.id)} onClick={() => toggle(c.id)} disabled={maxReached} />
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
                  {currentStep.choices.map((c) => (
                    <ChoiceCard key={c.id} choice={c} selected={currentAnswers.includes(c.id)} onClick={() => toggle(c.id)} />
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                {step > 1 && (
                  <button type="button" onClick={goPrev} style={{ height: 48, padding: '0 22px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--line-light)', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderRadius: 3, cursor: 'pointer' }}>
                    ← Précédent
                  </button>
                )}
                {isMultiple && (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canAdvance}
                    style={{ flex: 1, height: 48, padding: '0 24px', background: canAdvance ? 'var(--noir)' : 'var(--line-light)', color: canAdvance ? '#fff' : 'var(--text-pale)', border: 'none', fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 3, cursor: canAdvance ? 'pointer' : 'not-allowed', transition: 'all 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {step === TOTAL_STEPS ? 'Voir mes résultats' : 'Continuer'}
                    {canAdvance && (
                      <svg width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                      </svg>
                    )}
                  </button>
                )}
                {!isMultiple && !canAdvance && (
                  <div style={{ flex: 1, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-pale)', fontStyle: 'italic' }}>
                    Sélectionnez une option pour continuer
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
