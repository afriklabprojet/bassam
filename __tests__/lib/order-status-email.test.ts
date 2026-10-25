import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/site-settings', () => ({
  getSiteSettings: vi.fn(async () => ({ site_name: 'VIP Parfumerie Bar', order_notification_email: 'commande@vip.ci' })),
}));

const { isCustomerStatusEmail, orderTrackingUrl, sendOrderStatusEmail } = await import('@/lib/order-notifications');

const ORDER_ID = 'abcdef12-0000-4000-8000-000000000001';

function supabaseWith(order: Record<string, unknown> | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: order, error: null });
  const from = vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }));
  return { client: { from } as never, from };
}

function mockResend(ok = true) {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: ok ? 200 : 500 }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const sentEmail = (fetchMock: ReturnType<typeof vi.fn>) => JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));

beforeEach(() => {
  vi.stubEnv('RESEND_API_KEY', 're_test');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('orderTrackingUrl', () => {
  it('pointe vers la page de suivi avec le numéro prérempli', () => {
    expect(orderTrackingUrl(ORDER_ID)).toMatch(/\/suivi-commande\?ref=VIP-ABCDEF12$/);
  });
});

describe('isCustomerStatusEmail', () => {
  it('chaque statut de commande prévient le client', () => {
    for (const status of ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']) {
      expect(isCustomerStatusEmail(status)).toBe(true);
    }
  });

  it('une valeur inconnue ne déclenche rien', () => {
    for (const status of ['autre', 'payment_failed', 'abandoned', 'toString', '']) expect(isCustomerStatusEmail(status)).toBe(false);
  });
});

describe('sendOrderStatusEmail', () => {
  it('commande expédiée : e-mail au client avec le numéro, son prénom et le lien de suivi', async () => {
    const fetchMock = mockResend();
    const { client } = supabaseWith({ id: ORDER_ID, email: 'aya@example.com', shipping_address: { firstName: 'Aya' } });

    await sendOrderStatusEmail(client, ORDER_ID, 'shipped');

    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({ method: 'POST' }));
    const email = sentEmail(fetchMock);
    expect(email.to).toBe('aya@example.com');
    expect(email.subject).toBe('Votre commande VIP-ABCDEF12 est en route');
    expect(email.html).toContain('Bonjour Aya');
    expect(email.html).toContain('/suivi-commande?ref=VIP-ABCDEF12');
    expect(email.html).toContain('Le téléphone utilisé pour la commande vous sera demandé.');
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('commande livrée : objet dédié', async () => {
    const fetchMock = mockResend();
    const { client } = supabaseWith({ id: ORDER_ID, email: 'aya@example.com', shipping_address: null });
    await sendOrderStatusEmail(client, ORDER_ID, 'delivered');
    expect(sentEmail(fetchMock).subject).toBe('Votre commande VIP-ABCDEF12 a été livrée');
    expect(sentEmail(fetchMock).html).toContain('Bonjour,');
  });

  it.each([
    ['confirmed', 'Votre commande VIP-ABCDEF12 est confirmée', 'en cours de préparation'],
    ['cancelled', 'Votre commande VIP-ABCDEF12 a été annulée', 'a été annulée'],
    ['pending', 'Votre commande VIP-ABCDEF12 est en attente', 'en attente de traitement'],
  ] as const)('statut « %s » : objet et texte dédiés, avec le lien de suivi', async (status, subject, text) => {
    const fetchMock = mockResend();
    const { client } = supabaseWith({ id: ORDER_ID, email: 'aya@example.com', shipping_address: { firstName: 'Aya' } });
    await sendOrderStatusEmail(client, ORDER_ID, status);
    const email = sentEmail(fetchMock);
    expect(email.subject).toBe(subject);
    expect(email.html).toContain(text);
    expect(email.html).toContain('/suivi-commande?ref=VIP-ABCDEF12');
  });

  it('paiement échoué : commande annulée, et un lien pour repasser commande (pas de lien de suivi)', async () => {
    const fetchMock = mockResend();
    const { client } = supabaseWith({ id: ORDER_ID, email: 'aya@example.com', shipping_address: null });
    await sendOrderStatusEmail(client, ORDER_ID, 'payment_failed');
    const email = sentEmail(fetchMock);
    expect(email.subject).toBe('Le paiement de votre commande VIP-ABCDEF12 n’a pas abouti');
    expect(email.html).toContain('commande a été annulée');
    expect(email.html).toMatch(/href="[^"]*\/panier"/);
    expect(email.html).not.toContain('/suivi-commande');
  });

  it('annulation automatique (non payée sous 48 h) : explication et lien pour repasser commande', async () => {
    const fetchMock = mockResend();
    const { client } = supabaseWith({ id: ORDER_ID, email: 'aya@example.com', shipping_address: { firstName: 'Aya' } });
    await sendOrderStatusEmail(client, ORDER_ID, 'abandoned');
    const email = sentEmail(fetchMock);
    expect(email.subject).toBe('Votre commande VIP-ABCDEF12 a été annulée');
    expect(email.html).toContain('n’a pas été payée sous 48 h');
    expect(email.html).toMatch(/href="[^"]*\/panier"/);
    expect(email.html).not.toContain('/suivi-commande');
  });

  it('échappe le prénom saisi par le client', async () => {
    const fetchMock = mockResend();
    const { client } = supabaseWith({ id: ORDER_ID, email: 'a@example.com', shipping_address: { firstName: '<img src=x onerror=alert(1)>' } });
    await sendOrderStatusEmail(client, ORDER_ID, 'shipped');
    expect(sentEmail(fetchMock).html).not.toContain('<img src=x');
  });

  it('indique si l’e-mail a été accepté par Resend', async () => {
    mockResend(true);
    const { client } = supabaseWith({ id: ORDER_ID, email: 'a@example.com' });
    await expect(sendOrderStatusEmail(client, ORDER_ID, 'shipped')).resolves.toBe(true);
    mockResend(false);
    await expect(sendOrderStatusEmail(client, ORDER_ID, 'shipped')).resolves.toBe(false);
  });

  it('sans e-mail client, sans commande ou sans Resend : rien n’est envoyé', async () => {
    const fetchMock = mockResend();
    await expect(sendOrderStatusEmail(supabaseWith({ id: ORDER_ID, email: null }).client, ORDER_ID, 'shipped')).resolves.toBe(false);
    await sendOrderStatusEmail(supabaseWith(null).client, ORDER_ID, 'shipped');
    vi.stubEnv('RESEND_API_KEY', '');
    const unconfigured = supabaseWith({ id: ORDER_ID, email: 'a@example.com' });
    await sendOrderStatusEmail(unconfigured.client, ORDER_ID, 'shipped');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(unconfigured.from).not.toHaveBeenCalled();
  });

  it('un échec de Resend ou du réseau ne lève jamais d’erreur', async () => {
    mockResend(false);
    const { client } = supabaseWith({ id: ORDER_ID, email: 'a@example.com' });
    await expect(sendOrderStatusEmail(client, ORDER_ID, 'shipped')).resolves.toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    await expect(sendOrderStatusEmail(client, ORDER_ID, 'delivered')).resolves.toBe(false);
  });
});
