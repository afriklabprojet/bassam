import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { normalizeOrderItemsForPersistence, type IncomingOrderItem } from '@/lib/supabase/custom-order-items';
import { createOrder } from '@/lib/supabase/orders';
import { initiatePayment, JekoApiError, mapProvider, JEKO_CURRENCY } from '@/lib/payment/jeko';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const PAYMENT_RATE_LIMIT = { limit: 5, windowSec: 60 };

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

/**
 * POST /api/payment/initiate
 * Creates the order in DB (payment_status: pending) then calls Jeko Africa
 * to send an STK push to the customer's mobile phone.
 */
export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, 'payment:initiate', PAYMENT_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

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
    const email = d.email ?? user?.email ?? getGuestEmail(d.phone);
    const orderClient = createServiceClient();
    const normalized = await normalizeOrderItemsForPersistence(orderClient, d.items);

    if (!normalized.ok) {
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
      return NextResponse.json(
        { error: orderError ?? 'Erreur lors de la création de la commande' },
        { status: getOrderErrorStatus(orderError ?? '') }
      );
    }

    // ── 2. Call Jeko API to initiate the mobile money payment ─────────────
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

    const jekoRes = await initiatePayment({
      amountXof: order.totalAmount,
      currency: JEKO_CURRENCY,
      provider: mapProvider(d.paymentMethod),
      reference: order.id,
      successUrl: `${appUrl}/commande/confirmation?order=${order.id}`,
      errorUrl: `${appUrl}/commande?error=payment_failed`,
      payerPhone: d.phone,
    });

    // ── 3. Store Jeko payment request ID for webhook reconciliation ───────
    await orderClient
      .from('orders')
      .update({ payment_reference: jekoRes.id })
      .eq('id', order.id);

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
      console.error('[POST /api/payment/initiate][Jeko]', err.status, err.details);
      return NextResponse.json(
        { error: 'Erreur du fournisseur de paiement' },
        { status: getJekoErrorStatus(err) }
      );
    }

    const msg = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/payment/initiate]', msg);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'initiation du paiement' },
      { status: 500 }
    );
  }
}
