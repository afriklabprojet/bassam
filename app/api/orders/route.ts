import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createOrder, getUserOrders } from '@/lib/supabase/orders';

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
  email: z.string().email('Email invalide'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid('ID produit invalide'),
    quantity: z.number().int().positive('Quantité invalide'),
    unitPrice: z.number().positive('Prix unitaire invalide'),
  })).min(1, 'Au moins un article requis'),
});

// POST /api/orders — create a new order (requires auth)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Veuillez vous connecter pour passer une commande' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { order, error } = await createOrder(user.id, parsed.data);

    if (error || !order) {
      return NextResponse.json(
        { error: error ?? 'Erreur lors de la création de la commande' },
        { status: 500 }
      );
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('[API POST /orders]', error);
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
    console.error('[API GET /orders]', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
