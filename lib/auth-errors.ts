export const PWNED_PASSWORD_MESSAGE =
  'Ce mot de passe apparaît dans des fuites de données connues. Choisissez-en un autre, que vous n’utilisez sur aucun autre site.';

const GENERIC_MESSAGE = 'Une erreur est survenue. Veuillez réessayer dans un instant.';

const SESSION_EXPIRED_MESSAGE = 'Votre session a expiré. Recommencez la procédure depuis le début.';

type AuthErrorLike = {
  message?: string;
  code?: string;
  status?: number;
  /** supabase-js sets it on client-side errors, e.g. AuthSessionMissingError. */
  name?: string;
  /** Set by supabase-js on `weak_password` errors (AuthWeakPasswordError). */
  reasons?: readonly string[];
};

const MESSAGES_BY_CODE: Record<string, string> = {
  same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
  invalid_credentials: 'Email ou mot de passe incorrect.',
  email_not_confirmed: 'Confirmez d’abord votre adresse e-mail grâce au lien que vous avez reçu.',
  email_exists: 'Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou réinitialisez votre mot de passe.',
  user_already_exists: 'Un compte existe déjà avec cette adresse e-mail. Connectez-vous ou réinitialisez votre mot de passe.',
  email_address_invalid: 'Cette adresse e-mail n’est pas valide.',
  email_address_not_authorized: 'Cette adresse e-mail n’est pas acceptée.',
  validation_failed: 'Les informations saisies ne sont pas valides. Vérifiez-les et réessayez.',
  over_email_send_rate_limit: 'Trop d’e-mails ont été envoyés à cette adresse. Réessayez dans quelques minutes.',
  over_request_rate_limit: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
  signup_disabled: 'Les inscriptions sont momentanément fermées.',
  email_provider_disabled: 'Ce mode de connexion n’est pas disponible pour le moment.',
  provider_disabled: 'Ce mode de connexion n’est pas disponible pour le moment.',
  oauth_provider_not_supported: 'Ce mode de connexion n’est pas disponible pour le moment.',
  user_banned: 'Ce compte est suspendu. Contactez-nous pour en savoir plus.',
  captcha_failed: 'La vérification anti-robot a échoué. Réessayez.',
  otp_expired: 'Ce lien a expiré. Demandez-en un nouveau.',
  request_timeout: 'Le service met trop de temps à répondre. Réessayez dans un instant.',
  session_not_found: SESSION_EXPIRED_MESSAGE,
  session_expired: SESSION_EXPIRED_MESSAGE,
  refresh_token_not_found: SESSION_EXPIRED_MESSAGE,
  refresh_token_already_used: SESSION_EXPIRED_MESSAGE,
  bad_jwt: SESSION_EXPIRED_MESSAGE,
  reauthentication_needed: SESSION_EXPIRED_MESSAGE,
  flow_state_expired: SESSION_EXPIRED_MESSAGE,
  flow_state_not_found: SESSION_EXPIRED_MESSAGE,
};

function weakPasswordMessage(reasons: readonly string[]): string {
  if (reasons.includes('pwned')) return PWNED_PASSWORD_MESSAGE;
  if (reasons.includes('length')) return 'Ce mot de passe est trop court.';
  if (reasons.includes('characters')) return 'Le mot de passe doit contenir au moins une lettre et un chiffre.';
  return 'Ce mot de passe est trop facile à deviner. Choisissez-en un autre.';
}

/**
 * French message for an error returned by Supabase Auth, whose own messages
 * are in English. Unknown errors get a generic French message, so no English
 * text from Supabase ever reaches the page.
 */
export function authErrorMessage(error: AuthErrorLike): string {
  if (error.code === 'weak_password') return weakPasswordMessage(error.reasons ?? []);
  if (error.code && MESSAGES_BY_CODE[error.code]) return MESSAGES_BY_CODE[error.code];

  // Client-side errors from supabase-js carry a name instead of a code.
  if (error.name === 'AuthSessionMissingError') return SESSION_EXPIRED_MESSAGE;
  if (error.name === 'AuthRetryableFetchError') {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.';
  }
  if (error.status === 429) return MESSAGES_BY_CODE.over_request_rate_limit;

  return GENERIC_MESSAGE;
}
