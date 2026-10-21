const RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const TIMEOUT_MS = 3000;

/**
 * Checks a password against Have I Been Pwned's Pwned Passwords using
 * k-anonymity: only the first 5 hex characters of its SHA-1 leave the browser,
 * and the match happens locally. Resolves `null` when the check could not run
 * (network error, timeout, non-OK response), so a third-party outage never
 * blocks a sign-up.
 */
export async function isPasswordPwned(password: string, fetchImpl: typeof fetch = fetch): Promise<boolean | null> {
  try {
    const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      // Add-Padding hides the real size of the response; padded entries have a count of 0.
      const res = await fetchImpl(`${RANGE_URL}${prefix}`, {
        headers: { 'Add-Padding': 'true' },
        signal: controller.signal,
      });
      if (!res.ok) return null;

      const body = await res.text();
      return body.split('\n').some((line) => {
        const [lineSuffix, count] = line.trim().split(':');
        return lineSuffix === suffix && Number(count) > 0;
      });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}
