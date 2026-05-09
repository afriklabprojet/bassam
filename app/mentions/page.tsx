import type { Metadata } from 'next';
import { supportConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Mentions légales | VIP Parfumerie Bar',
  description: 'Retrouvez les mentions légales de VIP Parfumerie Bar: éditeur, hébergement, responsabilité et contact.',
};

export default function MentionsPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <section style={{ background: 'var(--noir)', padding: '5.5rem 0 3rem' }}>
        <div className="container mx-auto">
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>
            Informations légales
          </p>
          <h1 className="heading-lg text-white" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
            Mentions légales
          </h1>
        </div>
      </section>

      <section style={{ padding: '4rem 0 5rem' }}>
        <div className="container mx-auto" style={{ maxWidth: 820 }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'grid', gap: '2rem' }}>
              <section>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>1. Éditeur du site</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  VIP Parfumerie Bar est une boutique de parfums de luxe opérant depuis Abidjan, Côte d’Ivoire.
                  Pour toute demande commerciale ou légale, vous pouvez nous écrire à <a href={`mailto:${supportConfig.email}`} style={{ color: 'var(--gold-dark)', textDecoration: 'none' }}>{supportConfig.email}</a>.
                </p>
              </section>

              <section>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>2. Hébergement</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Le site est hébergé sur une infrastructure cloud sécurisée. Les composants techniques et services tiers
                  utilisés sont sélectionnés pour leur fiabilité, leur disponibilité et leur niveau de sécurité.
                </p>
              </section>

              <section>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>3. Propriété intellectuelle</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Les textes, visuels, éléments de marque, maquettes et contenus présents sur ce site sont protégés.
                  Toute reproduction totale ou partielle sans autorisation préalable est interdite.
                </p>
              </section>

              <section>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>4. Responsabilité</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Nous nous efforçons de fournir des informations exactes et à jour. Toutefois, VIP Parfumerie Bar ne
                  saurait être tenu responsable d’une erreur involontaire, d’une indisponibilité temporaire ou d’un usage
                  inadapté du site par un tiers.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}