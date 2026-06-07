import { createClient } from './server';

export interface PublicTaxonomyItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
}

export async function getPublicCategories(): Promise<PublicTaxonomyItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_url, display_order')
    .order('display_order', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getPublicCollections(): Promise<PublicTaxonomyItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, slug, description, image_url, display_order')
    .order('display_order', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getPublicCategoryBySlug(slug: string): Promise<PublicTaxonomyItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_url, display_order')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getPublicCollectionBySlug(slug: string): Promise<PublicTaxonomyItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, slug, description, image_url, display_order')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}