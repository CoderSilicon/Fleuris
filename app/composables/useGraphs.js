import {
  CLOUD_GRAPH_STORAGE_KEY,
  GRAPH_SEED_KEY,
  GRAPH_STORAGE_KEY,
  LOCAL_GRAPH_STORAGE_KEY,
  createSampleGraph,
  normalizeGraph,
  parseGraphFile,
  slugify,
  uniqueSlug,
} from '~/utils/graph'
import { authErrorMessage } from '~/utils/auth'

const STORAGE_VERSION = 1
const TOMBSTONE_STORAGE_KEY = 'fleuris.graphs.deleted.v1'
const PUSH_DELAY = 900
const MAX_TOMBSTONES = 200

let pushTimer = null
const pendingSlugs = new Set()
let syncPromise = null
let syncUserId = null

// The active browser cache. Cloud caches are keyed by user id so one account
// can never inherit another account's (or a local account's) graphs.
let activeStorageKey = null
let activeTombstoneKey = null

function cloudStorageKey(userId) {
  return `${CLOUD_GRAPH_STORAGE_KEY}:${userId}`
}

function cloudTombstoneKey(userId) {
  return `${TOMBSTONE_STORAGE_KEY}:${userId}`
}

function graphToRow(graph, userId) {
  return {
    user_id: userId,
    slug: graph.slug,
    title: graph.title,
    description: graph.description ?? '',
    nodes: graph.nodes ?? [],
    connections: graph.connections ?? [],
    view: graph.view ?? null,
    created_at: graph.createdAt,
    updated_at: graph.updatedAt,
  }
}

