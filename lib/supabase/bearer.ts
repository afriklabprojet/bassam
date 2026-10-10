/**
 * Lecture de l'en-tête `Authorization: Bearer <jwt Supabase>` envoyé par l'application
 * mobile (android-admin). Le navigateur, lui, continue de s'authentifier par cookies.
 *
 * Ce module ne vérifie PAS le jeton : la vérification (signature, expiration, rôle)
 * se fait toujours auprès de Supabase Auth via `supabase.auth.getUser(token)`.
 */

export type BearerCredentials =
  | { kind: 'none' }
  | { kind: 'invalid' }
  | { kind: 'token'; token: string }

const BEARER_SCHEME = /^Bearer(?:\s+(.*))?$/i
const JWT_SHAPE = /^[\w-]+\.[\w-]+\.[\w-]+$/

/**
 * - pas d'en-tête (ou autre schéma, ex. Basic) → `none` : on retombe sur les cookies ;
 * - schéma Bearer avec un jeton vide ou mal formé → `invalid` : à refuser (401),
 *   sans retomber sur les cookies ;
 * - schéma Bearer avec un jeton de forme JWT → `token`.
 */
export function parseBearer(header: string | null | undefined): BearerCredentials {
  const value = header?.trim()
  if (!value) return { kind: 'none' }

  const match = BEARER_SCHEME.exec(value)
  if (!match) return { kind: 'none' }

  const token = (match[1] ?? '').trim()
  return JWT_SHAPE.test(token) ? { kind: 'token', token } : { kind: 'invalid' }
}
