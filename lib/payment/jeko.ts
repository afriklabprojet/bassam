import crypto from 'node:crypto';

/* ══════════════════════════════════════════════════════════════════════════
   Jeko Africa — Mobile Money Payment Service
   Docs : https://developer.jeko.africa
   ══════════════════════════════════════════════════════════════════════════ */

export type JekoProvider = 'orange' | 'mtn' | 'wave' | 'moov' | 'djamo';
export type JekoCurrency = 'XOF' | 'XAF' | 'GNF';

export interface JekoInitiateParams {
  /** Amount in XOF (converted internally to amountCents) */
  amountXof: number;
  currency: JekoCurrency;
  provider: JekoProvider;
  /** Our internal order ID — used as idempotency key + for webhook matching */
  reference: string;
  successUrl: string;
  errorUrl: string;
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

/**
 * Real shape of a Jeko webhook delivery (verified against
 * https://developer.jeko.africa/docs/webhooks/integration — the payload is a
 * flat transaction object, not an {event, ...} envelope, and our own order
 * reference lives under transactionDetails.reference, not top-level
 * `reference`).
 */
export interface JekoWebhookPayload {
  /** Jeko transaction id (the actual money movement, not the payment request) */
  id: string;
  amount: { amount: number; currency: string };
  fees?: { amount: number; currency: string };
  /** Transaction state — only "success" is ever sent for a completed payment */
  status: 'pending' | 'success' | 'error' | string;
  counterpartLabel?: string;
  counterpartIdentifier?: string;
  paymentMethod?: string;
  transactionType?: string;
  description?: string;
  executedAt?: string;
  transactionDetails?: {
    /** Payment request id — matches the `id` we stored as orders.payment_reference at initiation */
    id?: string;
    /** Our order UUID, as submitted as `reference` when creating the payment request */
    reference?: string;
    paymentLinkId?: string;
  };
}

export class JekoApiError extends Error {
  status: number;
  details: string;

  constructor(status: number, details: string) {
    super(`Jeko API error ${status}: ${details}`);
    this.name = 'JekoApiError';
    this.status = status;
    this.details = details;
  }
}

const REQUIRED_JEKO_ENV_KEYS = ['JEKO_API_KEY', 'JEKO_API_KEY_ID', 'JEKO_STORE_ID'] as const;

type RequiredJekoEnvKey = (typeof REQUIRED_JEKO_ENV_KEYS)[number];

export interface JekoConfigDiagnostics {
  baseUrl: string;
  currency: JekoCurrency;
  hasWebhookSecret: boolean;
  required: Record<RequiredJekoEnvKey, boolean>;
  missingRequired: RequiredJekoEnvKey[];
  isReadyForInitiation: boolean;
}
export const JEKO_CURRENCY = (process.env.JEKO_CURRENCY ?? 'XOF') as JekoCurrency;

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

export function normalizeJekoBaseUrl(rawUrl: string) {
  return rawUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
}

export function getJekoConfigDiagnostics(): JekoConfigDiagnostics {
  const required: Record<RequiredJekoEnvKey, boolean> = {
    JEKO_API_KEY: Boolean(process.env.JEKO_API_KEY),
    JEKO_API_KEY_ID: Boolean(process.env.JEKO_API_KEY_ID),
    JEKO_STORE_ID: Boolean(process.env.JEKO_STORE_ID),
  };

  const missingRequired = REQUIRED_JEKO_ENV_KEYS.filter((key) => !required[key]);

  return {
    baseUrl: normalizeJekoBaseUrl(process.env.JEKO_API_URL ?? 'https://api.jeko.africa'),
    currency: JEKO_CURRENCY,
    hasWebhookSecret: Boolean(process.env.JEKO_WEBHOOK_SECRET),
    required,
    missingRequired,
    isReadyForInitiation: missingRequired.length === 0,
  };
}

/**
 * Normalize a CI phone number to E.164 (+225XXXXXXXXXX, 13 digits total).
 * CI uses 10-digit local numbers since 2021 (e.g. 0759119185).
 * Returns null if the result cannot be made valid — caller should omit payerPhone.
 */
export function normalizePhoneForJeko(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');

  let local: string;

  if (digits.startsWith('225')) {
    local = digits.slice(3);
  } else if (digits.startsWith('0')) {
    // Local format 0XXXXXXXXX (10 digits)
    local = digits;
  } else if (digits.length === 9) {
    // 9-digit local without leading 0 — prepend it
    local = `0${digits}`;
  } else {
    return null;
  }

  // Ivorian local numbers are exactly 10 digits
  if (local.length !== 10) return null;

  const e164 = `+225${local}`;

  // Validate the result: +225 followed by exactly 10 digits
  if (!/^\+225\d{10}$/.test(e164)) return null;

  return e164;
}

/** Initiate a mobile money collection via Jeko Africa API (redirect flow) */
export async function initiatePayment(
  params: JekoInitiateParams
): Promise<JekoInitiateResponse> {
  const JEKO_BASE_URL = normalizeJekoBaseUrl(
    process.env.JEKO_API_URL ?? 'https://api.jeko.africa'
  );
  const JEKO_API_KEY = process.env.JEKO_API_KEY ?? '';
  const JEKO_API_KEY_ID = process.env.JEKO_API_KEY_ID ?? '';
  const JEKO_STORE_ID = process.env.JEKO_STORE_ID ?? '';

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

  // payerPhone intentionally omitted — Jeko rejects non-matching regex formats
  // and the field is optional (Jeko prompts the user on their hosted payment page)

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
    throw new JekoApiError(response.status, err);
  }

  return response.json() as Promise<JekoInitiateResponse>;
}

/**
 * Verify Jeko webhook HMAC-SHA256 signature.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const JEKO_WEBHOOK_SECRET = process.env.JEKO_WEBHOOK_SECRET ?? '';
  if (!JEKO_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JEKO_WEBHOOK_SECRET must be set in production');
    }
    // Dev-only: secret not set, skip verification
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
