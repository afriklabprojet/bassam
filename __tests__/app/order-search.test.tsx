import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderSearch from '@/app/admin/OrderSearch';

const ORDER = {
  id: '3f2a9c1b-1111-4222-8333-444455556666',
  trackingNumber: 'VIP-3F2A9C1B',
  status: 'shipped',
  deliveryStatus: 'En cours de livraison',
  totalAmount: 45000,
  paymentMethod: 'mobile_money',
  paymentStatus: 'paid',
  customer: { name: 'Awa Diop', phone: '+2250700000000', email: 'awa@example.com' },
  shippingAddress: { address: '12 rue des Palmiers', city: 'Abidjan', country: 'CI' },
  notes: null,
  createdAt: '2026-10-01T10:00:00Z',
  items: [{ id: 'i1', name: 'Oud Royal', brand: 'VIP', quantity: 2, unitPrice: 15000 }],
  payments: [],
  refunds: [],
  timeline: [{ at: '2026-10-01T10:00:00Z', label: 'Commande créée' }],
};

const PLACEHOLDER = 'Rechercher une commande par numéro de suivi…';

function jsonResponse(status: number, body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

describe('OrderSearch', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('affiche le placeholder demandé', () => {
    render(<OrderSearch />);
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();
  });

  it('invite à saisir un numéro si le champ est vide, sans appel réseau', async () => {
    const user = userEvent.setup();
    render(<OrderSearch />);
    await user.click(screen.getByRole('button', { name: 'Rechercher' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Veuillez saisir un numéro de suivi.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lance la recherche avec Entrée et affiche la commande, ses articles et le bouton « Voir la commande »', async () => {
    fetchMock.mockReturnValue(jsonResponse(200, { orders: [ORDER] }));
    const user = userEvent.setup();
    render(<OrderSearch />);

    await user.type(screen.getByPlaceholderText(PLACEHOLDER), ' vip-3f2a9c1b {Enter}');

    expect(await screen.findByText('Oud Royal')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/orders/search?q=vip-3f2a9c1b', expect.anything());
    expect(screen.getByText('Awa Diop')).toBeInTheDocument();
    expect(screen.getByText('En cours de livraison')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir la commande' })).toHaveAttribute('href', '/admin/commandes?ref=VIP-3F2A9C1B');
  });

  it('affiche un indicateur de chargement pendant la recherche', async () => {
    let resolve!: (value: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<OrderSearch />);

    await user.type(screen.getByPlaceholderText(PLACEHOLDER), 'VIP-3F2A9C1B{Enter}');
    expect(await screen.findByText('Recherche en cours…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechercher' })).toBeDisabled();

    resolve(new Response(JSON.stringify({ orders: [] }), { status: 200 }));
    await waitFor(() => expect(screen.queryByText('Recherche en cours…')).not.toBeInTheDocument());
  });

  it('affiche le message prévu quand aucune commande n\'est trouvée', async () => {
    fetchMock.mockReturnValue(jsonResponse(200, { orders: [] }));
    const user = userEvent.setup();
    render(<OrderSearch />);
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), 'VIP-3F2A9C1B{Enter}');
    expect(await screen.findByText('Aucune commande trouvée pour ce numéro de suivi.')).toBeInTheDocument();
  });

  it('affiche l\'erreur de format renvoyée par le serveur', async () => {
    fetchMock.mockReturnValue(jsonResponse(400, { error: 'Numéro de suivi invalide. Exemple : VIP-3F2A9C1B.' }));
    const user = userEvent.setup();
    render(<OrderSearch />);
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), 'abc{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Numéro de suivi invalide');
  });

  it('affiche une erreur explicite sans casser le composant en cas d\'erreur serveur ou réseau', async () => {
    const user = userEvent.setup();
    render(<OrderSearch />);
    const input = screen.getByPlaceholderText(PLACEHOLDER);

    fetchMock.mockReturnValueOnce(jsonResponse(500, { error: 'Erreur serveur' }));
    await user.type(input, 'VIP-3F2A9C1B{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de lancer la recherche');

    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await user.type(input, '{Enter}');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Connexion impossible'));
    expect(input).toBeEnabled();
  });

  it('refuse l\'accès affiché aux non-administrateurs (403)', async () => {
    fetchMock.mockReturnValue(jsonResponse(403, { error: 'Accès refusé' }));
    const user = userEvent.setup();
    render(<OrderSearch />);
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), 'VIP-3F2A9C1B{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Accès refusé');
  });

  it('délègue « Voir la commande » à onView quand il est fourni (écran Commandes)', async () => {
    fetchMock.mockReturnValue(jsonResponse(200, { orders: [ORDER] }));
    const onView = vi.fn();
    const user = userEvent.setup();
    render(<OrderSearch onView={onView} />);
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), 'VIP-3F2A9C1B{Enter}');

    expect(screen.queryByRole('link', { name: 'Voir la commande' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Voir la commande' }));
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ trackingNumber: 'VIP-3F2A9C1B' }));
  });

  it('permet de fermer le panneau de résultats', async () => {
    fetchMock.mockReturnValue(jsonResponse(200, { orders: [ORDER] }));
    const user = userEvent.setup();
    render(<OrderSearch />);
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), 'VIP-3F2A9C1B{Enter}');
    await screen.findByText('Oud Royal');
    await user.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(screen.queryByText('Oud Royal')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toHaveValue('');
  });
});
