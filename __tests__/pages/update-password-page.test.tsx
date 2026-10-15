import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { getSession, push, setSession, updateUser } = vi.hoisted(() => ({
  getSession: vi.fn(),
  push: vi.fn(),
  setSession: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getSession, setSession, updateUser },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

import UpdatePasswordPage from '@/app/auth/update-password/page';

describe('Page de changement du mot de passe', () => {
  beforeEach(() => {
    getSession.mockReset();
    push.mockReset();
    setSession.mockReset();
    updateUser.mockReset();
    setSession.mockResolvedValue({
      data: { session: { access_token: 'access-token' } },
      error: null,
    });
    updateUser.mockResolvedValue({ error: null });
    window.history.replaceState(
      null,
      '',
      '/auth/update-password#access_token=access-token&refresh_token=refresh-token&type=recovery'
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('établit la session depuis le lien avant de changer le mot de passe', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);

    await waitFor(() => {
      expect(setSession).toHaveBeenCalledWith({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
    });
    expect(window.location.hash).toBe('');

    await user.type(screen.getByLabelText('Nouveau mot de passe'), 'StrongPass1!');
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'StrongPass1!');
    await user.click(
      screen.getByRole('button', { name: 'Mettre à jour le mot de passe' })
    );

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith({ password: 'StrongPass1!' });
    });
    expect(
      screen.getByRole('heading', { name: 'Mot de passe modifié' })
    ).toBeTruthy();
  });
});
