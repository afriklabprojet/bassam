import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockCreateBrowserClient } = vi.hoisted(() => ({
  mockCreateBrowserClient: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
}));

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
    mockCreateBrowserClient.mockReset();
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

  it('corrèle chaque callback PKCE avec son vérificateur', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    const client = {};
    mockCreateBrowserClient.mockReturnValue(client);

    expect(createClient()).toBe(client);
    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      {
        auth: {
          experimental: {
            appendPkceFlowIdToRedirects: true,
          },
        },
      }
    );
  });
});