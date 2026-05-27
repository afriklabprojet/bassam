'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// ── Icônes inline ─────────────────────────────────────────────────────────────
const IconEye = ({ open }: { open: boolean }) => open ? (
  <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
) : (
  <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const IconGoogle = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const IconFacebook = () => (
  <svg width={17} height={17} fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || globalThis.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (signInError) { setError(signInError.message); setLoading(false); }
  };

  // ── État succès — email de confirmation envoyé ─────────────────────────────
  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          {/* Icône checkmark doré */}
          <div style={{
            width: 60, height: 60, margin: '0 auto 28px',
            border: '1px solid rgba(197,165,90,0.4)',
            borderRadius: '50%', background: 'rgba(197,165,90,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={22} height={22} fill="none" stroke="var(--gold)" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          {/* Séparateur éditorial */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, justifyContent: 'center' }}>
            <div style={{ width: 40, height: '1px', background: 'var(--line-light)' }} />
            <span style={{ fontSize: '0.5625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)' }}>Compte créé</span>
            <div style={{ width: 40, height: '1px', background: 'var(--line-light)' }} />
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem', fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '0.03em', margin: '0 0 14px' }}>
            Vérifiez votre email
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 8px' }}>
            Un lien de confirmation a été envoyé à{' '}
            <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{email}</strong>.
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-pale)', lineHeight: 1.65, margin: '0 0 28px' }}>
            Cliquez sur le lien dans l&apos;email pour activer votre compte.
          </p>
          <Link href="/auth/login" style={{ fontSize: '0.8125rem', color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  // ── Formulaire principal ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="auth-layout">

      {/* LEFT PANEL — brand */}
      <div
        className="hidden lg:flex"
        style={{
          background: 'var(--noir)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Fond radial or */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 75% 25%, rgba(197,165,90,0.07) 0%, transparent 55%), radial-gradient(circle at 25% 75%, rgba(197,165,90,0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: 0, left: 0, width: 120, height: 120, background: 'linear-gradient(135deg, rgba(197,165,90,0.1) 0%, transparent 60%)' }} aria-hidden="true" />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
            <div style={{ width: 44, height: 44, border: '1px solid rgba(197,165,90,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}>
              <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', fontSize: 16, fontWeight: 300, letterSpacing: 3 }}>VB</span>
            </div>
            <div>
              <p style={{ margin: 0, fontFamily: 'var(--font-serif)', color: '#fff', fontSize: '1rem', fontWeight: 500, letterSpacing: '0.06em', lineHeight: 1.1 }}>VIP Parfumerie</p>
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', color: 'var(--gold)', fontSize: '0.5rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 2 }}>Bar</p>
            </div>
          </Link>
        </div>

        {/* Avantages membres */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(197,165,90,0.25)' }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', opacity: 0.6 }} />
            <div style={{ flex: 1, height: '1px', background: 'rgba(197,165,90,0.25)' }} />
          </div>

          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.625rem', fontWeight: 300, color: '#fff', lineHeight: 1.4, letterSpacing: '0.02em', margin: '0 0 28px' }}>
            Rejoignez un cercle<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>d&apos;exception.</em>
          </p>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '◆', text: 'Accès prioritaire aux nouvelles collections' },
              { icon: '◆', text: 'Quiz olfactif IA personnalisé' },
              { icon: '◆', text: 'Consultation privée sur rendez-vous' },
              { icon: '◆', text: 'Offres exclusives membres VIP' },
            ].map(({ icon, text }) => (
              <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ color: 'var(--gold)', fontSize: '0.45rem', marginTop: 5, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p style={{ position: 'relative', zIndex: 1, fontSize: '0.5625rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>
          © 2026 VIP Parfumerie Bar
        </p>
      </div>

      {/* RIGHT PANEL — formulaire */}
      <div style={{
        background: 'var(--surface)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '48px 32px', minHeight: '100vh',
      }}>
        {/* Logo mobile */}
        <div className="lg:hidden" style={{ marginBottom: 32, textAlign: 'center' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, background: 'var(--noir)', border: '1px solid rgba(197,165,90,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}>
              <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', fontSize: 15, fontWeight: 300, letterSpacing: 3 }}>VB</span>
            </div>
            <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontSize: '1rem', letterSpacing: '0.06em' }}>VIP Parfumerie Bar</span>
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--line-light)' }} />
              <span style={{ fontSize: '0.5625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                Nouveau membre
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--line-light)' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '0.03em', margin: 0, lineHeight: 1.2 }}>
              Créer un compte
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Rejoignez VIP Parfumerie Bar et accédez à votre espace privé.
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(180,40,40,0.06)', border: '1px solid rgba(180,40,40,0.2)', borderLeft: '3px solid rgba(180,40,40,0.5)', borderRadius: 3, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <svg width={14} height={14} fill="none" stroke="rgba(160,20,20,0.8)" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'rgba(160,20,20,0.9)' }}>{error}</p>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Nom complet */}
            <div>
              <label htmlFor="full-name" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7 }}>
                Nom complet
              </label>
              <input
                id="full-name" name="name" type="text" autoComplete="name" required
                value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Votre nom complet"
                className="input"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7 }}>
                Adresse email
              </label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="input"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7 }}>
                Mot de passe <span style={{ color: 'var(--text-pale)', fontWeight: 400, letterSpacing: '0.04em', textTransform: 'none', fontSize: '0.6rem' }}>min. 6 caractères</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingRight: 42 }}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-pale)', padding: 4, display: 'flex' }}>
                  <IconEye open={showPassword} />
                </button>
              </div>
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirm-password" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7 }}>
                Confirmer le mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm-password" name="confirm-password" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" required
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  style={{
                    paddingRight: 42,
                    ...(confirmPassword && confirmPassword !== password ? { borderColor: 'rgba(180,40,40,0.45)' } : {}),
                  }}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-pale)', padding: 4, display: 'flex' }}>
                  <IconEye open={showConfirm} />
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p style={{ margin: '5px 0 0', fontSize: '0.6875rem', color: '#EF4444' }}>Les mots de passe ne correspondent pas.</p>
              )}
            </div>

            {/* Bouton submit */}
            <button
              type="submit" disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: 4, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? (
                <>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                  Création du compte…
                </>
              ) : 'Créer mon compte'}
            </button>
          </form>

          {/* Séparateur OAuth */}
          <div style={{ margin: '22px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--line-light)' }} />
            <span style={{ fontSize: '0.625rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-pale)', whiteSpace: 'nowrap' }}>Ou s&apos;inscrire avec</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--line-light)' }} />
          </div>

          {/* Boutons OAuth */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { provider: 'google' as const, icon: <IconGoogle />, label: 'Google' },
              { provider: 'facebook' as const, icon: <IconFacebook />, label: 'Facebook' },
            ].map(({ provider, icon, label }) => (
              <button
                key={provider} type="button" onClick={() => handleOAuth(provider)} disabled={loading}
                style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid var(--line-light)', borderRadius: 3, background: '#fff', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: loading ? 'not-allowed' : 'pointer', transition: 'border-color 0.15s, background 0.15s', opacity: loading ? 0.5 : 1 }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--text-pale)'; e.currentTarget.style.background = 'var(--offwhite)'; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line-light)'; e.currentTarget.style.background = '#fff'; }}
              >
                {icon}
                <span style={{ fontWeight: 500 }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Lien connexion */}
          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 26 }}>
            Déjà membre ?{' '}
            <Link href="/auth/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @media (max-width: 1023px) { .auth-layout { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
