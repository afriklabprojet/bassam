'use client';

import { useCart } from '@/lib/cart-context';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { buildWhatsAppHref, hasWhatsAppSupport } from '@/lib/site-config';
import { DEFAULT_SHIPPING_CONFIG, getShippingFee, type ShippingConfig, type DeliveryMode } from '@/lib/shipping';

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

type PaymentMethod = 'livraison' | 'orange' | 'mtn' | 'wave' | 'moov' | 'djamo';

function formatPrice(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

const STEPS: { label: string }[] = [
  { label: 'Livraison' },
  { label: 'Coordonnées' },
  { label: 'Paiement' },
  { label: 'Confirmation' },
];

/* ── Payment brand icons (SVG inline) ─────────────────────────────────────
   Sources: Wikimedia Commons (Orange, MTN), official brand colors for others
   ──────────────────────────────────────────────────────────────────────── */
function IconLivraison() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#C5A55A"/>
      <path d="M4 10h16v12H4V10zm16 2l5 3v7h-5V12z" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="9" cy="22" r="2" fill="#fff"/>
      <circle cx="19" cy="22" r="2" fill="#fff"/>
    </svg>
  );
}

function IconOrange() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#FF7900"/>
      <text x="16" y="21" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" fill="#fff" letterSpacing="-0.3">orange</text>
    </svg>
  );
}

function IconMTN() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#FFC300"/>
      <text x="16" y="21" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="11" fontWeight="900" fill="#000" letterSpacing="0.5">MTN</text>
    </svg>
  );
}

function IconWave() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#1DC5E0"/>
      <text x="16" y="21" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="800" fill="#fff" letterSpacing="-0.3">wave</text>
    </svg>
  );
}

function IconMoov() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#0056A3"/>
      <text x="16" y="21" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" fill="#fff" letterSpacing="-0.3">moov</text>
    </svg>
  );
}

function IconDjamo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#5B2FD4"/>
      <text x="16" y="21" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="9.5" fontWeight="700" fill="#fff" letterSpacing="-0.2">djamo</text>
    </svg>
  );
}

const PAYMENT_OPTIONS = [
  { value: 'livraison' as const, label: 'Paiement à la livraison', desc: 'Espèces ou Mobile Money à la réception.', recommended: true, accent: '#C5A55A', Icon: IconLivraison },
  { value: 'orange' as const, label: 'Orange Money', desc: 'Paiement mobile sécurisé', recommended: false, accent: '#FF7900', Icon: IconOrange },
  { value: 'mtn' as const, label: 'MTN Money', desc: 'Paiement mobile sécurisé', recommended: false, accent: '#FFC300', Icon: IconMTN },
  { value: 'wave' as const, label: 'Wave', desc: 'Paiement instant Wave', recommended: false, accent: '#1DC5E0', Icon: IconWave },
  { value: 'moov' as const, label: 'Moov Money', desc: 'Paiement mobile sécurisé', recommended: false, accent: '#0056A3', Icon: IconMoov },
  { value: 'djamo' as const, label: 'Djamo', desc: 'Carte virtuelle Djamo', recommended: false, accent: '#5B2FD4', Icon: IconDjamo },
];

function stepCircleBg(done: boolean, active: boolean): string {
  if (done) return 'var(--text-primary)';
  if (active) return 'var(--gold)';
  return '#fff';
}

function stepLabelColor(done: boolean, active: boolean): string {
  if (active) return 'var(--text-primary)';
  if (done) return 'var(--text-secondary)';
  return 'var(--text-pale)';
}

