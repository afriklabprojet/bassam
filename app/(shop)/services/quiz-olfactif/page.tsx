import { SITE_URL as BASE_URL } from '@/lib/site-config';
import type { Metadata } from 'next';
import QuizClient from './QuizClient';


export const metadata: Metadata = {
  title: 'Quiz Olfactif IA — Trouvez Votre Parfum Idéal | VIP Parfumerie Bar Abidjan',
  description: "Répondez à notre quiz olfactif intelligent et découvrez les parfums faits pour vous. Recommandations personnalisées en 5 minutes. Disponible à Abidjan et en Côte d'Ivoire.",
  keywords: "quiz parfum Abidjan, trouver son parfum Côte d'Ivoire, recommandation parfum personnalisée, quiz olfactif IA Abidjan",
  alternates: { canonical: `${BASE_URL}/services/quiz-olfactif` },
  openGraph: {
    title: 'Quiz Olfactif IA — Votre Signature Olfactive | VIP Parfumerie Bar',
    description: 'Découvrez les parfums qui vous correspondent grâce à notre quiz olfactif intelligent.',
    url: `${BASE_URL}/services/quiz-olfactif`,
    type: 'website',
    locale: 'fr_CI',
  },
};

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${BASE_URL}/` },
    { '@type': 'ListItem', position: 2, name: 'Services', item: `${BASE_URL}/services` },
    { '@type': 'ListItem', position: 3, name: 'Quiz Olfactif', item: `${BASE_URL}/services/quiz-olfactif` },
  ],
};

const serviceLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Quiz Olfactif IA — VIP Parfumerie Bar',
  description: "Quiz interactif pour identifier votre signature olfactive et recevoir des recommandations personnalisées de parfums de luxe.",
  provider: { '@type': 'Organization', name: 'VIP Parfumerie Bar', '@id': `${BASE_URL}/#organization` },
  areaServed: { '@type': 'Country', name: "Côte d'Ivoire" },
  url: `${BASE_URL}/services/quiz-olfactif`,
  serviceType: 'Conseil en parfumerie',
};

export default function QuizOlfactifPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      <QuizClient />
    </>
  );
}
