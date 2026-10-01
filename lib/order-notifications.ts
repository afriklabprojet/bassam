import type { SupabaseClient } from '@supabase/supabase-js';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { escapeHtml } from '@/lib/sanitize';
import { formatPrice } from '@/lib/format';
import { logger } from '@/lib/logger';
import { getSiteSettings } from '@/lib/site-settings';
import { buildFromAddress } from '@/lib/email-from';
import { EMAIL_BODY_COLOR } from '@/lib/email-theme';

type ShippingAddress = {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  country?: string;
};

type NotificationOrder = {
  id: string;
  total_amount: number | string;
  payment_method: string;
  payment_reference: string | null;
  shipping_address: ShippingAddress;
  phone: string;
  email: string;
  created_at: string;
};

type NotificationItem = {
  quantity: number;
  unit_price: number | string;
  products: { name: string; brand: string } | null;
};

type OrderNotificationData = {
  order: NotificationOrder;
  items: NotificationItem[];
};

function orderNumber(id: string) {
  return `VIP-${id.slice(0, 8).toUpperCase()}`;
}

function customerName(address: ShippingAddress) {
  return [address.firstName, address.lastName].filter(Boolean).join(' ') || 'Client';
}

function productLabel(item: NotificationItem) {
  if (!item.products) return 'Article';
  return [item.products.brand, item.products.name].filter(Boolean).join(' - ');
}

function formatPdfPrice(amount: number) {
  return `${Math.round(amount).toLocaleString('fr-FR').replaceAll('\u202f', ' ')} FCFA`;
}

function pdfSafe(value: string) {
  return value.normalize('NFKD').replaceAll(/[\u0300-\u036f]/g, '').replaceAll(/[^\x20-\x7E]/g, '?');
}

function drawText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, size = 10) {
  page.drawText(pdfSafe(text), { x, y, size, font, color: rgb(0.13, 0.12, 0.1) });
}

async function buildInvoicePdf(data: OrderNotificationData, siteName: string) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 790;

  const addPage = () => {
    page = pdf.addPage([595, 842]);
    y = 790;
  };

  drawText(page, bold, siteName.toUpperCase(), 48, y, 18);
  drawText(page, bold, 'FACTURE', 460, y, 16);
  y -= 32;
  drawText(page, regular, `Facture : ${orderNumber(data.order.id)}`, 48, y);
  drawText(page, regular, `Date : ${new Date(data.order.created_at).toLocaleDateString('fr-FR')}`, 360, y);
  y -= 42;

  const address = data.order.shipping_address ?? {};
  drawText(page, bold, 'FACTURE A', 48, y, 11);
  y -= 18;
  drawText(page, regular, customerName(address), 48, y);
  y -= 15;
  drawText(page, regular, data.order.email, 48, y);
  y -= 15;
  drawText(page, regular, data.order.phone, 48, y);
  y -= 15;
  drawText(page, regular, [address.address, address.city, address.country].filter(Boolean).join(', '), 48, y);
  y -= 36;

  page.drawRectangle({ x: 48, y: y - 6, width: 499, height: 24, color: rgb(0.77, 0.65, 0.35) });
  drawText(page, bold, 'Article', 56, y + 2, 10);
  drawText(page, bold, 'Qte', 382, y + 2, 10);
  drawText(page, bold, 'Prix', 430, y + 2, 10);
  y -= 24;

  for (const item of data.items) {
    if (y < 90) {
      addPage();
    }
    const unitPrice = Number(item.unit_price);
    const label = productLabel(item);
    drawText(page, regular, label.length > 52 ? `${label.slice(0, 49)}...` : label, 56, y, 9);
    drawText(page, regular, String(item.quantity), 390, y, 9);
    drawText(page, regular, formatPdfPrice(unitPrice * item.quantity), 430, y, 9);
    page.drawLine({ start: { x: 48, y: y - 7 }, end: { x: 547, y: y - 7 }, thickness: 0.5, color: rgb(0.86, 0.86, 0.84) });
    y -= 24;
  }

  y -= 16;
  drawText(page, bold, `TOTAL PAYE : ${formatPdfPrice(Number(data.order.total_amount))}`, 345, y, 12);
  y -= 22;
  drawText(page, regular, `Paiement : ${data.order.payment_method}`, 345, y, 9);
  if (data.order.payment_reference) {
    y -= 15;
    drawText(page, regular, `Reference : ${data.order.payment_reference}`, 345, y, 8);
  }

  drawText(page, regular, 'Merci pour votre confiance.', 48, 48, 9);
  return pdf.save();
}