function rowToGraph(row) {
  return normalizeGraph(
    {
      slug: row.slug,
      title: row.title,
      description: row.description,
      nodes: row.nodes,
      connections: row.connections,
      view: row.view,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    { slug: row.slug },
  )
}

function timeOf(value) {
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

function parseGraphList(raw) {
  const parsed = JSON.parse(raw)
  const source = Array.isArray(parsed) ? parsed : parsed?.graphs
  if (!Array.isArray(source)) return []

  const usedSlugs = []
  const result = []

  for (const rawGraph of source) {
    try {
      const graph = normalizeGraph(rawGraph, { slug: rawGraph?.slug })
      graph.slug = uniqueSlug(graph.slug, usedSlugs)
      usedSlugs.push(graph.slug)
      result.push(graph)
    } catch {
      // Skip one corrupt graph instead of discarding the whole library.
    }
  }

  return result
}

export function useGraphs() {
  const graphs = useState('fleuris:graphs', () => [])
  const ready = useState('fleuris:graphs-ready', () => false)
  const storageError = useState('fleuris:graphs-error', () => '')

  const tombstones = useState('fleuris:graph-tombstones', () => [])
  const cloudStatus = useState('fleuris:cloud-status', () => 'local')
  const cloudError = useState('fleuris:cloud-error', () => '')
  const lastSyncedAt = useState('fleuris:cloud-synced-at', () => null)

  const { user, isLocal } = useAuth()
  const { supabase, configured } = useSupabase()

  function desiredStorageKey() {
    const id = user.value?.id
    if (!id) return null

    return isLocal.value ? LOCAL_GRAPH_STORAGE_KEY : cloudStorageKey(id)
  }

  function desiredTombstoneKey() {
    const id = user.value?.id
    if (!id || isLocal.value) return null

    return cloudTombstoneKey(id)
  }

  function isCloudReady() {
    return Boolean(
      configured
      && supabase
      && user.value?.id
      && !isLocal.value
      && activeStorageKey === cloudStorageKey(user.value.id),
    )
  }

  function cancelPush() {
    clearTimeout(pushTimer)
    pushTimer = null
    pendingSlugs.clear()
  }

  function persistTo(key, list = graphs.value) {
    if (!import.meta.client || !key) return

    try {
      const payload = JSON.stringify({ version: STORAGE_VERSION, graphs: list })
      localStorage.setItem(key, payload)

      // Keep the original identifier working as the local account's mirror.
      // Cloud accounts never write here, so their graphs cannot leak locally.
      if (key === LOCAL_GRAPH_STORAGE_KEY) {
        localStorage.setItem(GRAPH_STORAGE_KEY, payload)
      }

      storageError.value = ''
    } catch {
      storageError.value = 'Your browser could not save this graph. Storage may be full or blocked.'
    }
  }

  function persist() {
    persistTo(activeStorageKey)
  }

  function persistTombstones() {
    if (!import.meta.client || !activeTombstoneKey) return

    try {
      localStorage.setItem(activeTombstoneKey, JSON.stringify(tombstones.value))
    } catch {
      // Deletion still happens locally even when the browser cannot store the tombstone.
    }
  }

  function loadTombstones() {
    tombstones.value = []
    if (!import.meta.client || !activeTombstoneKey) return

    try {
      const raw = JSON.parse(localStorage.getItem(activeTombstoneKey) || '[]')
      if (Array.isArray(raw)) {
        tombstones.value = raw.filter((item) => (
          item
          && typeof item.slug === 'string'
          && typeof item.at === 'string'
        ))
      }
    } catch {
      // Ignore a corrupt tombstone list; cloud sync will rebuild it as needed.
    }
  }

  function addTombstone(slug) {
    if (!activeTombstoneKey) return

    const next = tombstones.value.filter((item) => item.slug !== slug)
    next.push({ slug, at: new Date().toISOString() })

    tombstones.value = next.slice(-MAX_TOMBSTONES)
    persistTombstones()
  }

  function removeTombstone(slug) {
    const next = tombstones.value.filter((item) => item.slug !== slug)
    if (next.length === tombstones.value.length) return

    tombstones.value = next
    persistTombstones()
  }

  /**
   * Load the graph library that belongs to the current account. Local accounts
   * use the local library; cloud accounts use their own user-keyed cache until
   * the first successful pull replaces it with remote rows.
   */
  function loadScope() {
    if (!import.meta.client) return

    const nextKey = desiredStorageKey()
    const nextTombstoneKey = desiredTombstoneKey()

    try {
      if (!nextKey) {
        if (activeStorageKey) persistTo(activeStorageKey)
        cancelPush()
        activeStorageKey = null
        activeTombstoneKey = null
        graphs.value = []
        tombstones.value = []
        cloudStatus.value = 'local'
        cloudError.value = ''
        lastSyncedAt.value = null
        ready.value = true
        return
      }

      if (nextKey === activeStorageKey && ready.value) return

      if (activeStorageKey && activeStorageKey !== nextKey) {
        persistTo(activeStorageKey)
      }

      cancelPush()
      activeStorageKey = nextKey
      activeTombstoneKey = nextTombstoneKey
      loadTombstones()

      let loaded = null
      try {
        const raw = localStorage.getItem(nextKey)
        loaded = raw ? parseGraphList(raw) : null
      } catch {
        loaded = null
        storageError.value = 'Saved graphs could not be read. Starting with a fresh library.'
      }

      // One-time migration: the original generic key always held local graphs.
      // It is never consulted for a cloud account.
      if (loaded === null && nextKey === LOCAL_GRAPH_STORAGE_KEY) {
        try {
          const legacy = localStorage.getItem(GRAPH_STORAGE_KEY)
          loaded = legacy ? parseGraphList(legacy) : []
        } catch {
          loaded = []
        }
        persistTo(LOCAL_GRAPH_STORAGE_KEY, loaded)
      }

      graphs.value = loaded || []

      if (
        nextKey === LOCAL_GRAPH_STORAGE_KEY
        && !graphs.value.length
        && !localStorage.getItem(GRAPH_SEED_KEY)
      ) {
        graphs.value = [createSampleGraph()]
        localStorage.setItem(GRAPH_SEED_KEY, '1')
        persistTo(LOCAL_GRAPH_STORAGE_KEY, graphs.value)
      }

      cloudStatus.value = 'local'
      cloudError.value = ''
      lastSyncedAt.value = null
    } finally {
      ready.value = true
    }
  }

  if (import.meta.client) loadScope()

  function getGraph(slug) {
    if (!slug) return null
    return graphs.value.find((graph) => graph.slug === slug) || null
  }

  function setCloudError(message) {
    cloudStatus.value = 'error'
    cloudError.value = message
  }

  function markSynced() {
    cloudStatus.value = 'synced'
    cloudError.value = ''
    lastSyncedAt.value = new Date().toISOString()
  }

  async function pushRows(rows) {
    if (!rows.length || !supabase) return true

    const { error } = await supabase
      .from('graphs')
      .upsert(rows, { onConflict: 'user_id,slug' })

    if (error) {
      setCloudError(authErrorMessage(error.message))
      return false
    }

    return true
  }

  async function flushPush() {
    const slugs = [...pendingSlugs]
    pendingSlugs.clear()

    if (!slugs.length || !isCloudReady()) return true

    const rows = slugs
      .map((slug) => getGraph(slug))
      .filter(Boolean)
      .map((graph) => graphToRow(graph, user.value.id))

    if (!rows.length) return true

    cloudStatus.value = 'syncing'
    const pushed = await pushRows(rows)
    if (pushed) markSynced()
    return pushed
  }

  function schedulePush(slug) {
    if (!isCloudReady()) return

    pendingSlugs.add(slug)
    clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
      pushTimer = null
      void flushPush()
    }, PUSH_DELAY)
  }

  /**
   * Push queued edits immediately, e.g. when the tab is hidden or the browser
   * regains a connection. Returns a promise so callers can await it.
   */
  function flushPending() {
    clearTimeout(pushTimer)
    pushTimer = null
    return flushPush()
  }

  async function deleteRemote(slug) {
    if (!isCloudReady()) return

    cloudStatus.value = 'syncing'

    const { error } = await supabase
      .from('graphs')
      .delete()
      .eq('user_id', user.value.id)
      .eq('slug', slug)

    if (error) {
      setCloudError(authErrorMessage(error.message))
      return
    }

    removeTombstone(slug)
    markSynced()
  }

  /**
   * Cloud is authoritative for a signed-in account: flush local edits, pull
   * that user's rows, then show exactly those rows. Local graphs are never
   * merged into a cloud library.
   */
  async function syncCloud() {
    if (!import.meta.client) return

    if (!isCloudReady()) {
      resetCloud()
      return
    }

    const userId = user.value.id
    const scopeKey = cloudStorageKey(userId)

    // Reuse only a sync for this same account; a stale sync must not block the
    // newly selected account from loading its own rows.
    if (syncPromise && syncUserId === userId) return syncPromise

    const currentSync = (async () => {
      cloudStatus.value = 'syncing'
      cloudError.value = ''

      try {
        const pushed = await flushPush()
        if (!pushed) return

        // The account may have changed while the push was in flight.
        if (user.value?.id !== userId || activeStorageKey !== scopeKey) return

        const { data, error } = await supabase
          .from('graphs')
          .select('*')
          .eq('user_id', userId)

        if (error) throw new Error(authErrorMessage(error.message))

        if (user.value?.id !== userId || activeStorageKey !== scopeKey) return

        const remoteGraphs = []
        const slugsToDelete = []

        for (const row of Array.isArray(data) ? data : []) {
          let remote

          try {
            remote = rowToGraph(row)
          } catch {
            continue
          }

          const tombstone = tombstones.value.find((item) => item.slug === remote.slug)

          if (tombstone && timeOf(remote.updatedAt) <= timeOf(tombstone.at)) {
            slugsToDelete.push(remote.slug)
            continue
          }

          if (tombstone) removeTombstone(remote.slug)
          remoteGraphs.push(remote)
        }

        remoteGraphs.sort((a, b) => timeOf(b.updatedAt) - timeOf(a.updatedAt))
        graphs.value = remoteGraphs
        persist()

        if (slugsToDelete.length) {
          const { error: deleteError } = await supabase
            .from('graphs')
            .delete()
            .eq('user_id', userId)
            .in('slug', slugsToDelete)

          if (deleteError) throw new Error(authErrorMessage(deleteError.message))

          for (const slug of slugsToDelete) removeTombstone(slug)
        }

        if (user.value?.id !== userId || activeStorageKey !== scopeKey) return
        markSynced()
      } catch (error) {
        setCloudError(error instanceof Error ? error.message : 'Cloud sync is unavailable right now.')
      } finally {
        if (syncPromise === currentSync) {
          syncPromise = null
          syncUserId = null
        }
      }
    })()

    syncPromise = currentSync
    syncUserId = userId
    return currentSync
  }

  function resetCloud() {
    cancelPush()
    cloudStatus.value = 'local'
    cloudError.value = ''
    lastSyncedAt.value = null
  }

  function switchAccount() {
    loadScope()
  }

  function createGraph({ title, slug, description = '' } = {}) {
    const cleanTitle = String(title || '').trim() || 'Untitled graph'
    const now = new Date().toISOString()

    const graph = {
      slug: uniqueSlug(slug || cleanTitle, graphs.value.map((item) => item.slug)),
      title: cleanTitle,
      description: String(description || '').trim(),
      nodes: [],
      connections: [],
      view: null,
      createdAt: now,
      updatedAt: now,
    }

    graphs.value.unshift(graph)
    persist()
    schedulePush(graph.slug)
    return graph
  }

  function saveGraph(slug, patch = {}) {
    const graph = getGraph(slug)
    if (!graph) return null

    if (patch.title != null) {
      graph.title = String(patch.title).trim() || 'Untitled graph'
    }
    if (patch.description != null) {
      graph.description = String(patch.description)
    }
    if (Array.isArray(patch.nodes)) {
      graph.nodes = patch.nodes
    }
    if (Array.isArray(patch.connections)) {
      graph.connections = patch.connections
    }
    if (patch.view !== undefined) {
      graph.view = patch.view
    }

    graph.updatedAt = new Date().toISOString()
    persist()
    schedulePush(graph.slug)
    return graph
  }

  function deleteGraph(slug) {
    const index = graphs.value.findIndex((graph) => graph.slug === slug)
    if (index === -1) return false

    graphs.value.splice(index, 1)
    addTombstone(slug)
    persist()
    void deleteRemote(slug)
    return true
  }

  function duplicateGraph(slug) {
    const source = getGraph(slug)
    if (!source) return null

    const now = new Date().toISOString()
    const copy = normalizeGraph({
      ...source,
      slug: undefined,
      title: `${source.title} copy`,
    })

    copy.slug = uniqueSlug(`${source.slug}-copy`, graphs.value.map((graph) => graph.slug))
    copy.createdAt = now
    copy.updatedAt = now

    graphs.value.unshift(copy)
    persist()
    schedulePush(copy.slug)
    return copy
  }

  function importGraph(input) {
    const draft = typeof input === 'string' ? parseGraphFile(input) : normalizeGraph(input)
    const now = new Date().toISOString()

    draft.slug = uniqueSlug(draft.slug || draft.title, graphs.value.map((graph) => graph.slug))
    draft.createdAt = now
    draft.updatedAt = now

    graphs.value.unshift(draft)
    persist()
    schedulePush(draft.slug)
    return draft
  }

  return {
    graphs,
    ready,
    storageError,
    cloudStatus,
    cloudError,
    getGraph,
    createGraph,
    saveGraph,
    deleteGraph,
    duplicateGraph,
    importGraph,
    switchAccount,
    flushPending,
    syncNow: syncCloud,
    resetCloud,
    slugify,
  }
}
