import type { SupabaseClient } from '@supabase/supabase-js';

export type PromoType = 'percentage' | 'fixed';

export type PromoValidationResult =
  | { ok: true; id: string; code: string; type: PromoType; value: number; usesCount: number }
  | { ok: false; error: string };

type PromoCodeRow = {
  id: string;
  code: string;
  type: PromoType;
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
};

/** Validate a promo code against an order amount. Shared by the cart-page
 *  preview check and the server-side re-validation done at order creation. */
export async function validatePromoCode(
  supabase: SupabaseClient,
  rawCode: string,
  orderAmount: number
): Promise<PromoValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: 'Code requis' };

  const { data, error } = await supabase
    .from('promo_codes')
    .select('id, code, type, value, min_order_amount, max_uses, uses_count, expires_at, is_active')
    .eq('code', code)
    .single();

  const row = data as PromoCodeRow | null;

  if (error || !row) return { ok: false, error: 'Code promo invalide' };
  if (!row.is_active) return { ok: false, error: 'Ce code promo est désactivé' };
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { ok: false, error: 'Ce code promo a expiré' };
  }
  if (row.max_uses !== null && row.uses_count >= row.max_uses) {
    return { ok: false, error: 'Ce code promo a atteint son nombre maximum d\'utilisations' };
  }
  if (row.min_order_amount && orderAmount < row.min_order_amount) {
    return { ok: false, error: `Montant minimum requis : ${row.min_order_amount}`, };
  }

  return { ok: true, id: row.id, code: row.code, type: row.type, value: row.value, usesCount: row.uses_count };
}

/** Compute the discount amount for a validated promo code, clamped to [0, amount]. */
export function computePromoDiscount(type: PromoType, value: number, amount: number): number {
  const raw = type === 'percentage' ? Math.round((amount * value) / 100) : value;
  return Math.min(Math.max(raw, 0), Math.max(amount, 0));
}

const PROMO_CAS_ATTEMPTS = 3;

/**
 * Adds `delta` to uses_count with a compare-and-swap retry (same pattern as
 * decrementProductStock), so concurrent orders can neither lose an update nor
 * push a code past max_uses. Returns false if the code is exhausted, missing,
 * or stays contended after every attempt.
 */
async function adjustPromoCodeUses(supabase: SupabaseClient, id: string, delta: 1 | -1): Promise<boolean> {
  for (let attempt = 0; attempt < PROMO_CAS_ATTEMPTS; attempt++) {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('uses_count, max_uses')
      .eq('id', id)
      .single();

    const row = data as Pick<PromoCodeRow, 'uses_count' | 'max_uses'> | null;
    if (error || !row) return false;

    const current = Number(row.uses_count ?? 0);
    if (delta > 0 && row.max_uses !== null && current >= row.max_uses) return false;
    const next = Math.max(current + delta, 0);

    const { data: updated, error: updateError } = await supabase
      .from('promo_codes')
      .update({ uses_count: next })
      .eq('id', id)
      .eq('uses_count', current)
      .select('id');

    if (!updateError && updated && updated.length > 0) return true;
    // Row changed concurrently between the read and the write — retry.
  }
  return false;
}

/** Reserves one use of a promo code; false means the order must be refused. */
export function claimPromoCodeUse(supabase: SupabaseClient, id: string): Promise<boolean> {
  return adjustPromoCodeUses(supabase, id, 1);
}

/** Gives back a use claimed for an order that could not be created. */
export function releasePromoCodeUse(supabase: SupabaseClient, id: string): Promise<boolean> {
  return adjustPromoCodeUses(supabase, id, -1);
}
