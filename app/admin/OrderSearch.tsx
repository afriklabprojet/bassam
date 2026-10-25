'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import type { AdminTrackedOrder as TrackedOrder } from '@/lib/supabase/admin-order-search';
import { formatCFA, formatDateTime } from '@/lib/format';
import { getDarkOrderStatusStyle, getOrderStatusLabel } from '@/lib/order-status-theme';
import { CARD_BASE } from './dashboard-ui';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mobile_money: 'Mobile Money',
  card: 'Carte bancaire',
  cash_on_delivery: 'Paiement à la livraison',
  cash: 'Espèces',
  transfer: 'Virement',
  other: 'Autre',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payé',
  completed: 'Payé',
  failed: 'Échoué',
  cancelled: 'Annulé',
  refunded: 'Remboursé',
};

const MESSAGES = {
  empty: 'Veuillez saisir un numéro de suivi.',
  notFound: 'Aucune commande trouvée pour ce numéro de suivi.',
  server: 'Impossible de lancer la recherche pour le moment. Réessayez dans un instant.',
  network: 'Connexion impossible. Vérifiez votre réseau puis réessayez.',
  forbidden: 'Accès refusé — vous devez être administrateur.',
} as const;

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#777',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 8,
};

const BLOCK_STYLE: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px' };

type SearchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; orders: TrackedOrder[] };

