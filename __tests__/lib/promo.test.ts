import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { claimPromoCodeUse, releasePromoCodeUse } from '@/lib/promo';

const PROMO_ID = 'promo-1';

const mockRead = vi.fn();
const mockUpdate = vi.fn();
const mockGuard = vi.fn();
const mockUpdateSelect = vi.fn();

const supabase = {
  from: vi.fn(() => ({
    select: () => ({ eq: () => ({ single: mockRead }) }),
    update: mockUpdate,
  })),
} as unknown as SupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateSelect.mockResolvedValue({ data: [{ id: PROMO_ID }], error: null });
  mockGuard.mockReturnValue({ select: mockUpdateSelect });
  mockUpdate.mockReturnValue({ eq: vi.fn(() => ({ eq: mockGuard, is: mockGuard })) });
});

describe('claimPromoCodeUse', () => {
  it('incrémente uses_count en le conditionnant à la valeur lue', async () => {
    mockRead.mockResolvedValue({ data: { uses_count: 3, max_uses: 10 }, error: null });

    await expect(claimPromoCodeUse(supabase, PROMO_ID)).resolves.toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ uses_count: 4 });
    expect(mockGuard).toHaveBeenCalledWith('uses_count', 3);
  });

  it('refuse sans écrire quand max_uses est atteint', async () => {
    mockRead.mockResolvedValue({ data: { uses_count: 10, max_uses: 10 }, error: null });

    await expect(claimPromoCodeUse(supabase, PROMO_ID)).resolves.toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('accepte sans limite quand max_uses est null', async () => {
    mockRead.mockResolvedValue({ data: { uses_count: 500, max_uses: null }, error: null });

    await expect(claimPromoCodeUse(supabase, PROMO_ID)).resolves.toBe(true);
  });

  it('relit et réessaie quand une commande concurrente a modifié le compteur', async () => {
    mockRead
      .mockResolvedValueOnce({ data: { uses_count: 9, max_uses: 10 }, error: null })
      .mockResolvedValueOnce({ data: { uses_count: 10, max_uses: 10 }, error: null });
    mockUpdateSelect.mockResolvedValueOnce({ data: [], error: null });

    await expect(claimPromoCodeUse(supabase, PROMO_ID)).resolves.toBe(false);
    expect(mockRead).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('abandonne après plusieurs conflits successifs', async () => {
    mockRead.mockResolvedValue({ data: { uses_count: 1, max_uses: null }, error: null });
    mockUpdateSelect.mockResolvedValue({ data: [], error: null });

    await expect(claimPromoCodeUse(supabase, PROMO_ID)).resolves.toBe(false);
    expect(mockUpdate).toHaveBeenCalledTimes(5);
  });

  it('gère un compteur NULL avec une garde IS NULL', async () => {
    mockRead.mockResolvedValue({ data: { uses_count: null, max_uses: 1 }, error: null });

    await expect(claimPromoCodeUse(supabase, PROMO_ID)).resolves.toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ uses_count: 1 });
    expect(mockGuard).toHaveBeenCalledWith('uses_count', null);
  });
});

describe('releasePromoCodeUse', () => {
  it('décrémente uses_count sans descendre sous zéro', async () => {
    mockRead.mockResolvedValue({ data: { uses_count: 0, max_uses: 10 }, error: null });

    await expect(releasePromoCodeUse(supabase, PROMO_ID)).resolves.toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ uses_count: 0 });
  });

  it('insiste davantage qu une réservation avant d abandonner', async () => {
    mockRead.mockResolvedValue({ data: { uses_count: 2, max_uses: null }, error: null });
    mockUpdateSelect.mockResolvedValue({ data: [], error: null });

    await expect(releasePromoCodeUse(supabase, PROMO_ID)).resolves.toBe(false);
    expect(mockUpdate).toHaveBeenCalledTimes(10);
  });
});
