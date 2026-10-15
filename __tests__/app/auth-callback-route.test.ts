import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateClient, mockExchangeCodeForSession } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockExchangeCodeForSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

import { GET } from '@/app/auth/callback/route';

describe('auth callback route', () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
    mockExchangeCodeForSession.mockReset();
    mockCreateClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    });
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it('échange le code avec le vérificateur PKCE du flux concerné', async () => {
    const response = await GET(
      new Request(
        'https://vipparfumeriebar.com/auth/callback?code=auth-code&sb_flow_id=flow-id&next=/auth/update-password'
      )
    );

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('auth-code', {
      flowId: 'flow-id',
    });
    expect(response.headers.get('location')).toBe(
      'https://vipparfumeriebar.com/auth/update-password'
    );
  });

  it('refuse un callback sans code', async () => {
    const response = await GET(
      new Request(
        'https://vipparfumeriebar.com/auth/callback?next=/auth/update-password'
      )
    );

    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(response.headers.get('location')).toBe(
      'https://vipparfumeriebar.com/auth/reset-password?error=missing_code'
    );
  });

  it('refuse un code invalide sans ouvrir la page de changement', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockExchangeCodeForSession.mockResolvedValue({
      error: { code: 'flow_state_not_found', status: 400 },
    });

    const response = await GET(
      new Request(
        'https://vipparfumeriebar.com/auth/callback?code=invalid-code&next=/auth/update-password'
      )
    );

    expect(response.headers.get('location')).toBe(
      'https://vipparfumeriebar.com/auth/reset-password?error=invalid_or_expired_link'
    );
    expect(consoleError).toHaveBeenCalledWith(
      'Auth callback code exchange failed',
      {
        code: 'flow_state_not_found',
        status: 400,
      }
    );
    consoleError.mockRestore();
  });
});
