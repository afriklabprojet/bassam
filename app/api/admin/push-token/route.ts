import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { dbErrorResponse } from '@/lib/api-errors';

export const runtime = 'nodejs';

const LOG_CONTEXT = 'API /admin/push-token';

// Les jetons FCM sont longs (≈160 caractères) et composés de ces seuls caractères.
const TOKEN_PATTERN = /^[A-Za-z0-9_:\-.]{20,4096}$/;

function readToken(value: unknown): string | null {
  return typeof value === 'string' && TOKEN_PATTERN.test(value) ? value : null;
}

/**
 * Un seul appel à Supabase Auth : il donne à la fois l'utilisateur (401 s'il n'y en a pas) et son rôle, lu dans
 * app_metadata comme isCurrentUserAdmin (403 s'il n'est pas administrateur).
 */
async function authorizeAdmin(): Promise<{ user: User; supabase: SupabaseClient } | { denied: NextResponse }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { denied: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  if (user.app_metadata?.role !== 'admin') return { denied: NextResponse.json({ error: 'Accès interdit' }, { status: 403 }) };
  return { user, supabase };
}

// POST /api/admin/push-token  { token, platform }  — enregistre (ou rattache) le téléphone de l'administrateur connecté
export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeAdmin();
    if ('denied' in auth) return auth.denied;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
    }
    const { token: rawToken, platform } = (body ?? {}) as Record<string, unknown>;
    const token = readToken(rawToken);
    if (!token) return NextResponse.json({ error: 'token invalide' }, { status: 400 });
    if (platform !== undefined && platform !== 'android') {
      return NextResponse.json({ error: 'platform invalide' }, { status: 400 });
    }

    // Un même téléphone peut changer de compte : le jeton suit le dernier administrateur connecté.
    // La RLS interdit à un administrateur de modifier la ligne d'un autre : la reprise du jeton passe
    // donc par la clé service, avec un user_id qui vient toujours de l'utilisateur vérifié ci-dessus.
    const { error } = await createServiceClient()
      .from('admin_push_tokens')
      .upsert(
        { user_id: auth.user.id, token, platform: 'android', last_seen_at: new Date().toISOString() },
        { onConflict: 'token' },
      );
    if (error) return dbErrorResponse(LOG_CONTEXT, error);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbErrorResponse(LOG_CONTEXT, error);
  }
}

// DELETE /api/admin/push-token?token=...  — retire le téléphone (déconnexion ou notifications coupées)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeAdmin();
    if ('denied' in auth) return auth.denied;

    const token = readToken(new URL(request.url).searchParams.get('token'));
    if (!token) return NextResponse.json({ error: 'token invalide' }, { status: 400 });

    // La RLS limite déjà aux jetons de l'utilisateur ; le filtre user_id le rend explicite.
    const { error } = await auth.supabase.from('admin_push_tokens').delete().eq('token', token).eq('user_id', auth.user.id);
    if (error) return dbErrorResponse(LOG_CONTEXT, error);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbErrorResponse(LOG_CONTEXT, error);
  }
}
