import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const resetPasswordForEmail = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
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
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      });
    });
    expect(screen.getByRole('heading', { name: 'Email envoyé' })).toBeTruthy();
  });
});
