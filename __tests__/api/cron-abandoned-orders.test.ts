import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const sendOrderStatusEmail = vi.fn<(supabase: unknown, id: string, kind: string) => Promise<'sent' | 'skipped' | 'failed'>>();
vi.mock('@/lib/order-notifications', () => ({
  sendOrderStatusEmail: (...args: [unknown, string, string]) => sendOrderStatusEmail(...args),
}));

/* Base simulée : lecture des commandes à prévenir, puis « claim » (cancellation_email_sent_at encore vide). */
const pending: Array<{ id: string }> = [];
const claimed = new Set<string>();
/** Commandes payées entre la lecture et le marquage : le marquage conditionnel ne les trouve plus. */
const paidMeanwhile = new Set<string>();
const claimConditions: Array<Array<[string, unknown]>> = [];
const released: string[] = [];
const filters: Array<[string, string, unknown]> = [];
const listResult = vi.fn(async () => ({ data: pending, error: null as unknown }));

function listQuery() {
  const query = {
    eq: (column: string, value: unknown) => (filters.push(['eq', column, value]), query),
    is: (column: string, value: unknown) => (filters.push(['is', column, value]), query),
    in: (column: string, value: unknown) => (filters.push(['in', column, value]), query),
    like: (column: string, value: unknown) => (filters.push(['like', column, value]), query),
    order: () => query,
    limit: () => listResult(),
  };
  return query;
}

const mockFrom = vi.fn(() => ({
  select: () => listQuery(),
  update: (values: Record<string, unknown>) => {
    const conditions: Array<[string, unknown]> = [];
    let id = '';
    // Remise en file après un refus de Resend : update({ cancellation_email_sent_at: null }).eq('id', …).
    if (values.cancellation_email_sent_at === null) {
      return { eq: async (_c: string, value: string) => (released.push(value), claimed.delete(value), { error: null }) };
    }
    const chain = {
      eq: (column: string, value: unknown) => {
        if (column === 'id') id = String(value);
        else conditions.push([column, value]);
        return chain;
      },
      is: (column: string, value: unknown) => (conditions.push([column, value]), chain),
      in: (column: string, value: unknown) => (conditions.push([column, value]), chain),
      select: async () => {
        expect(values).toEqual({ cancellation_email_sent_at: expect.any(String) });
        claimConditions.push(conditions);
        if (claimed.has(id) || paidMeanwhile.has(id)) return { data: [], error: null };
        claimed.add(id);
        return { data: [{ id }], error: null };
      },
    };
    return chain;
  },
}));
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: vi.fn(() => ({ from: mockFrom })) }));

const { GET } = await import('@/app/api/cron/abandoned-orders/route');

