// @vitest-environment node
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isPasswordPwned } from '@/lib/pwned-password';

const sha1 = (value: string) => createHash('sha1').update(value).digest('hex').toUpperCase();
const PASSWORD = 'password123';
const HASH = sha1(PASSWORD);
const PREFIX = HASH.slice(0, 5);
const SUFFIX = HASH.slice(5);

function rangeResponse(lines: string[], ok = true) {
  return vi.fn(async () => ({ ok, text: async () => lines.join('\r\n') }) as unknown as Response);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('isPasswordPwned', () => {
  it('n envoie que les 5 premiers caractères de l empreinte, avec remplissage', async () => {
    const fetchImpl = rangeResponse([]);

    await isPasswordPwned(PASSWORD, fetchImpl);

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://api.pwnedpasswords.com/range/${PREFIX}`);
    expect(url).not.toContain(SUFFIX);
    expect(url).not.toContain(PASSWORD);
    expect(init.headers).toEqual({ 'Add-Padding': 'true' });
  });

  it('signale un mot de passe présent dans une fuite', async () => {
    const fetchImpl = rangeResponse(['0018A45C4D1DEF81644B54AB7F969B88D65:1', `${SUFFIX}:2654`]);
    await expect(isPasswordPwned(PASSWORD, fetchImpl)).resolves.toBe(true);
  });

  it('ignore les entrées de remplissage (compte à 0) et les autres suffixes', async () => {
    await expect(isPasswordPwned(PASSWORD, rangeResponse([`${SUFFIX}:0`]))).resolves.toBe(false);
    await expect(isPasswordPwned(PASSWORD, rangeResponse(['0018A45C4D1DEF81644B54AB7F969B88D65:12']))).resolves.toBe(false);
  });

  it('renvoie null si l API répond en erreur ou est injoignable', async () => {
    await expect(isPasswordPwned(PASSWORD, rangeResponse([], false))).resolves.toBeNull();
    const failing = vi.fn(async () => {
      throw new TypeError('network down');
    });
    await expect(isPasswordPwned(PASSWORD, failing as unknown as typeof fetch)).resolves.toBeNull();
  });

  it('abandonne et renvoie null après 3 secondes sans réponse', async () => {
    // Only timeouts are faked: the SHA-1 digest resolves on its own before the timer is armed.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const hanging = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    );

    const pending = isPasswordPwned(PASSWORD, hanging as unknown as typeof fetch);
    while (hanging.mock.calls.length === 0) await new Promise((resolve) => setImmediate(resolve));
    await vi.advanceTimersByTimeAsync(2999);
    expect(hanging.mock.calls[0][1]?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    await expect(pending).resolves.toBeNull();
  });
});
