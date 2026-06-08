import { SITE_URL, SITE_NAME } from '@/lib/site-config';
import type { Metadata, Viewport } from "next";

// Nonce-based CSP requires per-request rendering so Next.js can stamp
// every generated <script> tag with the nonce emitted by the proxy middleware.
// Static (build-time) HTML has no nonce, causing all scripts to be blocked
// by strict-dynamic in production.
export const dynamic = 'force-dynamic';
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { BrandingInjector } from "@/components/BrandingInjector";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VIP Parfumerie Bar — Parfums de Luxe Authentiques à Abidjan",
    template: "%s | VIP Parfumerie Bar",
  },
  description: "Boutique de parfums de luxe authentiques à Abidjan, Côte d'Ivoire. Chanel, Dior, YSL, Tom Ford, Creed. Livraison en 24h à Abidjan et partout en Afrique de l'Ouest. Paiement Mobile Money.",
  keywords: "parfum luxe Abidjan, parfumerie Côte d'Ivoire, boutique parfum authentique Abidjan, Chanel Abidjan, Dior Abidjan, YSL Abidjan, Tom Ford Abidjan, livraison parfum Afrique Ouest, Mobile Money parfum",
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
    icon: [
      { url: "/icons/favicon.ico", sizes: "any" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "fr_CI",
    url: SITE_URL,
    siteName: "VIP Parfumerie Bar",
    title: "VIP Parfumerie Bar — Parfums de Luxe Authentiques à Abidjan",
    description: "Boutique de parfums de luxe authentiques à Abidjan. Chanel, Dior, YSL, Tom Ford. Livraison Côte d'Ivoire et Afrique de l'Ouest.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "VIP Parfumerie Bar — Parfums de Luxe Abidjan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VIP Parfumerie Bar — Parfums de Luxe à Abidjan",
    description: "Boutique de parfums de luxe authentiques à Abidjan. Livraison rapide en Côte d'Ivoire.",
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
        <BrandingInjector />
        <meta name="google-adsense-account" content="ca-pub-6231112370273982" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C5A55A" />
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
