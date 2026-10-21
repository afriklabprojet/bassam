import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { getSession, isPasswordPwned, push, setSession, updateUser } = vi.hoisted(() => ({
  getSession: vi.fn(),
  isPasswordPwned: vi.fn(),
  push: vi.fn(),
  setSession: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('@/lib/pwned-password', () => ({ isPasswordPwned }));

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
    isPasswordPwned.mockReset();
    isPasswordPwned.mockResolvedValue(false);
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

  it('affiche en français le refus d un mot de passe compromis', async () => {
    updateUser.mockResolvedValue({
      error: {
        message: 'Password is known to be weak and easy to guess, please choose a different one.',
        code: 'weak_password',
        reasons: ['pwned'],
      },
    });
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await waitFor(() => expect(setSession).toHaveBeenCalled());

    await user.type(screen.getByLabelText('Nouveau mot de passe'), 'password123');
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), 'password123');
    await user.click(
      screen.getByRole('button', { name: 'Mettre à jour le mot de passe' })
    );

    expect(await screen.findByText(/fuites de données connues/)).toBeTruthy();
    expect(screen.queryByText(/known to be weak/)).toBeNull();
  });

  async function submitPassword(value: string) {
    const user = userEvent.setup();
    render(<UpdatePasswordPage />);
    await waitFor(() => expect(setSession).toHaveBeenCalled());
    await user.type(screen.getByLabelText('Nouveau mot de passe'), value);
    await user.type(screen.getByLabelText('Confirmer le mot de passe'), value);
    await user.click(screen.getByRole('button', { name: 'Mettre à jour le mot de passe' }));
  }

  it('refuse un mot de passe sans chiffre avant d appeler Supabase', async () => {
    await submitPassword('abcdefgh');

    expect(await screen.findByText(/une lettre et un chiffre/)).toBeTruthy();
    expect(isPasswordPwned).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('refuse un mot de passe présent dans une fuite connue sans appeler Supabase', async () => {
    isPasswordPwned.mockResolvedValue(true);

    await submitPassword('Password123');

    expect(await screen.findByText(/fuites de données connues/)).toBeTruthy();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('laisse passer le changement si la vérification des fuites est indisponible', async () => {
    isPasswordPwned.mockResolvedValue(null);

    await submitPassword('Parfum2026x');

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ password: 'Parfum2026x' }));
  });
});
