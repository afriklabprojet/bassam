import type { Metadata } from 'next';
import { supportConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Politique de confidentialité | VIP Parfumerie Bar',
  description: 'Consultez la politique de confidentialité de VIP Parfumerie Bar concernant la collecte, l’utilisation et la protection de vos données personnelles.',
};

export default function ConfidentialitePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <section style={{ background: 'var(--noir)', padding: '5.5rem 0 3rem' }}>
        <div className="container mx-auto">
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>
            Informations légales
          </p>
          <h1 className="heading-lg text-white" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
            Politique de confidentialité
          </h1>
        </div>
      </section>

      <section style={{ padding: '4rem 0 5rem' }}>
        <div className="container mx-auto" style={{ maxWidth: 820 }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'grid', gap: '2rem' }}>
              <section>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>1. Données collectées</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Nous collectons uniquement les données nécessaires au traitement des commandes, à la livraison,
                  au service client et à l’amélioration de votre expérience: nom, prénom, adresse, téléphone,
                  email, contenu du panier et historique de commande.
                </p>
              </section>

              <section>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>2. Utilisation des données</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Vos informations servent à confirmer vos commandes, assurer la livraison, répondre à vos demandes,
                  prévenir la fraude et, si vous y avez consenti, vous adresser nos nouveautés et offres exclusives.
                </p>
              </section>

              <section>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>3. Conservation et sécurité</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Nous appliquons des mesures raisonnables de sécurité pour protéger vos données et nous limitons
                  leur conservation à la durée strictement nécessaire à la gestion commerciale, comptable et légale.
                </p>
              </section>

              <section>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>4. Vos droits</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Vous pouvez demander l’accès, la rectification ou la suppression de vos données personnelles en nous
                  écrivant à <a href={`mailto:${supportConfig.email}`} style={{ color: 'var(--gold-dark)', textDecoration: 'none' }}>{supportConfig.email}</a>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}