import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { sendOrderStatusEmail } from '@/lib/order-notifications';
import { logger } from '@/lib/logger';

const LOG_CONTEXT = 'Cron /abandoned-orders';
/** Une exécution par jour (offre Vercel Hobby) : largement plus que les commandes abandonnées d'une journée. */
const BATCH_SIZE = 50;
/** Note ajoutée par public.cancel_abandoned_orders (migration 20261021020000). */
const AUTO_CANCEL_NOTE = '%Annulée automatiquement : non payée%';
/**
 * Annulée automatiquement puis paiement refusé par Jeko : le webhook ne prévient pas (commande déjà annulée),
 * c'est donc cette tâche qui le fait.
 */
const UNPAID = ['pending', 'failed'];
/** Plus de nouvel envoi passé ce délai (chaque envoi dure au plus 10 s) : le reste est repris au passage suivant. */
const TIME_BUDGET_MS = 40_000;
/** Espacement entre deux envois : Resend limite le nombre d'e-mails par seconde. */
const SEND_INTERVAL_MS = 600;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get('authorization') ?? '');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// GET /api/cron/abandoned-orders — appelée chaque jour par Vercel Cron (vercel.json), avec
// `Authorization: Bearer $CRON_SECRET`. Prévient par e-mail les clients dont la commande a été annulée
// automatiquement (non payée sous 48 h). cancellation_email_sent_at est renseigné AVANT l'envoi (claim) :
// une exécution en double ne renvoie jamais un e-mail.
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'cancelled')
    .in('payment_status', UNPAID)
    .is('cancellation_email_sent_at', null)
    .like('notes', AUTO_CANCEL_NOTE)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error || !data) {
    logger.error(LOG_CONTEXT, 'Unable to list abandoned orders', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  const startedAt = Date.now();
  let sent = 0;
  let attempted = 0;
  // Un par un, espacés : la limite d'envoi de Resend est basse, et chaque envoi est borné à 10 s.
  for (const { id } of data as Array<{ id: string }>) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) break;
    if (attempted > 0) await sleep(SEND_INTERVAL_MS);

    const { data: claimedRows } = await supabase
      .from('orders')
      .update({ cancellation_email_sent_at: new Date().toISOString() })
      .eq('id', id)
      // Toujours annulée et impayée : un paiement arrivé depuis la lecture ne reçoit pas « annulée ».
      .eq('status', 'cancelled')
      .in('payment_status', UNPAID)
      .is('cancellation_email_sent_at', null)
      .select('id');
    if (!claimedRows || claimedRows.length === 0) continue;

    attempted += 1;
    const result = await sendOrderStatusEmail(supabase, id, 'abandoned').catch((sendError: unknown) => {
      logger.error(LOG_CONTEXT, 'Unable to send abandoned order email', { orderId: id, error: sendError });
      return 'failed' as const;
    });
    if (result === 'sent') {
      sent += 1;
    } else if (result === 'failed') {
      // Refusé par Resend (limite, panne) : remise en file, réessayée au prochain passage.
      const { error: releaseError } = await supabase
        .from('orders')
        .update({ cancellation_email_sent_at: null })
        .eq('id', id);
      if (releaseError) logger.error(LOG_CONTEXT, 'Unable to requeue order email', { orderId: id, error: releaseError });
    }
  }

  logger.info(LOG_CONTEXT, 'Abandoned order emails processed', { found: data.length, sent });
  return NextResponse.json({ found: data.length, sent });
}