function StepIndicator({ step }: Readonly<{ step: Step }>) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2.5rem', gap: 0 }}>
      {STEPS.map((s, i) => {
        const num = (i + 1) as Step;
        const active = step === num;
        const done = step > num;
        const circleBg = stepCircleBg(done, active);
        const labelColor = stepLabelColor(done, active);
        return (
          <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.3s',
                background: circleBg,
                border: `2px solid ${circleBg === '#fff' ? 'var(--line-light)' : circleBg}`,
                color: done || active ? '#fff' : 'var(--text-pale)',
                boxShadow: active ? '0 0 0 4px rgba(197,165,90,0.15)' : 'none',
              }}>
                {done ? (
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : num}
              </div>
              <p style={{ fontSize: '0.5625rem', fontWeight: active ? 600 : 400, color: labelColor, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2 }}>
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: '2px', margin: '16px 6px 0', background: done ? 'var(--text-primary)' : 'var(--line-light)', transition: 'background 0.3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DeliveryModeButton({
  mode, selected, onSelect,
}: Readonly<{ mode: DeliveryMode; selected: boolean; onSelect: () => void }>) {
  function feeColor(): string {
    if (mode.fee === 0) return 'var(--gold-dark)';
    if (selected) return 'var(--text-primary)';
    return 'var(--text-secondary)';
  }
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '1rem 1.125rem', borderRadius: 'var(--r-md)', cursor: 'pointer',
        border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--line-light)'}`,
        background: selected ? 'rgba(197,165,90,0.04)' : '#fff',
        transition: 'all 0.18s', textAlign: 'left', width: '100%',
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? 'var(--gold)' : 'var(--line-light)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.18s',
      }}>
        {selected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)' }} />}
      </div>
      <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>
        {mode.type === 'pickup' ? '🏪' : '🚚'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {mode.label}
        </span>
        {mode.description && (
          <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-pale)', marginTop: '2px', lineHeight: 1.4 }}>
            {mode.description}
          </span>
        )}
      </div>
      <span style={{ fontSize: '0.9375rem', fontWeight: 600, flexShrink: 0, color: feeColor(), fontFamily: 'var(--font-serif)' }}>
        {mode.fee === 0 ? 'Gratuit' : formatPrice(mode.fee)}
      </span>
    </button>
  );
}

function SectionLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-pale)', marginBottom: '0.75rem', fontWeight: 600 }}>
      {children}
    </p>
  );
}

