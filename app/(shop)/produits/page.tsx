import { SITE_URL as BASE_URL } from '@/lib/site-config';
import { getSiteSettings } from '@/lib/site-settings';
import type { Metadata } from 'next';
import ProduitsClient from './ProduitsClient';


export async function generateMetadata(): Promise<Metadata> {
  const { site_name: siteName } = await getSiteSettings();

  return {
    title: `Boutique Parfums de Luxe — Tous nos Parfums | ${siteName} Abidjan`,
    description: `Achetez en ligne les parfums de luxe authentiques chez ${siteName} à Abidjan. Chanel, Dior, YSL, Tom Ford, Creed. Livraison en Côte d'Ivoire et en Afrique de l'Ouest. Paiement Mobile Money.`,
    keywords: "boutique parfum Abidjan, acheter parfum luxe Côte d'Ivoire, parfum Chanel Abidjan, parfum Dior Abidjan, YSL parfum Abidjan, parfum en ligne Afrique Ouest, livraison parfum Abidjan",
    alternates: { canonical: `${BASE_URL}/produits` },
    openGraph: {
      title: `Boutique Parfums de Luxe | ${siteName} Abidjan`,
      description: "Tous nos parfums authentiques — Chanel, Dior, YSL, Tom Ford, Creed. Livraison rapide en Côte d'Ivoire.",
      url: `${BASE_URL}/produits`,
      type: 'website',
      locale: 'fr_CI',
      images: [{ url: `${BASE_URL}/og-image.svg`, width: 1200, height: 630, alt: `${siteName} — Boutique parfums` }],
    },
  };
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${BASE_URL}/` },
    { '@type': 'ListItem', position: 2, name: 'Boutique', item: `${BASE_URL}/produits` },
  ],
};

export default async function ProduitsPage() {
  const { site_name: siteName } = await getSiteSettings();

  const collectionPageLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Boutique Parfums de Luxe — ${siteName}`,
    description: "Tous nos parfums de luxe authentiques disponibles à Abidjan et en Côte d'Ivoire.",
    url: `${BASE_URL}/produits`,
    publisher: { '@type': 'Organization', name: siteName, '@id': `${BASE_URL}/#organization` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }} />
      <ProduitsClient />
    </>
  );
}
