import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { CONTACT_RATE_LIMIT } from '@/lib/rate-limit-config';
import { logger } from '@/lib/logger';
import { escapeHtml } from '@/lib/sanitize';
import { getSiteSettings } from '@/lib/site-settings';
import { buildFromAddress } from '@/lib/email-from';
import { EMAIL_HEADING_COLOR, EMAIL_ACCENT_COLOR, EMAIL_LABEL_COLOR, EMAIL_BODY_COLOR, EMAIL_MUTED_COLOR, EMAIL_FOOTER_COLOR } from '@/lib/email-theme';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(80, 'Nom trop long'),
  email: z.string().trim().toLowerCase().email('Email invalide'),
  sujet: z.string().trim().max(80).optional(),
  message: z.string().trim().min(10, 'Message trop court (10 caractères minimum)').max(2000, 'Message trop long'),
});

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, 'contact', CONTACT_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

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
    const settings = await getSiteSettings();
    const to = settings.support_email;
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? buildFromAddress('contact', settings.site_name);

    if (resendKey && to) {
      const safeName = escapeHtml(name);
      const safeEmail = escapeHtml(email);
      const safeSujet = sujet ? escapeHtml(sujet) : '';
      const safeMessage = escapeHtml(message);

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:${EMAIL_HEADING_COLOR};margin-bottom:8px">Nouveau message de contact</h2>
          <p style="color:${EMAIL_MUTED_COLOR};margin-bottom:24px;font-size:14px">${escapeHtml(settings.site_name)}</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;font-weight:600;width:120px;color:${EMAIL_LABEL_COLOR}">Nom</td><td style="padding:8px 0;color:${EMAIL_BODY_COLOR}">${safeName}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:${EMAIL_LABEL_COLOR}">Email</td><td style="padding:8px 0"><a href="mailto:${safeEmail}" style="color:${EMAIL_ACCENT_COLOR}">${safeEmail}</a></td></tr>
            ${safeSujet ? `<tr><td style="padding:8px 0;font-weight:600;color:${EMAIL_LABEL_COLOR}">Sujet</td><td style="padding:8px 0;color:${EMAIL_BODY_COLOR}">${safeSujet}</td></tr>` : ''}
          </table>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
          <p style="color:${EMAIL_BODY_COLOR};white-space:pre-wrap;line-height:1.6">${safeMessage}</p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
          <p style="font-size:12px;color:${EMAIL_FOOTER_COLOR}">Répondre directement à ${safeEmail}</p>
        </div>`;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromEmail, to, reply_to: email, subject: `Contact — ${sujet || 'Nouveau message'} — ${name}`, html }),
      });

      if (!res.ok) {
        logger.error('API /contact', 'Resend send failed');
        return NextResponse.json({ error: 'Erreur lors de l\'envoi. Réessayez ou contactez-nous par WhatsApp.' }, { status: 500 });
      }
    } else {
      logger.info('API /contact', 'No RESEND_API_KEY configured — message dropped');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('API /contact', 'Unexpected error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
