import { createBrowserClient } from '@supabase/ssr'

export const MISSING_BROWSER_SUPABASE_CONFIG_MESSAGE =
  'Configuration Supabase manquante. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY en production puis redéployez.'

export function getBrowserSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  }
}

export function hasBrowserSupabaseConfig() {
  return getBrowserSupabaseConfig().isConfigured
}

export function createClient() {
  const { url, anonKey } = getBrowserSupabaseConfig()

  if (!url || !anonKey) {
    throw new Error(MISSING_BROWSER_SUPABASE_CONFIG_MESSAGE)
  }

  return createBrowserClient(url, anonKey)
}
