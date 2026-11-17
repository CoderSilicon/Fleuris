export const NODE_TYPES = ['Concept', 'Resource', 'Question', 'Task']

export const NODE_TYPE_META = {
  Concept: { color: '#8CA4FF', soft: 'rgba(140, 164, 255, 0.12)' },
  Resource: { color: '#F5A623', soft: 'rgba(245, 166, 35, 0.12)' },
  Question: { color: '#C084FC', soft: 'rgba(192, 132, 252, 0.12)' },
  Task: { color: '#34D399', soft: 'rgba(52, 211, 153, 0.12)' },
}

export const EDGE_KINDS = ['topic', 'related']

export const GRAPH_FILE_FORMAT = 'fleuris.graph'
export const GRAPH_FILE_VERSION = 1
export const GRAPH_FILE_EXTENSION = '.fl'
export const GRAPH_STORAGE_KEY = 'fleuris.graphs.v1'

// Account-scoped copies. The generic key above remains for backwards
// compatibility; these keep local and cloud libraries separate.
export const LOCAL_GRAPH_STORAGE_KEY = 'fleuris.graphs.local.v1'
export const CLOUD_GRAPH_STORAGE_KEY = 'fleuris.graphs.cloud.v1'

export const GRAPH_SEED_KEY = 'fleuris.graphs.seeded'

const MAX_NODE_COORDINATE = 1_000_000

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asString(value, fallback = '') {
  if (value == null) return fallback
  return String(value)
}

function asNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function asCoordinate(value, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(-MAX_NODE_COORDINATE, Math.min(MAX_NODE_COORDINATE, number))
}

function asDate(value, fallback) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

function newId(value) {
  return value == null ? null : `id:${value}`
}

export function slugify(value = '') {
  return asString(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

export function uniqueSlug(base, usedSlugs = []) {
  const taken = new Set(usedSlugs)
  const candidate = slugify(base) || 'graph'

  if (!taken.has(candidate)) return candidate

  let suffix = 2
  while (taken.has(`${candidate}-${suffix}`)) suffix += 1
  return `${candidate}-${suffix}`
}

export function normalizeView(rawView) {
  const view = isObject(rawView?.view) ? rawView.view : isObject(rawView?.transform) ? rawView.transform : rawView
  if (!isObject(view)) return null

  const x = Number(view.x)
  const y = Number(view.y)
  const zoom = Number(view.zoom)

  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(zoom)) return null

  return {
    x: Math.max(-100_000, Math.min(100_000, x)),
    y: Math.max(-100_000, Math.min(100_000, y)),
    zoom: Math.max(0.2, Math.min(3, zoom)),
  }
}

/**
 * Build an adjacency list for topic edges: parent -> [children].
 * Used for hierarchy checks and topological ordering.
 */
export function topicAdjacency(connections = []) {
    const adjacency = new Map()

    for (const edge of connections) {
        if (edge?.kind !== 'topic') continue
        if (!adjacency.has(edge.from)) adjacency.set(edge.from, [])
        adjacency.get(edge.from).push(edge.to)
    }

    return adjacency
}

/**
 * Depth-first search over topic edges.
 * Answers: can we travel from `fromId` to `toId` by following parent -> child links?
 */
export function hasTopicPath(connections = [], fromId, toId) {
    if (fromId == null || toId == null) return false
    if (fromId === toId) return true

    const adjacency = topicAdjacency(connections)
    const stack = [fromId]
    const visited = new Set()

    while (stack.length) {
        const current = stack.pop()
        if (visited.has(current)) continue
        visited.add(current)

        for (const next of adjacency.get(current) || []) {
            if (next === toId) return true
            if (!visited.has(next)) stack.push(next)
        }
    }

    return false
}

/**
 * Adding parent -> child would create a cycle if child can already reach parent.
 */
export function wouldCreateTopicCycle(connections = [], parentId, childId) {
    return hasTopicPath(connections, childId, parentId)
}

/**
 * Keeps topic hierarchy valid for documents coming from older/edited files:
 * - one main topic per node
 * - no cycles in the topic tree/forest
 */
export function normalizeTopicHierarchy(connections = []) {
    const topicEdges = connections.filter(edge => edge?.kind === 'topic')
    const otherEdges = connections.filter(edge => edge?.kind !== 'topic')

    const accepted = []
    const assignedParent = new Set()

    // Incremental adjacency list of the edges accepted so far.
    const children = new Map()

    // Iterative DFS: can we already travel from `fromId` down to `toId`?
    function canReach(fromId, toId) {
        if (fromId === toId) return true

        const stack = [fromId]
        const visited = new Set()

        while (stack.length) {
            const current = stack.pop()
            if (visited.has(current)) continue
            visited.add(current)

            for (const next of children.get(current) || []) {
                if (next === toId) return true
                if (!visited.has(next)) stack.push(next)
            }
        }

        return false
    }

    for (const edge of topicEdges) {
        if (edge.from === edge.to) continue
        if (assignedParent.has(edge.to)) continue
        if (canReach(edge.to, edge.from)) continue

        assignedParent.add(edge.to)
        accepted.push(edge)

        if (!children.has(edge.from)) children.set(edge.from, [])
        children.get(edge.from).push(edge.to)
    }

    return [...accepted, ...otherEdges]
        .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0))
        .map((edge, index) => ({ ...edge, id: index + 1 }))
}

