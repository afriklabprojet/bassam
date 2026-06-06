'use client';

import { useCart } from '@/lib/cart-context';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { buildWhatsAppHref, hasWhatsAppSupport } from '@/lib/site-config';
import { DEFAULT_SHIPPING_CONFIG, getShippingFee, type ShippingConfig } from '@/lib/shipping';
import type { Step, Direction, DeliveryInfo, PaymentMethod } from './checkout-ui';
import {
  ProgressBar, StepRecap, StepTransition,
  OrderRecap, MobileRecap,
  Step1Delivery, Step2Contact, Step3Payment, ConfettiParticles,
} from './checkout-ui';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const hasWhatsappSupport = hasWhatsAppSupport();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<Direction>('forward');
  const [attempted, setAttempted] = useState(false);

  const [guestEmail, setGuestEmail] = useState('');
  const [delivery, setDelivery] = useState<DeliveryInfo>({
    firstName: '', lastName: '', phone: '',
    address: '', city: '', country: "Côte d'Ivoire", notes: '',
  });
  const [selectedModeId, setSelectedModeId] = useState<string>(
    () => DEFAULT_SHIPPING_CONFIG.modes.find((m) => m.enabled)?.id ?? '',
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('livraison');
  const [orderNumber, setOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [paymentPending, setPaymentPending] = useState(false);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING_CONFIG);

  useEffect(() => {
    fetch('/api/shipping-config')
      .then(r => r.json())
      .then((d: { config?: ShippingConfig }) => {
        if (d.config) {
          setShippingConfig(d.config);
          const firstEnabled = d.config.modes.find((m) => m.enabled);
          if (firstEnabled) setSelectedModeId(firstEnabled.id);
        }
      })
      .catch(() => {});
  }, []);

  const enabledModes = shippingConfig.modes.filter(m => m.enabled);
  const selectedMode = enabledModes.find(m => m.id === selectedModeId) ?? null;
  const isPickup = selectedMode?.type === 'pickup';
  const shipping = getShippingFee(shippingConfig, selectedModeId);
  const total = totalPrice + shipping;

  function handleDeliveryChange(field: keyof DeliveryInfo, value: string) {
    setDelivery((p) => ({ ...p, [field]: value }));
  }

  function goForward(target: Step) { setDirection('forward'); setStep(target); }
  function goBack(target: Step) { setDirection('back'); setStep(target); }

  const step2Valid = isPickup
    ? !!(delivery.firstName && delivery.lastName && delivery.phone)
    : !!(delivery.firstName && delivery.lastName && delivery.phone && delivery.city && delivery.address);

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError('');

    const orderItems = items.map((item) => ({
      productId: item.productId ?? item.id,
      quantity: item.quantity,
      unitPrice: item.price,
      customCreation: item.customization,
    }));

    const modeNote = selectedMode ? `[${selectedMode.label.toUpperCase()}]` : '';
    const fullNotes = [modeNote, delivery.notes].filter(Boolean).join('\n');
    const shippingAddress = {
      firstName: delivery.firstName,
      lastName: delivery.lastName,
      address: isPickup ? 'Retrait en boutique' : delivery.address,
      city: isPickup ? 'Abidjan' : delivery.city,
      country: delivery.country,
    };

    try {
      if (paymentMethod === 'livraison') {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalAmount: total, paymentMethod: 'cash_on_delivery',
            shippingModeId: selectedModeId, shippingAddress,
            phone: delivery.phone, email: guestEmail || undefined,
            notes: fullNotes || undefined, items: orderItems,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erreur lors de la commande');
        setOrderNumber(`VIP-${data.order.id.substring(0, 8).toUpperCase()}`);
        setPaymentPending(false);
      } else {
        const res = await fetch('/api/payment/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalAmount: total, paymentMethod,
            shippingModeId: selectedModeId, shippingAddress,
            phone: delivery.phone, email: guestEmail || undefined,
            notes: fullNotes || undefined, items: orderItems,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erreur lors du paiement');
        setOrderNumber(`VIP-${data.orderId.substring(0, 8).toUpperCase()}`);
        setPaymentPending(true);
        if (data.redirectUrl) { globalThis.location.href = data.redirectUrl; return; }
      }
      clearCart();
      setDirection('forward');
      setStep(4);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0 && step !== 4) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <svg width="24" height="24" fill="none" stroke="var(--gold)" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
          </svg>
        </div>
        <h1 className="heading-lg" style={{ marginBottom: '0.75rem' }}>Votre panier est vide</h1>
        <Link href="/produits" className="btn-primary" style={{ marginTop: '0.5rem' }}>Découvrir nos parfums</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--offwhite)' }}>
      <div style={{ background: 'var(--noir)', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
        <div className="container mx-auto">
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem', letterSpacing: '0.06em' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Accueil</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
            <Link href="/panier" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Panier</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>Commande</span>
          </nav>
          <h1 className="heading-lg" style={{ color: '#fff', fontSize: 'clamp(1.625rem, 4vw, 2.25rem)' }}>Finaliser ma commande</h1>
        </div>
      </div>

      <div className="checkout-main container mx-auto py-10" style={{ maxWidth: '960px' }}>
        <ProgressBar step={step} />

        <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.75rem', alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>
            {step !== 4 && (
              <StepRecap
                step={step}
                selectedMode={selectedMode}
                shipping={shipping}
                delivery={delivery}
                paymentMethod={paymentMethod}
                onGoToStep={(s) => goBack(s)}
              />
            )}

            <StepTransition step={step} direction={direction}>
              {step === 1 && (
                <Step1Delivery
                  enabledModes={enabledModes}
                  selectedModeId={selectedModeId}
                  onSelectMode={setSelectedModeId}
                  onNext={() => goForward(2)}
                />
              )}
              {step === 2 && (
                <Step2Contact
                  delivery={delivery}
                  guestEmail={guestEmail}
                  isPickup={isPickup}
                  selectedMode={selectedMode}
                  attempted={attempted}
                  step2Valid={step2Valid}
                  hasWhatsappSupport={hasWhatsappSupport}
                  onChange={handleDeliveryChange}
                  onGuestEmail={setGuestEmail}
                  onBack={() => { setAttempted(false); goBack(1); }}
                  onNext={() => { setAttempted(true); if (step2Valid) { setAttempted(false); goForward(3); } }}
                />
              )}
              {step === 3 && (
                <Step3Payment
                  paymentMethod={paymentMethod}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                  onPaymentMethod={setPaymentMethod}
                  onBack={() => goBack(2)}
                  onSubmit={handleSubmit}
                />
              )}
              {step === 4 && (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', transition: 'none', animation: 'fadeSlideUp 0.5s ease both' }}>
                  <div style={{ position: 'relative', width: '88px', height: '88px', margin: '0 auto 1.75rem' }}>
                    <ConfettiParticles />
                    <div style={{ position: 'absolute', inset: '-10px', borderRadius: '50%', border: '1.5px solid rgba(197,165,90,0.25)', animation: 'ringPulse 2s ease-out 0.6s infinite' }} />
                    <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', border: '1px solid rgba(197,165,90,0.35)', animation: 'ringPulse 2s ease-out 0.9s infinite' }} />
                    <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'rgba(197,165,90,0.08)', border: '1.5px solid rgba(197,165,90,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'circlePop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both' }}>
                      <svg width="36" height="36" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M4.5 12.75l6 6 9-13.5" style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'drawCheck 0.45s ease 0.55s forwards' }} />
                      </svg>
                    </div>
                  </div>
                  <h2 className="heading-lg" style={{ marginBottom: '0.75rem', fontSize: '1.75rem', animation: 'fadeSlideUp 0.45s ease 0.35s both' }}>
                    {paymentPending ? 'Paiement en cours' : 'Commande confirmée !'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontWeight: 300, maxWidth: '28rem', margin: '0 auto 2rem', lineHeight: 1.7, animation: 'fadeSlideUp 0.45s ease 0.45s both' }}>
                    {paymentPending
                      ? `Merci ${delivery.firstName} ! Confirmez le paiement sur votre téléphone. Votre commande sera traitée dès réception.`
                      : `Merci ${delivery.firstName}, votre commande a été enregistrée avec succès.`}
                  </p>
                  <div style={{ display: 'inline-block', background: 'var(--offwhite)', borderRadius: 'var(--r-md)', padding: '1.25rem 2rem', marginBottom: '1.5rem', border: '1px solid var(--line-light)', animation: 'fadeSlideUp 0.45s ease 0.55s both' }}>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Numéro de commande</p>
                    <p style={{ fontFamily: 'monospace', fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.08em' }}>{orderNumber}</p>
                  </div>
                  {selectedMode && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', animation: 'fadeSlideUp 0.45s ease 0.62s both' }}>
                      <span>{selectedMode.type === 'pickup' ? '🏪' : '🚚'}</span>
                      <span>{selectedMode.label}</span>
                      {selectedMode.description && <span style={{ color: 'var(--text-pale)' }}>· {selectedMode.description}</span>}
                    </div>
                  )}
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 300, animation: 'fadeSlideUp 0.45s ease 0.68s both' }}>
                    Notre équipe vous contactera au <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{delivery.phone}</strong> pour confirmer.
                  </p>
                  <div style={{ animation: 'fadeSlideUp 0.45s ease 0.76s both' }}>
                    {hasWhatsappSupport ? (
                      <a href={buildWhatsAppHref(`Bonjour, j'ai passé la commande ${orderNumber}.`)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', background: '#25D366', color: '#fff', padding: '0.875rem 1.75rem', borderRadius: 'var(--r-md)', fontWeight: 500, textDecoration: 'none', fontSize: '0.875rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896.002-3.176-1.24-6.165-3.48-8.45z"/>
                        </svg>
                        Suivre via WhatsApp
                      </a>
                    ) : (
                      <Link href="/contact" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                        Contacter le service client
                      </Link>
                    )}
                  </div>
                  <div style={{ marginTop: '1.75rem', animation: 'fadeSlideUp 0.45s ease 0.84s both' }}>
                    <Link href="/" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'none', letterSpacing: '0.04em' }}>
                      ← Retour à l&apos;accueil
                    </Link>
                  </div>
                </div>
              )}
            </StepTransition>
          </div>

          {step !== 4 && (
            <div className="desktop-recap" style={{ position: 'sticky', top: '100px' }}>
              <div className="card" style={{ padding: '1.5rem', transition: 'none' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 400, marginBottom: '1.25rem' }}>Récapitulatif</h3>
                <OrderRecap items={items} shipping={shipping} total={total} selectedMode={selectedMode} />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes circlePop { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        @keyframes drawCheck { to { stroke-dashoffset: 0; } }
        @keyframes ringPulse { 0% { opacity: 0.6; transform: scale(1); } 100% { opacity: 0; transform: scale(1.6); } }
        @keyframes confetti {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80%  { opacity: 0.8; }
          100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.4); }
        }
        @media (max-width: 768px) {
          .checkout-layout { grid-template-columns: 1fr !important; }
          .desktop-recap { display: none !important; }
          .mobile-recap-wrapper { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; box-shadow: 0 -2px 12px rgba(0,0,0,0.12); }
          .mobile-recap { display: block; }
          .checkout-main { padding-bottom: 80px !important; }
        }
        @media (min-width: 769px) {
          .mobile-recap-wrapper { display: none; }
          .mobile-recap { display: none; }
        }
      `}</style>

      {step !== 4 && (
        <div className="mobile-recap-wrapper">
          <MobileRecap items={items} shipping={shipping} total={total} selectedMode={selectedMode} />
        </div>
      )}
    </div>
  );
}
