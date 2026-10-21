import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

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

// Promo use counters are changed only through the SQL functions of migration
// 20261021000000_promo_reservation_lifecycle: each runs as one statement, so
// concurrent orders cannot exceed max_uses or count a release twice. They are
// executable by the service role only.

/**
 * `ok` is false only when the call itself failed (already logged here);
 * `changed` tells whether the function did something — doing nothing is the
 * normal outcome for an order without a promo or already settled.
 */
export type PromoCallResult = { ok: boolean; changed: boolean };

async function callPromoFunction(
  supabase: SupabaseClient,
  name: string,
  args: Record<string, string>
): Promise<PromoCallResult> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    logger.error('promo', `${name} failed`, { code: error.code, message: error.message, ...args });
    return { ok: false, changed: false };
  }
  return { ok: true, changed: data === true };
}

/**
 * Reserves one use of a promo code. `changed` false with `ok` true means the
 * code is exhausted; `ok` false means the call itself failed.
 */
export function claimPromoCodeUse(supabase: SupabaseClient, promoId: string): Promise<PromoCallResult> {
  return callPromoFunction(supabase, 'claim_promo_code_use', { p_promo_id: promoId });
}

/** Gives back a use reserved for an order that could not be created (the function returns nothing). */
export async function releasePromoCodeUse(supabase: SupabaseClient, promoId: string): Promise<boolean> {
  const result = await callPromoFunction(supabase, 'unclaim_promo_code_use', { p_promo_id: promoId });
  return result.ok;
}

/**
 * Gives back the use an order holds (payment failed, order cancelled). No-op
 * if already given back, without promo, or if the order is paid or refunded.
 */
export function releaseOrderPromoUse(supabase: SupabaseClient, orderId: string): Promise<PromoCallResult> {
  return callPromoFunction(supabase, 'release_order_promo', { p_order_id: orderId });
}

/**
 * Counts the use again for a paid order whose use had been given back (paid
 * more than 24 h after ordering); no-op otherwise. The customer has paid, so
 * this may exceed max_uses.
 */
export function consumeOrderPromoUseOnPayment(supabase: SupabaseClient, orderId: string): Promise<PromoCallResult> {
  return callPromoFunction(supabase, 'consume_order_promo_on_payment', { p_order_id: orderId });
}