function cron(authorization?: string) {
  return GET(
    new NextRequest('http://localhost/api/cron/abandoned-orders', {
      headers: authorization ? { authorization } : {},
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('CRON_SECRET', 'secret-de-test-0123456789');
  pending.length = 0;
  claimed.clear();
  paidMeanwhile.clear();
  claimConditions.length = 0;
  released.length = 0;
  filters.length = 0;
  sendOrderStatusEmail.mockResolvedValue('sent');
});

afterEach(() => vi.unstubAllEnvs());

describe('GET /api/cron/abandoned-orders', () => {
  it.each([undefined, 'Bearer mauvais', 'secret-de-test-0123456789'])('refuse un appel sans le bon secret (%s)', async (auth) => {
    const res = await cron(auth);
    expect(res.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('refuse tout si CRON_SECRET n’est pas configuré', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await cron('Bearer ')).status).toBe(401);
  });

  it('prévient chaque client dont la commande vient d’être annulée automatiquement, une seule fois', async () => {
    pending.push({ id: 'o1' }, { id: 'o2' });
    const res = await cron('Bearer secret-de-test-0123456789');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ found: 2, sent: 2 });
    expect(sendOrderStatusEmail.mock.calls.map(([, id, kind]) => [id, kind])).toEqual([['o1', 'abandoned'], ['o2', 'abandoned']]);

    // Second passage (ou exécution en double) : déjà marquées, rien n'est renvoyé.
    sendOrderStatusEmail.mockClear();
    const again = await cron('Bearer secret-de-test-0123456789');
    expect(await again.json()).toEqual({ found: 2, sent: 0 });
    expect(sendOrderStatusEmail).not.toHaveBeenCalled();
  });

  it('ne lit que les commandes annulées automatiquement, impayées et pas encore prévenues', async () => {
    await cron('Bearer secret-de-test-0123456789');
    expect(filters).toEqual(
      expect.arrayContaining([
        ['eq', 'status', 'cancelled'],
        // Annulée automatiquement puis paiement refusé : le webhook ne prévient pas (déjà annulée), la tâche oui.
        ['in', 'payment_status', ['pending', 'failed']],
        ['is', 'cancellation_email_sent_at', null],
        ['like', 'notes', '%Annulée automatiquement : non payée%'],
      ]),
    );
  });

  it('le marquage revérifie que la commande est toujours annulée et impayée', async () => {
    pending.push({ id: 'o1' });
    await cron('Bearer secret-de-test-0123456789');
    expect(claimConditions[0]).toEqual(
      expect.arrayContaining([
        ['status', 'cancelled'],
        ['payment_status', ['pending', 'failed']],
        ['cancellation_email_sent_at', null],
      ]),
    );
  });

  it('payée entre la lecture et le marquage : aucun e-mail « annulée »', async () => {
    pending.push({ id: 'o1' });
    paidMeanwhile.add('o1');
    const res = await cron('Bearer secret-de-test-0123456789');
    expect(await res.json()).toEqual({ found: 1, sent: 0 });
    expect(sendOrderStatusEmail).not.toHaveBeenCalled();
  });

  it('refus de Resend : la commande est remise en file pour le prochain passage ; sans objet : elle reste marquée', async () => {
    pending.push({ id: 'o1' }, { id: 'o2' }, { id: 'o3' });
    sendOrderStatusEmail.mockResolvedValueOnce('failed').mockResolvedValueOnce('skipped');
    const res = await cron('Bearer secret-de-test-0123456789');
    expect(await res.json()).toEqual({ found: 3, sent: 1 });
    expect(released).toEqual(['o1']);
  });

  it('s’arrête avant la limite de durée : le reste est repris au passage suivant, sans être marqué', async () => {
    pending.push({ id: 'o1' }, { id: 'o2' }, { id: 'o3' });
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    sendOrderStatusEmail.mockImplementation(async () => {
      now += 25_000;
      return 'sent';
    });
    try {
      const res = await cron('Bearer secret-de-test-0123456789');
      expect(await res.json()).toEqual({ found: 3, sent: 2 });
      expect(claimed.has('o3')).toBe(false);
    } finally {
      vi.mocked(Date.now).mockRestore();
    }
  });

  it('espace les envois pour rester sous la limite de Resend', async () => {
    pending.push({ id: 'o1' }, { id: 'o2' });
    const sentAt: number[] = [];
    sendOrderStatusEmail.mockImplementation(async () => (sentAt.push(performance.now()), 'sent'));
    await cron('Bearer secret-de-test-0123456789');
    expect(sentAt[1]! - sentAt[0]!).toBeGreaterThanOrEqual(500);
  });

  it('un e-mail en échec n’arrête pas les suivants', async () => {
    pending.push({ id: 'o1' }, { id: 'o2' });
    sendOrderStatusEmail.mockRejectedValueOnce(new Error('Resend indisponible'));
    const res = await cron('Bearer secret-de-test-0123456789');
    expect(res.status).toBe(200);
    expect(sendOrderStatusEmail).toHaveBeenCalledTimes(2);
  });

  it('erreur de lecture : 500 sans détail interne', async () => {
    listResult.mockResolvedValueOnce({ data: null as unknown as Array<{ id: string }>, error: { message: 'column does not exist' } });
    const res = await cron('Bearer secret-de-test-0123456789');
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('column');
  });
});
