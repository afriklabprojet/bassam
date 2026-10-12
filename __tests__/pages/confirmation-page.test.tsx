import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

let mockSearch = new URLSearchParams();
const mockClearCart = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearch,
}));
vi.mock('@/lib/cart-context', () => ({
  useCart: () => ({ clearCart: mockClearCart }),
}));
vi.mock('@/lib/site-settings-context', () => ({
  useSiteSettings: () => ({}),
}));
vi.mock('@/lib/site-settings', () => ({
  hasWhatsApp: () => false,
  buildWhatsAppHref: () => '#',
}));
vi.mock('@/app/(shop)/commande/checkout-ui', () => ({
  ConfettiParticles: () => null,
}));

import ConfirmationPage from '@/app/(shop)/commande/confirmation/page';

const ORDER_ID = 'abcdef12-0000-4000-8000-000000000001';

function mockStatus(status: number, body?: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body }),
  );
}

describe('Page de confirmation de commande', () => {
  beforeEach(() => {
    mockClearCart.mockReset();
    mockSearch = new URLSearchParams();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('sans identifiant de commande : « Commande introuvable » dès le rendu, sans appel réseau', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<ConfirmationPage />);

    expect(screen.getByRole('heading', { name: 'Commande introuvable' })).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('commande inconnue (404) : « Commande introuvable »', async () => {
    mockSearch = new URLSearchParams({ order: ORDER_ID });
    mockStatus(404);

    render(<ConfirmationPage />);

    expect(await screen.findByRole('heading', { name: 'Commande introuvable' })).toBeTruthy();
  });

  it('erreur serveur : message d\'erreur, panier conservé', async () => {
    mockSearch = new URLSearchParams({ order: ORDER_ID });
    mockStatus(500);

    render(<ConfirmationPage />);

    expect(await screen.findByRole('heading', { name: 'Impossible de vérifier votre commande' })).toBeTruthy();
    expect(mockClearCart).not.toHaveBeenCalled();
  });

  it('paiement confirmé : commande confirmée et panier vidé une seule fois', async () => {
    mockSearch = new URLSearchParams({ order: ORDER_ID });
    mockStatus(200, { orderId: ORDER_ID, status: 'confirmed', paymentStatus: 'paid', firstName: 'Awa', phone: '***0000' });

    render(<ConfirmationPage />);

    expect(await screen.findByRole('heading', { name: 'Commande confirmée !' })).toBeTruthy();
    await waitFor(() => expect(mockClearCart).toHaveBeenCalledTimes(1));
    expect(screen.getByText('VIP-ABCDEF12')).toBeTruthy();
    expect(screen.getByText('***0000')).toBeTruthy();
    expect(screen.queryByText('0700000000')).toBeNull();
  });

  it('paiement échoué : message d\'échec, panier conservé', async () => {
    mockSearch = new URLSearchParams({ order: ORDER_ID });
    mockStatus(200, { orderId: ORDER_ID, status: 'pending', paymentStatus: 'failed', firstName: null, phone: '***0000' });

    render(<ConfirmationPage />);

    expect(await screen.findByRole('heading', { name: 'Le paiement a échoué' })).toBeTruthy();
    expect(mockClearCart).not.toHaveBeenCalled();
  });
});
