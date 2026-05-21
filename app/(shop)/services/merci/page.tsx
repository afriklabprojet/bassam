import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Demande envoyée — VIP Parfumerie Bar',
  description: 'Votre demande a bien été reçue. Nous vous recontactons très prochainement.',
};

export default function MerciPage() {
  return (
    <main style={{ background: 'var(--noir)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        {/* Icône check */}
        <div style={{
          width: 80, height: 80,
          border: '1px solid rgba(197,165,90,0.35)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px',
          background: 'rgba(197,165,90,0.06)',
        }}>
          <svg width={32} height={32} fill="none" stroke="var(--gold)" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
          <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
            Demande reçue
          </span>
          <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
          fontWeight: 300,
          color: '#fff',
          lineHeight: 1.15,
          margin: '0 0 20px',
          letterSpacing: '-0.01em',
        }}>
          Merci pour votre<br />
          <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>demande.</em>
        </h1>

        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, margin: '0 0 40px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
          Nous avons bien reçu votre message et vous contacterons dans les plus brefs délais pour confirmer les détails.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 46, padding: '0 24px',
              background: 'var(--gold)', color: 'var(--noir)',
              textDecoration: 'none',
              fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
              borderRadius: 3,
            }}
          >
            Retour à l&rsquo;accueil
          </Link>
          <Link
            href="/produits"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 46, padding: '0 24px',
              background: 'transparent', color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.15)',
              textDecoration: 'none',
              fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500,
              borderRadius: 3,
            }}
          >
            Explorer la boutique
          </Link>
        </div>
      </div>
    </main>
  );
}
