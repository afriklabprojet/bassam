import { generateKeyPairSync, createVerify } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const { buildAssertion, notifyAdminsOfPaidOrder, PUSH_DEADLINE_MS, readServiceAccount, resetFcmCache, sendPushToAdmins } =
  await import('@/lib/push/fcm');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const ACCOUNT = { project_id: 'vip-demo', client_email: 'push@vip-demo.iam.gserviceaccount.com', private_key: privateKey };

type Row = { token: string; user_id?: string };
/** Rôle actuel de chaque utilisateur côté Supabase Auth ; 'erreur' simule une panne passagère. Par défaut : admin. */
type Roles = Record<string, string | null | 'erreur'>;

function makeSupabase(tokens: Row[], roles: Roles = {}) {
  // Jetons périmés : delete().in('token', …). Jetons d'un admin rétrogradé : delete().eq('user_id', id).in('token', …).
  const deleteIn = vi.fn().mockResolvedValue({ error: null });
  const deleteOwnedBy = vi.fn().mockResolvedValue({ error: null });
  const rows = tokens.map((row) => ({ user_id: 'admin-1', ...row }));
  const from = vi.fn((table: string) => {
    if (table === 'admin_push_tokens') {
      return {
        select: vi.fn().mockResolvedValue({ data: rows, error: null }),
        delete: vi.fn(() => ({
          in: deleteIn,
          eq: (_column: string, userId: string) => ({ in: (_c: string, list: string[]) => deleteOwnedBy(userId, list) }),
        })),
      };
    }
    throw new Error(`Table non simulée : ${table}`);
  });
  const getUserById = vi.fn(async (userId: string) => {
    const role = userId in roles ? roles[userId] : 'admin';
    if (role === 'erreur') return { data: { user: null }, error: new Error('réseau') };
    return { data: { user: { id: userId, app_metadata: role ? { role } : {} } }, error: null };
  });
  return { client: { from, auth: { admin: { getUserById } } } as never, deleteIn, deleteOwnedBy, from, getUserById };
}

function mockFcm(onSend: (token: string) => { ok: boolean; status: number }) {
  const sent: Array<{ token: string; body: Record<string, unknown> }> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('oauth2.googleapis.com')) {
        return new Response(JSON.stringify({ access_token: 'access-1', expires_in: 3600 }), { status: 200 });
      }
      const body = JSON.parse(String(init?.body)) as { message: { token: string } & Record<string, unknown> };
      sent.push({ token: body.message.token, body: body.message });
      const result = onSend(body.message.token);
      return new Response('{}', { status: result.status });
    }),
  );
  return sent;
}

