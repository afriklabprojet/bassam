'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

/* ─── Types ─────────────────────────────────────────────── */

interface FormData {
  nom: string;
  prenom: string;
  email: string;
  mode: string;
  disponibilites: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const STEP_LABELS = ['Vos coordonnées', 'Votre séance', 'Confirmation'];
const RESPONSE_HOURS = 24;

/* ─── Countdown ─────────────────────────────────────────── */

function useCountdown(targetMs: number | null) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (targetMs === null) return;

    function tick() {
      const diff = targetMs! - Date.now();
      setRemaining(Math.max(0, diff));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (remaining === null) return null;

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1_000);

  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
    expired: remaining === 0,
  };
}

/* ─── Step indicator ────────────────────────────────────── */

function StepDots({ step, total }: Readonly<{ step: number; total: number }>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {Array.from({ length: total }, (_, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: active ? 28 : 20,
              height: 8,
              borderRadius: 4,
              background: done || active ? 'var(--gold)' : 'rgba(197,165,90,0.18)',
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }} />
            {i < total - 1 && (
              <div style={{
                width: 24,
                height: 1,
                background: i < step ? 'var(--gold)' : 'rgba(197,165,90,0.18)',
                transition: 'background 0.3s ease',
              }} />
            )}
          </div>
        );
      })}
      <span style={{ marginLeft: 12, fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-pale)', fontWeight: 500 }}>
        {step < total ? `${step + 1} / ${total - 1}` : '✓'}
      </span>
    </div>
  );
}

/* ─── Field helpers ─────────────────────────────────────── */

function Label({ htmlFor, children, required }: Readonly<{ htmlFor: string; children: React.ReactNode; required?: boolean }>) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7 }}>
      {children}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
    </label>
  );
}

/* ─── Confirmation card ─────────────────────────────────── */

function ConfirmationCard({ deadlineMs }: Readonly<{ deadlineMs: number }>) {
  const countdown = useCountdown(deadlineMs);
  const consultantPhoto = process.env.NEXT_PUBLIC_CONSULTANT_PHOTO ?? null;
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
  const whatsappDisplay = process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? whatsappNumber;
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'contact@vipparfumeriebar.com';
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent("Bonjour, j'ai envoyé une demande de consultation sur le site. Pouvez-vous me confirmer le créneau ?")}`
    : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      {/* Check circle */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        border: '2px solid var(--gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <svg width={26} height={26} fill="none" stroke="var(--gold)" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"
            style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'drawCheck 0.5s 0.3s ease forwards' }}
          />
        </svg>
      </div>

      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 8px' }}>
        Demande envoyée !
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 28px', lineHeight: 1.6 }}>
        Votre demande a bien été reçue. Votre experte vous contacte dans les prochaines heures.
      </p>

      {/* Countdown */}
      <div style={{ marginBottom: 32, width: '100%' }}>
        <p style={{ fontSize: '0.5625rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-pale)', margin: '0 0 10px', fontWeight: 500 }}>
          Délai de réponse estimé
        </p>
        {countdown && !countdown.expired ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {[
              { val: countdown.h, label: 'h' },
              { val: countdown.m, label: 'min' },
              { val: countdown.s, label: 'sec' },
            ].map(({ val, label }, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  background: 'var(--noir)',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.75rem',
                  fontWeight: 300,
                  lineHeight: 1,
                  padding: '10px 14px',
                  borderRadius: 3,
                  minWidth: 52,
                  textAlign: 'center',
                  letterSpacing: '0.05em',
                }}>
                  {val}
                </div>
                <span style={{ fontSize: '0.5625rem', color: 'var(--text-pale)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingRight: i < 2 ? 4 : 0 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--gold)', fontWeight: 500 }}>Réponse attendue d&apos;un moment à l&apos;autre…</p>
        )}
      </div>

      {/* Consultant card */}
      <div style={{
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--line-light)',
        borderRadius: 3,
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        textAlign: 'left',
      }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0, width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(197,165,90,0.3)', background: 'var(--noir)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {consultantPhoto ? (
            <Image src={consultantPhoto} alt="Votre experte" width={64} height={64} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          ) : (
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--gold)', fontWeight: 300 }}>V</span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-pale)', margin: '0 0 4px', fontWeight: 500 }}>Votre experte</p>
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px' }}>VIP Parfumerie Bar</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', background: '#25D366', color: '#fff', textDecoration: 'none', fontSize: '0.6875rem', fontWeight: 600, borderRadius: 3, letterSpacing: '0.06em' }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.115 1.524 5.843L.054 23.61a.5.5 0 00.611.637l5.938-1.556A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.857a9.83 9.83 0 01-5.032-1.383l-.36-.214-3.73.978.995-3.636-.235-.374A9.818 9.818 0 012.143 12C2.143 6.55 6.55 2.143 12 2.143S21.857 6.55 21.857 12 17.45 21.857 12 21.857z" />
                </svg>
                WhatsApp{whatsappDisplay ? ` · ${whatsappDisplay}` : ''}
              </a>
            )}
            <a
              href={`mailto:${supportEmail}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', background: 'transparent', border: '1px solid var(--line-light)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.6875rem', borderRadius: 3, letterSpacing: '0.06em' }}
            >
              {supportEmail}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────── */

