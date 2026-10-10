import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { parseBearer } from './bearer'

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.'
    )
  }

  const bearer = parseBearer((await headers()).get('authorization'))

  // Application mobile : le client agit en tant que l'utilisateur du jeton (RLS comprise).
  // Les cookies sont ignorés — un jeton Bearer invalide ne doit jamais retomber sur eux.
  if (bearer.kind !== 'none') {
    const token = bearer.kind === 'token' ? bearer.token : ''
    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
      global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Sans session, `auth.getUser()` n'a rien à vérifier : on l'oriente vers le jeton de la
    // requête pour que tous les appelants existants fonctionnent sans modification.
    const getUser = client.auth.getUser.bind(client.auth)
    client.auth.getUser = (jwt?: string) => getUser(jwt ?? token)
    return client
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Safe to ignore when called from a Server Component.
        }
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
