import { NextRequest, NextResponse } from 'next/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, slug, description, image_url, display_order')
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [], collections: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { name, slug, description, imageUrl, displayOrder } = await req.json();
    if (!name || !slug) {
      return NextResponse.json({ error: 'Nom et slug requis' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('collections')
      .insert([
        {
          name,
          slug,
          description: description || null,
          image_url: imageUrl || null,
          display_order: displayOrder ?? 0,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { id, name, slug, description, imageUrl, displayOrder } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (imageUrl !== undefined) updates.image_url = imageUrl || null;
    if (displayOrder !== undefined) updates.display_order = displayOrder;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id, name')
      .eq('id', id)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json({ error: 'Collection introuvable' }, { status: 404 });
    }

    const { count, error: usageError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('collection_id', id);

    if (usageError) {
      return NextResponse.json({ error: usageError.message }, { status: 500 });
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer cette collection: ${count} produit(s) y sont encore rattachés.` },
        { status: 409 }
      );
    }

    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 });
  }
}