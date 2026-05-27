import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { normalizeOrderItemsForPersistence } from '@/lib/supabase/custom-order-items';
import { createOrder, getUserOrders } from '@/lib/supabase/orders';
import { logger } from '@/lib/logger';

const customCreationSchema = z.object({
  formulaId: z.enum(['essentiel', 'signature', 'prestige']),
  formulaName: z.string().min(1),
  volume: z.string().min(1),
  family: z.string().min(1),
  intensity: z.string().min(1),
  audience: z.string().min(1),
  notes: z.array(z.string()).min(1),
  bottle: z.string().min(1),
  engraving: z.string(),
  perfumeName: z.string().min(1),
  inspiration: z.string(),
  createdAt: z.string().min(1),
});

const createOrderSchema = z.object({
  totalAmount: z.number().positive('Montant invalide'),
  paymentMethod: z.enum(['mobile_money', 'card', 'cash_on_delivery']),
  shippingAddress: z.object({
    firstName: z.string().min(1, 'Prénom requis'),
    lastName: z.string().min(1, 'Nom requis'),
    address: z.string().min(1, 'Adresse requise'),
    city: z.string().min(1, 'Ville requise'),
    country: z.string().min(1, 'Pays requis'),
    postalCode: z.string().optional(),
  }),
  phone: z.string().min(8, 'Numéro de téléphone invalide'),
  email: z.email('Email invalide').optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'ID produit invalide'),
    quantity: z.number().int().positive('Quantité invalide'),
    unitPrice: z.number().positive('Prix unitaire invalide'),
    customCreation: customCreationSchema.optional(),
  })).min(1, 'Au moins un article requis'),
});

function getGuestEmail(phone: string) {
  const compactPhone = phone.replace(/\D/g, '').slice(-12) || `${Date.now()}`;
  return `guest-${compactPhone}@vip-parfumerie.local`;
}

// POST /api/orders — create a new guest or authenticated order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const orderClient = createServiceClient();
    const normalized = await normalizeOrderItemsForPersistence(orderClient, parsed.data.items);

    if (!normalized.ok) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const notes = [parsed.data.notes, ...normalized.notes].filter(Boolean).join('\n\n');
    const { order, error } = await createOrder(user?.id ?? null, {
      ...parsed.data,
      email: parsed.data.email ?? user?.email ?? getGuestEmail(parsed.data.phone),
      notes: notes || undefined,
      items: normalized.items,
    }, orderClient);

    if (error || !order) {
      return NextResponse.json(
        { error: error ?? 'Erreur lors de la création de la commande' },
        { status: 500 }
      );
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    logger.error('[API POST /orders]', 'Error', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET /api/orders — list user's orders (requires auth)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Veuillez vous connecter' },
        { status: 401 }
      );
    }

    const orders = await getUserOrders(user.id);
    return NextResponse.json({ orders });
  } catch (error) {
    logger.error('[API GET /orders]', 'Error', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