function buildOrderHtml(data: OrderNotificationData, sellerCopy: boolean, siteName: string) {
  const address = data.order.shipping_address ?? {};
  const rows = data.items.map((item) => {
    const unitPrice = Number(item.unit_price);
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee">${escapeHtml(productLabel(item))}</td>
      <td style="padding:10px;text-align:center;border-bottom:1px solid #eee">${item.quantity}</td>
      <td style="padding:10px 0;text-align:right;border-bottom:1px solid #eee">${formatPrice(unitPrice * item.quantity)}</td>
    </tr>`;
  }).join('');

  return `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:${EMAIL_BODY_COLOR}">
    <h1 style="font-size:22px">${sellerCopy ? 'Nouvelle commande payée' : 'Merci pour votre commande'}</h1>
    <p>Commande <strong>${orderNumber(data.order.id)}</strong></p>
    ${sellerCopy ? `<p><strong>Client :</strong> ${escapeHtml(customerName(address))}<br><strong>Email :</strong> ${escapeHtml(data.order.email)}<br><strong>Téléphone :</strong> ${escapeHtml(data.order.phone)}<br><strong>Livraison :</strong> ${escapeHtml([address.address, address.city, address.country].filter(Boolean).join(', '))}</p>` : '<p>Votre paiement est confirmé. Votre facture est jointe à cet e-mail.</p>'}
    <table style="width:100%;border-collapse:collapse;margin:24px 0">
      <thead><tr><th style="text-align:left">Article</th><th>Qté</th><th style="text-align:right">Montant</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="text-align:right;font-size:18px"><strong>Total payé : ${formatPrice(Number(data.order.total_amount))}</strong></p>
    <p style="font-size:12px;color:#777">${escapeHtml(siteName)}</p>
  </div>`;
}

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION ?? 'v21.0';
const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME ?? 'nouvelle_commande_payee';
const WHATSAPP_TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG ?? 'fr';

/**
 * Upload the invoice PDF to WhatsApp's media endpoint and send the shop's
 * own number a copy via an approved template message (WhatsApp forbids
 * freeform business-initiated messages — only pre-approved templates can be
 * sent outside a live customer conversation window).
 * Silently skipped when WhatsApp isn't configured, same as email.
 */
async function sendWhatsAppInvoiceCopy(data: OrderNotificationData, pdf: Uint8Array, id: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const shopNumber = process.env.WHATSAPP_SHOP_NOTIFICATION_NUMBER;

  if (!token || !phoneNumberId || !shopNumber) {
    logger.info('Order notification', 'WhatsApp not configured, shop copy skipped', { orderId: id });
    return;
  }

  const number = orderNumber(id);
  const filename = `facture-${number}.pdf`;

  try {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', 'application/pdf');
    form.append('file', new Blob([Buffer.from(pdf)], { type: 'application/pdf' }), filename);

    const uploadResponse = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/media`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
    );

    if (!uploadResponse.ok) {
      logger.error('Order notification', 'WhatsApp media upload failed', {
        orderId: id,
        status: uploadResponse.status,
        body: await uploadResponse.text(),
      });
      return;
    }

    const { id: mediaId } = await uploadResponse.json() as { id: string };

    const messageResponse = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: shopNumber,
          type: 'template',
          template: {
            name: WHATSAPP_TEMPLATE_NAME,
            language: { code: WHATSAPP_TEMPLATE_LANG },
            components: [
              { type: 'header', parameters: [{ type: 'document', document: { id: mediaId, filename } }] },
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: number },
                  { type: 'text', text: customerName(data.order.shipping_address ?? {}) },
                  { type: 'text', text: data.order.phone },
                  { type: 'text', text: formatPdfPrice(Number(data.order.total_amount)) },
                ],
              },
            ],
          },
        }),
      }
    );

    if (!messageResponse.ok) {
      logger.error('Order notification', 'WhatsApp template send failed', {
        orderId: id,
        status: messageResponse.status,
        body: await messageResponse.text(),
      });
    }
  } catch (error) {
    logger.error('Order notification', 'WhatsApp request failed', { orderId: id, error });
  }
}

async function loadOrderNotificationData(supabase: SupabaseClient, id: string): Promise<OrderNotificationData | null> {
  const [{ data: order, error: orderError }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from('orders').select('id,total_amount,payment_method,payment_reference,shipping_address,phone,email,created_at').eq('id', id).single(),
    supabase.from('order_items').select('quantity,unit_price,products(name,brand)').eq('order_id', id),
  ]);

  if (orderError || itemsError || !order) {
    logger.error('Order notification', 'Unable to load order details', { orderId: id, orderError, itemsError });
    return null;
  }

  return { order: order as NotificationOrder, items: (items ?? []) as unknown as NotificationItem[] };
}

export async function sendOrderNotifications(supabase: SupabaseClient, id: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const [data, settings] = await Promise.all([
    resendKey || (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
      ? loadOrderNotificationData(supabase, id)
      : Promise.resolve(null),
    getSiteSettings(),
  ]);

  if (!data) {
    if (!resendKey) logger.info('Order notification', 'No RESEND_API_KEY configured, emails skipped', { orderId: id });
    return;
  }

  const pdf = await buildInvoicePdf(data, settings.site_name);

  const emailSend = resendKey
    ? (async () => {
        const invoice = {
          filename: `facture-${orderNumber(id)}.pdf`,
          content: Buffer.from(pdf).toString('base64'),
        };
        const from = process.env.RESEND_FROM_EMAIL ?? buildFromAddress('contact', settings.site_name);
        const number = orderNumber(id);
        const messages = [
          { to: data.order.email, subject: `Confirmation de votre commande ${number}`, html: buildOrderHtml(data, false, settings.site_name) },
          { to: settings.order_notification_email, subject: `Nouvelle commande payée ${number}`, html: buildOrderHtml(data, true, settings.site_name) },
        ];

        await Promise.all(messages.map(async (message) => {
          try {
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ from, ...message, attachments: [invoice] }),
            });
            if (!response.ok) {
              logger.error('Order notification', 'Resend send failed', { orderId: id, recipient: message.to, status: response.status });
            }
          } catch (error) {
            logger.error('Order notification', 'Resend request failed', { orderId: id, recipient: message.to, error });
          }
        }));
      })()
    : Promise.resolve();

  await Promise.all([emailSend, sendWhatsAppInvoiceCopy(data, pdf, id)]);
}