export default function ConsultationForm({ siteUrl: _siteUrl }: Readonly<{ siteUrl: string }>) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [data, setData] = useState<FormData>({
    nom: '',
    prenom: '',
    email: '',
    mode: '',
    disponibilites: '',
  });

  function update(field: keyof FormData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep0() {
    return data.nom.trim().length >= 2 && data.email.trim().includes('@');
  }

  function nextStep() {
    if (step === 0 && !validateStep0()) return;
    setStep((s) => s + 1);
  }

  function prevStep() {
    setStep((s) => s - 1);
  }

  async function handleSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: data.nom,
          prenom: data.prenom || undefined,
          email: data.email,
          mode: data.mode || undefined,
          disponibilites: data.disponibilites || undefined,
        }),
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const json = isJson ? await res.json() : null;
      if (!res.ok) throw new Error(json?.error ?? `Erreur serveur (${res.status}). Réessayez ou contactez-nous par WhatsApp.`);
      setDeadlineMs(Date.now() + RESPONSE_HOURS * 3_600_000);
      setStatus('success');
      setStep(2);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Une erreur est survenue');
      setStatus('error');
    }
  }

  return (
    <div style={{ background: '#fff', padding: '40px 36px', borderRadius: 3 }}>
      <StepDots step={step} total={STEP_LABELS.length} />

      {/* ── Step 0: Coordonnées ── */}
      {step === 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 24px' }}>
            Vos coordonnées
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="form-two-col">
              <div>
                <Label htmlFor="cprenom">Prénom</Label>
                <input id="cprenom" name="prenom" type="text" value={data.prenom} onChange={(e) => update('prenom', e.target.value)} placeholder="Votre prénom" className="input" />
              </div>
              <div>
                <Label htmlFor="cnom" required>Nom</Label>
                <input id="cnom" name="nom" type="text" required value={data.nom} onChange={(e) => update('nom', e.target.value)} placeholder="Votre nom" className="input" />
              </div>
            </div>
            <div>
              <Label htmlFor="cemail" required>Email</Label>
              <input id="cemail" name="email" type="email" required value={data.email} onChange={(e) => update('email', e.target.value)} placeholder="votre@email.com" className="input" />
            </div>
          </div>

          <button
            type="button"
            onClick={nextStep}
            disabled={!validateStep0()}
            className="btn-gold"
            style={{ width: '100%', marginTop: 24, opacity: validateStep0() ? 1 : 0.4, cursor: validateStep0() ? 'pointer' : 'not-allowed' }}
          >
            Suivant →
          </button>
        </div>
      )}

      {/* ── Step 1: Séance ── */}
      {step === 1 && (
        <form ref={formRef} onSubmit={handleSubmit}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 24px' }}>
            Votre séance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Mode — visual cards */}
            <div>
              <Label htmlFor="cmode">Format de consultation</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }} className="form-two-col">
                {[
                  { val: 'presentiel', label: 'Présentiel', sub: 'À Abidjan', icon: '📍' },
                  { val: 'visio', label: 'Visio', sub: 'WhatsApp / Meet', icon: '💻' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => update('mode', opt.val)}
                    style={{
                      padding: '16px 14px',
                      border: `1.5px solid ${data.mode === opt.val ? 'var(--gold)' : 'var(--line-light)'}`,
                      borderRadius: 3,
                      background: data.mode === opt.val ? 'rgba(197,165,90,0.06)' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '1.125rem', display: 'block', marginBottom: 6 }}>{opt.icon}</span>
                    <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{opt.label}</span>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-pale)' }}>{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Disponibilités */}
            <div>
              <Label htmlFor="cdispo">Vos disponibilités</Label>
              <textarea
                id="cdispo"
                name="disponibilites"
                rows={3}
                value={data.disponibilites}
                onChange={(e) => update('disponibilites', e.target.value)}
                placeholder="Ex : semaine du 15 juin, libre mardi ou jeudi matin…"
                className="input"
                style={{ resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>
          </div>

          {status === 'error' && (
            <p style={{ fontSize: '0.8125rem', color: '#EF4444', margin: '12px 0 0' }}>{errorMsg}</p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button
              type="button"
              onClick={prevStep}
              style={{ height: 46, padding: '0 20px', border: '1px solid var(--line-light)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: 3, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              ← Retour
            </button>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-gold"
              style={{ flex: 1, opacity: status === 'loading' ? 0.7 : 1, cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}
            >
              {status === 'loading' ? 'Envoi en cours…' : 'Envoyer ma demande'}
            </button>
          </div>

          <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', textAlign: 'center', margin: '14px 0 0', lineHeight: 1.5 }}>
            Réponse sous 24h · Paiement à la confirmation
          </p>
        </form>
      )}

      {/* ── Step 2: Confirmation ── */}
      {step === 2 && deadlineMs && (
        <ConfirmationCard deadlineMs={deadlineMs} />
      )}

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
        @media (max-width: 480px) {
          .form-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
