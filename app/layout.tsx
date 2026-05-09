import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import PWAInstaller from "@/components/PWAInstaller";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import BottomNav from "@/components/BottomNav";
import { CartProvider } from "@/lib/cart-context";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: "VIP Parfumerie Bar - Parfums de Luxe Authentiques en Afrique",
    template: "%s | VIP Parfumerie Bar",
  },
  description: "Découvrez les meilleurs parfums de luxe authentiques des plus grandes marques. Livraison rapide en Afrique de l'Ouest. Paiement sécurisé par Mobile Money.",
  keywords: "parfum, luxe, authentique, Afrique, Burkina Faso, mobile money, Chanel, Dior, YSL",
  authors: [{ name: "VIP Parfumerie Bar" }],
  creator: "VIP Parfumerie Bar",
  publisher: "VIP Parfumerie Bar",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VIP Parfumerie Bar",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://vip-parfumerie-bar.com",
    siteName: "VIP Parfumerie Bar",
    title: "VIP Parfumerie Bar - Parfums de Luxe Authentiques",
    description: "Découvrez les meilleurs parfums de luxe authentiques en Afrique de l'Ouest",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "VIP Parfumerie Bar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VIP Parfumerie Bar - Parfums de Luxe",
    description: "Découvrez les meilleurs parfums de luxe authentiques",
    images: ["/og-image.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#C5A55A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C5A55A" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col">
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
      </body>
    </html>
  );
}
