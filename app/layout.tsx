import type { Metadata, Viewport } from "next";
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
    icon: [
      { url: "/icons/favicon.ico", sizes: "any" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://vip-parfumerie-bar.com",
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
