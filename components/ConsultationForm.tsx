'use client';

import { useState, type FormEvent } from 'react';

export default function ConsultationForm({ siteUrl }: { siteUrl: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = {
      nom: (form.elements.namedItem('nom') as HTMLInputElement).value,
      prenom: (form.elements.namedItem('prenom') as HTMLInputElement).value || undefined,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      formule: (form.elements.namedItem('formule') as HTMLSelectElement).value || undefined,
      mode: (form.elements.namedItem('mode') as HTMLSelectElement).value || undefined,
      disponibilites: (form.elements.namedItem('disponibilites') as HTMLTextAreaElement).value || undefined,
    };

    try {
      const res = await fetch('/api/consultation', {
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
      <div style={{ background: '#fff', padding: '44px 40px', borderRadius: 3, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width={22} height={22} fill="none" stroke="var(--gold)" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', color: 'var(--text-primary)', marginBottom: 8 }}>
          Demande envoyée
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.6 }}>
          Nous vous contactons sous 4h pour confirmer votre créneau.
        </p>
        <a
          href={`${siteUrl}/services/merci`}
          style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, textDecoration: 'none' }}
        >
          Retour aux services →
        </a>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', padding: '44px 40px', borderRadius: 3 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Nom */}
          <div>
            <label htmlFor="cname" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7 }}>
              Nom <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input id="cname" name="nom" type="text" required placeholder="Votre nom" className="input" />
          </div>
          {/* Prénom */}
          <div>
            <label htmlFor="cprenom" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7 }}>Prénom</label>
            <input id="cprenom" name="prenom" type="text" placeholder="Votre prénom" className="input" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="cemail" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7 }}>
            Email <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input id="cemail" name="email" type="email" required placeholder="votre@email.com" className="input" />
        </div>

        {/* Formule */}
        <div>
          <label htmlFor="cformule" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7 }}>Formule souhaitée</label>
          <select id="cformule" name="formule" className="input">
            <option value="">Sélectionner…</option>
            <option value="decouverte">Découverte — 25 000 FCFA / 45 min</option>
            <option value="signature">Signature — 45 000 FCFA / 90 min</option>
            <option value="cadeau">Cadeau — 35 000 FCFA / 60 min</option>
          </select>
        </div>

        {/* Mode */}
        <div>
          <label htmlFor="cmode" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7 }}>Mode de consultation</label>
          <select id="cmode" name="mode" className="input">
            <option value="">Sélectionner…</option>
            <option value="presentiel">Présentiel — Abidjan</option>
            <option value="visio">Visio — WhatsApp / Google Meet</option>
          </select>
        </div>

        {/* Disponibilités */}
        <div>
          <label htmlFor="cdispo" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7 }}>Vos disponibilités</label>
          <textarea id="cdispo" name="disponibilites" rows={3} placeholder="Ex : semaine du 15 avril, libre mardi ou jeudi matin…" className="input" style={{ resize: 'vertical', lineHeight: 1.6 }} />
        </div>

        {status === 'error' && (
          <p style={{ fontSize: '0.8125rem', color: '#EF4444', margin: 0 }}>{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-gold"
          style={{ width: '100%', opacity: status === 'loading' ? 0.7 : 1, cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}
        >
          {status === 'loading' ? 'Envoi en cours…' : 'Envoyer ma demande de réservation'}
        </button>

        <p style={{ fontSize: '0.6875rem', color: 'var(--text-pale)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
          Nous vous contactons sous 4h pour confirmer le créneau.
        </p>
      </form>
    </div>
  );
}
