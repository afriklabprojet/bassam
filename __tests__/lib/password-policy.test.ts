import { describe, expect, it } from 'vitest';
import { PASSWORD_MIN_LENGTH, passwordPolicyError } from '@/lib/password-policy';

describe('passwordPolicyError', () => {
  it('accepte un mot de passe de 8 caractères avec lettres et chiffres', () => {
    expect(passwordPolicyError('Parfum2026x')).toBeNull();
    expect(passwordPolicyError('abcdefg1')).toBeNull();
  });

  it(`refuse moins de ${PASSWORD_MIN_LENGTH} caractères`, () => {
    expect(passwordPolicyError('abc123')).toMatch(/au moins 8 caractères/);
  });

  it('exige au moins une lettre et un chiffre', () => {
    expect(passwordPolicyError('abcdefgh')).toMatch(/une lettre et un chiffre/);
    expect(passwordPolicyError('12345678')).toMatch(/une lettre et un chiffre/);
  });
});
