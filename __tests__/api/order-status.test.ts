import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/* ── Mocks ───────────────────────────────────────────────────────────────── */

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn((_columns: string) => ({ eq: mockEq }));
const mockFrom = vi.fn((_table: string) => ({ select: mockSelect }));
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

const ID = '3f2b8c9e-1a2b-4c3d-8e4f-0123456789ab';
const call = async (id: string) => {
  const { GET } = await import('@/app/api/orders/[id]/status/route');
  return GET(new NextRequest(`http://localhost/api/orders/${id}/status`), { params: Promise.resolve({ id }) });
};

describe('GET /api/orders/[id]/status — route publique par UUID (client de service)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuse un identifiant qui n\'est pas un UUID, sans interroger la base', async () => {
    const res = await call('1 OR 1=1');
    expect(res.status).toBe(404);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('404 pour une commande inconnue', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'no rows' } });
    expect((await call(ID)).status).toBe(404);
  });

  it('limite la sélection aux champs documentés : jamais d\'e-mail, d\'identifiant utilisateur ni de lignes de commande', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'no rows' } });
    await call(ID);
    const columns = String(mockSelect.mock.calls[0][0]);
    expect(columns).not.toMatch(/email|user_id|notes|items|stripe|payment_reference/i);
  });

  it('ne renvoie JAMAIS l\'adresse de livraison complète, seulement le prénom', async () => {
    mockSingle.mockResolvedValue({
      data: { id: ID, status: 'pending', payment_status: 'paid', total_amount: '35000', shipping_address: { firstName: 'Awa', street: '12 rue Secrète', city: 'Abidjan' }, phone: '0700000000', created_at: '2026-10-01' },
      error: null,
    });
    const body = await (await call(ID)).json();
    expect(body.firstName).toBe('Awa');
    expect(JSON.stringify(body)).not.toMatch(/Secrète|Abidjan|street|city|shipping/i);
    expect(Object.keys(body).sort()).toEqual(['createdAt', 'firstName', 'orderId', 'paymentStatus', 'phone', 'status', 'totalAmount']);
  });

  it('CARACTÉRISATION — renvoie le numéro de téléphone EN ENTIER (la page de confirmation l\'affiche) ; masquage = décision produit en attente', async () => {
    mockSingle.mockResolvedValue({
      data: { id: ID, status: 'pending', payment_status: 'pending', total_amount: 1, shipping_address: null, phone: '0700000000', created_at: 'x' },
      error: null,
    });
    const body = await (await call(ID)).json();
    // Si le produit décide de masquer le numéro, mettre à jour ensemble la route, la page de confirmation et ce test.
    expect(body.phone).toBe('0700000000');
  });
});
