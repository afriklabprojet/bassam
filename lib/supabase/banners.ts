import { createServiceClient } from './service';

export interface PublicBanner {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string;
  image_url: string | null;
  bg_color: string;
}

export async function getActiveBanners(): Promise<PublicBanner[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('banners')
      .select('id, title, subtitle, cta_text, cta_link, image_url, bg_color')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data) return [];
    return data as PublicBanner[];
  } catch {
    return [];
  }
}
