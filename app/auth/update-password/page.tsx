'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--offwhite)' }}>
        <div className="max-w-md w-full text-center space-y-5">
          <div className="mx-auto flex items-center justify-center w-14 h-14" style={{ border: '1px solid var(--line-light)', borderRadius: '50%' }}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--gold)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-light" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
            Mot de passe modifié
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Votre mot de passe a été modifié avec succès.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-pale)' }}>
            Redirection vers l&apos;accueil...
          </p>
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
            Nouveau mot de passe
          </h2>
          <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Choisissez un nouveau mot de passe sécurisé
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleUpdatePassword}>
          {error && (
            <div className="p-3 border border-red-200 bg-red-50" style={{ borderRadius: 'var(--r-sm)' }}>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="password" className="label">Nouveau mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                placeholder="Min. 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="label">Confirmer le mot de passe</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>

          <div className="text-center text-sm">
            <Link
              href="/"
              className="transition-colors"
              style={{ color: 'var(--gold)' }}
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
