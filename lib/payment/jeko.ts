import crypto from 'node:crypto';

/* ══════════════════════════════════════════════════════════════════════════
   Jeko Africa — Mobile Money Payment Service
   Docs : https://docs.jeko.africa  (configurer via .env)
   ══════════════════════════════════════════════════════════════════════════ */

export type JekoProvider = 'orange_money' | 'mtn_mobile_money' | 'wave' | 'moov_money';

export interface JekoInitiateParams {
  amount: number;
  currency: 'XOF' | 'XAF' | 'GNF';
  phone: string;
  provider: JekoProvider;
  /** Our internal order ID — used as idempotency key + for webhook matching */
  reference: string;
  customerName: string;
  description: string;
  callbackUrl: string;
}

export interface JekoInitiateResponse {
  transactionId: string;
  status: 'pending' | 'failed';
  /** Optional redirect URL for web payment flows */
  paymentUrl?: string;
  message: string;
}

export interface JekoWebhookPayload {
  event: 'payment.success' | 'payment.failed';
  transactionId: string;
  /** Our order ID passed as reference during initiation */
  reference: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed';
  provider: string;
  phone: string;
}

const JEKO_BASE_URL = process.env.JEKO_API_URL ?? 'https://api.jeko.africa/v1';
const JEKO_API_KEY = process.env.JEKO_API_KEY ?? '';
const JEKO_WEBHOOK_SECRET = process.env.JEKO_WEBHOOK_SECRET ?? '';

/** Map internal provider names (from checkout form) to Jeko's expected values */
const PROVIDER_MAP: Record<string, JekoProvider> = {
  orange: 'orange_money',
  mtn: 'mtn_mobile_money',
  wave: 'wave',
  moov: 'moov_money',
};

export function mapProvider(internal: string): JekoProvider {
  return PROVIDER_MAP[internal] ?? 'orange_money';
}

/** Initiate a mobile money collection via Jeko Africa API */
export async function initiatePayment(
  params: JekoInitiateParams
): Promise<JekoInitiateResponse> {
  if (!JEKO_API_KEY) {
    throw new Error('JEKO_API_KEY is not configured');
  }

  const response = await fetch(`${JEKO_BASE_URL}/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JEKO_API_KEY}`,
      // Idempotency key — safe to retry with same order ID
      'X-Idempotency-Key': params.reference,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      customer: {
        phone: params.phone,
        name: params.customerName,
      },
      payment_method: params.provider,
      reference: params.reference,
      callback_url: params.callbackUrl,
      description: params.description,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[Jeko initiatePayment]', response.status, err);
    throw new Error(`Jeko API error ${response.status}: ${err}`);
  }

  return response.json() as Promise<JekoInitiateResponse>;
}

/**
 * Verify Jeko webhook HMAC-SHA256 signature.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!JEKO_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JEKO_WEBHOOK_SECRET must be set in production');
    }
    console.warn('[Jeko] JEKO_WEBHOOK_SECRET not set — skipping signature verification (dev only)');
    return true;
  }

  const expected = crypto
    .createHmac('sha256', JEKO_WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('hex');

  try {
    const sigBuf = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