export function normalizeGraph(input, { slug: forcedSlug } = {}) {
  const source = isObject(input?.graph) ? input.graph : input

  if (!isObject(source)) {
    throw new Error('The file does not contain a graph.')
  }

  if (source.format != null && source.format !== GRAPH_FILE_FORMAT) {
    throw new Error('This is not a Fleuris .fl file.')
  }

  if (source.version != null && Number(source.version) > GRAPH_FILE_VERSION) {
    throw new Error('This .fl file was created by a newer version of Fleuris.')
  }

  const rawNodes = Array.isArray(source.nodes) ? source.nodes : null
  if (!rawNodes) {
    throw new Error('The file does not contain a node list.')
  }

  const nodes = []
  const rawIdToNodeId = new Map()

  rawNodes.forEach((rawNode, index) => {
    if (!isObject(rawNode)) return

    const id = nodes.length + 1
    const rawId = newId(rawNode.id)
    if (rawId && !rawIdToNodeId.has(rawId)) rawIdToNodeId.set(rawId, id)

    const hasX = Number.isFinite(Number(rawNode.x))
    const hasY = Number.isFinite(Number(rawNode.y))
    const fallbackX = ((index % 4) - 1.5) * 260
    const fallbackY = Math.floor(index / 4) * 170

    nodes.push({
      id,
      title: asString(rawNode.title ?? rawNode.name, '').trim() || `Untitled node ${id}`,
      description: asString(rawNode.description ?? rawNode.body ?? ''),
      type: NODE_TYPES.includes(rawNode.type) ? rawNode.type : 'Concept',
      x: hasX ? asCoordinate(rawNode.x, fallbackX) : fallbackX,
      y: hasY ? asCoordinate(rawNode.y, fallbackY) : fallbackY,
    })
  })

  const rawConnections = Array.isArray(source.connections)
    ? source.connections
    : Array.isArray(source.edges)
      ? source.edges
      : []

  const connections = []
  const seenConnections = new Set()

  rawConnections.forEach((rawConnection) => {
    if (!isObject(rawConnection)) return

    const from = rawIdToNodeId.get(newId(rawConnection.from ?? rawConnection.source ?? rawConnection.fromId))
    const to = rawIdToNodeId.get(newId(rawConnection.to ?? rawConnection.target ?? rawConnection.toId))

    if (!from || !to || from === to) return

    const kind = rawConnection.kind === 'related' || rawConnection.type === 'related' ? 'related' : 'topic'
    const key = `${from}:${to}:${kind}`
    if (seenConnections.has(key)) return
    seenConnections.add(key)

    connections.push({ id: connections.length + 1, from, to, kind })
  })

  const now = new Date().toISOString()
  const title = asString(source.title ?? source.name, '').trim() || 'Untitled graph'

  return {
    slug: slugify(forcedSlug || source.slug || title) || 'graph',
    title,
    description: asString(source.description ?? ''),
    nodes,
    connections: normalizeTopicHierarchy(connections),
    view: normalizeView(source),
    createdAt: asDate(source.createdAt, now),
    updatedAt: asDate(source.updatedAt, now),
  }
}

