'use client';

import { useCart } from '@/lib/cart-context';
import Link from 'next/link';
import { useState } from 'react';
import { buildWhatsAppHref, hasWhatsAppSupport } from '@/lib/site-config';

type Step = 1 | 2 | 3 | 4;

type DeliveryInfo = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
};

type PaymentMethod = 'livraison' | 'orange' | 'mtn' | 'wave' | 'moov';

function formatPrice(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

const STEPS = ['Informations', 'Livraison', 'Paiement', 'Confirmation'];

const inputCls = 'input';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const hasWhatsappSupport = hasWhatsAppSupport();
  const [step, setStep] = useState<Step>(1);

  const [guestEmail, setGuestEmail] = useState('');
  const [delivery, setDelivery] = useState<DeliveryInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    country: "Côte d'Ivoire",
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('livraison');
  const [mobileNumber, setMobileNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [paymentPending, setPaymentPending] = useState(false);

  const shipping = totalPrice >= 50000 ? 0 : 2500;
  const total = totalPrice + shipping;

  function handleDeliveryChange(field: keyof DeliveryInfo, value: string) {
    setDelivery((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError('');

    const orderItems = items.map((item) => ({
      productId: item.productId ?? item.id,
      quantity: item.quantity,
      unitPrice: item.price,
      customCreation: item.customization,
    }));

    try {
      if (paymentMethod === 'livraison') {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalAmount: total,
            paymentMethod: 'cash_on_delivery',
            shippingAddress: {
              firstName: delivery.firstName,
              lastName: delivery.lastName,
              address: delivery.address,
              city: delivery.city,
              country: delivery.country,
            },
            phone: delivery.phone,
            email: guestEmail || undefined,
            notes: delivery.notes || undefined,
            items: orderItems,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erreur lors de la commande');
        setOrderNumber(`VIP-${data.order.id.substring(0, 8).toUpperCase()}`);
        setPaymentPending(false);
      } else {
        // Mobile Money — initiate via Jeko Africa
        const res = await fetch('/api/payment/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalAmount: total,
            paymentMethod,
            mobileNumber,
            shippingAddress: {
              firstName: delivery.firstName,
              lastName: delivery.lastName,
              address: delivery.address,
              city: delivery.city,
              country: delivery.country,
            },
            phone: delivery.phone,
            email: guestEmail || undefined,
            notes: delivery.notes || undefined,
            items: orderItems,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Erreur lors du paiement');
        setOrderNumber(`VIP-${data.orderId.substring(0, 8).toUpperCase()}`);
        setPaymentPending(true);
      }

      clearCart();
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
      {/* Page header */}
      <div style={{ background: 'var(--noir)', paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="container mx-auto">
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Accueil</Link>
            <span>/</span>
            <Link href="/panier" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Panier</Link>
            <span>/</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Commande</span>
          </nav>
          <h1 className="heading-lg text-white" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>Finaliser ma commande</h1>
        </div>
      </div>

      <div className="container mx-auto py-10" style={{ maxWidth: '900px' }}>
        {/* Steps indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3rem', gap: '0.25rem' }}>
          {STEPS.map((label, i) => {
            const num = (i + 1) as Step;
            const active = step === num;
            const done = step > num;
            let stepBg: string;
            if (done) stepBg = 'var(--text-primary)';
            else if (active) stepBg = 'var(--gold)';
            else stepBg = 'var(--line-light)';
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8125rem', fontWeight: 600, transition: 'all 0.2s',
                    background: stepBg,
                    color: done || active ? '#fff' : 'var(--text-pale)',
                  }}>
                    {done ? (
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : num}
                  </div>
                  <span style={{ fontSize: '0.6875rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'none', color: active ? 'var(--text-primary)' : 'var(--text-pale)', fontWeight: active ? 500 : 400 }} className="sm:block">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: '1px', margin: '0 0.5rem', background: done ? 'var(--text-secondary)' : 'var(--line-light)', marginBottom: '1.5rem' }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          <div style={{ gridColumn: 'span 2' }}>
            {/* Step 1: Informations */}
            {step === 1 && (
              <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, marginBottom: '1.5rem' }}>Vos informations</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label htmlFor="guestEmail" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Email de confirmation</label>
                    <input id="guestEmail" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="vous@email.com" className={inputCls} />
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', marginTop: '0.375rem' }}>Facultatif : nous confirmons aussi par téléphone.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label htmlFor="firstName" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Prénom *</label>
                      <input id="firstName" type="text" value={delivery.firstName} onChange={(e) => handleDeliveryChange('firstName', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="lastName" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Nom *</label>
                      <input id="lastName" type="text" value={delivery.lastName} onChange={(e) => handleDeliveryChange('lastName', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Téléphone *</label>
                    <input id="phone" type="tel" value={delivery.phone} onChange={(e) => handleDeliveryChange('phone', e.target.value)} placeholder="+225 XX XX XX XX" className={inputCls} />
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!delivery.firstName || !delivery.lastName || !delivery.phone}
                    className="btn-primary"
                    style={{ marginTop: '0.5rem', opacity: (!delivery.firstName || !delivery.lastName || !delivery.phone) ? 0.4 : 1 }}
                  >
                    Continuer →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Livraison */}
            {step === 2 && (
              <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, marginBottom: '1.5rem' }}>Adresse de livraison</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label htmlFor="country" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Pays</label>
                    <select id="country" value={delivery.country} onChange={(e) => handleDeliveryChange('country', e.target.value)} className={inputCls}>
                      <option>Côte d&apos;Ivoire</option>
                      <option>Sénégal</option>
                      <option>Mali</option>
                      <option>Burkina Faso</option>
                      <option>Guinée</option>
                      <option>Togo</option>
                      <option>Bénin</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="city" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Ville *</label>
                    <input id="city" type="text" value={delivery.city} onChange={(e) => handleDeliveryChange('city', e.target.value)} placeholder="Abidjan" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="address" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Adresse *</label>
                    <input id="address" type="text" value={delivery.address} onChange={(e) => handleDeliveryChange('address', e.target.value)} placeholder="Quartier, rue, numéro..." className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="notes" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Notes (facultatif)</label>
                    <textarea id="notes" value={delivery.notes} onChange={(e) => handleDeliveryChange('notes', e.target.value)} placeholder="Instructions particulières, point de repère..." rows={3} className={inputCls} style={{ resize: 'none' }} />
                  </div>
                  {hasWhatsappSupport ? (
                    <a
                      href={buildWhatsAppHref('Bonjour, je souhaite commander et partager ma localisation.')}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--line-light)', borderRadius: 'var(--r-md)', padding: '1rem', textDecoration: 'none', color: 'var(--text-primary)' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896.002-3.176-1.24-6.165-3.48-8.45z"/>
                      </svg>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Partager ma position via WhatsApp</p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 300 }}>Notre livreur viendra directement chez vous.</p>
                      </div>
                    </a>
                  ) : (
                    <Link
                      href="/contact"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--line-light)', borderRadius: 'var(--r-md)', padding: '1rem', textDecoration: 'none', color: 'var(--text-primary)' }}
                    >
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--gold-muted)', border: '1px solid rgba(197,165,90,0.35)', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Besoin d’aide pour la livraison ?</p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 300 }}>Contactez notre équipe et partagez vos indications.</p>
                      </div>
                    </Link>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setStep(1)} className="btn-ghost" style={{ flex: 1 }}>← Retour</button>
                    <button onClick={() => setStep(3)} disabled={!delivery.city || !delivery.address} className="btn-primary" style={{ flex: 2, opacity: (!delivery.city || !delivery.address) ? 0.4 : 1 }}>Continuer →</button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Paiement */}
            {step === 3 && (
              <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, marginBottom: '1.5rem' }}>Mode de paiement</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {([
                    { value: 'livraison', label: 'Paiement à la livraison', desc: 'Payez en espèces ou Mobile Money à la réception.', recommended: true },
                    { value: 'orange', label: 'Orange Money', desc: 'Paiement mobile sécurisé', recommended: false },
                    { value: 'mtn', label: 'MTN Mobile Money', desc: 'Paiement mobile sécurisé', recommended: false },
                    { value: 'wave', label: 'Wave', desc: 'Paiement instant Wave', recommended: false },
                  ] as const).map((opt) => (
                    <label key={opt.value} aria-label={opt.label} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem',
                      borderRadius: 'var(--r-md)', border: `1px solid ${paymentMethod === opt.value ? 'var(--noir)' : 'var(--line-light)'}`,
                      background: paymentMethod === opt.value ? 'var(--noir-card)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)} style={{ marginTop: '2px', accentColor: 'var(--gold)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: paymentMethod === opt.value ? 'var(--surface)' : 'var(--text-primary)' }}>{opt.label}</span>
                          {opt.recommended && (
                            <span style={{ fontSize: '0.625rem', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'var(--gold-muted)', color: 'var(--gold)', padding: '2px 8px', borderRadius: '2px', fontWeight: 500 }}>Recommandé</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: paymentMethod === opt.value ? 'rgba(255,255,255,0.4)' : 'var(--text-pale)', fontWeight: 300, marginTop: '0.125rem' }}>{opt.desc}</p>
                      </div>
                    </label>
                  ))}

                  {paymentMethod !== 'livraison' && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <label htmlFor="mobileNumber" style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Votre numéro Mobile Money</label>
                      <input id="mobileNumber" type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="+225 XX XX XX XX" className={inputCls} />
                    </div>
                  )}

                  {submitError && (
                    <p style={{ fontSize: '0.8125rem', color: 'rgba(160,20,20,0.9)', padding: '0.75rem', background: 'rgba(180,40,40,0.06)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(180,40,40,0.2)' }}>
                      {submitError}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button onClick={() => setStep(2)} className="btn-ghost" style={{ flex: 1 }} disabled={isSubmitting}>← Retour</button>
                    <button
                      onClick={handleSubmit}
                      className="btn-primary"
                      style={{ flex: 2, opacity: isSubmitting || (paymentMethod !== 'livraison' && !mobileNumber) ? 0.6 : 1 }}
                      disabled={isSubmitting || (paymentMethod !== 'livraison' && !mobileNumber)}
                    >
                      {isSubmitting ? 'Traitement…' : 'Confirmer →'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <svg width="28" height="28" fill="none" stroke="var(--gold)" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="heading-lg" style={{ marginBottom: '0.75rem' }}>
                  {paymentPending ? 'Paiement en attente' : 'Commande confirmée'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 300 }}>
                  {paymentPending
                    ? `Merci ${delivery.firstName} ! Confirmez le paiement sur votre téléphone. Votre commande sera traitée dès réception.`
                    : `Merci ${delivery.firstName}, votre commande a été enregistrée avec succès.`}
                </p>
                <div style={{ background: 'var(--offwhite)', borderRadius: 'var(--r-md)', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'inline-block' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-pale)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Numéro de commande</p>
                  <p style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{orderNumber}</p>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 300 }}>
                  Notre équipe vous contactera au <strong style={{ color: 'var(--text-primary)' }}>{delivery.phone}</strong> pour confirmer la livraison.
                </p>
                {hasWhatsappSupport ? (
                  <a
                    href={buildWhatsAppHref(`Bonjour, j'ai passé la commande ${orderNumber}.`) }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', background: '#25D366', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 'var(--r-md)', fontWeight: 500, textDecoration: 'none', fontSize: '0.875rem' }}
                  >
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
                <div style={{ marginTop: '1.5rem' }}>
                  <Link href="/" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'none', letterSpacing: '0.04em' }}>
                    ← Retour à l&apos;accueil
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Order recap — sticky panel */}
          {step !== 4 && (
            <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '100px', gridColumn: 'span 1' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 400, marginBottom: '1.25rem' }}>Récapitulatif</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name} ×{item.quantity}{item.isCustom ? ' · sur-mesure' : ''}
                    </span>
                    <span style={{ fontWeight: 500, flexShrink: 0 }}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--line-light)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Livraison</span>
                  <span style={shipping === 0 ? { color: 'var(--gold-dark)', fontWeight: 500 } : {}}>{shipping === 0 ? 'Offerte' : formatPrice(shipping)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--line-light)' }}>
                  <span style={{ fontWeight: 500 }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 500 }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
