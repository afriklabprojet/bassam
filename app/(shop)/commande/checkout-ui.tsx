'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { buildWhatsAppHref } from '@/lib/site-config';
import type { DeliveryMode } from '@/lib/shipping';
import type { useCart } from '@/lib/cart-context';

/* ── Types (re-exported for page.tsx to import from one place) ─────────────── */

export type Step = 1 | 2 | 3 | 4;
export type Direction = 'forward' | 'back';

export type DeliveryInfo = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
};

export type PaymentMethod = 'livraison' | 'orange' | 'mtn' | 'wave' | 'moov' | 'djamo';

export const STEPS: { label: string }[] = [
  { label: 'Livraison' },
  { label: 'Coordonnées' },
  { label: 'Paiement' },
  { label: 'Confirmation' },
];

/* ── Payment brand icons ───────────────────────────────────────────────────── */

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
  return <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="6" fill="#FF7900"/><text x="16" y="21" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" fill="#fff" letterSpacing="-0.3">orange</text></svg>;
}
function IconMTN() {
  return <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="6" fill="#FFC300"/><text x="16" y="21" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="11" fontWeight="900" fill="#000" letterSpacing="0.5">MTN</text></svg>;
}
function IconWave() {
  return <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="6" fill="#1DC5E0"/><text x="16" y="21" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="800" fill="#fff" letterSpacing="-0.3">wave</text></svg>;
}
function IconMoov() {
  return <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="6" fill="#0056A3"/><text x="16" y="21" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" fill="#fff" letterSpacing="-0.3">moov</text></svg>;
}
function IconDjamo() {
  return <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="6" fill="#5B2FD4"/><text x="16" y="21" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="9.5" fontWeight="700" fill="#fff" letterSpacing="-0.2">djamo</text></svg>;
}

export const PAYMENT_OPTIONS = [
  { value: 'livraison' as const, label: 'Paiement à la livraison', desc: 'Espèces ou Mobile Money à la réception.', recommended: true, accent: '#C5A55A', Icon: IconLivraison },
  { value: 'orange' as const, label: 'Orange Money', desc: 'Paiement mobile sécurisé', recommended: false, accent: '#FF7900', Icon: IconOrange },
  { value: 'mtn' as const, label: 'MTN Money', desc: 'Paiement mobile sécurisé', recommended: false, accent: '#FFC300', Icon: IconMTN },
  { value: 'wave' as const, label: 'Wave', desc: 'Paiement instant Wave', recommended: false, accent: '#1DC5E0', Icon: IconWave },
  { value: 'moov' as const, label: 'Moov Money', desc: 'Paiement mobile sécurisé', recommended: false, accent: '#0056A3', Icon: IconMoov },
  { value: 'djamo' as const, label: 'Djamo', desc: 'Carte virtuelle Djamo', recommended: false, accent: '#5B2FD4', Icon: IconDjamo },
];

/* ── ProgressBar ───────────────────────────────────────────────────────────── */

