/**
 * Password rules applied before calling Supabase Auth. They mirror the
 * project's Supabase settings (`password_min_length`, and
 * `password_required_characters` set to letters + digits): keep both in sync.
 */
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_HINT = `min. ${PASSWORD_MIN_LENGTH} caractères, lettres et chiffres`;

/** French error for a password that breaks the rules, or null when it passes. */
export function passwordPolicyError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }
  // ASCII letters, like Supabase's "letters and digits" requirement.
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Le mot de passe doit contenir au moins une lettre et un chiffre.';
  }
  return null;
}
