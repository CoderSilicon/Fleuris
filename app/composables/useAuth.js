import {
  authErrorMessage,
  clearLocalProfile,
  loadLocalProfile,
  makeLocalUser,
  saveLocalProfile,
} from '~/utils/auth'

let initPromise = null

export function useAuth() {
  const user = useState('fleuris:auth-user', () => null)
  const ready = useState('fleuris:auth-ready', () => false)
  const busy = useState('fleuris:auth-busy', () => false)

  const { supabase, configured } = useSupabase()

  const isConfigured = computed(() => configured)
  const isAuthenticated = computed(() => Boolean(user.value?.id))
  const isLocal = computed(() => user.value?.app_metadata?.provider === 'local')
  const isCloud = computed(() => isAuthenticated.value && !isLocal.value)

  function applySession(nextSession) {
    user.value = nextSession?.user ?? null
  }

  function applyLocalProfile(profile) {
    user.value = makeLocalUser(profile)
  }

  function clearAuth() {
    user.value = null
  }

  function requireClient() {
    if (!configured || !supabase) {
      throw new Error('Cloud accounts aren’t available. Choose Local to continue.')
    }

    return supabase
  }

  async function init() {
    if (ready.value) return

    if (!import.meta.client) {
      ready.value = true
      return
    }

    if (initPromise) return initPromise

    initPromise = (async () => {
      try {
        // A local account is a complete auth session, not a temporary bypass.
        const profile = loadLocalProfile()
        if (profile) applyLocalProfile(profile)

        if (supabase) {
          supabase.auth.onAuthStateChange((event, nextSession) => {
            if (nextSession?.user) {
              clearLocalProfile()
              applySession(nextSession)
            } else if (event !== 'INITIAL_SESSION') {
              clearAuth()
            }

            ready.value = true
          })

          const { data } = await supabase.auth.getSession()
          if (data.session?.user) {
            clearLocalProfile()
            applySession(data.session)
          }
        }
      } catch {
        // Keep any local account that was restored; auth errors are surfaced in the UI.
      } finally {
        ready.value = true
      }
    })()

    return initPromise
  }

  async function signInLocal({ name }) {
    const cleanName = String(name || '').trim()
    if (!cleanName) throw new Error('Enter a name to finish setting up your local account.')
    if (cleanName.length > 60) throw new Error('Keep your name under 60 characters.')

    busy.value = true
    try {
      const profile = {
        id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: cleanName,
        createdAt: new Date().toISOString(),
      }

      saveLocalProfile(profile)
      applyLocalProfile(profile)
      return profile
    } finally {
      busy.value = false
    }
  }

  async function signUp({ email, password, fullName = '' }) {
    const client = requireClient()

    busy.value = true
    try {
      const origin = import.meta.client ? window.location.origin : ''
      const { data, error } = await client.auth.signUp({
        email: String(email).trim(),
        password,
        options: {
          data: fullName ? { full_name: String(fullName).trim() } : {},
          emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
        },
      })

      if (error) throw new Error(authErrorMessage(error.message))
      if (data.session) {
        clearLocalProfile()
        applySession(data.session)
      }

      return { needsConfirmation: !data.session, user: data.user }
    } finally {
      busy.value = false
    }
  }

  async function signIn({ email, password }) {
    const client = requireClient()

    busy.value = true
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: String(email).trim(),
        password,
      })

      if (error) throw new Error(authErrorMessage(error.message))

      clearLocalProfile()
      applySession(data.session)
      return data.session
    } finally {
      busy.value = false
    }
  }

  async function signOut() {
    busy.value = true

    try {
      // Local sign-out always clears this browser's session, even offline.
      if (supabase) await supabase.auth.signOut({ scope: 'local' })
    } finally {
      clearLocalProfile()
      clearAuth()
      busy.value = false
    }
  }

  return {
    user,
    busy,
    isConfigured,
    isAuthenticated,
    isLocal,
    isCloud,
    init,
    signInLocal,
    signUp,
    signIn,
    signOut,
  }
}