export default function OrderSearch() {
  const [value, setValue] = useState('');
  const [state, setState] = useState<SearchState>({ kind: 'idle' });
  const abortRef = useRef<AbortController | null>(null);
  const inputId = useId();
  const statusId = useId();

  useEffect(() => () => abortRef.current?.abort(), []);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const query = value.trim();
    if (!query) {
      setState({ kind: 'error', message: MESSAGES.empty });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ kind: 'loading' });

    try {
      const res = await fetch(`/api/admin/orders/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      if (controller.signal.aborted) return;

      if (res.ok) {
        const data = (await res.json()) as { orders?: TrackedOrder[] };
        setState({ kind: 'done', orders: data.orders ?? [] });
        return;
      }
      if (res.status === 403) return setState({ kind: 'error', message: MESSAGES.forbidden });
      if (res.status === 400) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        return setState({ kind: 'error', message: data?.error ?? MESSAGES.empty });
      }
      setState({ kind: 'error', message: MESSAGES.server });
    } catch {
      if (!controller.signal.aborted) setState({ kind: 'error', message: MESSAGES.network });
    }
  }

  function reset() {
    abortRef.current?.abort();
    setValue('');
    setState({ kind: 'idle' });
  }

  const loading = state.kind === 'loading';

  return (
    <section aria-label="Recherche de commande" style={{ ...CARD_BASE, overflow: 'visible', padding: '20px 24px' }}>
      <style>{`
        .order-search-input:focus-visible, .order-search-btn:focus-visible, .order-search-link:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
        .order-search-input::placeholder { color: #777; }
        @media (prefers-reduced-motion: reduce) { .order-search-spin { animation: none !important; } }
      `}</style>

      <form role="search" onSubmit={search} noValidate style={{ position: 'relative', zIndex: 1 }}>
        <label htmlFor={inputId} style={{ ...LABEL_STYLE, display: 'block' }}>
          Retrouver une commande
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            id={inputId}
            className="order-search-input"
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={64}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Rechercher une commande par numéro de suivi…"
            aria-describedby={statusId}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 44,
              padding: '0 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(197,165,90,0.18)',
              color: '#fff',
              fontSize: '0.9375rem',
            }}
          />
          <button
            type="submit"
            className="order-search-btn"
            disabled={loading}
            aria-label="Rechercher"
            style={{
              width: 48,
              minHeight: 44,
              borderRadius: 12,
              background: 'var(--gold)',
              color: 'var(--noir)',
              border: 'none',
              cursor: loading ? 'progress' : 'pointer',
              opacity: loading ? 0.8 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {loading ? (
              <span
                className="order-search-spin animate-spin"
                aria-hidden="true"
                style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.25)', borderTopColor: 'var(--noir)' }}
              />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
          </button>
        </div>
      </form>

      <div id={statusId} aria-live="polite" style={{ position: 'relative', zIndex: 1 }}>
        {loading && <p style={{ color: '#888', fontSize: '0.8125rem', marginTop: 12 }}>Recherche en cours…</p>}

        {state.kind === 'error' && (
          <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginTop: 12 }}>
            {state.message}
          </p>
        )}

        {state.kind === 'done' && state.orders.length === 0 && (
          <p style={{ color: '#aaa', fontSize: '0.875rem', marginTop: 12 }}>{MESSAGES.notFound}</p>
        )}

        {state.kind === 'done' && state.orders.length > 0 && (
          <div style={{ marginTop: 16, display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: '#888', fontSize: '0.8125rem' }}>
                {state.orders.length} commande{state.orders.length > 1 ? 's' : ''} trouvée{state.orders.length > 1 ? 's' : ''}
                {state.orders.length > 1 ? ' — plusieurs commandes partagent ce numéro, vérifiez le client.' : ''}
              </span>
              <button
                type="button"
                className="order-search-btn"
                onClick={reset}
                style={{ minHeight: 44, padding: '0 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: '#bbb', fontSize: '0.8125rem', border: 'none', cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>
            {state.orders.map((order) => (
              <OrderResult key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div>
      <span style={{ color: '#666', display: 'block', fontSize: '0.7rem', marginBottom: 2 }}>{label}</span>
      <span style={{ color: '#fff', fontSize: '0.8125rem' }}>{children}</span>
    </div>
  );
}

export function OrderResult({ order, showLink = true, actions }: Readonly<{ order: TrackedOrder; showLink?: boolean; actions?: React.ReactNode }>) {
  const statusStyle = getDarkOrderStatusStyle(order.status);
  const address = order.shippingAddress;

  return (
    <article style={{ border: '1px solid rgba(197,165,90,0.14)', borderRadius: 14, padding: 16, display: 'grid', gap: 12, background: 'rgba(255,255,255,0.02)' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <h3 style={{ color: '#fff', fontFamily: 'monospace', fontSize: '1.0625rem', fontWeight: 700, margin: 0 }}>{order.trackingNumber}</h3>
          <span style={{ color: '#777', fontSize: '0.75rem' }}>Créée le {formatDateTime(order.createdAt)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '4px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
            {getOrderStatusLabel(order.status)}
          </span>
          {actions}
          {showLink && (
            <Link
              href={`/admin/commandes?ref=${encodeURIComponent(order.trackingNumber)}`}
              className="order-search-link"
              style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 16px', borderRadius: 10, background: 'var(--gold)', color: 'var(--noir)', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}
            >
              Voir la commande
            </Link>
          )}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div style={BLOCK_STYLE}>
          <div style={LABEL_STYLE}>Client</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <Field label="Nom">{order.customer.name}</Field>
            {order.customer.phone && (
              <Field label="Téléphone">
                <a href={`tel:${order.customer.phone}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>{order.customer.phone}</a>
              </Field>
            )}
            {order.customer.email && (
              <Field label="Email">
                <a href={`mailto:${order.customer.email}`} style={{ color: 'var(--gold)', textDecoration: 'none', overflowWrap: 'anywhere' }}>{order.customer.email}</a>
              </Field>
            )}
            {address && (address.address || address.city) && (
              <Field label="Livraison">
                {[address.address, [address.city, address.country].filter(Boolean).join(', ')].filter(Boolean).join(' — ')}
              </Field>
            )}
          </div>
        </div>

        <div style={BLOCK_STYLE}>
          <div style={LABEL_STYLE}>Paiement et livraison</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <Field label="Montant total">
              <strong>{formatCFA(order.totalAmount)}</strong>
            </Field>
            <Field label="Méthode">{order.paymentMethod ? (PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod) : '—'}</Field>
            <Field label="Statut du paiement">
              <span style={{ color: order.paymentStatus === 'paid' ? 'var(--success)' : '#ccc' }}>
                {order.paymentStatus ? (PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus) : '—'}
              </span>
            </Field>
            <Field label="Livraison">{order.deliveryStatus}</Field>
          </div>
        </div>
      </div>

      <div style={BLOCK_STYLE}>
        <div style={LABEL_STYLE}>Articles ({order.items.length})</div>
        {order.items.length === 0 ? (
          <span style={{ color: '#777', fontSize: '0.8125rem' }}>Aucun article enregistré</span>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {order.items.map((item) => (
              <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                <span style={{ color: '#fff', fontSize: '0.8125rem' }}>
                  {item.name}
                  {item.brand && <span style={{ color: '#777', display: 'block', fontSize: '0.7rem' }}>{item.brand}</span>}
                </span>
                <span style={{ textAlign: 'right', flexShrink: 0, color: '#aaa', fontSize: '0.75rem' }}>
                  {item.quantity} × {formatCFA(item.unitPrice)}
                  <span style={{ color: 'var(--gold)', display: 'block', fontSize: '0.8125rem', fontWeight: 600 }}>
                    {formatCFA(item.quantity * item.unitPrice)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={BLOCK_STYLE}>
        <div style={LABEL_STYLE}>Historique</div>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
          {order.timeline.map((event, index) => (
            <li key={`${event.at}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.8125rem' }}>
              <span style={{ color: '#ddd' }}>{event.label}</span>
              <time dateTime={event.at} style={{ color: '#777', flexShrink: 0 }}>{formatDateTime(event.at)}</time>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
