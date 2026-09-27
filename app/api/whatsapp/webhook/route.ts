import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const CONTEXT = 'API /whatsapp/webhook';

/**
 * GET /api/whatsapp/webhook
 * Meta's verification handshake when you register this URL as the
 * WhatsApp app's callback URL (App Dashboard > WhatsApp > Configuration).
 * This project only ever SENDS WhatsApp messages (order copy to the shop) —
 * a webhook isn't required for that per Meta's own docs, but the dashboard
 * still validates a callback URL if you fill in that field, so this exists
 * purely to satisfy that handshake. It intentionally does not process
 * incoming messages.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && expectedToken && token === expectedToken && challenge) {
    logger.info(CONTEXT, 'Webhook verification succeeded');
    return new NextResponse(challenge, { status: 200 });
  }

  logger.warn(CONTEXT, 'Webhook verification failed', { mode, hasToken: Boolean(token) });
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST /api/whatsapp/webhook
 * Meta may still deliver events here once the app is subscribed to the
 * WABA (message status updates, etc). Nothing in this project consumes
 * them — just acknowledge quickly so Meta doesn't flag/disable the
 * webhook for timing out or erroring.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    logger.info(CONTEXT, 'Webhook event received (unprocessed)', { hasBody: Boolean(body) });
  } catch (error) {
    logger.error(CONTEXT, 'Unexpected error reading webhook event', { error });
  }
  return NextResponse.json({ ok: true });
}
