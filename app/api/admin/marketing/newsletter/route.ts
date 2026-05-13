import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin } from '@/lib/supabase/admin';

// GET /api/admin/marketing/newsletter?page=1&limit=50
export async function GET(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)));
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    const [{ count }, { data }, { data: campaigns }] = await Promise.all([
      supabase
        .from('newsletter_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('newsletter_subscriptions')
        .select('id, email, phone, subscribed_at, source, is_active')
        .order('subscribed_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from('newsletter_campaigns')
        .select('id, subject, preview_text, recipients_count, status, sent_at')
        .order('sent_at', { ascending: false })
        .limit(20),
    ]);

    return NextResponse.json({
      subscribers: data ?? [],
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      campaigns: campaigns ?? [],
    });
  } catch (err) {
    console.error('[Admin GET /newsletter]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/marketing/newsletter
// Body: { subject, preview_text?, body_html }
export async function POST(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const body = await request.json();
    const { subject, preview_text, body_html } = body as {
      subject: string;
      preview_text?: string;
      body_html: string;
    };

    if (!subject?.trim() || !body_html?.trim()) {
      return NextResponse.json({ error: 'Sujet et contenu requis' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all active subscribers
    const { data: subs, count } = await supabase
      .from('newsletter_subscriptions')
      .select('email', { count: 'exact' })
      .eq('is_active', true);

    const recipientsCount = count ?? 0;
    let status: 'sent' | 'draft' | 'failed' = 'draft';
    const resendKey = process.env.RESEND_API_KEY;

    if (recipientsCount === 0) {
      status = 'sent'; // 0 subscribers is technically "sent" (nothing to send)
    } else if (resendKey && subs && subs.length > 0) {
      // Send via Resend REST API (no package needed)
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL
          ?? 'VIP Parfumerie Bar <newsletter@vip-parfumerie-bar.com>';
        const htmlContent = `${preview_text?.trim() ? `<p style="color:#999;font-size:14px;margin-bottom:16px">${preview_text.trim()}</p>` : ''}${body_html.trim()}`;

        // Resend supports batch up to 100 emails per call
        const chunkSize = 100;
        let allOk = true;
        for (let i = 0; i < subs.length; i += chunkSize) {
          const chunk = subs.slice(i, i + chunkSize);
          const res = await fetch('https://api.resend.com/emails/batch', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              chunk.map(s => ({
                from: fromEmail,
                to: s.email,
                subject: subject.trim(),
                html: htmlContent,
              }))
            ),
          });
          if (!res.ok) { allOk = false; break; }
        }
        status = allOk ? 'sent' : 'failed';
      } catch (e) {
        console.error('[Newsletter] Resend error:', e);
        status = 'failed';
      }
    } else {
      // No RESEND_API_KEY — dev/demo mode: log and mark sent
      console.log(`[Newsletter Campaign] No RESEND_API_KEY — would send "${subject}" to ${recipientsCount} subscriber(s).`);
      status = 'sent';
    }

    // Record campaign in DB
    const { data: campaign, error } = await supabase
      .from('newsletter_campaigns')
      .insert({
        subject: subject.trim(),
        preview_text: preview_text?.trim() || null,
        body_html: body_html.trim(),
        recipients_count: recipientsCount,
        status,
        created_by: user?.id ?? null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ campaign, status, recipientsCount });
  } catch (err) {
    console.error('[Admin POST /newsletter]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/marketing/newsletter
// Body: { id, is_active }
export async function PATCH(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { id, is_active } = await request.json() as { id: string; is_active: boolean };
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .update({ is_active })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Admin PATCH /newsletter]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/admin/marketing/newsletter?id=...
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isCurrentUserAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Admin DELETE /newsletter]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
