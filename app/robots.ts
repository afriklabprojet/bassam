import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vip-parfumerie-bar.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/auth/', '/compte', '/panier', '/commande'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
