import crypto from 'node:crypto';

/* ══════════════════════════════════════════════════════════════════════════
   Jeko Africa — Mobile Money Payment Service
   Docs : https://developer.jeko.africa
   ══════════════════════════════════════════════════════════════════════════ */

export type JekoProvider = 'orange' | 'mtn' | 'wave' | 'moov' | 'djamo';

export interface JekoInitiateParams {
  /** Amount in XOF (converted internally to amountCents) */
  amountXof: number;
  currency: 'XOF' | 'XAF' | 'GNF';
  provider: JekoProvider;
  /** Our internal order ID — used as idempotency key + for webhook matching */
  reference: string;
  successUrl: string;
  errorUrl: string;
  /** Optional: pre-fills the payer phone on Jeko's hosted payment page */
  payerPhone?: string;
}

export interface JekoInitiateResponse {
  id: string;
  storeId: string;
  reference: string;
  type: string;
  paymentMethod: string;
  status: 'pending' | 'failed';
  errorReason: string | null;
  transaction: unknown;
  /** URL to redirect the customer to for payment completion */
  redirectUrl: string;
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

const JEKO_BASE_URL = process.env.JEKO_API_URL ?? 'https://api.jeko.africa';
const JEKO_API_KEY = process.env.JEKO_API_KEY ?? '';
const JEKO_API_KEY_ID = process.env.JEKO_API_KEY_ID ?? '';
const JEKO_WEBHOOK_SECRET = process.env.JEKO_WEBHOOK_SECRET ?? '';
const JEKO_STORE_ID = process.env.JEKO_STORE_ID ?? '';
export const JEKO_CURRENCY = (process.env.JEKO_CURRENCY ?? 'XOF') as 'XOF' | 'XAF' | 'GNF';

/** Map internal provider names (from checkout form) to Jeko's expected values */
const PROVIDER_MAP: Record<string, JekoProvider> = {
  orange: 'orange',
  mtn: 'mtn',
  wave: 'wave',
  moov: 'moov',
  djamo: 'djamo',
};

export function mapProvider(internal: string): JekoProvider {
  return PROVIDER_MAP[internal] ?? 'orange';
}

/** Initiate a mobile money collection via Jeko Africa API (redirect flow) */
export async function initiatePayment(
  params: JekoInitiateParams
): Promise<JekoInitiateResponse> {
  if (!JEKO_API_KEY || !JEKO_API_KEY_ID) {
    throw new Error('JEKO_API_KEY and JEKO_API_KEY_ID must be configured');
  }
  if (!JEKO_STORE_ID) {
    throw new Error('JEKO_STORE_ID must be configured');
  }

  const paymentData: Record<string, unknown> = {
    paymentMethod: params.provider,
    successUrl: params.successUrl,
    errorUrl: params.errorUrl,
  };

  if (params.payerPhone) {
    paymentData.payerPhone = params.payerPhone;
  }

  const body = {
    amountCents: Math.round(params.amountXof * 100),
    currency: params.currency,
    reference: params.reference,
    storeId: JEKO_STORE_ID,
    paymentDetails: {
      type: 'redirect',
      data: paymentData,
    },
  };

  const response = await fetch(`${JEKO_BASE_URL}/partner_api/payment_requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': JEKO_API_KEY,
      'X-API-KEY-ID': JEKO_API_KEY_ID,
      'X-Idempotency-Key': params.reference,
    },
    body: JSON.stringify(body),
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
