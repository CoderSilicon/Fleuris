import { createClient } from '@supabase/supabase-js'

let client = null

/**
 * Returns the shared Supabase browser client.
 *
 * The app is local-first: when the environment variables are missing, the
 * client is `null` and every account-aware surface falls back to local mode.
 */
export function useSupabase() {
  const config = useRuntimeConfig()

  const url = String(config.public.supabaseUrl || '').trim()
  const key = String(config.public.supabaseKey || '').trim()
  const configured = Boolean(url && key)

  if (!configured) {
    return { supabase: null, configured: false }
  }

  // The client is browser-only, but `configured` must match on the server so
  // the auth pages render the same form during SSR and hydration.
  if (!import.meta.client) {
    return { supabase: null, configured: true }
  }

  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  }

  return { supabase: client, configured: true }
}
