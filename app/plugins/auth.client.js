/**
 * Initialise Supabase auth once, load the signed-in account's graph library,
 * and keep that library current in the background.
 *
 * Auto-sync behaviour:
 * - edits push after a short debounce (see useGraphs)
 * - queued edits push immediately when the tab is hidden
 * - a fresh pull runs on sign-in, on tab focus, on reconnect, and every minute
 */
const AUTO_SYNC_INTERVAL = 60_000

export default defineNuxtPlugin(async () => {
  const auth = useAuth()

  await auth.init()

  const graphs = useGraphs()

  watch(() => auth.user.value?.id, async (userId) => {
    graphs.switchAccount()

    if (userId && auth.isCloud.value) {
      await graphs.syncNow()
    } else {
      graphs.resetCloud()
    }
  })

  function syncIfCloud() {
    if (!auth.isCloud.value || !navigator.onLine) return
    void graphs.syncNow()
  }

  function flushIfCloud() {
    if (!auth.isCloud.value) return
    void graphs.flushPending()
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') syncIfCloud()
    else flushIfCloud()
  }

  window.addEventListener('online', syncIfCloud)
  document.addEventListener('visibilitychange', onVisibilityChange)
  setInterval(() => {
    if (document.visibilityState === 'visible') syncIfCloud()
  }, AUTO_SYNC_INTERVAL)

  if (auth.isCloud.value) {
    void graphs.syncNow()
  }
})
