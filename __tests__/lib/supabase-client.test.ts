import { afterEach, describe, expect, it } from 'vitest';

import {
  createClient,
  getBrowserSupabaseConfig,
  hasBrowserSupabaseConfig,
  MISSING_BROWSER_SUPABASE_CONFIG_MESSAGE,
} from '@/lib/supabase/client';

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe('browser supabase config helpers', () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  });

  it('signale une configuration manquante', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(getBrowserSupabaseConfig()).toEqual({
      url: undefined,
      anonKey: undefined,
      isConfigured: false,
    });
    expect(hasBrowserSupabaseConfig()).toBe(false);
    expect(() => createClient()).toThrow(MISSING_BROWSER_SUPABASE_CONFIG_MESSAGE);
  });
});