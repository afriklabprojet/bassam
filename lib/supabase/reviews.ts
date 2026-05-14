import { createClient } from './server';

export interface Review {
  id: string;
  name: string;
  ville: string;
  texte: string;
  rating: number;
  is_approved: boolean;
  source: string;
  order_id: string | null;
  product_id: string | null;
  created_at: string;
}

export interface ReviewInsert {
  name: string;
  ville: string;
  texte: string;
  rating?: number;
  source?: string;
  order_id?: string;
  product_id?: string;
}

/** Avis approuvés pour affichage public */
export async function getApprovedReviews(limit = 6): Promise<Review[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

/** Soumettre un avis (en attente de modération) */
export async function submitReview(payload: ReviewInsert): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('reviews').insert({
      name: payload.name.trim(),
      ville: payload.ville.trim(),
      texte: payload.texte.trim(),
      rating: payload.rating ?? 5,
      source: payload.source ?? 'website',
      order_id: payload.order_id ?? null,
      product_id: payload.product_id ?? null,
      is_approved: false,
    });
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Admin — tous les avis (approuvés + en attente) */
export async function getAllReviews(): Promise<Review[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

/** Admin — approuver ou rejeter un avis */
export async function setReviewApproval(id: string, approved: boolean): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: approved })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

/** Admin — supprimer un avis */
export async function deleteReview(id: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}
