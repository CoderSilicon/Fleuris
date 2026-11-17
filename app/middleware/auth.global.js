import { safeRedirect } from '~/utils/auth'

function isDashboardPath(path) {
  return path === '/dashboard' || path.startsWith('/dashboard/')
}

/**
 * Auth is compulsory. Cloud and local accounts are both real sessions here;
 * there is no way to reach the dashboard without completing one of them.
 *
 * Supabase sessions live in browser storage, so this guard runs on the client
 * after `init()` has restored either kind of session.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { init, isAuthenticated } = useAuth()

  await init()

  const isAuthPage = to.path === '/login' || to.path === '/signup'

  if (isAuthPage && isAuthenticated.value) {
    return navigateTo(safeRedirect(to.query.redirect))
  }

  if (!isDashboardPath(to.path) || isAuthenticated.value) return

  return navigateTo({
    path: '/login',
    query: { redirect: to.fullPath },
  })
})