beforeEach(() => {
  resetFcmCache();
  vi.stubEnv('FIREBASE_SERVICE_ACCOUNT_JSON', JSON.stringify(ACCOUNT));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('readServiceAccount', () => {
  it('retourne null sans configuration ou avec un JSON incomplet', () => {
    expect(readServiceAccount('')).toBeNull();
    expect(readServiceAccount('{pas du json')).toBeNull();
    expect(readServiceAccount(JSON.stringify({ project_id: 'x' }))).toBeNull();
    expect(readServiceAccount(JSON.stringify(ACCOUNT))).toEqual(ACCOUNT);
  });
});

describe('buildAssertion', () => {
  it('produit un JWT RS256 vérifiable avec la clé publique', () => {
    const jwt = buildAssertion(ACCOUNT, 1_800_000_000);
    const [header, claims, signature] = jwt.split('.') as [string, string, string];
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${header}.${claims}`);
    expect(verifier.verify(publicKey, Buffer.from(signature, 'base64url'))).toBe(true);
    expect(JSON.parse(Buffer.from(claims, 'base64url').toString())).toMatchObject({
      iss: ACCOUNT.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      exp: 1_800_003_600,
    });
  });
});

describe('sendPushToAdmins', () => {
  it('ne fait rien sans compte de service (aucune requête, base non consultée)', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT_JSON', '');
    const { client, from } = makeSupabase([{ token: 't1' }]);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await sendPushToAdmins(client, { title: 'a', body: 'b' });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it('envoie à chaque téléphone et supprime les jetons périmés (404)', async () => {
    const sent = mockFcm((token) => (token === 'vieux' ? { ok: false, status: 404 } : { ok: true, status: 200 }));
    const { client, deleteIn } = makeSupabase([{ token: 'bon' }, { token: 'vieux' }]);

    await sendPushToAdmins(client, { title: 'Titre', body: 'Texte', data: { orderId: 'o1' } });

    expect(sent.map((s) => s.token).sort()).toEqual(['bon', 'vieux']);
    expect(sent[0]?.body).toMatchObject({
      notification: { title: 'Titre', body: 'Texte' },
      data: { orderId: 'o1' },
      android: { priority: 'HIGH', notification: { channel_id: 'orders' } },
    });
    expect(deleteIn).toHaveBeenCalledWith('token', ['vieux']);
  });

  it('un administrateur rétrogradé ne reçoit plus rien et ses jetons sont supprimés', async () => {
    const sent = mockFcm(() => ({ ok: true, status: 200 }));
    const { client, deleteIn, deleteOwnedBy } = makeSupabase(
      [{ token: 'admin-tel', user_id: 'a1' }, { token: 'ex-admin-tel', user_id: 'a2' }],
      { a1: 'admin', a2: null },
    );

    await sendPushToAdmins(client, { title: 'Titre', body: 'Texte' });

    expect(sent.map((s) => s.token)).toEqual(['admin-tel']);
    // Filtré aussi sur l'ancien propriétaire : si le téléphone vient d'être réattribué à un autre admin, son
    // nouvel enregistrement n'est pas effacé.
    expect(deleteOwnedBy).toHaveBeenCalledWith('a2', ['ex-admin-tel']);
    expect(deleteIn).not.toHaveBeenCalled();
  });

  it('chaque appel à Google (jeton OAuth, envoi FCM) a un délai maximal', async () => {
    const signals: Array<AbortSignal | null | undefined> = [];
    mockFcm(() => ({ ok: true, status: 200 }));
    const recording = vi.mocked(fetch);
    const original = recording.getMockImplementation();
    recording.mockImplementation(async (input, init) => {
      signals.push(init?.signal);
      return original!(input, init);
    });
    const { client } = makeSupabase([{ token: 'tel', user_id: 'a1' }]);

    await sendPushToAdmins(client, { title: 'Titre', body: 'Texte' });

    expect(signals).toHaveLength(2);
    for (const signal of signals) expect(signal).toBeInstanceOf(AbortSignal);
  });

  it('rôle illisible (panne passagère) : aucun envoi à cet utilisateur, mais ses jetons sont conservés', async () => {
    const sent = mockFcm(() => ({ ok: true, status: 200 }));
    const { client, deleteIn } = makeSupabase([{ token: 'tel', user_id: 'a1' }], { a1: 'erreur' });

    await sendPushToAdmins(client, { title: 'Titre', body: 'Texte' });

    expect(sent).toEqual([]);
    expect(deleteIn).not.toHaveBeenCalled();
  });

  it('vérifie chaque utilisateur une seule fois, même avec plusieurs téléphones', async () => {
    mockFcm(() => ({ ok: true, status: 200 }));
    const { client, getUserById } = makeSupabase([{ token: 'tel-1', user_id: 'a1' }, { token: 'tel-2', user_id: 'a1' }]);
    await sendPushToAdmins(client, { title: 'Titre', body: 'Texte' });
    expect(getUserById).toHaveBeenCalledOnce();
  });

  it('une erreur réseau ne lève jamais d’exception', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    const { client } = makeSupabase([{ token: 'bon' }]);
    await expect(sendPushToAdmins(client, { title: 'a', body: 'b' })).resolves.toBeUndefined();
  });
});

describe('notifyAdminsOfPaidOrder', () => {
  it('Google ne répond pas : rend la main après le délai global, le webhook n’est jamais bloqué', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
      const { client } = makeSupabase([{ token: 'tel', user_id: 'a1' }]);
      let done = false;
      const pending = notifyAdminsOfPaidOrder(client, { id: 'abcdef12-0000-4000-8000-000000000000', total_amount: 1 }).then(() => {
        done = true;
      });
      await vi.advanceTimersByTimeAsync(PUSH_DEADLINE_MS - 1);
      expect(done).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await pending;
      expect(done).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('annonce la commande avec son numéro et son montant, et porte son identifiant', async () => {
    const sent = mockFcm(() => ({ ok: true, status: 200 }));
    const { client, from } = makeSupabase([{ token: 'bon' }]);

    await notifyAdminsOfPaidOrder(client, { id: 'abcdef12-0000-4000-8000-000000000000', total_amount: 25000 });

    // La commande vient du webhook : pas de seconde lecture en base.
    expect(from).not.toHaveBeenCalledWith('orders');

    const message = sent[0]?.body as { notification: { title: string; body: string }; data: Record<string, string> };
    expect(message.notification.title).toBe('Nouvelle commande payée');
    expect(message.notification.body).toContain('VIP-ABCDEF12');
    expect(message.data).toEqual({ type: 'order_paid', orderId: 'abcdef12-0000-4000-8000-000000000000' });
  });
});
