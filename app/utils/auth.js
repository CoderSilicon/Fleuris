/**
 * Only allow in-app redirects. This keeps `?redirect=` from becoming an open redirect.
 */
export function safeRedirect(value, fallback = '/dashboard') {
  if (typeof value !== 'string') return fallback

  const target = value.trim()
  if (!target.startsWith('/') || target.startsWith('//')) return fallback
  if (target.startsWith('/login') || target.startsWith('/signup') || target.startsWith('/auth/')) {
    return fallback
  }

  return target
}

const LOCAL_PROFILE_KEY = 'fleuris.local-profile.v1'

/**
 * Local accounts are still accounts: a name is saved in the browser and the
 * resulting profile is the only thing that unlocks the dashboard locally.
 */
export function loadLocalProfile() {
  if (!import.meta.client) return null

  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_PROFILE_KEY) || 'null')
    if (!raw || typeof raw.id !== 'string' || typeof raw.name !== 'string') return null

    const name = raw.name.trim()
    if (!name) return null

    return {
      id: raw.id,
      name,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function saveLocalProfile(profile) {
  if (!import.meta.client) return

  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile))
  } catch {
    // The in-memory session still works for this tab if storage is blocked.
  }
}

export function clearLocalProfile() {
  if (!import.meta.client) return

  try {
    localStorage.removeItem(LOCAL_PROFILE_KEY)
  } catch {
    // Nothing else to do; the in-memory user is cleared separately.
  }
}

export function makeLocalUser(profile) {
  return {
    id: `local:${profile.id}`,
    email: null,
    user_metadata: {
      full_name: profile.name,
      provider: 'local',
    },
    app_metadata: {
      provider: 'local',
    },
    created_at: profile.createdAt,
  }
}

/**
 * Classify an auth/database error without exposing provider internals to the UI.
 */
export function authErrorKind(message = '') {
  const text = String(message).toLowerCase()

  if (text.includes('user already registered') || text.includes('already registered') || text.includes('already exists')) {
    return 'account-exists'
  }
  if (text.includes('invalid login credentials') || text.includes('invalid password')) {
    return 'invalid-credentials'
  }
  if (text.includes('email not confirmed') || text.includes('confirm your email')) {
    return 'email-unconfirmed'
  }
  if (text.includes('password should be at least') || text.includes('password is too short')) {
    return 'weak-password'
  }
  if (text.includes('invalid email') || text.includes('unable to validate email')) {
    return 'invalid-email'
  }
  if (text.includes('rate limit') || text.includes('too many requests')) {
    return 'rate-limit'
  }
  if (text.includes('signup is disabled') || text.includes('signups not allowed')) {
    return 'signup-disabled'
  }
  if (
    text.includes('pgrst205')
    || text.includes('could not find the table')
    || text.includes('schema cache')
  ) {
    return 'sync-unavailable'
  }
  if (text.includes('fetch') || text.includes('network') || text.includes('failed to fetch')) {
    return 'offline'
  }
  if (text.includes('email link is invalid') || text.includes('token has expired') || text.includes('expired')) {
    return 'expired-link'
  }

  return 'unknown'
}

export function isAuthError(message, kind) {
  return authErrorKind(message) === kind
}

/**
 * Friendly, production-safe copy. Technical detail stays out of the interface.
 */
export function authErrorMessage(message = '') {
  switch (authErrorKind(message)) {
    case 'account-exists':
      return 'You already have an account with this email. Sign in instead.'
    case 'invalid-credentials':
      return 'That email and password don’t match. Check them and try again.'
    case 'email-unconfirmed':
      return 'Please confirm your email address, then sign in.'
    case 'weak-password':
      return 'Use a password with at least 6 characters.'
    case 'invalid-email':
      return 'Enter a valid email address.'
    case 'rate-limit':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'signup-disabled':
      return 'New cloud accounts aren’t available right now. You can still use a local account.'
    case 'sync-unavailable':
      return 'Cloud sync isn’t available yet. Your work is safe in this browser.'
    case 'offline':
      return 'Couldn’t reach the cloud service. Check your connection and try again.'
    case 'expired-link':
      return 'That link has expired. Request a new one and try again.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export function userDisplayName(user) {
  if (!user) return ''

  const meta = user.user_metadata || {}
  const explicit = meta.full_name || meta.name || meta.display_name

  if (explicit) return String(explicit).trim()

  const email = String(user.email || '')
  const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim()

  if (!local) return ''

  return local.replace(/\b\w/g, (character) => character.toUpperCase())
}

export function userInitials(user) {
  const name = userDisplayName(user)
  if (!name) return '?'

  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return name.slice(0, 2).toUpperCase()
}
