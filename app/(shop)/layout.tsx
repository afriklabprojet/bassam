import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';
import WhatsAppFAB from '@/components/WhatsAppFAB';
import BottomNav from '@/components/BottomNav';
import PWAInstaller from '@/components/PWAInstaller';
import { CartProvider } from '@/lib/cart-context';
import { getSiteSettings } from '@/lib/site-settings';
import { SiteSettingsProvider } from '@/lib/site-settings-context';

export default async function ShopLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const siteSettings = await getSiteSettings();
  return (
    <SiteSettingsProvider value={siteSettings}>
      <CartProvider>
        <Header />
        <main className="flex-1 pb-16 lg:pb-0">
          {children}
        </main>
        <Footer />
        <CartSidebar />
        <WhatsAppFAB />
        <BottomNav />
        <PWAInstaller />
      </CartProvider>
    </SiteSettingsProvider>
  );
}
