'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ── Icônes inline ─────────────────────────────────────────────────────────────
const IconEye = ({ open }: { open: boolean }) => open ? (
  <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
) : (
  <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="auth-layout">
      {/* ── LEFT PANEL — brand ────────────────────────────────────────────── */}
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
        {/* Subtle background texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(197,165,90,0.07) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(197,165,90,0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} aria-hidden="true" />

        {/* Gold corner accent top-right */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 120, height: 120,
          background: 'linear-gradient(225deg, rgba(197,165,90,0.12) 0%, transparent 60%)',
        }} aria-hidden="true" />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
            <div style={{
              width: 44, height: 44,
              border: '1px solid rgba(197,165,90,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 3,
            }}>
              <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', fontSize: 16, fontWeight: 300, letterSpacing: 3 }}>VB</span>
            </div>
            <div>
              <p style={{ margin: 0, fontFamily: 'var(--font-serif)', color: '#fff', fontSize: '1rem', fontWeight: 500, letterSpacing: '0.06em', lineHeight: 1.1 }}>VIP Parfumerie</p>
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', color: 'var(--gold)', fontSize: '0.5rem', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 2 }}>Bar</p>
            </div>
          </Link>
        </div>

        {/* Center quote */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Ornement */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(197,165,90,0.25)' }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', opacity: 0.6 }} />
            <div style={{ flex: 1, height: '1px', background: 'rgba(197,165,90,0.25)' }} />
          </div>

          <blockquote style={{ margin: 0 }}>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.875rem',
              fontWeight: 300,
              color: '#fff',
              lineHeight: 1.4,
              letterSpacing: '0.02em',
              marginBottom: 20,
            }}>
              L&apos;art de sentir<br />
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>ce qui vous définit.</em>
            </p>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              Abidjan · Côte d&apos;Ivoire
            </p>
          </blockquote>

          <div style={{ marginTop: 36, display: 'flex', gap: 8 }}>
            {['Quiz olfactif IA', 'Consultation privée', 'Parfum sur-mesure'].map((s) => (
              <span key={s} style={{
                fontSize: '0.5625rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(197,165,90,0.65)',
                border: '1px solid rgba(197,165,90,0.2)',
                borderRadius: 2,
                padding: '4px 10px',
                whiteSpace: 'nowrap',
              }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Footer brand */}
        <p style={{ position: 'relative', zIndex: 1, fontSize: '0.5625rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0 }}>
          © 2026 VIP Parfumerie Bar
        </p>
      </div>

      {/* ── RIGHT PANEL — form ────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 32px',
        minHeight: '100vh',
      }}>
        {/* Mobile logo */}
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
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--line-light)' }} />
              <span style={{ fontSize: '0.5625rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                Espace membre
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--line-light)' }} />
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2rem',
              fontWeight: 300,
              color: 'var(--text-primary)',
              letterSpacing: '0.03em',
              margin: 0,
              lineHeight: 1.2,
            }}>
              Connexion
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Bienvenue. Entrez vos identifiants pour accéder à votre compte.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 20,
              padding: '12px 16px',
              background: 'rgba(180,40,40,0.06)',
              border: '1px solid rgba(180,40,40,0.2)',
              borderLeft: '3px solid rgba(180,40,40,0.5)',
              borderRadius: 3,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <svg width={14} height={14} fill="none" stroke="rgba(160,20,20,0.8)" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'rgba(160,20,20,0.9)' }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 7 }}>
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="input"
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                <label htmlFor="password" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Mot de passe
                </label>
                <Link href="/auth/reset-password" style={{ fontSize: '0.75rem', color: 'var(--text-pale)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-pale)')}
                >
                  Oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-pale)', padding: 4, display: 'flex',
                  }}
                >
                  <IconEye open={showPassword} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? (
                <>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                  Connexion…
                </>
              ) : 'Se connecter'}
            </button>
          </form>

          {/* Sign up link */}
          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 28 }}>
            Pas encore de compte ?{' '}
            <Link href="/auth/signup" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @media (max-width: 1023px) { .auth-layout { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}


