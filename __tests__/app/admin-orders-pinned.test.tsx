import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminOrders from '@/app/admin/commandes/page';

const ORDER = {
  id: '3f2a9c1b-1111-4222-8333-444455556666',
  trackingNumber: 'VIP-3F2A9C1B',
  status: 'confirmed',
  deliveryStatus: 'Pas encore expédiée',
  totalAmount: 45000,
  paymentMethod: 'mobile_money',
  paymentStatus: 'paid',
  customer: { name: 'Awa Diop', phone: '+2250700000000', email: 'awa@example.com' },
  shippingAddress: null,
  notes: null,
  createdAt: '2026-10-01T10:00:00Z',
  items: [{ id: 'i1', name: 'Oud Royal', brand: 'VIP', quantity: 2, unitPrice: 15000 }],
  payments: [],
  refunds: [],
  timeline: [{ at: '2026-10-01T10:00:00Z', label: 'Commande créée' }],
};

const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

const LIST = { orders: [], total: 0, page: 1, totalPages: 0 };

describe('Commandes — commande ouverte depuis la recherche (?ref=)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  function route(searchResponse: () => Promise<Response>) {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.startsWith('/api/admin/orders/search')) return searchResponse();
      if (url === '/api/admin/orders' && init?.method === 'PATCH') return json(200, { success: true });
      return json(200, LIST);
    });
  }

  it('n\'appelle pas la recherche sans paramètre ref', async () => {
    window.history.replaceState(null, '', '/admin/commandes');
    route(() => json(200, { orders: [ORDER] }));
    render(<AdminOrders />);
    await screen.findByText('Aucune commande trouvée');
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/orders/search'))).toBe(false);
    expect(screen.queryByLabelText('Commande recherchée')).not.toBeInTheDocument();
  });

  it('affiche la fiche de la commande recherchée au-dessus de la liste', async () => {
    window.history.replaceState(null, '', '/admin/commandes?ref=VIP-3F2A9C1B');
    route(() => json(200, { orders: [ORDER] }));
    render(<AdminOrders />);

    expect(await screen.findByText('Oud Royal')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/orders/search?q=VIP-3F2A9C1B');
    expect(screen.getByText('Commande recherchée : VIP-3F2A9C1B')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Voir la commande' })).not.toBeInTheDocument();
  });

  it('affiche le message prévu si la commande n\'existe pas ou si le chargement échoue', async () => {
    window.history.replaceState(null, '', '/admin/commandes?ref=VIP-3F2A9C1B');
    route(() => json(200, { orders: [] }));
    const first = render(<AdminOrders />);
    expect(await screen.findByText('Aucune commande trouvée pour ce numéro de suivi.')).toBeInTheDocument();
    first.unmount();

    route(() => json(500, { error: 'Erreur serveur' }));
    render(<AdminOrders />);
    expect(await screen.findByText('Impossible de charger la commande recherchée.')).toBeInTheDocument();
  });

  it('recharge la fiche après un changement de statut, et se ferme', async () => {
    window.history.replaceState(null, '', '/admin/commandes?ref=VIP-3F2A9C1B');
    route(() => json(200, { orders: [ORDER] }));
    const user = userEvent.setup();
    render(<AdminOrders />);
    await screen.findByText('Oud Royal');

    await user.selectOptions(screen.getByLabelText('Statut de la commande VIP-3F2A9C1B'), 'shipped');
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/orders',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ id: ORDER.id, status: 'shipped' }) }),
      ),
    );
    await waitFor(() =>
      expect(fetchMock.mock.calls.filter(([url]) => String(url).startsWith('/api/admin/orders/search'))).toHaveLength(2),
    );

    await user.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(screen.queryByText('Oud Royal')).not.toBeInTheDocument();
    expect(window.location.search).toBe('');
  });
});
