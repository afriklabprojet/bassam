import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isCurrentUserAdmin, getAdminProducts, createProduct, updateProduct, deleteProduct } from '@/lib/supabase/admin';

const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  brand: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  gender: z.enum(['homme', 'femme', 'mixte']).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  notes: z.object({
    top: z.array(z.string()),
    heart: z.array(z.string()),
    base: z.array(z.string()),
  }).optional(),
  concentration: z.string().optional(),
  volume: z.string().optional(),
});

// GET /api/admin/products — list products (admin)
export async function GET(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 20);
    const search = searchParams.get('q') || undefined;

    const result = await getAdminProducts(page, limit, search);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Admin GET /products]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/products — create product
export async function POST(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { product, error } = await createProduct(parsed.data);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('[Admin POST /products]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/products — update product (id in body)
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...fields } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });
    }

    const { error } = await updateProduct(id, fields);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin PATCH /products]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/admin/products — delete product (id in body)
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });
    }

    const { error } = await deleteProduct(id);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin DELETE /products]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
