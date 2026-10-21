import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const resetPasswordForEmail = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createPasswordRecoveryClient: () => ({
    auth: { resetPasswordForEmail },
  }),
}));

import ResetPasswordPage from '@/app/auth/reset-password/page';

describe('Page de réinitialisation du mot de passe', () => {
  beforeEach(() => {
    resetPasswordForEmail.mockReset();
    resetPasswordForEmail.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    cleanup();
  });

  it('fait passer le lien de récupération par le callback qui crée la session', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('Adresse email'), 'admin@example.com');
    await user.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

    await waitFor(() => {
      expect(resetPasswordForEmail).toHaveBeenCalledWith('admin@example.com', {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
    });
    expect(screen.getByRole('heading', { name: 'Email envoyé' })).toBeTruthy();
  });

  it('affiche en français la limite de fréquence renvoyée en anglais par Supabase', async () => {
    resetPasswordForEmail.mockResolvedValue({
      error: {
        message: 'For security purposes, you can only request this after 60 seconds.',
        code: 'over_email_send_rate_limit',
        status: 429,
      },
    });
    const user = userEvent.setup();
    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText('Adresse email'), 'admin@example.com');
    await user.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

    expect(await screen.findByText(/Trop d’e-mails ont été envoyés/)).toBeTruthy();
    expect(screen.queryByText(/For security purposes/)).toBeNull();
  });
});
