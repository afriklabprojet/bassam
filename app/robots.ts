import { SITE_URL as BASE_URL } from '@/lib/site-config';
import type { MetadataRoute } from 'next';


export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/auth/',
          '/compte',
          '/panier',
          '/commande',
          '/services/merci',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
