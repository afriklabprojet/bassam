import { SITE_URL as BASE_URL } from '@/lib/site-config';
import type { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase/service';


const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/`,                               lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
  { url: `${BASE_URL}/produits`,                        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
  { url: `${BASE_URL}/collections`,                     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
  { url: `${BASE_URL}/collections/homme`,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
  { url: `${BASE_URL}/collections/femme`,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
  { url: `${BASE_URL}/collections/mixte`,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
  { url: `${BASE_URL}/collections/nouveautes`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
  { url: `${BASE_URL}/services`,                        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/services/quiz-olfactif`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/services/consultation`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/services/creation-personnalisee`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/a-propos`,                        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/contact`,                         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    const productPages: MetadataRoute.Sitemap = (data ?? []).map((row) => ({
      url: `${BASE_URL}/produits/${row.slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));

    return [...STATIC_PAGES, ...productPages];
  } catch {
    // Supabase unavailable at build time → static pages only
    return STATIC_PAGES;
  }
}
