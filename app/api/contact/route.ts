import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(80, 'Nom trop long'),
  email: z.string().trim().toLowerCase().email('Email invalide'),
  sujet: z.string().trim().max(80).optional(),
  message: z.string().trim().min(10, 'Message trop court (10 caractères minimum)').max(2000, 'Message trop long'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { name, email, sujet, message } = parsed.data;
    const to = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'VIP Parfumerie Bar <contact@vipparfumeriebar.com>';

    if (resendKey && to) {
      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#0d0a06;margin-bottom:8px">Nouveau message de contact</h2>
          <p style="color:#888;margin-bottom:24px;font-size:14px">VIP Parfumerie Bar</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;font-weight:600;width:120px;color:#555">Nom</td><td style="padding:8px 0;color:#222">${name}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#555">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#C5A55A">${email}</a></td></tr>
            ${sujet ? `<tr><td style="padding:8px 0;font-weight:600;color:#555">Sujet</td><td style="padding:8px 0;color:#222">${sujet}</td></tr>` : ''}
          </table>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
          <p style="color:#222;white-space:pre-wrap;line-height:1.6">${message}</p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
          <p style="font-size:12px;color:#aaa">Répondre directement à ${email}</p>
        </div>`;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromEmail, to, reply_to: email, subject: `Contact — ${sujet || 'Nouveau message'} — ${name}`, html }),
      });

      if (!res.ok) {
        console.error('[API /contact] Resend error:', await res.text());
        return NextResponse.json({ error: 'Erreur lors de l\'envoi. Réessayez ou contactez-nous par WhatsApp.' }, { status: 500 });
      }
    } else {
      // Dev/sans clé — log uniquement
      console.log('[Contact] No RESEND_API_KEY — message:', { name, email, sujet, message });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API POST /contact]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
