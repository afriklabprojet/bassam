import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { escapeHtml } from '@/lib/sanitize';

const consultationSchema = z.object({
  nom: z.string().trim().min(2, 'Nom trop court').max(80),
  prenom: z.string().trim().max(80).optional(),
  email: z.string().trim().toLowerCase().email('Email invalide'),
  formule: z.string().trim().max(60).optional(),
  mode: z.string().trim().max(60).optional(),
  disponibilites: z.string().trim().max(500).optional(),
});

type ConsultationData = z.infer<typeof consultationSchema>;

function buildConsultationHtml(data: ConsultationData & { fullName: string }): string {
  const safeFullName = escapeHtml(data.fullName);
  const safeEmail = escapeHtml(data.email);
  const safeFormule = data.formule ? escapeHtml(data.formule) : '';
  const safeMode = data.mode ? escapeHtml(data.mode) : '';
  const safeDisponibilites = data.disponibilites ? escapeHtml(data.disponibilites) : '';

  const optionalRows = [
    safeFormule ? `<tr><td style="padding:8px 0;font-weight:600;color:#555">Formule</td><td style="padding:8px 0;color:#222">${safeFormule}</td></tr>` : '',
    safeMode ? `<tr><td style="padding:8px 0;font-weight:600;color:#555">Mode</td><td style="padding:8px 0;color:#222">${safeMode}</td></tr>` : '',
  ].join('');

  const disponibilitesBlock = safeDisponibilites
    ? `<hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
       <p style="font-weight:600;color:#555;margin-bottom:8px">Disponibilités</p>
       <p style="color:#222;white-space:pre-wrap;line-height:1.6">${safeDisponibilites}</p>`
    : '';

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#0d0a06;margin-bottom:8px">Demande de consultation privée</h2>
      <p style="color:#C5A55A;margin-bottom:24px;font-size:14px;font-weight:600">VIP Parfumerie Bar</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-weight:600;width:160px;color:#555">Client</td><td style="padding:8px 0;color:#222">${safeFullName}</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;color:#555">Email</td><td style="padding:8px 0"><a href="mailto:${safeEmail}" style="color:#C5A55A">${safeEmail}</a></td></tr>
        ${optionalRows}
      </table>
      ${disponibilitesBlock}
      <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
      <p style="font-size:12px;color:#aaa">Répondre à ${safeEmail} pour confirmer le créneau.</p>
    </div>`;
}

async function sendConsultationEmail(data: ConsultationData & { fullName: string }): Promise<boolean> {
  const to = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey || !to) {
    logger.info('API /consultation', 'No RESEND_API_KEY configured — demande dropped');
    return true;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'VIP Parfumerie Bar <contact@vipparfumeriebar.com>';
  const html = buildConsultationHtml(data);
  const subject = `Consultation — ${data.formule || 'Demande'} — ${data.fullName}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromEmail, to, reply_to: data.email, subject, html }),
  });

  if (!res.ok) {
    logger.error('API /consultation', 'Resend send failed');
    return false;
  }

  return true;
}

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

    const fullName = [parsed.data.prenom, parsed.data.nom].filter(Boolean).join(' ');
    const sent = await sendConsultationEmail({ ...parsed.data, fullName });

    if (!sent) {
      return NextResponse.json({ error: "Erreur lors de l'envoi. Réessayez ou contactez-nous par WhatsApp." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('API /consultation', 'Unexpected error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
