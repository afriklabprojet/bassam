'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/update-password`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--offwhite)' }}>
        <div className="max-w-md w-full text-center space-y-5">
          <div className="mx-auto flex items-center justify-center w-14 h-14" style={{ border: '1px solid var(--line-light)', borderRadius: '50%' }}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--gold)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-light" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
            Email envoyé
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Si un compte existe avec l&apos;adresse{' '}
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{email}</span>, vous recevrez un
            email avec un lien pour réinitialiser votre mot de passe.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-pale)' }}>
            Vérifiez votre boîte de réception et vos spams.
          </p>
          <Link
            href="/auth/login"
            className="inline-block text-sm transition-colors"
            style={{ color: 'var(--gold)' }}
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--offwhite)' }}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-6">
            <div style={{ width: 40, height: 40, background: 'var(--noir)', border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
              <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', fontSize: 16, fontWeight: 300, letterSpacing: 2 }}>VB</span>
            </div>
          </div>
          <h2 className="mt-4 text-center text-3xl font-light" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
            Mot de passe oublié
          </h2>
          <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleResetPassword}>
          {error && (
            <div className="p-3 border border-red-200 bg-red-50" style={{ borderRadius: 'var(--r-sm)' }}>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="label">Adresse email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>

          <div className="text-center text-sm">
            <Link
              href="/auth/login"
              className="transition-colors"
              style={{ color: 'var(--gold)' }}
            >
              Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
