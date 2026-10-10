import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getProfile, updateProfile } from '@/lib/supabase/profile';
import { logger } from '@/lib/logger';
import { mergePreferencesPreservingPrivileges } from '@/lib/profile-preferences';

const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(8).optional(),
  avatarUrl: z.string().url().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Au moins un champ à mettre à jour',
});

// GET /api/profile — fetch authenticated user's profile
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Veuillez vous connecter' },
        { status: 401 }
      );
    }

    const profile = await getProfile(user.id);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    logger.error('[API GET /profile]', 'Error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/profile — update authenticated user's profile
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Veuillez vous connecter' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    // Défense en profondeur (F1) : `preferences.role` et `preferences.admin_level` ouvrent l'accès d'administration dans plusieurs
    // politiques RLS ; ils ne doivent jamais venir du client. On relit les préférences enregistrées et on ne fusionne que le reste.
    // Échec fermé : si le profil est illisible, on n'écrit rien (un remplacement complet pourrait effacer un rôle existant).
    let input = parsed.data;
    if (input.preferences) {
      const current = await getProfile(user.id);
      if (!current) {
        return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
      }
      input = { ...input, preferences: mergePreferencesPreservingPrivileges(current.preferences, input.preferences) };
    }

    const { profile, error } = await updateProfile(user.id, input);

    if (error || !profile) {
      return NextResponse.json(
        { error: error ?? 'Erreur mise à jour profil' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    logger.error('[API PATCH /profile]', 'Error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
