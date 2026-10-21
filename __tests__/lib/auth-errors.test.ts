import { describe, expect, it } from 'vitest';
import { passwordErrorMessage } from '@/lib/auth-errors';

const weak = (reasons: string[]) => ({
  message: 'Password is known to be weak and easy to guess, please choose a different one.',
  code: 'weak_password',
  reasons,
});

describe('passwordErrorMessage', () => {
  it('explique en français qu un mot de passe a fuité', () => {
    expect(passwordErrorMessage(weak(['pwned']))).toMatch(/fuites de données connues/);
  });

  it('donne priorité à la fuite quand plusieurs raisons sont présentes', () => {
    expect(passwordErrorMessage(weak(['length', 'pwned']))).toMatch(/fuites de données/);
  });

  it('traduit les mots de passe trop courts ou trop simples', () => {
    expect(passwordErrorMessage(weak(['length']))).toBe('Ce mot de passe est trop court.');
    expect(passwordErrorMessage(weak(['characters']))).toMatch(/types de caractères/);
    expect(passwordErrorMessage(weak([]))).toMatch(/trop facile à deviner/);
  });

  it('traduit la réutilisation de l ancien mot de passe', () => {
    expect(passwordErrorMessage({ message: 'New password should be different', code: 'same_password' })).toMatch(
      /différent de l’ancien/,
    );
  });

  it('laisse les autres erreurs inchangées', () => {
    expect(passwordErrorMessage({ message: 'User already registered', code: 'user_already_exists' })).toBe(
      'User already registered',
    );
    expect(passwordErrorMessage({ message: 'Erreur réseau' })).toBe('Erreur réseau');
  });
});
