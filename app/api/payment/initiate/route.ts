import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { normalizeOrderItemsForPersistence, type IncomingOrderItem } from '@/lib/supabase/custom-order-items';
import { createOrder } from '@/lib/supabase/orders';
import { initiatePayment, JekoApiError, mapProvider, JEKO_CURRENCY, getJekoConfigDiagnostics } from '@/lib/payment/jeko';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const PAYMENT_RATE_LIMIT = { limit: 5, windowSec: 60 };
const PAYMENT_LOG_CONTEXT = 'API /payment/initiate';

type MobileProvider = 'orange' | 'mtn' | 'wave' | 'moov' | 'djamo';

interface InitiateBody {
  totalAmount: number;
  paymentMethod: MobileProvider;
  shippingModeId?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    country: string;
  };
  phone: string;
  email?: string;
  notes?: string;
  items: IncomingOrderItem[];
}

function getGuestEmail(phone: string) {
  const compactPhone = phone.replace(/\D/g, '').slice(-12) || `${Date.now()}`;
  return `guest-${compactPhone}@vip-parfumerie.local`;
}

function validateBody(body: unknown): { data: InitiateBody } | { error: string } {
  const b = body as Record<string, unknown>;

  if (!b || typeof b !== 'object') return { error: 'Corps de requête invalide' };
  if (typeof b.totalAmount !== 'number' || b.totalAmount <= 0)
    return { error: 'Montant invalide' };
  if (!['orange', 'mtn', 'wave', 'moov', 'djamo'].includes(b.paymentMethod as string))
    return { error: 'Opérateur Mobile Money invalide' };
  if (!b.phone || typeof b.phone !== 'string') return { error: 'Numéro de téléphone requis' };
  if (b.phone.replace(/\D/g, '').length < 8) return { error: 'Numéro Mobile Money invalide' };
  if (!Array.isArray(b.items) || b.items.length === 0)
    return { error: 'Au moins un article requis' };
  if (b.shippingModeId !== undefined && typeof b.shippingModeId !== 'string') {
    return { error: 'Mode de livraison invalide' };
  }

  const addr = b.shippingAddress as Record<string, unknown>;
  if (!addr?.firstName || !addr?.lastName || !addr?.address || !addr?.city || !addr?.country)
    return { error: 'Adresse de livraison incomplète' };

  return { data: b as unknown as InitiateBody };
}

function getOrderErrorStatus(message: string) {
  if (/stock insuffisant/i.test(message)) return 409;
  if (/produit invalide|quantité invalide|article requis|introuvable|prix produit invalide/i.test(message)) {
    return 400;
  }
  return 500;
}

function getJekoErrorStatus(error: JekoApiError) {
  if ([400, 409, 422].includes(error.status)) return 502;
  if ([401, 403].includes(error.status)) return 503;
  return 502;
}

function getMaskedPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '[redacted-phone]';
  return `***${digits.slice(-4)}`;
}

function getInitiationLogContext(appUrlSource: 'env' | 'request-origin') {
  return {
    appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    appUrlSource,
    hasSupabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    jeko: getJekoConfigDiagnostics(),
  };
}

function getPaymentCorrelationId(
  requestCorrelationId: string,
  currentOrderId?: string | null,
  currentTransactionId?: string | null
) {
  return currentOrderId ?? currentTransactionId ?? requestCorrelationId;
}

/**
 * POST /api/payment/initiate
 * Creates the order in DB (payment_status: pending) then calls Jeko Africa
 * to send an STK push to the customer's mobile phone.
 */
