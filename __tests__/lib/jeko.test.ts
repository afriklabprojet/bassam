import { describe, it, expect, vi, beforeAll } from 'vitest';
import crypto from 'node:crypto';

// JEKO_WEBHOOK_SECRET est une constante au niveau module dans jeko.ts.
// Elle est évaluée une seule fois à l'import. On la fixe AVANT l'import.
const TEST_SECRET = 'test_webhook_secret_12345';
vi.stubEnv('JEKO_WEBHOOK_SECRET', TEST_SECRET);

// Import après stubEnv pour que la constante soit correctement initialisée.
const { mapProvider, verifyWebhookSignature } = await import('@/lib/payment/jeko');

const BODY = JSON.stringify({ event: 'payment.success', amount: 50000 });

function makeSignature(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

beforeAll(() => {
  // Garantit que le secret est en place pour tous les tests de ce fichier.
  vi.stubEnv('JEKO_WEBHOOK_SECRET', TEST_SECRET);
});

// ─── mapProvider ─────────────────────────────────────────────────────────────

describe('mapProvider', () => {
  it('mappe "orange" vers orange', () => {
    expect(mapProvider('orange')).toBe('orange');
  });

  it('mappe "mtn" vers mtn', () => {
    expect(mapProvider('mtn')).toBe('mtn');
  });

  it('mappe "wave" vers wave', () => {
    expect(mapProvider('wave')).toBe('wave');
  });

  it('mappe "moov" vers moov', () => {
    expect(mapProvider('moov')).toBe('moov');
  });

  it('retourne orange pour une valeur inconnue', () => {
    expect(mapProvider('inconnu')).toBe('orange');
  });
});

// ─── verifyWebhookSignature ───────────────────────────────────────────────────

describe('verifyWebhookSignature', () => {
  it('valide une signature correcte', () => {
    const sig = makeSignature(BODY, TEST_SECRET);
    expect(verifyWebhookSignature(BODY, sig)).toBe(true);
  });

  it('rejette une signature incorrecte', () => {
    expect(verifyWebhookSignature(BODY, 'mauvaise_signature_hex')).toBe(false);
  });

  it('valide une signature préfixée sha256=', () => {
    const sig = 'sha256=' + makeSignature(BODY, TEST_SECRET);
    expect(verifyWebhookSignature(BODY, sig)).toBe(true);
  });

  it('rejette si le corps a été modifié', () => {
    const sig = makeSignature(BODY, TEST_SECRET);
    expect(verifyWebhookSignature(BODY + ' ', sig)).toBe(false);
  });

  it('rejette si la signature utilise un mauvais secret', () => {
    const wrongSig = makeSignature(BODY, 'mauvais_secret');
    expect(verifyWebhookSignature(BODY, wrongSig)).toBe(false);
  });

  it('retourne false pour une signature vide avec secret configuré', () => {
    expect(verifyWebhookSignature(BODY, '')).toBe(false);
  });
});
