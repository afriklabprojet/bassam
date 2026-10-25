import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderTracking from '@/components/OrderTracking';
import type { TrackedOrder } from '@/lib/order-tracking';

const ORDER: TrackedOrder = {
  orderNumber: 'VIP-ABCDEF12',
  status: 'shipped',
  paymentStatus: 'paid',
  totalAmount: 45000,
  createdAt: '2026-10-20T10:00:00Z',
  items: [{ name: 'Oud Royal', quantity: 2 }],
};

function mockTrack(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function submit(ref = 'VIP-ABCDEF12', phone = '07 01 02 03 04') {
  const user = userEvent.setup();
  render(<OrderTracking initialRef="" whatsappHref="https://wa.me/2250700000000" />);
  await user.type(screen.getByLabelText('Numéro de commande'), ref);
  await user.type(screen.getByLabelText('Téléphone de la commande'), phone);
  await user.click(screen.getByRole('button', { name: 'Afficher le suivi' }));
  return user;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Suivre ma commande', () => {
  it('le bouton reste désactivé tant que les deux champs ne sont pas remplis', () => {
    render(<OrderTracking initialRef="" whatsappHref={null} />);
    expect(screen.getByRole('button', { name: 'Afficher le suivi' })).toBeDisabled();
  });

  it('envoie le numéro et le téléphone, puis affiche la frise avec l’étape actuelle', async () => {
    const fetchMock = mockTrack(200, { order: ORDER });
    await submit();

    expect(fetchMock).toHaveBeenCalledWith('/api/orders/track', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ ref: 'VIP-ABCDEF12', phone: '07 01 02 03 04' });

    const heading = await screen.findByRole('heading', { name: 'Commande VIP-ABCDEF12' });
    expect(heading).toHaveFocus();
    const steps = within(screen.getByRole('list', { name: 'Étapes de la commande' })).getAllByRole('listitem');
    expect(steps).toHaveLength(4);
    expect(steps[2]).toHaveAttribute('aria-current', 'step');
    expect(steps[2]).toHaveTextContent('Expédiée');
    expect(screen.getByText('Votre commande est en route.')).toBeInTheDocument();
    expect(screen.getByText('Paiement reçu')).toBeInTheDocument();
    expect(screen.getByText('Oud Royal')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Poser une question sur WhatsApp' })).toHaveAttribute('href', 'https://wa.me/2250700000000');
  });

  it('commande annulée : pas de frise, un message clair', async () => {
    mockTrack(200, { order: { ...ORDER, status: 'cancelled', paymentStatus: 'pending' } });
    await submit();
    expect(await screen.findByText(/Cette commande a été annulée/)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Étapes de la commande' })).toBeNull();
  });

  it('introuvable : affiche le message du serveur et garde la saisie', async () => {
    mockTrack(404, { error: 'Commande introuvable. Vérifiez le numéro de commande et le téléphone utilisé pour la commande.' });
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Commande introuvable');
    expect(screen.getByLabelText('Numéro de commande')).toHaveValue('VIP-ABCDEF12');
    // L'erreur est rattachée aux deux champs pour les lecteurs d'écran.
    for (const label of ['Numéro de commande', 'Téléphone de la commande']) {
      expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText(label)).toHaveAccessibleDescription(/Commande introuvable/);
    }
  });

  it('sans réseau : message de connexion', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Connexion impossible');
  });

  it('« Suivre une autre commande » revient au formulaire vide', async () => {
    mockTrack(200, { order: ORDER });
    const user = await submit();
    await user.click(await screen.findByRole('button', { name: 'Suivre une autre commande' }));
    expect(screen.getByLabelText('Numéro de commande')).toHaveValue('');
    expect(screen.getByLabelText('Numéro de commande')).toHaveFocus();
  });

  it('arrivée depuis un lien avec le numéro : champ prérempli, curseur sur le téléphone', () => {
    render(<OrderTracking initialRef="VIP-ABCDEF12" whatsappHref={null} />);
    expect(screen.getByLabelText('Numéro de commande')).toHaveValue('VIP-ABCDEF12');
    expect(screen.getByLabelText('Téléphone de la commande')).toHaveFocus();
  });
});
