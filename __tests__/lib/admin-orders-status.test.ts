import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSelect = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: () => ({ select: mockSelect }) }));
// Lecture du statut avant la mise à jour (pour n'avertir le client que d'un vrai changement).
const mockBefore = vi.fn();
const mockRead = vi.fn(() => ({ eq: () => ({ maybeSingle: mockBefore }) }));
const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: () => ({ update: mockUpdate, select: mockRead }), rpc: mockRpc })),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const { updateOrderStatus } = await import('@/lib/supabase/admin-orders');

beforeEach(() => {
  vi.clearAllMocks();
  mockRpc.mockResolvedValue({ data: true, error: null });
  mockBefore.mockResolvedValue({ data: { status: 'pending' }, error: null });
});

describe('updateOrderStatus — usage du code promo', () => {
  it('rend l usage quand l admin annule une commande impayée', async () => {
    mockSelect.mockResolvedValue({ data: [{ payment_status: 'pending' }], error: null });

    await expect(updateOrderStatus('order-1', 'cancelled')).resolves.toEqual({ error: null, previousStatus: 'pending' });
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

  it('signale l échec de la libération pour que l admin réessaie', async () => {
    mockSelect.mockResolvedValue({ data: [{ payment_status: 'pending' }], error: null });
    mockRpc.mockResolvedValue({ data: null, error: { code: '57014', message: 'canceling statement due to timeout' } });

    const result = await updateOrderStatus('order-1', 'cancelled');

    expect(result.error).toEqual(expect.objectContaining({ code: 'promo_release_failed' }));
  });
});

describe('updateOrderStatus — statut précédent', () => {
  it('renvoie le statut d’avant la mise à jour', async () => {
    mockBefore.mockResolvedValue({ data: { status: 'confirmed' }, error: null });
    mockSelect.mockResolvedValue({ data: [{ payment_status: 'paid' }], error: null });

    await expect(updateOrderStatus('order-1', 'shipped')).resolves.toEqual({ error: null, previousStatus: 'confirmed' });
  });

  it('statut précédent illisible : la mise à jour se fait quand même (previousStatus null)', async () => {
    mockBefore.mockResolvedValue({ data: null, error: { code: '57014', message: 'timeout' } });
    mockSelect.mockResolvedValue({ data: [{ payment_status: 'paid' }], error: null });

    await expect(updateOrderStatus('order-1', 'shipped')).resolves.toEqual({ error: null, previousStatus: null });
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'shipped' });
  });
});
