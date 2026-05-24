import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DEFAULT_SHIPPING_CONFIG,
  getShippingFee,
  getMinDeliveryFee,
  type ShippingConfig,
} from '@/lib/shipping';

/* ── Mock Supabase service for getShippingConfig ─────────────────────────── */

const mockSingle = vi.fn();

function makeEq() { return { single: mockSingle }; }
function makeSelect() { return { eq: makeEq }; }
function makeFrom() { return { select: makeSelect }; }

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: makeFrom })),
}));

const { getShippingConfig } = await import('@/lib/shipping');

beforeEach(() => {
  vi.clearAllMocks();
});

/* ── getShippingFee ──────────────────────────────────────────────────────── */

describe('getShippingFee', () => {
  it('retourne les frais du mode sélectionné', () => {
    expect(getShippingFee(DEFAULT_SHIPPING_CONFIG, 'express')).toBe(2500);
    expect(getShippingFee(DEFAULT_SHIPPING_CONFIG, 'standard')).toBe(1500);
    expect(getShippingFee(DEFAULT_SHIPPING_CONFIG, 'interieur')).toBe(3500);
    expect(getShippingFee(DEFAULT_SHIPPING_CONFIG, 'retrait')).toBe(0);
  });

  it('retourne 0 si le mode est inconnu', () => {
    expect(getShippingFee(DEFAULT_SHIPPING_CONFIG, 'inexistant')).toBe(0);
  });

  it('retourne 0 si le mode est désactivé', () => {
    const cfg: ShippingConfig = {
      modes: [{ id: 'test', label: 'Test', description: '', fee: 5000, enabled: false, type: 'delivery' }],
    };
    expect(getShippingFee(cfg, 'test')).toBe(0);
  });
});

/* ── getMinDeliveryFee ───────────────────────────────────────────────────── */

describe('getMinDeliveryFee', () => {
  it('retourne le tarif minimum parmi les modes de livraison actifs', () => {
    expect(getMinDeliveryFee(DEFAULT_SHIPPING_CONFIG)).toBe(1500);
  });

  it('ignore les modes désactivés', () => {
    const cfg: ShippingConfig = {
      modes: [
        { id: 'a', label: 'A', description: '', fee: 500, enabled: false, type: 'delivery' },
        { id: 'b', label: 'B', description: '', fee: 2000, enabled: true, type: 'delivery' },
      ],
    };
    expect(getMinDeliveryFee(cfg)).toBe(2000);
  });

  it('ignore les modes pickup', () => {
    const cfg: ShippingConfig = {
      modes: [
        { id: 'pickup', label: 'Retrait', description: '', fee: 0, enabled: true, type: 'pickup' },
        { id: 'delivery', label: 'Livraison', description: '', fee: 1500, enabled: true, type: 'delivery' },
      ],
    };
    expect(getMinDeliveryFee(cfg)).toBe(1500);
  });

  it('retourne 0 si aucun mode de livraison actif', () => {
    expect(getMinDeliveryFee({ modes: [] })).toBe(0);
  });
});

/* ── getShippingConfig ───────────────────────────────────────────────────── */

describe('getShippingConfig', () => {
  it('retourne la config stockée en base', async () => {
    const stored: ShippingConfig = {
      modes: [
        { id: 'express', label: 'Express', description: '', fee: 3500, enabled: true, type: 'delivery' },
      ],
    };
    mockSingle.mockResolvedValue({
      data: { value: JSON.stringify(stored) },
      error: null,
    });
    const cfg = await getShippingConfig();
    expect(cfg.modes).toHaveLength(1);
    expect(cfg.modes[0].fee).toBe(3500);
  });

  it('retourne les valeurs par défaut si aucune entrée en base', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    const cfg = await getShippingConfig();
    expect(cfg).toEqual(DEFAULT_SHIPPING_CONFIG);
  });

  it("retourne les valeurs par défaut en cas d'erreur Supabase", async () => {
    mockSingle.mockRejectedValue(new Error('connection refused'));
    const cfg = await getShippingConfig();
    expect(cfg).toEqual(DEFAULT_SHIPPING_CONFIG);
  });

  it('retourne les valeurs par défaut si le JSON est malformé', async () => {
    mockSingle.mockResolvedValue({ data: { value: '{invalid json' }, error: null });
    const cfg = await getShippingConfig();
    expect(cfg).toEqual(DEFAULT_SHIPPING_CONFIG);
  });
});
