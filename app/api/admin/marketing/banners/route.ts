import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

// GET /api/admin/marketing/banners
export async function GET() {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ banners: data ?? [] });
  } catch (err) {
    console.error('[Admin GET /banners]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/marketing/banners
export async function POST(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const body = await request.json();
    const { title, subtitle, cta_text, cta_link, image_url, bg_color, display_order } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('banners')
      .insert({
        title: title.trim(),
        subtitle: subtitle ?? null,
        cta_text: cta_text ?? null,
        cta_link: cta_link ?? '/',
        image_url: image_url ?? null,
        bg_color: bg_color ?? 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%)',
        display_order: display_order ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ banner: data }, { status: 201 });
  } catch (err) {
    console.error('[Admin POST /banners]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/marketing/banners
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const allowed = ['title', 'subtitle', 'cta_text', 'cta_link', 'image_url', 'bg_color', 'is_active', 'display_order'];
    const sanitized: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in updates) sanitized[key] = updates[key];
    }

    const supabase = await createClient();
    const { error } = await supabase.from('banners').update(sanitized).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Admin PATCH /banners]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/admin/marketing/banners
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Admin DELETE /banners]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
