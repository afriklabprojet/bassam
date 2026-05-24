'use client';

import { useState, type FormEvent } from 'react';

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px', fontSize: '0.875rem',
  color: 'var(--text-primary)', background: 'var(--surface)',
  border: '1px solid var(--line-light)', borderRadius: 3, outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7,
};

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      sujet: (form.elements.namedItem('sujet') as HTMLSelectElement).value || undefined,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erreur lors de l\'envoi');
      setStatus('success');
      form.reset();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Une erreur est survenue');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div style={{ background: '#fff', padding: '40px 36px', borderRadius: 3, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width={22} height={22} fill="none" stroke="var(--gold)" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: 8 }}>Message envoyé</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Nous vous répondons sous 2h en jours ouvrés.</p>
        <button
          onClick={() => setStatus('idle')}
          style={{ marginTop: 20, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontWeight: 500 }}
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', padding: '40px 36px', borderRadius: 3 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Nom */}
        <div>
          <label htmlFor="name" style={labelStyle}>
            Nom complet <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input id="name" name="name" type="text" required placeholder="Votre nom" style={inputStyle} />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" style={labelStyle}>
            Email <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input id="email" name="email" type="email" required placeholder="votre@email.com" style={inputStyle} />
        </div>

        {/* Sujet */}
        <div>
          <label htmlFor="sujet" style={labelStyle}>Sujet</label>
          <select id="sujet" name="sujet" style={{ ...inputStyle, appearance: 'none' }}>
            <option value="">Sélectionner un sujet…</option>
            <option value="commande">Commande / Livraison</option>
            <option value="conseil">Conseil olfactif</option>
            <option value="partenariat">Partenariat / B2B</option>
            <option value="consultation">Consultation privée</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" style={labelStyle}>
            Message <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <textarea
            id="message" name="message" required rows={5}
            placeholder="Décrivez votre demande…"
            style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {status === 'error' && (
          <p style={{ fontSize: '0.8125rem', color: '#EF4444', margin: 0 }}>{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            height: 48, background: status === 'loading' ? 'var(--text-secondary)' : 'var(--noir)',
            color: '#fff', border: 'none', borderRadius: 3,
            fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.3s ease',
          }}
        >
          {status === 'loading' ? 'Envoi en cours…' : (
            <>
              Envoyer le message
              <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
