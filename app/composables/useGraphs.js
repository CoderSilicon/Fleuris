import {
  GRAPH_SEED_KEY,
  GRAPH_STORAGE_KEY,
  createSampleGraph,
  normalizeGraph,
  parseGraphFile,
  serializeGraph,
  slugify,
  uniqueSlug,
} from '~/utils/graph'

const STORAGE_VERSION = 1

export function useGraphs() {
  const graphs = useState('fleuris:graphs', () => [])
  const ready = useState('fleuris:graphs-ready', () => false)
  const storageError = useState('fleuris:graphs-error', () => '')

  function persist() {
    if (!import.meta.client) return

    try {
      localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify({
        version: STORAGE_VERSION,
        graphs: graphs.value,
      }))
      storageError.value = ''
    } catch {
      storageError.value = 'Your browser could not save this graph. Storage may be full or blocked.'
    }
  }

  function hydrate() {
    if (ready.value || !import.meta.client) return

    try {
      const stored = localStorage.getItem(GRAPH_STORAGE_KEY)

      if (stored) {
        const parsed = JSON.parse(stored)
        const rawGraphs = Array.isArray(parsed) ? parsed : parsed?.graphs
        const usedSlugs = []

        if (Array.isArray(rawGraphs)) {
          for (const rawGraph of rawGraphs) {
            try {
              const graph = normalizeGraph(rawGraph, { slug: rawGraph?.slug })
              graph.slug = uniqueSlug(graph.slug, usedSlugs)
              usedSlugs.push(graph.slug)
              graphs.value.push(graph)
            } catch {
              // Skip one corrupt graph instead of discarding the whole library.
            }
          }
        }
      }

      if (!graphs.value.length && !localStorage.getItem(GRAPH_SEED_KEY)) {
        graphs.value = [createSampleGraph()]
        localStorage.setItem(GRAPH_SEED_KEY, '1')
        persist()
      }
    } catch {
      storageError.value = 'Saved graphs could not be read. Starting with an empty workspace.'
    } finally {
      ready.value = true
    }
  }

  if (import.meta.client) hydrate()

  function getGraph(slug) {
    if (!slug) return null
    return graphs.value.find((graph) => graph.slug === slug) || null
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
    return graph
  }

  function deleteGraph(slug) {
    const index = graphs.value.findIndex((graph) => graph.slug === slug)
    if (index === -1) return false

    graphs.value.splice(index, 1)
    persist()
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
    return draft
  }

  function exportGraph(slug) {
    const graph = getGraph(slug)
    return graph ? serializeGraph(graph) : null
  }

  return {
    graphs,
    ready,
    storageError,
    getGraph,
    createGraph,
    saveGraph,
    deleteGraph,
    duplicateGraph,
    importGraph,
    exportGraph,
    slugify,
  }
}
