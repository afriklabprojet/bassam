import { createClient } from './server';

/* ═══════════════════════════════════════════════════════════════════════════
   Supabase Profile Queries
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Profile {
  id: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  email: string | null;
  preferences: Record<string, unknown>;
  createdAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  preferences?: Record<string, unknown>;
}

/** Get the authenticated user's profile */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('[getProfile]', error?.message);
    return null;
  }

  // Also fetch email from auth.users
  const { data: { user } } = await supabase.auth.getUser();

  return {
    id: data.id,
    fullName: data.full_name,
    phone: data.phone,
    avatarUrl: data.avatar_url,
    email: user?.email ?? null,
    preferences: (data.preferences as Record<string, unknown>) ?? {},
    createdAt: data.created_at,
  };
}

/** Update the authenticated user's profile */
export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<{ profile: Profile | null; error: string | null }> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (input.fullName !== undefined) updateData.full_name = input.fullName;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;
  if (input.preferences !== undefined) updateData.preferences = input.preferences;

  if (Object.keys(updateData).length === 0) {
    return { profile: null, error: 'Aucun champ à mettre à jour' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    console.error('[updateProfile]', error?.message);
    return { profile: null, error: error?.message ?? 'Erreur mise à jour profil' };
  }

  const { data: { user } } = await supabase.auth.getUser();

  return {
    profile: {
      id: data.id,
      fullName: data.full_name,
      phone: data.phone,
      avatarUrl: data.avatar_url,
      email: user?.email ?? null,
      preferences: (data.preferences as Record<string, unknown>) ?? {},
      createdAt: data.created_at,
    },
    error: null,
  };
}
