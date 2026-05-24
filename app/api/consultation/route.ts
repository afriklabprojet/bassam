import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const consultationSchema = z.object({
  nom: z.string().trim().min(2, 'Nom trop court').max(80),
  prenom: z.string().trim().max(80).optional(),
  email: z.string().trim().toLowerCase().email('Email invalide'),
  formule: z.string().trim().max(60).optional(),
  mode: z.string().trim().max(60).optional(),
  disponibilites: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = consultationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { nom, prenom, email, formule, mode, disponibilites } = parsed.data;
    const to = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'VIP Parfumerie Bar <contact@vipparfumeriebar.com>';
    const fullName = [prenom, nom].filter(Boolean).join(' ');

    if (resendKey && to) {
      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#0d0a06;margin-bottom:8px">Demande de consultation privée</h2>
          <p style="color:#C5A55A;margin-bottom:24px;font-size:14px;font-weight:600">VIP Parfumerie Bar</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;font-weight:600;width:160px;color:#555">Client</td><td style="padding:8px 0;color:#222">${fullName}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#555">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#C5A55A">${email}</a></td></tr>
            ${formule ? `<tr><td style="padding:8px 0;font-weight:600;color:#555">Formule</td><td style="padding:8px 0;color:#222">${formule}</td></tr>` : ''}
            ${mode ? `<tr><td style="padding:8px 0;font-weight:600;color:#555">Mode</td><td style="padding:8px 0;color:#222">${mode}</td></tr>` : ''}
          </table>
          ${disponibilites ? `
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
          <p style="font-weight:600;color:#555;margin-bottom:8px">Disponibilités</p>
          <p style="color:#222;white-space:pre-wrap;line-height:1.6">${disponibilites}</p>` : ''}
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
          <p style="font-size:12px;color:#aaa">Répondre à ${email} pour confirmer le créneau.</p>
        </div>`;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromEmail, to, reply_to: email, subject: `Consultation — ${formule || 'Demande'} — ${fullName}`, html }),
      });

      if (!res.ok) {
        console.error('[API /consultation] Resend error:', await res.text());
        return NextResponse.json({ error: 'Erreur lors de l\'envoi. Réessayez ou contactez-nous par WhatsApp.' }, { status: 500 });
      }
    } else {
      console.log('[Consultation] No RESEND_API_KEY — demande:', { nom, prenom, email, formule, mode });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API POST /consultation]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
