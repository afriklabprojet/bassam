import { SITE_URL as BASE_URL } from '@/lib/site-config';
import type { Metadata } from 'next';
import ProduitsClient from './ProduitsClient';


export const metadata: Metadata = {
  title: 'Boutique Parfums de Luxe — Tous nos Parfums | VIP Parfumerie Bar Abidjan',
  description: "Achetez en ligne les parfums de luxe authentiques chez VIP Parfumerie Bar à Abidjan. Chanel, Dior, YSL, Tom Ford, Creed. Livraison en Côte d'Ivoire et en Afrique de l'Ouest. Paiement Mobile Money.",
  keywords: "boutique parfum Abidjan, acheter parfum luxe Côte d'Ivoire, parfum Chanel Abidjan, parfum Dior Abidjan, YSL parfum Abidjan, parfum en ligne Afrique Ouest, livraison parfum Abidjan",
  alternates: { canonical: `${BASE_URL}/produits` },
  openGraph: {
    title: 'Boutique Parfums de Luxe | VIP Parfumerie Bar Abidjan',
    description: "Tous nos parfums authentiques — Chanel, Dior, YSL, Tom Ford, Creed. Livraison rapide en Côte d'Ivoire.",
    url: `${BASE_URL}/produits`,
    type: 'website',
    locale: 'fr_CI',
    images: [{ url: `${BASE_URL}/og-image.svg`, width: 1200, height: 630, alt: 'VIP Parfumerie Bar — Boutique parfums' }],
  },
};

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${BASE_URL}/` },
    { '@type': 'ListItem', position: 2, name: 'Boutique', item: `${BASE_URL}/produits` },
  ],
};

const collectionPageLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Boutique Parfums de Luxe — VIP Parfumerie Bar',
  description: "Tous nos parfums de luxe authentiques disponibles à Abidjan et en Côte d'Ivoire.",
  url: `${BASE_URL}/produits`,
  publisher: { '@type': 'Organization', name: 'VIP Parfumerie Bar', '@id': `${BASE_URL}/#organization` },
};

export default function ProduitsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }} />
      <ProduitsClient />
    </>
  );
}
