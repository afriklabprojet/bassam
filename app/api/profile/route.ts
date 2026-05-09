import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getProfile, updateProfile } from '@/lib/supabase/profile';

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
    console.error('[API GET /profile]', error);
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

    const { profile, error } = await updateProfile(user.id, parsed.data);

    if (error || !profile) {
      return NextResponse.json(
        { error: error ?? 'Erreur mise à jour profil' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[API PATCH /profile]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
