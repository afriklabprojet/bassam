import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  claimPromoCodeUse,
  consumeOrderPromoUseOnPayment,
  releaseOrderPromoUse,
  releasePromoCodeUse,
} from '@/lib/promo';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const rpc = vi.fn();
const supabase = { rpc } as unknown as SupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fonctions SQL des usages de codes promo', () => {
  it('réserve et rend un usage par code', async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(claimPromoCodeUse(supabase, 'promo-1')).resolves.toBe(true);
    expect(rpc).toHaveBeenLastCalledWith('claim_promo_code_use', { p_promo_id: 'promo-1' });

    rpc.mockResolvedValue({ data: null, error: null });
    await expect(releasePromoCodeUse(supabase, 'promo-1')).resolves.toBe(true);
    expect(rpc).toHaveBeenLastCalledWith('unclaim_promo_code_use', { p_promo_id: 'promo-1' });
  });

  it.each([
    ['releaseOrderPromoUse', releaseOrderPromoUse, 'release_order_promo'],
    ['consumeOrderPromoUseOnPayment', consumeOrderPromoUseOnPayment, 'consume_order_promo_on_payment'],
  ] as const)('%s distingue « rien à faire » d un échec', async (_label, fn, name) => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(fn(supabase, 'order-1')).resolves.toEqual({ ok: true, changed: true });
    expect(rpc).toHaveBeenLastCalledWith(name, { p_order_id: 'order-1' });

    rpc.mockResolvedValue({ data: false, error: null });
    await expect(fn(supabase, 'order-1')).resolves.toEqual({ ok: true, changed: false });

    rpc.mockResolvedValue({ data: null, error: { code: '42883', message: 'function does not exist' } });
    await expect(fn(supabase, 'order-1')).resolves.toEqual({ ok: false, changed: false });
  });

  it('refuse la réservation quand la fonction renvoie false (plafond atteint)', async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(claimPromoCodeUse(supabase, 'promo-1')).resolves.toBe(false);
  });

  it('renvoie false et journalise quand la fonction échoue', async () => {
    const { logger } = await import('@/lib/logger');
    rpc.mockResolvedValue({ data: null, error: { code: '42883', message: 'function does not exist' } });

    await expect(claimPromoCodeUse(supabase, 'promo-1')).resolves.toBe(false);
    expect(logger.error).toHaveBeenCalledWith('promo', 'claim_promo_code_use failed', expect.objectContaining({ code: '42883' }));
  });
});
