'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { formatCFA, formatDateShort } from '@/lib/format';
import { TRACKING_STEPS, trackingStep, type TrackedOrder } from '@/lib/order-tracking';

const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Paiement reçu',
  pending: 'Paiement en attente',
  failed: 'Paiement échoué',
  refunded: 'Commande remboursée',
};

/** Ce que l'étape actuelle signifie pour le client, en une phrase. */
const STEP_MESSAGES = [
  'Votre commande est enregistrée. Elle sera confirmée prochainement.',
  'Votre commande est confirmée et en cours de préparation.',
  'Votre commande est en route.',
  'Votre commande a été livrée.',
];

const inputStyle: React.CSSProperties = {
  width: '100%', height: 48, padding: '0 14px', fontSize: '1rem',
  color: 'var(--text-primary)', background: 'var(--surface)',
  border: '1px solid var(--line-light)', borderRadius: 3, boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: 6,
};

const hintStyle: React.CSSProperties = { fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '6px 0 0' };

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'found'; order: TrackedOrder };

function Timeline({ status }: Readonly<{ status: string }>) {
  const current = trackingStep(status);
  if (current === null) {
    return (
      <p className="track-cancelled">
        {status === 'cancelled'
          ? 'Cette commande a été annulée. Pour toute question, contactez-nous.'
          : 'Cette commande est en cours de traitement. Pour toute question, contactez-nous.'}
      </p>
    );
  }
  return (
    <>
      <ol className="track-steps" aria-label="Étapes de la commande">
        {TRACKING_STEPS.map((label, index) => {
          const state = index < current ? 'done' : index === current ? 'current' : 'todo';
          return (
            <li key={label} className={`track-step track-step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="track-dot" aria-hidden="true" />
              <span className="track-label">
                {label}
                {state === 'done' && <span className="track-sr-only"> (terminée)</span>}
                {state === 'todo' && <span className="track-sr-only"> (à venir)</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <p style={{ margin: '20px 0 0', color: 'var(--text-primary)', lineHeight: 1.6 }}>{STEP_MESSAGES[current]}</p>
    </>
  );
}

export default function OrderTracking({
  initialRef,
  whatsappHref,
}: Readonly<{ initialRef: string; whatsappHref: string | null }>) {
  const [ref, setRef] = useState(initialRef);
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const resultRef = useRef<HTMLHeadingElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  // Retour au formulaire depuis un résultat : le focus va au premier champ (le bouton cliqué n'existe plus).
  const focusFormRef = useRef(false);

  // Arrivée depuis un lien avec le numéro : il ne reste que le téléphone à saisir.
  useEffect(() => {
    if (initialRef) phoneRef.current?.focus();
  }, [initialRef]);

  useEffect(() => {
    if (state.kind === 'found') resultRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (focusFormRef.current && state.kind === 'idle') {
      focusFormRef.current = false;
      refInputRef.current?.focus();
    }
  }, [state]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (state.kind === 'loading') return;
    setState({ kind: 'loading' });
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref, phone }),
      });
      const body = (await res.json().catch(() => ({}))) as { order?: TrackedOrder; error?: string };
      if (res.ok && body.order) setState({ kind: 'found', order: body.order });
      else setState({ kind: 'error', message: body.error ?? 'Le suivi est indisponible. Réessayez dans un instant.' });
    } catch {
      setState({ kind: 'error', message: 'Connexion impossible. Vérifiez votre connexion internet puis réessayez.' });
    }
  }

  const order = state.kind === 'found' ? state.order : null;

  return (
    <div style={{ background: 'var(--offwhite)', minHeight: '70vh', padding: 'clamp(2.5rem, 6vw, 5rem) 1.5rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 className="heading-lg" style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', margin: 0 }}>Suivre ma commande</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '12px 0 28px', lineHeight: 1.6, maxWidth: '34rem' }}>
          Le numéro de commande figure dans l’e-mail de confirmation et sur la facture. Utilisez le téléphone donné lors
          de la commande.
        </p>

        {order ? (
          <section aria-labelledby="track-result" style={{ background: '#fff', border: '1px solid var(--line-light)', borderRadius: 3, padding: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
            <h2 id="track-result" ref={resultRef} tabIndex={-1} className="heading-md" style={{ fontSize: '1.5rem', margin: 0, outlineOffset: 6 }}>
              Commande {order.orderNumber}
            </h2>
            <p style={{ margin: '6px 0 28px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Passée le {formatDateShort(order.createdAt)}
            </p>

            <Timeline status={order.status} />

            <dl className="track-facts">
              <div>
                <dt>Paiement</dt>
                <dd>{(order.paymentStatus && PAYMENT_LABELS[order.paymentStatus]) ?? 'Paiement en attente'}</dd>
              </div>
              <div>
                <dt>Montant</dt>
                <dd>{formatCFA(order.totalAmount)}</dd>
              </div>
            </dl>

            {order.items.length > 0 && (
              <>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 500, margin: '28px 0 10px', color: 'var(--text-primary)' }}>Articles</h3>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {order.items.map((item, index) => (
                    <li key={`${item.name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderTop: '1px solid var(--line-light)' }}>
                      <span>{item.name}</span>
                      <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>× {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 32 }}>
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Poser une question sur WhatsApp
                </a>
              )}
              <button
                type="button"
                className="track-link"
                onClick={() => {
                  setState({ kind: 'idle' });
                  setRef('');
                  setPhone('');
                  focusFormRef.current = true;
                }}
              >
                Suivre une autre commande
              </button>
            </div>
          </section>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ background: '#fff', border: '1px solid var(--line-light)', borderRadius: 3, padding: 'clamp(1.5rem, 4vw, 2.25rem)' }}>
            <div className="track-fields">
              <div>
                <label htmlFor="track-ref" style={labelStyle}>Numéro de commande</label>
                <input
                  id="track-ref"
                  ref={refInputRef}
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  enterKeyHint="next"
                  placeholder="VIP-ABCDEF12"
                  aria-describedby={state.kind === 'error' ? 'track-ref-hint track-error' : 'track-ref-hint'}
                  aria-invalid={state.kind === 'error' || undefined}
                  required
                  style={inputStyle}
                />
                <p id="track-ref-hint" style={hintStyle}>Avec ou sans « VIP- ».</p>
              </div>
              <div>
                <label htmlFor="track-phone" style={labelStyle}>Téléphone de la commande</label>
                <input
                  id="track-phone"
                  ref={phoneRef}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  enterKeyHint="search"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07 00 00 00 00"
                  aria-describedby={state.kind === 'error' ? 'track-error' : undefined}
                  aria-invalid={state.kind === 'error' || undefined}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {state.kind === 'error' && (
              <p id="track-error" role="alert" style={{ margin: '18px 0 0', color: 'var(--order-danger-text-light)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                {state.message}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={state.kind === 'loading' || !ref.trim() || !phone.trim()}
              style={{ marginTop: 22, minHeight: 48, width: '100%' }}
            >
              {state.kind === 'loading' ? 'Recherche…' : 'Afficher le suivi'}
            </button>
          </form>
        )}

        <p style={{ marginTop: 24, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Vous avez un compte ? Toutes vos commandes sont dans{' '}
          <Link href="/compte?tab=commandes" style={{ color: 'var(--gold-dark)' }}>Mon compte</Link>.
        </p>
      </div>

      <style>{`
        .track-fields { display: grid; gap: 18px; }
        @media (min-width: 640px) { .track-fields { grid-template-columns: 1fr 1fr; } }

        /* Frise : un fil doré relie les étapes franchies. */
        .track-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); }
        .track-step { position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
        .track-step::before {
          content: ''; position: absolute; top: 7px; right: 50%; width: 100%; height: 2px; background: var(--line-light);
        }
        .track-step:first-child::before { display: none; }
        .track-step--done::before, .track-step--current::before { background: var(--gold); }
        .track-dot {
          position: relative; z-index: 1; width: 16px; height: 16px; border-radius: 50%;
          background: #fff; border: 2px solid var(--line-light); box-sizing: border-box;
        }
        .track-step--done .track-dot { background: var(--gold); border-color: var(--gold); }
        .track-step--current .track-dot { background: var(--gold); border-color: var(--gold); box-shadow: 0 0 0 5px var(--gold-muted); }
        .track-label { font-size: 0.8125rem; color: var(--text-secondary); }
        .track-step--current .track-label { color: var(--text-primary); font-weight: 600; }
        .track-step--done .track-label { color: var(--text-primary); }

        .track-cancelled {
          margin: 0; padding: 14px 16px; border-radius: 3px; line-height: 1.5;
          background: rgba(209,106,95,0.1); color: var(--order-danger-text-light);
        }
        .track-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 28px 0 0; padding-top: 20px; border-top: 1px solid var(--line-light); }
        .track-facts dt { font-size: 0.8125rem; color: var(--text-secondary); margin: 0 0 4px; }
        .track-facts dd { margin: 0; font-weight: 500; }
        .track-link {
          min-height: 48px; padding: 0 4px; background: none; border: none; cursor: pointer;
          color: var(--gold-dark); font-size: 0.9375rem; text-decoration: underline; text-underline-offset: 3px;
        }
        .track-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      `}</style>
    </div>
  );
}
