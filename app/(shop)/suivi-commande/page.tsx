import type { Metadata } from 'next';
import OrderTracking from '@/components/OrderTracking';
import { buildWhatsAppHref, getSiteSettings, hasWhatsApp } from '@/lib/site-settings';

export async function generateMetadata(): Promise<Metadata> {
  const { site_name: siteName } = await getSiteSettings();
  return {
    title: `Suivre ma commande — ${siteName}`,
    description: `Suivez votre commande ${siteName} avec votre numéro de commande et votre téléphone.`,
    // Page de service : rien à indexer, et le numéro peut figurer dans l'adresse.
    robots: { index: false, follow: false },
  };
}

export default async function OrderTrackingPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ ref?: string | string[] }> }>) {
  const { ref } = await searchParams;
  const settings = await getSiteSettings();
  const whatsappHref = hasWhatsApp(settings)
    ? buildWhatsAppHref(settings, 'Bonjour, j’ai une question sur ma commande.')
    : null;

  return <OrderTracking initialRef={typeof ref === 'string' ? ref : ''} whatsappHref={whatsappHref} />;
}