export function ProgressBar({ step }: Readonly<{ step: Step }>) {
  const pct = ((step - 1) / (STEPS.length - 1)) * 100;
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: '4px', background: 'var(--line-light)', borderRadius: '2px', zIndex: 0 }} />
        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: '4px', width: `${pct}%`, background: 'var(--gold)', borderRadius: '2px', zIndex: 0, transition: 'width 0.35s ease' }} />
        {STEPS.map((s, i) => {
          const num = (i + 1) as Step;
          const isActive = step === num;
          const isDone = step > num;
          const chipBg = isActive ? 'var(--gold)' : isDone ? 'var(--text-primary)' : 'var(--offwhite)';
          const chipBorder = isActive ? 'var(--gold)' : isDone ? 'var(--text-primary)' : 'var(--line-light)';
          const labelColor = isActive ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-pale)';
          return (
            <div key={s.label} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 600, transition: 'all 0.3s', background: chipBg, border: `2px solid ${chipBorder}`, color: isActive || isDone ? '#fff' : 'var(--text-pale)', boxShadow: isActive ? '0 0 0 4px rgba(197,165,90,0.18)' : 'none' }}>
                {isDone ? <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : num}
              </div>
              <span style={{ fontSize: '0.5625rem', fontWeight: isActive ? 600 : 400, color: labelColor, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <p style={{ textAlign: 'center', fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>
        Étape {step} sur {STEPS.length} · {STEPS[step - 1].label}
      </p>
    </div>
  );
}

/* ── StepRecap ─────────────────────────────────────────────────────────────── */

type StepRecapProps = Readonly<{
  step: Step;
  selectedMode: DeliveryMode | null;
  shipping: number;
  delivery: DeliveryInfo;
  paymentMethod: PaymentMethod;
  onGoToStep: (s: Step) => void;
}>;

export function StepRecap({ step, selectedMode, shipping, delivery, paymentMethod, onGoToStep }: StepRecapProps) {
  if (step <= 1) return null;
  const paymentLabel = PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label ?? paymentMethod;
  const stripStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: 'var(--offwhite)', border: '1px solid var(--line-light)', borderRadius: '3px', padding: '10px 16px', marginBottom: '0.5rem' };
  const checkStyle: React.CSSProperties = { color: 'var(--gold)', fontWeight: 700, flexShrink: 0, fontSize: '0.75rem' };
  const textStyle: React.CSSProperties = { flex: 1, fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  const modifierStyle: React.CSSProperties = { fontSize: '0.6875rem', color: 'var(--gold)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0, flexShrink: 0 };
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {step >= 2 && selectedMode && (
        <div style={stripStyle}>
          <span style={checkStyle}>✓</span>
          <span style={textStyle}>Livraison : {selectedMode.label}{' — '}<span style={{ fontWeight: 500 }}>{shipping === 0 ? 'Gratuit' : formatPrice(shipping)}</span></span>
          <button type="button" style={modifierStyle} onClick={() => onGoToStep(1)}>Modifier</button>
        </div>
      )}
      {step >= 3 && delivery.firstName && (
        <div style={stripStyle}>
          <span style={checkStyle}>✓</span>
          <span style={textStyle}>Contact : {delivery.firstName} {delivery.lastName} · {delivery.phone}</span>
          <button type="button" style={modifierStyle} onClick={() => onGoToStep(2)}>Modifier</button>
        </div>
      )}
      {step >= 4 && (
        <div style={stripStyle}>
          <span style={checkStyle}>✓</span>
          <span style={textStyle}>Paiement : {paymentLabel}</span>
          <button type="button" style={modifierStyle} onClick={() => onGoToStep(3)}>Modifier</button>
        </div>
      )}
    </div>
  );
}

/* ── StepTransition ────────────────────────────────────────────────────────── */

export function StepTransition({ step, direction, children }: Readonly<{ step: Step; direction: Direction; children: React.ReactNode }>) {
  return (
    <div key={step} style={{ animation: `${direction === 'forward' ? 'slideInRight' : 'slideInLeft'} 0.28s ease both` }}>
      {children}
    </div>
  );
}

/* ── StepCardHeader ────────────────────────────────────────────────────────── */

export function StepCardHeader({ stepNum, title, subtitle }: Readonly<{ stepNum: number; title: string; subtitle: string }>) {
  return (
    <div style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '0.875rem', marginBottom: '1.75rem' }}>
      <p style={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.25rem' }}>Étape {stepNum}</p>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, marginBottom: '0.25rem' }}>{title}</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 300 }}>{subtitle}</p>
    </div>
  );
}

/* ── DeliveryModeButton ────────────────────────────────────────────────────── */

export function DeliveryModeButton({ mode, selected, onSelect }: Readonly<{ mode: DeliveryMode; selected: boolean; onSelect: () => void }>) {
  const feeColor = mode.fee === 0 ? 'var(--gold-dark)' : selected ? 'var(--text-primary)' : 'var(--text-secondary)';
  return (
    <button type="button" onClick={onSelect} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.125rem', borderRadius: 'var(--r-md)', cursor: 'pointer', border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--line-light)'}`, background: selected ? 'rgba(197,165,90,0.04)' : '#fff', transition: 'all 0.18s', textAlign: 'left', width: '100%' }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${selected ? 'var(--gold)' : 'var(--line-light)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.18s' }}>
        {selected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)' }} />}
      </div>
      <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{mode.type === 'pickup' ? '🏪' : '🚚'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{mode.label}</span>
        {mode.description && <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-pale)', marginTop: '2px', lineHeight: 1.4 }}>{mode.description}</span>}
      </div>
      <span style={{ fontSize: '0.9375rem', fontWeight: 600, flexShrink: 0, color: feeColor, fontFamily: 'var(--font-serif)' }}>
        {mode.fee === 0 ? 'Gratuit' : formatPrice(mode.fee)}
      </span>
    </button>
  );
}

/* ── Field helpers ─────────────────────────────────────────────────────────── */

export function SectionLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-pale)', marginBottom: '0.75rem', fontWeight: 600 }}>{children}</p>;
}

export function FieldGroup({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{children}</div>;
}

export function FieldRow({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>{children}</div>;
}

export function Field({ id, label, required, error, children }: Readonly<{ id: string; label: string; required?: boolean; error?: boolean; children: React.ReactNode }>) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.07em', textTransform: 'uppercase', color: error ? '#c0392b' : 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 500 }}>
        {label}{required && <span style={{ color: 'var(--gold)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── DeliveryContactBlock ──────────────────────────────────────────────────── */

export function DeliveryContactBlock({ hasWhatsappSupport: waSup }: Readonly<{ hasWhatsappSupport: boolean }>) {
  if (waSup) {
    return (
      <a href={buildWhatsAppHref('Bonjour, je souhaite commander et partager ma localisation.')} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 'var(--r-md)', padding: '1rem', textDecoration: 'none', color: 'var(--text-primary)', background: 'rgba(37,211,102,0.04)' }}>
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
    <Link href="/contact" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', border: '1px solid var(--line-light)', borderRadius: 'var(--r-md)', padding: '1rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--gold-muted)', border: '1px solid rgba(197,165,90,0.35)', flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Besoin d&apos;aide pour la livraison ?</p>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 300, marginTop: '2px' }}>Contactez notre équipe et partagez vos indications.</p>
      </div>
    </Link>
  );
}

/* ── OrderRecap ────────────────────────────────────────────────────────────── */

type OrderRecapProps = Readonly<{
  items: ReturnType<typeof useCart>['items'];
  shipping: number;
  total: number;
  selectedMode: DeliveryMode | null;
}>;

function OrderRecapBody({ items, shipping, total, selectedMode }: OrderRecapProps) {
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
          <span>Sous-total</span><span>{formatPrice(total - shipping)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <span>{selectedMode ? selectedMode.label : 'Livraison'}</span>
          <span style={{ color: shipping === 0 ? 'var(--gold-dark)' : 'var(--text-secondary)' }}>{selectedMode ? formatPrice(shipping) : '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.875rem', borderTop: '1px solid var(--line-light)', marginTop: '0.25rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>Total</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 500 }}>{formatPrice(total)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--line-light)' }}>
        {[{ icon: '🔒', label: 'Paiement 100% sécurisé' }, { icon: '🛡', label: 'Données protégées' }, { icon: '✓', label: 'Authenticité garantie' }].map((t) => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', width: '16px', textAlign: 'center', flexShrink: 0 }}>{t.icon}</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', letterSpacing: '0.04em' }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderRecap(props: OrderRecapProps) {
  return <OrderRecapBody {...props} />;
}

export function MobileRecap({ items, shipping, total, selectedMode }: OrderRecapProps) {
  const [open, setOpen] = useState(false);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return (
    <div className="mobile-recap">
      <button type="button" onClick={() => setOpen((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'var(--noir)', border: 'none', cursor: 'pointer', borderBottom: open ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#fff', fontWeight: 500 }}>
          <svg width="16" height="16" fill="none" stroke="var(--gold)" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          Récapitulatif · {itemCount} article{itemCount > 1 ? 's' : ''}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontWeight: 500, color: 'var(--gold)' }}>{formatPrice(total)}</span>
          <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" viewBox="0 0 24 24" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: '1.25rem 1rem', background: '#fff', borderTop: '1px solid var(--line-light)' }}>
          <OrderRecapBody items={items} shipping={shipping} total={total} selectedMode={selectedMode} />
        </div>
      )}
    </div>
  );
}

/* ── Step sub-components ───────────────────────────────────────────────────── */

export function Step1Delivery({ enabledModes, selectedModeId, onSelectMode, onNext }: Readonly<{ enabledModes: DeliveryMode[]; selectedModeId: string; onSelectMode: (id: string) => void; onNext: () => void }>) {
  return (
    <div className="card" style={{ padding: '2rem', transition: 'none' }}>
      <StepCardHeader stepNum={1} title="Mode de livraison" subtitle="Choisissez comment vous souhaitez recevoir votre commande." />
      {enabledModes.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.75rem' }}>
          {enabledModes.map((mode) => (
            <DeliveryModeButton key={mode.id} mode={mode} selected={selectedModeId === mode.id} onSelect={() => onSelectMode(mode.id)} />
          ))}
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-pale)', fontSize: '0.875rem', border: '1px dashed var(--line-light)', borderRadius: 'var(--r-md)', marginBottom: '1.75rem' }}>
          Aucun mode de livraison disponible.
        </div>
      )}
      <button type="button" onClick={onNext} disabled={!selectedModeId} className="btn-primary" style={{ width: '100%', opacity: selectedModeId ? 1 : 0.4 }}>
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

export function Step2Contact({ delivery, guestEmail, isPickup, selectedMode, attempted, step2Valid, hasWhatsappSupport, onChange, onGuestEmail, onBack, onNext }: Step2Props) {
  const fieldError = (val: boolean) => attempted && !val;
  return (
    <div className="card" style={{ padding: '2rem', transition: 'none' }}>
      <StepCardHeader stepNum={2} title="Vos coordonnées" subtitle={isPickup ? 'Indiquez vos informations de contact.' : 'Indiquez vos informations de contact et adresse de livraison.'} />
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
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
            Veuillez remplir tous les champs obligatoires.
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={onBack} className="btn-ghost" style={{ flex: '0 0 auto' }}>← Retour</button>
          <button type="button" onClick={onNext} className="btn-primary" style={{ flex: 1 }}>Continuer →</button>
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

export function Step3Payment({ paymentMethod, isSubmitting, submitError, onPaymentMethod, onBack, onSubmit }: Step3Props) {
  return (
    <div className="card" style={{ padding: '2rem', transition: 'none' }}>
      <StepCardHeader stepNum={3} title="Mode de paiement" subtitle="Choisissez votre méthode de paiement préférée." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {PAYMENT_OPTIONS.map((opt) => {
          const sel = paymentMethod === opt.value;
          return (
            <label key={opt.value} aria-label={opt.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.125rem', borderRadius: 'var(--r-md)', border: `1.5px solid ${sel ? 'var(--gold)' : 'var(--line-light)'}`, background: sel ? 'rgba(197,165,90,0.04)' : '#fff', cursor: 'pointer', transition: 'all 0.18s' }}>
              <div style={{ flexShrink: 0, width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${sel ? 'var(--gold)' : 'var(--line-light)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {sel && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)' }} />}
              </div>
              <input type="radio" name="payment" value={opt.value} checked={sel} onChange={() => onPaymentMethod(opt.value)} style={{ display: 'none' }} />
              <div style={{ flexShrink: 0 }}><opt.Icon /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{opt.label}</span>
                  {opt.recommended && <span style={{ fontSize: '0.5625rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--gold-muted)', color: 'var(--gold-dark)', padding: '2px 7px', borderRadius: '2px', fontWeight: 600 }}>Recommandé</span>}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-pale)', fontWeight: 300, marginTop: '1px' }}>{opt.desc}</p>
              </div>
            </label>
          );
        })}
        {paymentMethod !== 'livraison' && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0.875rem 1rem', background: 'var(--offwhite)', borderRadius: 'var(--r-md)', border: '1px solid var(--line-light)' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '1px', color: 'var(--gold)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
            Votre numéro de téléphone vous sera demandé directement sur la page de paiement.
          </div>
        )}
        {submitError && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.8125rem', color: '#c0392b', padding: '0.875rem 1rem', background: 'rgba(192,57,43,0.05)', borderRadius: 'var(--r-md)', border: '1px solid rgba(192,57,43,0.2)' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '1px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
            {submitError}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onBack} className="btn-ghost" style={{ flex: '0 0 auto' }} disabled={isSubmitting}>← Retour</button>
          <button type="button" onClick={onSubmit} className="btn-primary" style={{ flex: 1, opacity: isSubmitting ? 0.55 : 1 }} disabled={isSubmitting}>
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

/* ── ConfettiParticles ─────────────────────────────────────────────────────── */

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

export function ConfettiParticles() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}>
      {CONFETTI_PARTICLES.map((p) => (
        <div key={p.id} style={{ position: 'absolute', left: '50%', top: '50%', width: `${p.size}px`, height: `${p.size}px`, borderRadius: '50%', background: p.color, animation: `confetti 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s both`, ['--tx' as string]: `${p.x}px`, ['--ty' as string]: `${p.y}px` }} />
      ))}
    </div>
  );
}
