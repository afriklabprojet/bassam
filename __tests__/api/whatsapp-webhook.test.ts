import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const VERIFY_TOKEN = 'test_verify_token_123';

function makeGetRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/whatsapp/webhook');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return new NextRequest(url);
}

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv('WHATSAPP_VERIFY_TOKEN', VERIFY_TOKEN);
});

const { GET, POST } = await import('@/app/api/whatsapp/webhook/route');

describe('GET /api/whatsapp/webhook — vérification Meta', () => {
  it('renvoie le challenge brut quand le token et le mode sont corrects', async () => {
    const res = GET(makeGetRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY_TOKEN, 'hub.challenge': '1234567' }));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('1234567');
  });

  it('rejette (403) un verify_token incorrect', async () => {
    const res = GET(makeGetRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': 'mauvais_token', 'hub.challenge': '1234567' }));
    expect(res.status).toBe(403);
  });

  it('rejette (403) un mode différent de "subscribe"', async () => {
    const res = GET(makeGetRequest({ 'hub.mode': 'unsubscribe', 'hub.verify_token': VERIFY_TOKEN, 'hub.challenge': '1234567' }));
    expect(res.status).toBe(403);
  });

  it('rejette (403) si WHATSAPP_VERIFY_TOKEN n\'est pas configuré', async () => {
    vi.stubEnv('WHATSAPP_VERIFY_TOKEN', '');
    const res = GET(makeGetRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': '', 'hub.challenge': '1234567' }));
    expect(res.status).toBe(403);
  });
});

describe('POST /api/whatsapp/webhook — accusé de réception', () => {
  it('retourne toujours 200 sans traiter le contenu', async () => {
    const res = await POST(makePostRequest({ entry: [] }));
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
