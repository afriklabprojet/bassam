'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { buildWhatsAppHref, hasWhatsAppSupport } from '@/lib/site-config';
import { ConfettiParticles } from '../checkout-ui';

type OrderStatusResponse = {
  orderId: string;
  status: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | string;
  firstName: string | null;
  phone: string;
};

type LoadState = 'loading' | 'not-found' | 'error';
type ResolvedState = 'polling' | 'paid' | 'failed';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 12; // ~36s of polling before we stop and ask the customer to wait

function Wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--offwhite)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '32rem', width: '100%' }}>
        {children}
      </div>
    </div>
  );
}

function ConfirmationBody() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const { clearCart } = useCart();
  const hasWhatsappSupport = hasWhatsAppSupport();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [resolvedState, setResolvedState] = useState<ResolvedState>('polling');
  const [order, setOrder] = useState<OrderStatusResponse | null>(null);
  const clearedRef = useRef(false);

  useEffect(() => {
    if (!orderId) {
      setLoadState('not-found');
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (cancelled) return;

        if (!res.ok) {
          setLoadState(res.status === 404 ? 'not-found' : 'error');
          return;
        }

        const data = (await res.json()) as OrderStatusResponse;
        if (cancelled) return;

        setLoadState('loading'); // clears any previous error state once we have data
        setOrder(data);
        attempts += 1;

        if (data.paymentStatus === 'paid') {
          setResolvedState('paid');
          if (!clearedRef.current) {
            clearedRef.current = true;
            clearCart();
          }
          return;
        }

        if (data.paymentStatus === 'failed') {
          setResolvedState('failed');
          return;
        }

        // still pending — keep polling until we give up
        if (attempts < MAX_POLL_ATTEMPTS) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) setLoadState('error');
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, clearCart]);

  if (loadState === 'not-found') {
    return (
      <Wrapper>
        <h1 className="heading-lg" style={{ marginBottom: '0.75rem' }}>Commande introuvable</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 300 }}>
          Le lien de confirmation semble invalide ou a expiré.
        </p>
        <Link href="/" className="btn-primary">Retour à l&apos;accueil</Link>
      </Wrapper>
    );
  }

  if (loadState === 'error' && !order) {
    return (
      <Wrapper>
        <h1 className="heading-lg" style={{ marginBottom: '0.75rem' }}>Impossible de vérifier votre commande</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 300 }}>
          Une erreur est survenue. Contactez-nous avec votre numéro de commande si le paiement a bien été effectué.
        </p>
        <Link href="/contact" className="btn-primary">Contacter le service client</Link>
      </Wrapper>
    );
  }

  if (!order) {
    return (
      <Wrapper>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 300 }}>Vérification de votre commande…</p>
      </Wrapper>
    );
  }

  const orderNumber = `VIP-${order.orderId.substring(0, 8).toUpperCase()}`;

  if (resolvedState === 'failed') {
    return (
      <Wrapper>
        <h1 className="heading-lg" style={{ marginBottom: '0.75rem' }}>Le paiement a échoué</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 300, lineHeight: 1.7 }}>
          Le paiement de la commande <strong>{orderNumber}</strong> n&apos;a pas pu être confirmé. Vos articles sont toujours dans votre panier, vous pouvez réessayer.
        </p>
        <Link href="/commande" className="btn-primary">Réessayer le paiement</Link>
      </Wrapper>
    );
  }

  if (resolvedState === 'polling') {
    return (
      <Wrapper>
        <h1 className="heading-lg" style={{ marginBottom: '0.75rem', fontSize: '1.75rem' }}>Paiement en cours</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 300, lineHeight: 1.7 }}>
          {order.firstName ? `Merci ${order.firstName} ! ` : ''}Confirmez le paiement sur votre téléphone. Cette page se mettra à jour automatiquement.
        </p>
        <div style={{ display: 'inline-block', background: 'var(--offwhite)', borderRadius: 'var(--r-md)', padding: '1.25rem 2rem', marginBottom: '1.5rem', border: '1px solid var(--line-light)' }}>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Numéro de commande</p>
          <p style={{ fontFamily: 'monospace', fontSize: '1.375rem', fontWeight: 700, letterSpacing: '0.08em' }}>{orderNumber}</p>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-pale)', fontWeight: 300 }}>
          Si vous avez déjà confirmé le paiement, patientez quelques instants.
        </p>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div style={{ position: 'relative', width: '88px', height: '88px', margin: '0 auto 1.75rem' }}>
        <ConfettiParticles />
        <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'rgba(197,165,90,0.08)', border: '1.5px solid rgba(197,165,90,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="36" height="36" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      </div>
      <h2 className="heading-lg" style={{ marginBottom: '0.75rem', fontSize: '1.75rem' }}>Commande confirmée !</h2>
      <p style={{ color: 'var(--text-secondary)', fontWeight: 300, maxWidth: '28rem', margin: '0 auto 2rem', lineHeight: 1.7 }}>
        {order.firstName ? `Merci ${order.firstName}, ` : 'Merci, '}votre paiement a été confirmé et votre commande est en préparation.
      </p>
      <div style={{ display: 'inline-block', background: 'var(--offwhite)', borderRadius: 'var(--r-md)', padding: '1.25rem 2rem', marginBottom: '1.5rem', border: '1px solid var(--line-light)' }}>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Numéro de commande</p>
        <p style={{ fontFamily: 'monospace', fontSize: '1.375rem', fontWeight: 700, letterSpacing: '0.08em' }}>{orderNumber}</p>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 300 }}>
        Notre équipe vous contactera au <strong>{order.phone}</strong> pour confirmer.
      </p>
      {hasWhatsappSupport ? (
        <a href={buildWhatsAppHref(`Bonjour, j'ai passé la commande ${orderNumber}.`)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', background: '#25D366', color: '#fff', padding: '0.875rem 1.75rem', borderRadius: 'var(--r-md)', fontWeight: 500, textDecoration: 'none', fontSize: '0.875rem' }}>
          Suivre via WhatsApp
        </a>
      ) : (
        <Link href="/contact" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
          Contacter le service client
        </Link>
      )}
      <div style={{ marginTop: '1.75rem' }}>
        <Link href="/" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </Wrapper>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<Wrapper><p style={{ color: 'var(--text-secondary)', fontWeight: 300 }}>Chargement…</p></Wrapper>}>
      <ConfirmationBody />
    </Suspense>
  );
}