export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, 'payment:initiate', PAYMENT_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const requestCorrelationId = randomUUID();
  let orderId: string | null = null;
  let transactionId: string | null = null;
  let paymentMethod: MobileProvider | null = null;
  let maskedPhone: string | null = null;
  const appUrlSource = process.env.NEXT_PUBLIC_APP_URL ? 'env' : 'request-origin';

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const raw = await request.json();
    const validated = validateBody(raw);
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const d = validated.data;
    paymentMethod = d.paymentMethod;
    maskedPhone = getMaskedPhone(d.phone);

    logger.info(PAYMENT_LOG_CONTEXT, 'Payment initiation request received', {
      correlationId: getPaymentCorrelationId(requestCorrelationId, orderId, transactionId),
      provider: d.paymentMethod,
      totalAmount: d.totalAmount,
      itemCount: d.items.length,
      hasShippingMode: Boolean(d.shippingModeId),
      requestOrigin: request.nextUrl.origin,
      phone: maskedPhone,
      env: getInitiationLogContext(appUrlSource),
    });

    const jekoConfig = getJekoConfigDiagnostics();
    if (!jekoConfig.isReadyForInitiation) {
      logger.error(PAYMENT_LOG_CONTEXT, 'Jeko configuration incomplete before order creation', {
        correlationId: getPaymentCorrelationId(requestCorrelationId, orderId, transactionId),
        provider: d.paymentMethod,
        phone: maskedPhone,
        env: getInitiationLogContext(appUrlSource),
      });

      return NextResponse.json(
        { error: 'Configuration du paiement indisponible. Contactez le support.' },
        { status: 503 }
      );
    }

    const email = d.email ?? user?.email ?? getGuestEmail(d.phone);
    const orderClient = createServiceClient();
    const normalized = await normalizeOrderItemsForPersistence(orderClient, d.items);

    if (!normalized.ok) {
      logger.warn(PAYMENT_LOG_CONTEXT, 'Order items normalization failed', {
        correlationId: getPaymentCorrelationId(requestCorrelationId, orderId, transactionId),
        provider: d.paymentMethod,
        phone: maskedPhone,
        itemCount: d.items.length,
        error: normalized.error,
      });

      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const notes = [d.notes, ...normalized.notes].filter(Boolean).join('\n\n');

    // ── 1. Create order with payment_status pending ───────────────────────
    const { order, error: orderError } = await createOrder(user?.id ?? null, {
      totalAmount: d.totalAmount,
      paymentMethod: 'mobile_money',
      shippingModeId: d.shippingModeId,
      shippingAddress: d.shippingAddress,
      phone: d.phone,
      email,
      notes: notes || undefined,
      items: normalized.items,
    }, orderClient);

    if (orderError || !order) {
      logger.error(PAYMENT_LOG_CONTEXT, 'Order creation failed before Jeko initiation', {
        correlationId: getPaymentCorrelationId(requestCorrelationId, orderId, transactionId),
        provider: d.paymentMethod,
        phone: maskedPhone,
        itemCount: normalized.items.length,
        totalAmount: d.totalAmount,
        error: orderError ?? 'unknown_order_error',
      });

      return NextResponse.json(
        { error: orderError ?? 'Erreur lors de la création de la commande' },
        { status: getOrderErrorStatus(orderError ?? '') }
      );
    }

    orderId = order.id;

    // ── 2. Call Jeko API to initiate the mobile money payment ─────────────
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    const mappedProvider = mapProvider(d.paymentMethod);

    logger.info(PAYMENT_LOG_CONTEXT, 'Calling Jeko payment initiation', {
      correlationId: getPaymentCorrelationId(requestCorrelationId, orderId, transactionId),
      orderId,
      provider: d.paymentMethod,
      mappedProvider,
      amountXof: order.totalAmount,
      currency: JEKO_CURRENCY,
      appUrl,
      phone: maskedPhone,
      jekoBaseUrl: jekoConfig.baseUrl,
    });

    const jekoRes = await initiatePayment({
      amountXof: order.totalAmount,
      currency: JEKO_CURRENCY,
      provider: mappedProvider,
      reference: order.id,
      successUrl: `${appUrl}/commande/confirmation?order=${order.id}`,
      errorUrl: `${appUrl}/commande?error=payment_failed`,
      payerPhone: d.phone,
    });

    transactionId = jekoRes.id;

    logger.info(PAYMENT_LOG_CONTEXT, 'Jeko payment initiated successfully', {
      correlationId: getPaymentCorrelationId(requestCorrelationId, orderId, transactionId),
      orderId,
      transactionId: jekoRes.id,
      status: jekoRes.status,
      hasRedirectUrl: Boolean(jekoRes.redirectUrl),
    });

    // ── 3. Store Jeko payment request ID for webhook reconciliation ───────
    const { error: paymentReferenceError } = await orderClient
      .from('orders')
      .update({ payment_reference: jekoRes.id })
      .eq('id', order.id);

    if (paymentReferenceError) {
      logger.warn(PAYMENT_LOG_CONTEXT, 'Failed to persist Jeko transaction id on order', {
        correlationId: getPaymentCorrelationId(requestCorrelationId, orderId, transactionId),
        orderId,
        transactionId: jekoRes.id,
        error: paymentReferenceError,
      });
    }

    return NextResponse.json(
      {
        orderId: order.id,
        transactionId: jekoRes.id,
        redirectUrl: jekoRes.redirectUrl,
        status: jekoRes.status,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof JekoApiError) {
      logger.error(PAYMENT_LOG_CONTEXT, 'Jeko API error during payment initiation', {
        correlationId: getPaymentCorrelationId(requestCorrelationId, orderId, transactionId),
        orderId,
        transactionId,
        provider: paymentMethod,
        phone: maskedPhone,
        status: err.status,
        details: err.details,
        env: getInitiationLogContext(appUrlSource),
      });

      return NextResponse.json(
        { error: 'Erreur du fournisseur de paiement' },
        { status: getJekoErrorStatus(err) }
      );
    }

    logger.error(PAYMENT_LOG_CONTEXT, 'Unexpected error during payment initiation', {
      correlationId: getPaymentCorrelationId(requestCorrelationId, orderId, transactionId),
      orderId,
      transactionId,
      provider: paymentMethod,
      phone: maskedPhone,
      env: getInitiationLogContext(appUrlSource),
      error: err,
    });

    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'initiation du paiement' },
      { status: 500 }
    );
  }
}