function FieldGroup({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{children}</div>;
}

function FieldRow({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>{children}</div>;
}

function Field({
  id, label, required, error, children,
}: Readonly<{ id: string; label: string; required?: boolean; error?: boolean; children: React.ReactNode }>) {
  return (
    <div>
      <label htmlFor={id} style={{
        display: 'block', fontSize: '0.6875rem', letterSpacing: '0.07em',
        textTransform: 'uppercase', color: error ? '#c0392b' : 'var(--text-secondary)',
        marginBottom: '0.4rem', fontWeight: 500,
      }}>
        {label}{required && <span style={{ color: 'var(--gold)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function DeliveryContactBlock({ hasWhatsappSupport: waSup }: Readonly<{ hasWhatsappSupport: boolean }>) {
  if (waSup) {
    return (
      <a
        href={buildWhatsAppHref('Bonjour, je souhaite commander et partager ma localisation.')}
        target="_blank" rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 'var(--r-md)', padding: '1rem', textDecoration: 'none', color: 'var(--text-primary)', background: 'rgba(37,211,102,0.04)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
          <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896.002-3.176-1.24-6.165-3.48-8.45z"/>
        </svg>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Partager ma position via WhatsApp</p>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 300, marginTop: '2px' }}>Notre livreur viendra directement chez vous.</p>
        </div>
      </a>
    );
  }
  return (
    <Link
      href="/contact"
      style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', border: '1px solid var(--line-light)', borderRadius: 'var(--r-md)', padding: '1rem', textDecoration: 'none', color: 'var(--text-primary)' }}
    >
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--gold-muted)', border: '1px solid rgba(197,165,90,0.35)', flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Besoin d&apos;aide pour la livraison ?</p>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 300, marginTop: '2px' }}>Contactez notre équipe et partagez vos indications.</p>
      </div>
    </Link>
  );
}

function OrderRecap({
  items, shipping, total, selectedMode,
}: Readonly<{
  items: ReturnType<typeof useCart>['items'];
  shipping: number;
  total: number;
  selectedMode: DeliveryMode | null;
}>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 400, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
                {item.isCustom && <span style={{ color: 'var(--gold)', fontSize: '0.6875rem', marginLeft: '4px' }}>sur-mesure</span>}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-pale)' }}>Qté {item.quantity}</span>
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, flexShrink: 0 }}>{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--line-light)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>Sous-total</span>
          <span>{formatPrice(total - shipping)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>{selectedMode ? selectedMode.label : 'Livraison'}</span>
          <span style={{ color: shipping === 0 ? 'var(--gold-dark)' : 'var(--text-secondary)' }}>
            {selectedMode ? formatPrice(shipping) : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.875rem', borderTop: '1px solid var(--line-light)', marginTop: '0.25rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>Total</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 500 }}>{formatPrice(total)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--line-light)' }}>
        {[
          { icon: '🔒', label: 'Paiement 100% sécurisé' },
          { icon: '🛡', label: 'Données protégées' },
          { icon: '✓', label: 'Authenticité garantie' },
        ].map((t) => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', width: '16px', textAlign: 'center', flexShrink: 0 }}>{t.icon}</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', letterSpacing: '0.04em' }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Step sub-components ────────────────────────────────────── */

function Step1Delivery({
  enabledModes, selectedModeId, onSelectMode, onNext,
}: Readonly<{
  enabledModes: DeliveryMode[];
  selectedModeId: string;
  onSelectMode: (id: string) => void;
  onNext: () => void;
}>) {
  return (
    <div className="card" style={{ padding: '2rem', transition: 'none' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, marginBottom: '0.375rem' }}>
        Mode de livraison
      </h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', fontWeight: 300 }}>
        Choisissez comment vous souhaitez recevoir votre commande.
      </p>
      {enabledModes.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.75rem' }}>
          {enabledModes.map((mode) => (
            <DeliveryModeButton
              key={mode.id}
              mode={mode}
              selected={selectedModeId === mode.id}
              onSelect={() => onSelectMode(mode.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-pale)', fontSize: '0.875rem', border: '1px dashed var(--line-light)', borderRadius: 'var(--r-md)', marginBottom: '1.75rem' }}>
          Aucun mode de livraison disponible.
        </div>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!selectedModeId}
        className="btn-primary"
        style={{ width: '100%', opacity: selectedModeId ? 1 : 0.4 }}
      >
        Continuer →
      </button>
    </div>
  );
}

type Step2Props = Readonly<{
  delivery: DeliveryInfo;
  guestEmail: string;
  isPickup: boolean;
  selectedMode: DeliveryMode | null;
  attempted: boolean;
  step2Valid: boolean;
  hasWhatsappSupport: boolean;
  onChange: (field: keyof DeliveryInfo, value: string) => void;
  onGuestEmail: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}>;

function Step2Contact({
  delivery, guestEmail, isPickup, selectedMode,
  attempted, step2Valid, hasWhatsappSupport,
  onChange, onGuestEmail, onBack, onNext,
}: Step2Props) {
  const fieldError = (val: boolean) => attempted && !val;
  return (
    <div className="card" style={{ padding: '2rem', transition: 'none' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, marginBottom: '0.375rem' }}>
        Vos coordonnées
      </h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', fontWeight: 300 }}>
        {isPickup ? 'Indiquez vos informations de contact.' : 'Indiquez vos informations de contact et adresse de livraison.'}
      </p>
      <FieldGroup>
        <FieldRow>
          <Field id="firstName" label="Prénom" required error={fieldError(!!delivery.firstName)}>
            <input id="firstName" type="text" value={delivery.firstName} onChange={(e) => onChange('firstName', e.target.value)} className="input" style={fieldError(!!delivery.firstName) ? { borderColor: '#c0392b' } : {}} />
          </Field>
          <Field id="lastName" label="Nom" required error={fieldError(!!delivery.lastName)}>
            <input id="lastName" type="text" value={delivery.lastName} onChange={(e) => onChange('lastName', e.target.value)} className="input" style={fieldError(!!delivery.lastName) ? { borderColor: '#c0392b' } : {}} />
          </Field>
        </FieldRow>
        <Field id="phone" label="Téléphone" required error={fieldError(!!delivery.phone)}>
          <input id="phone" type="tel" value={delivery.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="+225 XX XX XX XX" className="input" style={fieldError(!!delivery.phone) ? { borderColor: '#c0392b' } : {}} />
        </Field>
        <Field id="guestEmail" label="Email de confirmation">
          <input id="guestEmail" type="email" value={guestEmail} onChange={(e) => onGuestEmail(e.target.value)} placeholder="vous@email.com" className="input" />
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', marginTop: '0.35rem' }}>Facultatif — nous confirmons aussi par téléphone.</p>
        </Field>
        {!isPickup && (
          <>
            <div style={{ height: '1px', background: 'var(--line-light)', margin: '0.25rem 0' }} />
            <SectionLabel>Adresse de livraison</SectionLabel>
            <Field id="country" label="Pays">
              <select id="country" value={delivery.country} onChange={(e) => onChange('country', e.target.value)} className="input">
                <option>Côte d&apos;Ivoire</option>
                <option>Sénégal</option>
                <option>Mali</option>
                <option>Burkina Faso</option>
                <option>Guinée</option>
                <option>Togo</option>
                <option>Bénin</option>
              </select>
            </Field>
            <Field id="city" label="Ville" required error={fieldError(!!delivery.city)}>
              <input id="city" type="text" value={delivery.city} onChange={(e) => onChange('city', e.target.value)} placeholder="Abidjan" className="input" style={fieldError(!!delivery.city) ? { borderColor: '#c0392b' } : {}} />
            </Field>
            <Field id="address" label="Adresse" required error={fieldError(!!delivery.address)}>
              <input id="address" type="text" value={delivery.address} onChange={(e) => onChange('address', e.target.value)} placeholder="Quartier, rue, numéro..." className="input" style={fieldError(!!delivery.address) ? { borderColor: '#c0392b' } : {}} />
            </Field>
            <Field id="notes" label="Instructions de livraison">
              <textarea id="notes" value={delivery.notes} onChange={(e) => onChange('notes', e.target.value)} placeholder="Point de repère, instructions particulières..." rows={3} className="input" style={{ resize: 'none' }} />
            </Field>
            <DeliveryContactBlock hasWhatsappSupport={hasWhatsappSupport} />
          </>
        )}
        {isPickup && selectedMode && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.125rem 1.25rem', borderRadius: 'var(--r-md)', background: 'rgba(197,165,90,0.06)', border: '1px solid rgba(197,165,90,0.3)' }}>
            <span style={{ fontSize: '1.375rem', lineHeight: 1, flexShrink: 0 }}>🏪</span>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>{selectedMode.label}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.6 }}>
                {selectedMode.description && <>{selectedMode.description}<br /></>}
                Nous vous contacterons au <strong style={{ fontWeight: 600 }}>{delivery.phone || 'votre numéro'}</strong> dès que votre commande est prête.
              </p>
            </div>
          </div>
        )}
      </FieldGroup>
      <div style={{ marginTop: '1.75rem' }}>
        {attempted && !step2Valid && (
          <p style={{ fontSize: '0.75rem', color: '#c0392b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            Veuillez remplir tous les champs obligatoires.
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={onBack} className="btn-ghost" style={{ flex: '0 0 auto' }}>← Retour</button>
          <button type="button" onClick={onNext} className="btn-primary" style={{ flex: 1 }}>
            Continuer vers le paiement →
          </button>
        </div>
      </div>
    </div>
  );
}

type Step3Props = Readonly<{
  paymentMethod: PaymentMethod;
  isSubmitting: boolean;
  submitError: string;
  onPaymentMethod: (v: PaymentMethod) => void;
  onBack: () => void;
  onSubmit: () => void;
}>;

function Step3Payment({
  paymentMethod, isSubmitting, submitError,
  onPaymentMethod, onBack, onSubmit,
}: Step3Props) {
  const submitDisabled = isSubmitting;
  return (
    <div className="card" style={{ padding: '2rem', transition: 'none' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, marginBottom: '0.375rem' }}>Mode de paiement</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', fontWeight: 300 }}>
        Choisissez votre méthode de paiement préférée.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {PAYMENT_OPTIONS.map((opt) => {
          const sel = paymentMethod === opt.value;
          return (
            <label
              key={opt.value}
              aria-label={opt.label}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.125rem', borderRadius: 'var(--r-md)', border: `1.5px solid ${sel ? 'var(--gold)' : 'var(--line-light)'}`, background: sel ? 'rgba(197,165,90,0.04)' : '#fff', cursor: 'pointer', transition: 'all 0.18s' }}
            >
              <div style={{ flexShrink: 0, width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${sel ? 'var(--gold)' : 'var(--line-light)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {sel && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)' }} />}
              </div>
              <input type="radio" name="payment" value={opt.value} checked={sel} onChange={() => onPaymentMethod(opt.value)} style={{ display: 'none' }} />
              <div style={{ flexShrink: 0 }}><opt.Icon /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{opt.label}</span>
                  {opt.recommended && (
                    <span style={{ fontSize: '0.5625rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--gold-muted)', color: 'var(--gold-dark)', padding: '2px 7px', borderRadius: '2px', fontWeight: 600 }}>Recommandé</span>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-pale)', fontWeight: 300, marginTop: '1px' }}>{opt.desc}</p>
              </div>
            </label>
          );
        })}
        {paymentMethod !== 'livraison' && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0.875rem 1rem', background: 'var(--offwhite)', borderRadius: 'var(--r-md)', border: '1px solid var(--line-light)' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '1px', color: 'var(--gold)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            Votre numéro de téléphone vous sera demandé directement sur la page de paiement.
          </div>
        )}
        {submitError && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.8125rem', color: '#c0392b', padding: '0.875rem 1rem', background: 'rgba(192,57,43,0.05)', borderRadius: 'var(--r-md)', border: '1px solid rgba(192,57,43,0.2)' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            {submitError}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onBack} className="btn-ghost" style={{ flex: '0 0 auto' }} disabled={isSubmitting}>← Retour</button>
          <button type="button" onClick={onSubmit} className="btn-primary" style={{ flex: 1, opacity: submitDisabled ? 0.55 : 1 }} disabled={submitDisabled}>
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Traitement…
              </span>
            ) : 'Confirmer la commande →'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Confirmation animations ────────────────────────────────── */

const CONFETTI_PARTICLES = [
  { id: 'c1',  x: 15,   y: -65, delay: 0,    color: '#C5A55A', size: 6 },
  { id: 'c2',  x: -22,  y: -80, delay: 0.08, color: '#9B7B38', size: 4 },
  { id: 'c3',  x: 55,   y: -52, delay: 0.14, color: '#E8C97A', size: 5 },
  { id: 'c4',  x: -48,  y: -72, delay: 0.05, color: '#C5A55A', size: 4 },
  { id: 'c5',  x: 82,   y: -38, delay: 0.2,  color: '#C5A55A', size: 3 },
  { id: 'c6',  x: -78,  y: -58, delay: 0.1,  color: '#9B7B38', size: 5 },
  { id: 'c7',  x: 32,   y: -92, delay: 0.24, color: '#E8C97A', size: 6 },
  { id: 'c8',  x: -35,  y: -88, delay: 0.12, color: '#C5A55A', size: 4 },
  { id: 'c9',  x: 65,   y: -78, delay: 0.18, color: '#9B7B38', size: 3 },
  { id: 'c10', x: -62,  y: -68, delay: 0.22, color: '#C5A55A', size: 5 },
  { id: 'c11', x: 105,  y: -28, delay: 0.28, color: '#E8C97A', size: 4 },
  { id: 'c12', x: -98,  y: -42, delay: 0.06, color: '#C5A55A', size: 6 },
  { id: 'c13', x: 42,   y: -45, delay: 0.16, color: '#9B7B38', size: 3 },
  { id: 'c14', x: -15,  y: -95, delay: 0.3,  color: '#E8C97A', size: 5 },
];

function ConfettiParticles() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}>
      {CONFETTI_PARTICLES.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: p.color,
            animation: `confetti 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s both`,
            ['--tx' as string]: `${p.x}px`,
            ['--ty' as string]: `${p.y}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const hasWhatsappSupport = hasWhatsAppSupport();
  const [step, setStep] = useState<Step>(1);
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
        if (data.redirectUrl) {
          globalThis.location.href = data.redirectUrl;
          return;
        }
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
      {/* ── Page header ── */}
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

      <div className="container mx-auto py-10" style={{ maxWidth: '960px' }}>
        <StepIndicator step={step} />

        <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.75rem', alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>

            {step === 1 && (
              <Step1Delivery
                enabledModes={enabledModes}
                selectedModeId={selectedModeId}
                onSelectMode={setSelectedModeId}
                onNext={() => setStep(2)}
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
                onBack={() => { setAttempted(false); setStep(1); }}
                onNext={() => { setAttempted(true); if (step2Valid) { setAttempted(false); setStep(3); } }}
              />
            )}

            {step === 3 && (
              <Step3Payment
                paymentMethod={paymentMethod}
                isSubmitting={isSubmitting}
                submitError={submitError}
                onPaymentMethod={setPaymentMethod}
                onBack={() => setStep(2)}
                onSubmit={handleSubmit}
              />
            )}

            {/* ── Step 4 : Confirmation ── */}
            {step === 4 && (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', transition: 'none', animation: 'fadeSlideUp 0.5s ease both' }}>

                {/* Animated checkmark + confetti */}
                <div style={{ position: 'relative', width: '88px', height: '88px', margin: '0 auto 1.75rem' }}>
                  <ConfettiParticles />

                  {/* Outer pulse ring */}
                  <div style={{ position: 'absolute', inset: '-10px', borderRadius: '50%', border: '1.5px solid rgba(197,165,90,0.25)', animation: 'ringPulse 2s ease-out 0.6s infinite' }} />
                  {/* Middle ring */}
                  <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', border: '1px solid rgba(197,165,90,0.35)', animation: 'ringPulse 2s ease-out 0.9s infinite' }} />

                  {/* Circle */}
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
                    <a
                      href={buildWhatsAppHref(`Bonjour, j'ai passé la commande ${orderNumber}.`)}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', background: '#25D366', color: '#fff', padding: '0.875rem 1.75rem', borderRadius: 'var(--r-md)', fontWeight: 500, textDecoration: 'none', fontSize: '0.875rem' }}
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
                </div>

                <div style={{ marginTop: '1.75rem', animation: 'fadeSlideUp 0.45s ease 0.84s both' }}>
                  <Link href="/" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'none', letterSpacing: '0.04em' }}>
                    ← Retour à l&apos;accueil
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── Sticky recap ── */}
          {step !== 4 && (
            <div style={{ position: 'sticky', top: '100px' }}>
              <div className="card" style={{ padding: '1.5rem', transition: 'none' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 400, marginBottom: '1.25rem' }}>
                  Récapitulatif
                </h3>
                <OrderRecap items={items} shipping={shipping} total={total} selectedMode={selectedMode} />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes circlePop {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }

        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }

        @keyframes ringPulse {
          0%   { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0;   transform: scale(1.6); }
        }

        @keyframes confetti {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80%  { opacity: 0.8; }
          100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.4); }
        }

        @media (max-width: 768px) {
          .checkout-layout { grid-template-columns: 1fr !important; }
          .checkout-layout > *:last-child { order: -1; }
        }
      `}</style>
    </div>
  );
}
