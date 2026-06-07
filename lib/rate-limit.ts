import { NextRequest, NextResponse } from 'next/server';

// LIMITATION: This rate limiter uses an in-process Map (memory).
// On Vercel (serverless), each function invocation may run in a separate
// container — the store does NOT persist across cold starts or parallel
// instances. This provides best-effort protection, not strict enforcement.
//
// For strict distributed rate limiting, replace this module with
// Vercel KV (Upstash Redis): https://vercel.com/docs/storage/vercel-kv
// Pattern: use kv.incr() + kv.expire() with a sliding window.

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, window] of store) {
    if (now >= window.resetAt) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSec: number;
}

export function checkRateLimit(
  request: NextRequest,
  prefix: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const windowMs = config.windowSec * 1_000;

  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }

  existing.count += 1;

  if (existing.count > config.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  return { allowed: true, remaining: config.limit - existing.count, resetAt: existing.resetAt };
}

export function rateLimitResponse(resetAt: number): NextResponse {
  return NextResponse.json(
    { error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1_000)),
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1_000)),
      },
    }
  );
}
