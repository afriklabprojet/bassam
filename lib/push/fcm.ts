import { createSign } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formatCFA } from '@/lib/format';
import { logger } from '@/lib/logger';

/**
 * Notifications push vers les téléphones des administrateurs (Firebase Cloud Messaging, API HTTP v1).
 * Le compte de service Firebase vit UNIQUEMENT dans la variable d'environnement serveur
 * FIREBASE_SERVICE_ACCOUNT_JSON (jamais dans l'APK ni dans le dépôt). Sans elle, l'envoi est ignoré.
 */
const LOG_CONTEXT = 'Admin push';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

export type ServiceAccount = { project_id: string; client_email: string; private_key: string };

export function readServiceAccount(raw: string | undefined = process.env.FIREBASE_SERVICE_ACCOUNT_JSON): ServiceAccount | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return { project_id: parsed.project_id, client_email: parsed.client_email, private_key: parsed.private_key };
  } catch {
    return null;
  }
}

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

export function buildAssertion(account: ServiceAccount, nowSeconds: number): string {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(
    JSON.stringify({ iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: nowSeconds, exp: nowSeconds + 3600 }),
  );
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  return `${header}.${claims}.${base64Url(signer.sign(account.private_key))}`;
}

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(account: ServiceAccount): Promise<string | null> {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt - 60_000 > now) return cachedAccessToken.value;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: buildAssertion(account, Math.floor(now / 1000)),
    }),
  });
  if (!response.ok) {
    logger.error(LOG_CONTEXT, 'Unable to obtain a Firebase access token', { status: response.status });
    return null;
  }
  const { access_token: value, expires_in: expiresIn } = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!value) return null;
  cachedAccessToken = { value, expiresAt: now + (expiresIn ?? 3600) * 1000 };
  return value;
}

export function resetFcmCache(): void {
  cachedAccessToken = null;
}

export type PushMessage = { title: string; body: string; data?: Record<string, string> };

/** Retourne les jetons que Firebase déclare périmés (appli désinstallée) : ils doivent être supprimés. */
async function sendToTokens(account: ServiceAccount, accessToken: string, tokens: string[], message: PushMessage): Promise<string[]> {
  const stale: string[] = [];
  await Promise.all(
    tokens.map(async (token) => {
      try {
        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: {
              token,
              notification: { title: message.title, body: message.body },
              data: message.data ?? {},
              android: { priority: 'HIGH', notification: { channel_id: 'orders' } },
            },
          }),
        });
        if (response.ok) return;
        if (response.status === 404) stale.push(token);
        logger.error(LOG_CONTEXT, 'FCM send failed', { status: response.status });
      } catch (error) {
        logger.error(LOG_CONTEXT, 'FCM request failed', { error });
      }
    }),
  );
  return stale;
}

type TokenRow = { token: string; user_id: string };

/**
 * Relit le rôle de chaque propriétaire de jeton : la clé service contourne la RLS, et un administrateur rétrogradé
 * sans s'être déconnecté garderait sinon son jeton. `revoked` : jetons d'utilisateurs qui ne sont plus administrateurs
 * (à supprimer). Un rôle illisible (erreur passagère) n'envoie rien mais ne supprime rien.
 */
async function splitByAdminRole(supabase: SupabaseClient, rows: TokenRow[]): Promise<{ allowed: string[]; revoked: string[] }> {
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const roles = new Map<string, 'admin' | 'revoked' | 'unknown'>();
  await Promise.all(
    userIds.map(async (userId) => {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error || !data.user) {
        roles.set(userId, 'unknown');
        logger.warn(LOG_CONTEXT, 'Unable to verify push token owner role', { userId });
        return;
      }
      roles.set(userId, data.user.app_metadata?.role === 'admin' ? 'admin' : 'revoked');
    }),
  );
  return {
    allowed: rows.filter((row) => roles.get(row.user_id) === 'admin').map((row) => row.token),
    revoked: rows.filter((row) => roles.get(row.user_id) === 'revoked').map((row) => row.token),
  };
}

async function sendWithAccount(account: ServiceAccount, supabase: SupabaseClient, message: PushMessage): Promise<void> {
  try {
    const { data, error } = await supabase.from('admin_push_tokens').select('token,user_id');
    if (error || !data || data.length === 0) return;

    const { allowed, revoked } = await splitByAdminRole(supabase, data as TokenRow[]);
    const stale = [...revoked];
    if (allowed.length > 0) {
      const accessToken = await getAccessToken(account);
      if (accessToken) stale.push(...(await sendToTokens(account, accessToken, allowed, message)));
    }
    if (stale.length > 0) await supabase.from('admin_push_tokens').delete().in('token', stale);
  } catch (error) {
    logger.error(LOG_CONTEXT, 'Unable to send admin push notifications', { error });
  }
}

/** Envoie une notification aux téléphones des utilisateurs qui sont encore administrateurs. Ne lève jamais d'erreur. */
export async function sendPushToAdmins(supabase: SupabaseClient, message: PushMessage): Promise<void> {
  const account = readServiceAccount();
  if (account) await sendWithAccount(account, supabase, message);
}

export type PaidOrder = { id: string; total_amount: number | string | null };

/**
 * Notification « nouvelle commande payée » : toucher la notification ouvre la commande dans l'application.
 * La commande vient du webhook, qui vient de la lire : pas de seconde lecture en base.
 */
export async function notifyAdminsOfPaidOrder(supabase: SupabaseClient, order: PaidOrder): Promise<void> {
  const account = readServiceAccount();
  if (!account) return;

  await sendWithAccount(account, supabase, {
    title: 'Nouvelle commande payée',
    body: `VIP-${order.id.slice(0, 8).toUpperCase()} — ${formatCFA(Number(order.total_amount) || 0)}`,
    data: { type: 'order_paid', orderId: order.id },
  });
}
