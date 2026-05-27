'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('Identifiants incorrects.');
      setLoading(false);
      return;
    }

    // Vérifier le rôle admin
    const role = data.user?.app_metadata?.role;
    if (role !== 'admin') {
      await supabase.auth.signOut();
      setError('Accès réservé aux administrateurs.');
      setLoading(false);
      return;
    }

    const next = searchParams.get('next');
    const destination = next?.startsWith('/') ? next : '/admin';
    router.push(destination);
    router.refresh();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080808',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background accents */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(197,165,90,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(197,165,90,0.04) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Subtle grid lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(197,165,90,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(197,165,90,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '420px',
          padding: '0 24px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 16px',
              border: '1px solid rgba(197,165,90,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                color: '#C5A55A',
                fontSize: '1.125rem',
                fontWeight: 300,
                letterSpacing: '0.2em',
              }}
            >
              VP
            </span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              margin: 0,
            }}
          >
            Administration
          </h1>
          <p
            style={{
              color: '#666',
              fontSize: '0.8125rem',
              marginTop: '6px',
              letterSpacing: '0.02em',
            }}
          >
            Espace réservé aux administrateurs
          </p>
        </div>

        {/* Login card */}
        <div
          style={{
            background: 'rgba(25,25,25,0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '32px',
          }}
        >
          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="admin-email"
                style={{
                  display: 'block',
                  color: '#999',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '8px',
                }}
              >
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vipparfumerie.com"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(197,165,90,0.4)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="admin-password"
                style={{
                  display: 'block',
                  color: '#999',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '8px',
                }}
              >
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(197,165,90,0.4)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  tabIndex={-1}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    {showPassword ? (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </>
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#EF4444',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.8125rem',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                border: 'none',
                background: loading
                  ? 'rgba(197,165,90,0.3)'
                  : 'linear-gradient(135deg, #C5A55A, #9B7B38)',
                color: '#080808',
                fontSize: '0.875rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(8,8,8,0.3)',
                    borderTopColor: '#080808',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link
            href="/"
            style={{
              color: '#666',
              fontSize: '0.8125rem',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
          >
            ← Retour à la boutique
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: #444;
        }
      `}</style>
    </div>
  );
}