export function parseGraphFile(contents) {
  let raw

  try {
    raw = JSON.parse(contents)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  return normalizeGraph(raw)
}

export function serializeGraph(graph) {
  return {
    format: GRAPH_FILE_FORMAT,
    version: GRAPH_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    title: graph.title,
    slug: graph.slug,
    description: graph.description ?? '',
    createdAt: graph.createdAt,
    updatedAt: graph.updatedAt,
    view: normalizeView(graph.view),
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      description: node.description ?? '',
      type: node.type,
      x: Math.round(node.x * 100) / 100,
      y: Math.round(node.y * 100) / 100,
    })),
    connections: graph.connections.map((connection) => ({
      id: connection.id,
      from: connection.from,
      to: connection.to,
      kind: connection.kind,
    })),
  }
}

export function downloadGraphFile(graph) {
  if (typeof document === 'undefined') return

  const contents = JSON.stringify(serializeGraph(graph), null, 2)
  const blob = new Blob([contents], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${graph.slug || slugify(graph.title) || 'graph'}${GRAPH_FILE_EXTENSION}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function createSampleGraph() {
  const now = new Date().toISOString()

  return normalizeGraph({
    slug: 'biology-map',
    title: 'Biology map',
    description: 'A demo graph that gathers the branches, questions, and resources of biology.',
    createdAt: now,
    updatedAt: now,
    nodes: [
      {
        id: 1,
        title: 'Biology',
        description: 'The study of life: from single cells to whole ecosystems. This map gathers the branches, questions, and resources that belong to the topic.',
        type: 'Concept',
        x: 0,
        y: 0,
      },
      {
        id: 2,
        title: 'Cell biology',
        description: 'The basic unit of life and the machinery inside it. Covers membranes, organelles, and the processes that keep a cell alive.',
        type: 'Concept',
        x: -300,
        y: 170,
      },
      {
        id: 3,
        title: 'Genetics',
        description: 'Heredity, genes, and variation. How information is stored, copied, and passed between generations.',
        type: 'Concept',
        x: 0,
        y: 170,
      },
      {
        id: 4,
        title: 'Anatomy',
        description: 'Structure and organisation of organisms, from tissues to organ systems.',
        type: 'Concept',
        x: 300,
        y: 170,
      },
      {
        id: 5,
        title: 'Evolution',
        description: 'Change in populations over time through selection, drift, and mutation. Connects to genetics and the broader story of life.',
        type: 'Concept',
        x: 250,
        y: 345,
      },
      {
        id: 6,
        title: 'Cell membrane',
        description: 'A selective barrier around the cell that controls what enters and leaves. Kept as a resource under cell biology.',
        type: 'Resource',
        x: -420,
        y: 340,
      },
      {
        id: 7,
        title: 'Mitochondria',
        description: 'Organelles that convert energy into ATP. Often called the powerhouse of the cell.',
        type: 'Concept',
        x: -210,
        y: 340,
      },
      {
        id: 8,
        title: 'DNA',
        description: 'The double-helix molecule that carries genetic instructions. A subtopic of genetics and the starting point for most questions about heredity.',
        type: 'Resource',
        x: 0,
        y: 340,
      },
    ],
    connections: [
      { id: 1, from: 1, to: 2, kind: 'topic' },
      { id: 2, from: 1, to: 3, kind: 'topic' },
      { id: 3, from: 1, to: 4, kind: 'topic' },
      { id: 4, from: 2, to: 6, kind: 'topic' },
      { id: 5, from: 2, to: 7, kind: 'topic' },
      { id: 6, from: 3, to: 8, kind: 'topic' },
      { id: 7, from: 1, to: 5, kind: 'related' },
      { id: 8, from: 3, to: 5, kind: 'related' },
    ],
  })
}
