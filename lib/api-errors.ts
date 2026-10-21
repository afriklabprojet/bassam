import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Postgres SQLSTATE codes an admin can act on; anything else is a server error.
const CLIENT_ERRORS: Record<string, { status: number; message: string }> = {
  '23505': { status: 409, message: 'Cet élément existe déjà.' },
  // Raised both by a delete blocked by a reference and by an insert/update pointing to a missing row.
  '23503': { status: 409, message: 'Opération impossible : un élément lié est manquant ou encore utilisé.' },
  '23502': { status: 400, message: 'Données invalides : un champ obligatoire est manquant.' },
  '23514': { status: 400, message: 'Données invalides.' },
  '22P02': { status: 400, message: 'Données invalides.' },
};

/**
 * JSON response for a Supabase/Postgres (or Storage) error, or anything caught
 * around one. The raw message, which names tables and constraints and is in
 * English, stays in the server logs; the client gets a French message chosen
 * from the SQLSTATE code.
 */
export function dbErrorResponse(context: string, error: unknown): NextResponse {
  const { code, message } = (error ?? {}) as { code?: unknown; message?: unknown };
  const sqlState = typeof code === 'string' ? code : undefined;
  logger.error(context, 'Database error', {
    code: sqlState,
    message: typeof message === 'string' ? message : String(error),
  });
  const known = sqlState ? CLIENT_ERRORS[sqlState] : undefined;
  if (known) return NextResponse.json({ error: known.message }, { status: known.status });
  return NextResponse.json({ error: 'Erreur serveur. Réessayez dans un instant.' }, { status: 500 });
}
