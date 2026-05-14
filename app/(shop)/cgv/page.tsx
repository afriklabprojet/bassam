import type { Metadata } from 'next';
import { supportConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Conditions générales de vente | VIP Parfumerie Bar',
  description: 'Consultez les conditions générales de vente de VIP Parfumerie Bar: commandes, paiements, livraisons, retours et service client.',
};

export default function CgvPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <section style={{ background: 'var(--noir)', padding: '5.5rem 0 3rem' }}>
        <div className="container mx-auto">
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>
            Informations légales
          </p>
          <h1 className="heading-lg text-white" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
            Conditions générales de vente
          </h1>
        </div>
      </section>

      <section style={{ padding: '4rem 0 5rem' }}>
        <div className="container mx-auto" style={{ maxWidth: 820 }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'grid', gap: '2rem' }}>
              <section>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>1. Commandes</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Toute commande passée sur la boutique vaut acceptation des présentes conditions. Une commande est
                  considérée comme confirmée après validation du paiement ou après confirmation de notre équipe pour les
                  règlements à la livraison.
                </p>
              </section>

              <section>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>2. Prix et paiement</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Les prix sont affichés en FCFA. Les moyens de paiement proposés peuvent inclure Mobile Money,
                  règlement à la livraison et autres solutions sécurisées selon votre pays de livraison.
                </p>
              </section>

              <section>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>3. Livraison</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Les délais de livraison sont donnés à titre indicatif. VIP Parfumerie Bar met tout en œuvre pour
                  assurer une expédition rapide, mais ne peut être tenu responsable d’un retard causé par un transporteur,
                  un événement exceptionnel ou une adresse incomplète.
                </p>
              </section>

              <section>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>4. Retours</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Les retours sont étudiés au cas par cas. Un produit ouvert, utilisé ou détérioré ne peut pas être
                  remboursé, sauf défaut avéré. Pour toute demande, contactez notre service client à <a href={`mailto:${supportConfig.email}`} style={{ color: 'var(--gold-dark)', textDecoration: 'none' }}>{supportConfig.email}</a>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}