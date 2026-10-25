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
  it('seuls « expédiée » et « livrée » préviennent le client', () => {
    expect(isCustomerStatusEmail('shipped')).toBe(true);
    expect(isCustomerStatusEmail('delivered')).toBe(true);
    for (const status of ['pending', 'confirmed', 'cancelled', 'autre']) expect(isCustomerStatusEmail(status)).toBe(false);
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

  it('échappe le prénom saisi par le client', async () => {
    const fetchMock = mockResend();
    const { client } = supabaseWith({ id: ORDER_ID, email: 'a@example.com', shipping_address: { firstName: '<img src=x onerror=alert(1)>' } });
    await sendOrderStatusEmail(client, ORDER_ID, 'shipped');
    expect(sentEmail(fetchMock).html).not.toContain('<img src=x');
  });

  it('sans e-mail client, sans commande ou sans Resend : rien n’est envoyé', async () => {
    const fetchMock = mockResend();
    await sendOrderStatusEmail(supabaseWith({ id: ORDER_ID, email: null }).client, ORDER_ID, 'shipped');
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
    await expect(sendOrderStatusEmail(client, ORDER_ID, 'shipped')).resolves.toBeUndefined();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    await expect(sendOrderStatusEmail(client, ORDER_ID, 'delivered')).resolves.toBeUndefined();
  });
});
