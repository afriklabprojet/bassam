'use client';

import { useState } from 'react';

interface ReviewFormProps {
  readonly onSuccess?: () => void;
}

export default function ReviewForm({ onSuccess }: ReviewFormProps) {
  const [form, setForm] = useState({ name: '', ville: '', texte: '', rating: 5 });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erreur lors de l\'envoi.');
        setStatus('error');
        return;
      }

      setStatus('success');
      setForm({ name: '', ville: '', texte: '', rating: 5 });
      onSuccess?.();
    } catch {
      setErrorMsg('Connexion impossible. Réessayez.');
      setStatus('error');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8,
    fontFamily: 'var(--font-sans)', fontSize: '0.9375rem',
    color: 'var(--text-primary)', background: '#fff',
    outline: 'none', transition: 'border-color 0.2s',
  };

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #d4edda', borderRadius: 12, background: '#f8fff9' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✓</div>
        <p style={{ fontWeight: 600, color: '#2d6a4f', fontSize: '1rem' }}>Merci pour votre avis !</p>
        <p style={{ fontSize: '0.875rem', color: '#52796f', marginTop: '0.375rem' }}>
          Il sera publié après validation par notre équipe.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Étoiles */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Note
        </legend>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setForm(f => ({ ...f, rating: n }))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
              aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={n <= form.rating ? 'var(--gold)' : 'none'} stroke={n <= form.rating ? 'var(--gold)' : '#ccc'} strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Nom & Ville */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label htmlFor="review-name" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Prénom *
          </label>
          <input
            id="review-name"
            style={inputStyle}
            type="text"
            placeholder="ex. Adjoua M."
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            maxLength={80}
          />
        </div>
        <div>
          <label htmlFor="review-ville" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Ville *
          </label>
          <input
            id="review-ville"
            style={inputStyle}
            type="text"
            placeholder="ex. Abidjan"
            value={form.ville}
            onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
            required
            maxLength={80}
          />
        </div>
      </div>

      {/* Texte */}
      <div>
        <label htmlFor="review-texte" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Votre avis *
        </label>
        <textarea
          id="review-texte"
          style={{ ...inputStyle, resize: 'vertical', minHeight: '6rem' }}
          placeholder="Partagez votre expérience avec VIP Parfumerie Bar…"
          value={form.texte}
          onChange={e => setForm(f => ({ ...f, texte: e.target.value }))}
          required
          minLength={10}
          maxLength={500}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textAlign: 'right' }}>
          {form.texte.length}/500
        </p>
      </div>

      {errorMsg && (
        <p style={{ fontSize: '0.875rem', color: '#c0392b', background: '#fdecea', padding: '0.625rem 0.875rem', borderRadius: 8 }}>
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding: '0.875rem 2rem', background: 'var(--gold)', color: '#fff',
          border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.9375rem',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1,
          fontFamily: 'var(--font-sans)', letterSpacing: '0.04em',
          transition: 'opacity 0.2s',
        }}
      >
        {status === 'loading' ? 'Envoi en cours…' : 'Publier mon avis'}
      </button>
    </form>
  );
}
