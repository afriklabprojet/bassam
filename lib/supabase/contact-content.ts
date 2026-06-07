import { createServiceClient } from '@/lib/supabase/service';

export interface FaqItem {
  question: string;
  reponse: string;
  ordre: number;
}

const DEFAULT_FAQ: FaqItem[] = [
  {
    question: 'Vos parfums sont-ils 100\u00a0% authentiques\u00a0?',
    reponse:
      "Oui, absolument. Chaque produit est sourcé directement auprès des distributeurs officiels en Europe. Nous fournissons un certificat d'authenticité avec chaque commande.",
    ordre: 1,
  },
  {
    question: 'Quels sont les délais de livraison\u00a0?',
    reponse:
      "24 à 72h pour Abidjan. 3 à 5 jours ouvrés pour le reste de l'Afrique de l'Ouest. La livraison est offerte à partir de 50\u00a0000 FCFA d'achat.",
    ordre: 2,
  },
  {
    question: 'Quels modes de paiement acceptez-vous\u00a0?',
    reponse: 'Orange Money, MTN Money, Wave, Moov Money, Djamo. Toutes les transactions sont sécurisées.',
    ordre: 3,
  },
  {
    question: 'Puis-je retourner un parfum\u00a0?',
    reponse:
      "Les parfums descellés ne peuvent pas être retournés pour des raisons hygiéniques. En revanche, si votre commande est endommagée ou ne correspond pas à la description, nous procédons à un échange ou un remboursement intégral.",
    ordre: 4,
  },
  {
    question: 'Proposez-vous des consultations olfactives\u00a0?',
    reponse:
      "Oui. Notre service de consultation privée vous permet de bénéficier d'un accompagnement personnalisé — en présentiel à Abidjan ou en visio. Prenez rendez-vous depuis la page Services.",
    ordre: 5,
  },
];

export async function getContactFaq(): Promise<FaqItem[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('contact_faq')
      .select('question, reponse, ordre')
      .eq('is_active', true)
      .order('ordre', { ascending: true });

    if (error || !data || data.length === 0) return DEFAULT_FAQ;
    return (data as FaqItem[]);
  } catch {
    return DEFAULT_FAQ;
  }
}
