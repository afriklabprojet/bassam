import { NextRequest, NextResponse } from "next/server";
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, display_order')
      .order('display_order', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [], categories: data ?? [] });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Vérification admin
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { name, slug, description, imageUrl, displayOrder } = await req.json();
    if (!name || !slug) {
      return NextResponse.json({ error: "Nom et slug requis" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.from("categories").insert([
      {
        name,
        slug,
        description: description || null,
        image_url: imageUrl || null,
        display_order: displayOrder ?? 0,
      },
    ]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message || "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { id, name, slug, description, imageUrl, displayOrder } = await req.json();
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (imageUrl !== undefined) updates.image_url = imageUrl || null;
    if (displayOrder !== undefined) updates.display_order = displayOrder;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const supabase = createServiceClient();
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('slug, name')
      .eq('id', id)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });
    }

    const { count, error: usageError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category', category.slug);

    if (usageError) {
      return NextResponse.json({ error: usageError.message }, { status: 500 });
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer cette catégorie: ${count} produit(s) utilisent encore ${category.name}.` },
        { status: 409 }
      );
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message || 'Erreur serveur' }, { status: 500 });
  }
}
