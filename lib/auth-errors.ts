type PasswordAuthError = {
  message: string;
  code?: string;
  /** Set by supabase-js on `weak_password` errors (AuthWeakPasswordError). */
  reasons?: readonly string[];
};

/**
 * French message for the password errors Supabase Auth returns on sign-up and
 * password change (its own messages are in English). Any other error keeps the
 * message Supabase sent.
 */
export function passwordErrorMessage(error: PasswordAuthError): string {
  if (error.code === 'same_password') {
    return 'Le nouveau mot de passe doit être différent de l’ancien.';
  }
  if (error.code !== 'weak_password') return error.message;

  const reasons = error.reasons ?? [];
  if (reasons.includes('pwned')) {
    return 'Ce mot de passe apparaît dans des fuites de données connues. Choisissez-en un autre, que vous n’utilisez sur aucun autre site.';
  }
  if (reasons.includes('length')) return 'Ce mot de passe est trop court.';
  if (reasons.includes('characters')) {
    return 'Ce mot de passe doit mélanger davantage de types de caractères (lettres, chiffres, symboles).';
  }
  return 'Ce mot de passe est trop facile à deviner. Choisissez-en un autre.';
}
