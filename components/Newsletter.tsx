'use client';

import React, { useState } from 'react';
import { subscribeToNewsletter } from '@/app/actions/newsletter.action';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const result = await subscribeToNewsletter({ email, phone: phone || undefined });
      if (result.success) {
        setStatus('success');
        setMessage('Bienvenue dans notre cercle. Vous recevrez prochainement nos exclusivités.');
        setEmail('');
        setPhone('');
      } else {
        setStatus('error');
        setMessage(result.error || "Une erreur est survenue lors de l'inscription.");
      }
    } catch {
      setStatus('error');
      setMessage('Une erreur est survenue. Réessayez plus tard.');
    }
  };

  return (
    <section
      style={{
        background: 'var(--noir)',
        padding: '6rem 0',
      }}
    >
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto text-center">

          {/* Eyebrow */}
          <span className="label" style={{ color: 'var(--gold)' }}>
            Cercle privé
          </span>

          {/* Heading */}
          <h2
            className="heading-lg text-white mt-4"
            style={{ fontSize: 'clamp(1.875rem, 4vw, 3rem)' }}
          >
            Accédez à nos exclusivités
          </h2>

          {/* Sub */}
          <p
            className="mt-4"
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9375rem', fontWeight: 300, lineHeight: 1.7 }}
          >
            Nouveautés en avant-première, offres réservées aux membres,
            conseils parfumerie personnalisés. Sans résidu.
          </p>

          {/* Divider */}
          <span className="gold-line mx-auto mt-6 mb-8" />

          {/* Form */}
          {status === 'success' ? (
            <p
              style={{
                color: 'var(--gold)',
                fontSize: '1rem',
                fontStyle: 'italic',
                fontFamily: 'var(--font-serif)',
              }}
            >
              {message}
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse e-mail"
                  required
                  className="input-dark flex-1"
                  style={{ height: '52px', fontSize: '0.9375rem' }}
                  aria-label="Adresse e-mail"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Téléphone (optionnel)"
                  className="input-dark"
                  style={{ height: '52px', fontSize: '0.9375rem', width: '180px' }}
                  aria-label="Numéro de téléphone"
                />
              </div>

              {status === 'error' && (
                <p
                  style={{
                    marginTop: '0.75rem',
                    color: '#e87070',
                    fontSize: '0.875rem',
                  }}
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-gold mt-4"
                style={{ width: '100%', height: '52px', fontSize: '0.8125rem' }}
              >
                {status === 'loading' ? 'Inscription...' : "Rejoindre le cercle"}
              </button>

              <p
                style={{
                  marginTop: '1rem',
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.25)',
                }}
              >
                Désinscription libre à tout moment. Aucun spam.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
