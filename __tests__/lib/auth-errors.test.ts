import { describe, expect, it } from 'vitest';
import { authErrorMessage, PWNED_PASSWORD_MESSAGE } from '@/lib/auth-errors';

const weak = (reasons: string[]) => ({
  message: 'Password is known to be weak and easy to guess, please choose a different one.',
  code: 'weak_password',
  reasons,
});

describe('authErrorMessage — mots de passe', () => {
  it('explique en français qu un mot de passe a fuité, en priorité sur les autres raisons', () => {
    expect(authErrorMessage(weak(['pwned']))).toBe(PWNED_PASSWORD_MESSAGE);
    expect(authErrorMessage(weak(['length', 'pwned']))).toBe(PWNED_PASSWORD_MESSAGE);
  });

  it('traduit les mots de passe trop courts ou trop simples', () => {
    expect(authErrorMessage(weak(['length']))).toBe('Ce mot de passe est trop court.');
    expect(authErrorMessage(weak(['characters']))).toMatch(/une lettre et un chiffre/);
    expect(authErrorMessage(weak([]))).toMatch(/trop facile à deviner/);
  });

  it('traduit la réutilisation de l ancien mot de passe', () => {
    expect(authErrorMessage({ message: 'New password should be different', code: 'same_password' })).toMatch(
      /différent de l’ancien/,
    );
  });
});

describe('authErrorMessage — autres erreurs Supabase', () => {
  it.each([
    ['invalid_credentials', /Email ou mot de passe incorrect/],
    ['email_not_confirmed', /Confirmez d’abord votre adresse e-mail/],
    ['user_already_exists', /Un compte existe déjà/],
    ['email_exists', /Un compte existe déjà/],
    ['email_address_invalid', /adresse e-mail n’est pas valide/],
    ['over_email_send_rate_limit', /Trop d’e-mails/],
    ['over_request_rate_limit', /Trop de tentatives/],
    ['signup_disabled', /inscriptions sont momentanément fermées/],
    ['provider_disabled', /mode de connexion n’est pas disponible/],
    ['otp_expired', /lien a expiré/],
    ['session_expired', /session a expiré/],
  ])('traduit %s', (code, expected) => {
    expect(authErrorMessage({ message: 'English message from Supabase', code })).toMatch(expected);
  });

  it('reconnaît les erreurs côté client de supabase-js par leur nom', () => {
    expect(authErrorMessage({ message: 'Auth session missing!', name: 'AuthSessionMissingError', status: 400 })).toMatch(
      /session a expiré/,
    );
    expect(authErrorMessage({ message: 'Failed to fetch', name: 'AuthRetryableFetchError' })).toMatch(
      /Impossible de joindre le serveur/,
    );
  });

  it('traite un HTTP 429 sans code comme trop de tentatives', () => {
    expect(
      authErrorMessage({ message: 'For security purposes, you can only request this after 60 seconds.', status: 429 }),
    ).toMatch(/Trop de tentatives/);
  });

  it('ne laisse jamais passer un message anglais inconnu', () => {
    const out = authErrorMessage({ message: 'Something unexpected happened', code: 'unexpected_failure', status: 500 });
    expect(out).toBe('Une erreur est survenue. Veuillez réessayer dans un instant.');
    expect(authErrorMessage({ message: 'Database error saving new user' })).not.toMatch(/Database/);
  });
});
