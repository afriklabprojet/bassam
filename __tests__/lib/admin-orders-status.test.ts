import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSelect = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: () => ({ select: mockSelect }) }));
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: () => ({ update: mockUpdate }), rpc: mockRpc })),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const { updateOrderStatus } = await import('@/lib/supabase/admin-orders');

beforeEach(() => {
  vi.clearAllMocks();
  mockRpc.mockResolvedValue({ data: true, error: null });
});

describe('updateOrderStatus — usage du code promo', () => {
  it('rend l usage quand l admin annule une commande impayée', async () => {
    mockSelect.mockResolvedValue({ data: [{ payment_status: 'pending' }], error: null });

    await expect(updateOrderStatus('order-1', 'cancelled')).resolves.toEqual({ error: null });
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' });
    expect(mockRpc).toHaveBeenCalledWith('release_order_promo', { p_order_id: 'order-1' });
  });

  it.each(['paid', 'refunded'])('garde l usage quand la commande annulée est %s', async (paymentStatus) => {
    mockSelect.mockResolvedValue({ data: [{ payment_status: paymentStatus }], error: null });

    await updateOrderStatus('order-1', 'cancelled');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('ne touche pas à l usage pour un autre statut', async () => {
    mockSelect.mockResolvedValue({ data: [{ payment_status: 'pending' }], error: null });

    await updateOrderStatus('order-1', 'confirmed');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('renvoie l erreur de base sans rien libérer', async () => {
    const dbError = { code: '22P02', message: 'invalid input syntax for type uuid' };
    mockSelect.mockResolvedValue({ data: null, error: dbError });

    await expect(updateOrderStatus('pas-un-uuid', 'cancelled')).resolves.toEqual({ error: dbError });
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
