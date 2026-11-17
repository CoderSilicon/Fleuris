<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { wouldCreateTopicCycle, downloadGraphFile, NODE_TYPE_META as TYPE_META, NODE_TYPES } from '~/utils/graph'

const route = useRoute()
const { getGraph, saveGraph, cloudStatus } = useGraphs()
const { isCloud } = useAuth()

const slug = computed(() => String(route.params.slug || ''))
const graph = computed(() => getGraph(slug.value))
const awaitingCloud = computed(() => (
    !graph.value
    && isCloud.value
    && cloudStatus.value !== 'synced'
    && cloudStatus.value !== 'error'
))

useHead(() => ({
    title: `${graph.value.title} `
}))

const NODE_W = 192
const NODE_H = 66
const NODE_RADIUS = 13

const nodeTypes = NODE_TYPES

// Reusable Tailwind class strings

const toolClass = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-[7px] text-[11px] font-medium transition-colors'

const toolIdleClass = 'text-white/45 hover:bg-white/[0.05] hover:text-white'

const toolActiveClass = 'bg-[#4B6BFF]/15 text-[#8CA4FF]'

const shortcutRows = [
    { label: 'New node', keys: 'N' },
    { label: 'Connect selected / two selected', keys: 'C' },
    { label: 'Edit selected node', keys: 'Enter' },
    { label: 'Delete selected nodes', keys: 'Del' },
    { label: 'Duplicate selected', keys: '⌘ / Ctrl + D' },
    { label: 'Fit to view', keys: 'F' },
    { label: 'Auto arrange', keys: 'A' },
    { label: 'Save now', keys: '⌘ / Ctrl + S' },
]

const controlClass = 'inline-flex items-center justify-center rounded-md p-1.5 text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white'

const menuItemClass = 'group flex w-full items-center gap-2.5 rounded-md px-2.5 py-[8px] text-left text-[11.5px] transition-colors'

const menuItemIdleClass = 'text-white/55 hover:bg-white/[0.055] hover:text-white'

const menuIconClass = 'h-3.5 w-3.5 shrink-0 text-white/30 transition-colors group-hover:text-[#8CA4FF]'

const fieldLabelClass = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40'

const fieldClass = 'w-full rounded-xl border border-white/[0.08] bg-[#0B0C10] px-3.5 py-2.5 text-[13px] text-white placeholder-white/25 outline-none transition-colors focus:border-[#4B6BFF]/60'

const relationOptionClass = 'flex w-full items-start gap-3 rounded-lg border border-white/[0.06] bg-[#0B0C10] px-3 py-2.5 text-left transition-colors hover:border-white/[0.14] hover:bg-[#151821]'

const relationIconClass = 'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.02] text-[13px] leading-none text-white/70'


// --- Graph data ---------------------------------------------------------
const nodes = computed({
    get: () => graph.value?.nodes ?? [],
    set: (value) => {
        if (graph.value) graph.value.nodes = value
    }
})

const connections = computed({
    get: () => graph.value?.connections ?? [],
    set: (value) => {
        if (graph.value) graph.value.connections = value
    }
})

const graphTitle = computed(() => graph.value?.title || 'Untitled graph')
const graphDescription = computed(() => graph.value?.description || '')
const saveState = ref('saved')
let saveTimer = null

// --- UI state -----------------------------------------------------------
const selectedNodeId = ref(null)
const selectedNodeIds = ref([])
const detailsNodeId = ref(null)
const isEditingDetails = ref(false)
const editDraft = reactive({ title: '', description: '', type: 'Concept' })

const searchQuery = ref('')
const canvasRef = ref(null)

const transform = reactive({ x: 0, y: 0, zoom: 1 })
const isPanning = ref(false)
const panStart = reactive({ x: 0, y: 0 })
const dragState = ref(null)

const connecting = reactive({ active: false, sourceId: null })
const pendingConnection = ref(null)
const pointerGraph = reactive({ x: 0, y: 0, visible: false })

const contextMenu = reactive({ open: false, nodeId: null, x: 0, y: 0 })
const canvasMenu = reactive({ open: false, x: 0, y: 0 })
const shortcutsOpen = ref(false)

const toast = ref('')
let toastTimer = null

const isEditingGraphTitle = ref(false)
const graphTitleDraft = ref('')
const titleInputRef = ref(null)
const editTitleRef = ref(null)

// --- Lookups ------------------------------------------------------------
const nodeById = computed(() => new Map(nodes.value.map(node => [node.id, node])))

const degreeMap = computed(() => {
    const counts = new Map()

    for (const connection of connections.value) {
        counts.set(connection.from, (counts.get(connection.from) || 0) + 1)
        counts.set(connection.to, (counts.get(connection.to) || 0) + 1)
    }

    return counts
})

const parentTopicEdgeByChild = computed(() => {
    const parents = new Map()

    for (const connection of connections.value) {
        if (connection.kind !== 'topic') continue
        if (!parents.has(connection.to)) parents.set(connection.to, connection)
    }

    return parents
})

const topicSets = computed(() => {
    const hasParent = new Set()
    const hasChild = new Set()

    for (const connection of connections.value) {
        if (connection.kind !== 'topic') continue
        hasChild.add(connection.from)
        hasParent.add(connection.to)
    }

    return { hasParent, hasChild }
})

function getNodeById(id) {
    return nodeById.value.get(id) || null
}

/**
 * `selectedNodeId` is the primary node (details, delete shortcut, etc.).
 * `selectedNodeIds` keeps the shift-clicked set so two nodes can be connected
 * without entering connect mode first.
 */
function setSelection(ids = []) {
    const validIds = [...new Set(ids.filter(id => getNodeById(id)))]

    selectedNodeIds.value = validIds
    selectedNodeId.value = validIds.length ? validIds[validIds.length - 1] : null
}

function toggleShiftSelection(node) {
    const ids = [...selectedNodeIds.value]
    const index = ids.indexOf(node.id)

    if (index === -1) ids.push(node.id)
    else ids.splice(index, 1)

    setSelection(ids)
    closeDetails()

    if (ids.length >= 2) showToast(`${ids.length} nodes selected — press C to connect`)
    else if (ids.length === 1) showToast('1 node selected — shift-click another')
    else showToast('Selection cleared')
}

function nextNodeId() {
    return nodes.value.reduce((max, node) => Math.max(max, Number(node.id) || 0), 0) + 1
}

function nextEdgeId() {
    return connections.value.reduce((max, edge) => Math.max(max, Number(edge.id) || 0), 0) + 1
}

function typeColor(type) {
    return TYPE_META[type]?.color || TYPE_META.Concept.color
}

function truncate(text, max = 20) {
    if (!text) return ''
    return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function degree(nodeId) {
    return degreeMap.value.get(nodeId) || 0
}

function isTopLevelTopic(node) {
    const { hasParent, hasChild } = topicSets.value
    return !hasParent.has(node.id) && hasChild.has(node.id)
}

function getMainTopic(nodeId) {
    const edge = parentTopicEdgeByChild.value.get(nodeId)
    if (!edge) return null
    const node = getNodeById(edge.from)
    return node ? { edge, node } : null
}

function getAttachments(nodeId) {
    const mainEdge = parentTopicEdgeByChild.value.get(nodeId)
    return connections.value
        .filter(c => c !== mainEdge && (c.from === nodeId || c.to === nodeId))
        .map(c => {
            const otherId = c.from === nodeId ? c.to : c.from
            const node = getNodeById(otherId)
            if (!node) return null

            let relation = 'Related'
            if (c.kind === 'topic') relation = c.from === nodeId ? 'Subtopic' : 'Main topic'

            return { edgeId: c.id, node, relation, kind: c.kind }
        })
        .filter(Boolean)
}

// --- Derived state ------------------------------------------------------
const selectedNode = computed(() => getNodeById(selectedNodeId.value))
const detailsNode = computed(() => getNodeById(detailsNodeId.value))
const detailsMainTopic = computed(() => (detailsNode.value ? getMainTopic(detailsNode.value.id) : null))
const detailsAttachments = computed(() => (detailsNode.value ? getAttachments(detailsNode.value.id) : []))
const detailsConnectionCount = computed(() => detailsAttachments.value.length + (detailsMainTopic.value ? 1 : 0))

const contextNode = computed(() => getNodeById(contextMenu.nodeId))
const contextConnections = computed(() => (contextNode.value ? getAttachments(contextNode.value.id) : []))

const connectSourceNode = computed(() => getNodeById(connecting.sourceId))
const pendingNodes = computed(() => {
    if (!pendingConnection.value) return null
    const from = getNodeById(pendingConnection.value.fromId)
    const to = getNodeById(pendingConnection.value.toId)
    return from && to ? { from, to } : null
})

const focusNodeId = computed(() => {
    if (contextMenu.open) return contextMenu.nodeId
    if (detailsNodeId.value != null) return detailsNodeId.value
    if (connecting.sourceId != null) return connecting.sourceId
    return selectedNodeId.value
})

const filteredNodes = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return nodes.value
    return nodes.value.filter(n =>
        `${n.title} ${n.description} ${n.type}`.toLowerCase().includes(query)
    )
})

// --- Graph geometry -----------------------------------------------------
// Connectors are modelled as leaving a node through the side that faces the
// other node. Each cubic Bézier then starts and ends perpendicular to that
// side, so the arrow always enters the target cleanly instead of cutting
// across a corner at an odd angle.
function connectionPairKey(edge) {
    return edge.from <= edge.to ? `${edge.from}:${edge.to}` : `${edge.to}:${edge.from}`
}

// Edges that share a pair of nodes (for example a topic edge plus a related
// edge) are shifted sideways so they remain individually readable.
const parallelOffsets = computed(() => {
    const groups = new Map()

    for (const edge of connections.value) {
        const key = connectionPairKey(edge)
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(edge)
    }

    const offsets = new Map()

    for (const group of groups.values()) {
        group.sort((a, b) => {
            if (a.kind !== b.kind) return a.kind === 'topic' ? -1 : 1
            return (Number(a.id) || 0) - (Number(b.id) || 0)
        })

        const spacing = 24
        group.forEach((edge, index) => {
            offsets.set(edge.id, (index - (group.length - 1) / 2) * spacing)
        })
    }

    return offsets
})

function facingSide(from, to) {
    const dx = to.x - from.x
    const dy = to.y - from.y

    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left'
    return dy >= 0 ? 'bottom' : 'top'
}

function rectanglePort(node, side, slide = 0) {
    const halfW = NODE_W / 2
    const halfH = NODE_H / 2
    const inset = NODE_RADIUS + 5

    if (side === 'right') {
        return { x: node.x + halfW, y: node.y + clamp(slide, -halfH + inset, halfH - inset), nx: 1, ny: 0 }
    }
    if (side === 'left') {
        return { x: node.x - halfW, y: node.y + clamp(slide, -halfH + inset, halfH - inset), nx: -1, ny: 0 }
    }
    if (side === 'bottom') {
        return { x: node.x + clamp(slide, -halfW + inset, halfW - inset), y: node.y + halfH, nx: 0, ny: 1 }
    }
    return { x: node.x + clamp(slide, -halfW + inset, halfW - inset), y: node.y - halfH, nx: 0, ny: -1 }
}

function curveBetween(from, to, slide = 0) {
    const start = rectanglePort(from, facingSide(from, to), slide)
    const end = rectanglePort(to, facingSide(to, from), slide)
    const distance = Math.hypot(end.x - start.x, end.y - start.y) || 1
    const spread = clamp(distance * 0.42, 28, 170)

    const c1 = { x: start.x + start.nx * spread, y: start.y + start.ny * spread }
    const c2 = { x: end.x + end.nx * spread, y: end.y + end.ny * spread }

    return {
        start,
        end,
        c1,
        c2,
        path: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`,
    }
}

// Build the arrowhead from the curve's real end tangent (end - control),
// rather than relying on an SVG marker that can drift from the path.
function arrowPoints(end, control) {
    const dx = end.x - control.x
    const dy = end.y - control.y
    const length = Math.hypot(dx, dy) || 1
    const ux = dx / length
    const uy = dy / length
    const size = 11
    const halfWidth = 4.4
    const baseX = end.x - ux * size
    const baseY = end.y - uy * size
    const px = -uy
    const py = ux

    return [
        `${end.x},${end.y}`,
        `${baseX + px * halfWidth},${baseY + py * halfWidth}`,
        `${baseX - px * halfWidth},${baseY - py * halfWidth}`,
    ].join(' ')
}

function edgeActive(edge) {
    return focusNodeId.value != null && (edge.from === focusNodeId.value || edge.to === focusNodeId.value)
}

const renderedConnections = computed(() => {
    const offsets = parallelOffsets.value

    return connections.value
        .map(edge => {
            const from = getNodeById(edge.from)
            const to = getNodeById(edge.to)
            if (!from || !to) return null

            const curve = curveBetween(from, to, offsets.get(edge.id) || 0)
            const active = edgeActive(edge)

            return {
                id: edge.id,
                path: curve.path,
                arrow: edge.kind === 'topic' ? arrowPoints(curve.end, curve.c2) : null,
                color: active ? '#6D86FF' : edge.kind === 'topic' ? '#3D4760' : '#333B4D',
                width: active ? 2.4 : edge.kind === 'topic' ? 2 : 1.6,
                opacity: active ? 1 : focusNodeId.value != null ? 0.42 : 0.82,
                dashed: edge.kind === 'related',
            }
        })
        .filter(Boolean)
})

const renderedArrows = computed(() => renderedConnections.value.filter(item => item.arrow))

const connectPreview = computed(() => {
    if (!connecting.active || connecting.sourceId == null || !pointerGraph.visible) return null

    const source = getNodeById(connecting.sourceId)
    if (!source) return null

    const target = { x: pointerGraph.x, y: pointerGraph.y }
    const start = rectanglePort(source, facingSide(source, target), 0)
    const dx = target.x - start.x
    const dy = target.y - start.y
    const distance = Math.hypot(dx, dy) || 1
    const spread = clamp(distance * 0.42, 20, 140)
    const ux = dx / distance
    const uy = dy / distance
    const c1 = { x: start.x + start.nx * spread, y: start.y + start.ny * spread }
    const c2 = { x: target.x - ux * spread, y: target.y - uy * spread }

    return {
        path: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${target.x} ${target.y}`,
        x: target.x,
        y: target.y,
    }
})

function isNodeSelected(node) {
    return selectedNodeIds.value.includes(node.id)
}

function isPrimaryNode(node) {
    return selectedNodeId.value === node.id
        || detailsNodeId.value === node.id
        || connecting.sourceId === node.id
        || (contextMenu.open && contextMenu.nodeId === node.id)
}

function isNodeEmphasized(node) {
    return isNodeSelected(node) || isPrimaryNode(node)
}

function nodeFill(node) {
    if (isPrimaryNode(node)) return '#1E2639'
    if (isNodeSelected(node)) return '#1A2131'
    if (isTopLevelTopic(node)) return '#191F2D'
    return '#161A23'
}

function nodeStroke(node) {
    if (connecting.sourceId === node.id) return '#F5A623'
    if (isPrimaryNode(node)) return '#7D93FF'
    if (isNodeSelected(node)) return '#6379B8'
    if (isTopLevelTopic(node)) return '#3F4F82'
    return '#2A3142'
}

// --- Canvas transform ---------------------------------------------------
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

function canvasRect() {
    return canvasRef.value ? canvasRef.value.getBoundingClientRect() : null
}

function graphPoint(clientX, clientY) {
    const rect = canvasRect()
    if (!rect) return { x: 0, y: 0 }
    return {
        x: (clientX - rect.left - transform.x) / transform.zoom,
        y: (clientY - rect.top - transform.y) / transform.zoom
    }
}

function canvasCenterPoint() {
    const rect = canvasRect()
    if (!rect) return { x: 0, y: 0 }
    return {
        x: (rect.width / 2 - transform.x) / transform.zoom,
        y: (rect.height / 2 - transform.y) / transform.zoom
    }
}

function applyZoom(nextZoom, pivotX, pivotY) {
    const newZoom = clamp(nextZoom, 0.3, 2.2)
    transform.x = pivotX - (pivotX - transform.x) * (newZoom / transform.zoom)
    transform.y = pivotY - (pivotY - transform.y) * (newZoom / transform.zoom)
    transform.zoom = newZoom
}

function handleWheel(event) {
    const rect = canvasRect()
    if (!rect) return
    const factor = event.deltaY < 0 ? 1.08 : 0.92
    applyZoom(
        transform.zoom * factor,
        event.clientX - rect.left,
        event.clientY - rect.top
    )
}

function zoomBy(amount) {
    const rect = canvasRect()
    if (!rect) return
    applyZoom(transform.zoom + amount, rect.width / 2, rect.height / 2)
}

function fitView() {
    const rect = canvasRect()
    if (!rect || !nodes.value.length) return

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const node of nodes.value) {
        minX = Math.min(minX, node.x - NODE_W / 2)
        maxX = Math.max(maxX, node.x + NODE_W / 2)
        minY = Math.min(minY, node.y - NODE_H / 2)
        maxY = Math.max(maxY, node.y + NODE_H / 2)
    }

    const pad = 120
    const availableW = Math.max(rect.width - pad * 2, 100)
    const availableH = Math.max(rect.height - pad * 2, 100)
    const graphW = Math.max(maxX - minX, NODE_W)
    const graphH = Math.max(maxY - minY, NODE_H)
    const zoom = clamp(Math.min(availableW / graphW, availableH / graphH), 0.35, 1.35)

    transform.zoom = zoom
    transform.x = rect.width / 2 - ((minX + maxX) / 2) * zoom
    transform.y = rect.height / 2 - ((minY + maxY) / 2) * zoom
}

// --- Pan & node drag ----------------------------------------------------
function onCanvasPointerDown(event) {
    if (event.button !== 0) return
    if (event.target.closest?.('[data-node]')) return
    closeMenus()
    isPanning.value = true
    panStart.x = event.clientX - transform.x
    panStart.y = event.clientY - transform.y
    window.addEventListener('pointermove', onPanMove)
    window.addEventListener('pointerup', stopPan)
    window.addEventListener('pointercancel', stopPan)
}

function onPanMove(event) {
    if (!isPanning.value) return
    transform.x = event.clientX - panStart.x
    transform.y = event.clientY - panStart.y
}

function stopPan() {
    isPanning.value = false
    window.removeEventListener('pointermove', onPanMove)
    window.removeEventListener('pointerup', stopPan)
    window.removeEventListener('pointercancel', stopPan)
}

function onCanvasPointerMove(event) {
    if (!connecting.active || connecting.sourceId == null) return

    const point = graphPoint(event.clientX, event.clientY)
    pointerGraph.x = point.x
    pointerGraph.y = point.y
    pointerGraph.visible = true
}

function startNodeDrag(node, event) {
    if (event.button !== 0) return
    event.stopPropagation()
    closeMenus()

    // Shift-click builds a multi-selection instead of starting a drag, so two
    // nodes can be linked with C without entering connect mode first.
    if (event.shiftKey) {
        if (connecting.active) cancelConnect()
        toggleShiftSelection(node)
        return
    }

    const point = graphPoint(event.clientX, event.clientY)
    dragState.value = {
        node,
        startX: point.x,
        startY: point.y,
        originX: node.x,
        originY: node.y,
        moved: false
    }

    window.addEventListener('pointermove', onNodeDragMove)
    window.addEventListener('pointerup', stopNodeDrag)
    window.addEventListener('pointercancel', stopNodeDrag)
}

function onNodeDragMove(event) {
    const state = dragState.value
    if (!state) return

    const point = graphPoint(event.clientX, event.clientY)
    const dx = point.x - state.startX
    const dy = point.y - state.startY

    if (!state.moved && Math.hypot(dx, dy) > 4) state.moved = true
    if (!state.moved) return

    state.node.x = state.originX + dx
    state.node.y = state.originY + dy
}

function stopNodeDrag(event, allowActivate = true) {
    const state = dragState.value
    dragState.value = null
    window.removeEventListener('pointermove', onNodeDragMove)
    window.removeEventListener('pointerup', stopNodeDrag)
    window.removeEventListener('pointercancel', stopNodeDrag)

    if (allowActivate && event?.type !== 'pointercancel' && state && !state.moved) {
        activateNode(state.node)
    }
}

// --- Selecting, popup & editing -----------------------------------------
function openDetails(node) {
    if (!node) return
    if (connecting.active || connecting.sourceId != null) cancelConnect()
    setSelection([node.id])
    detailsNodeId.value = node.id
    isEditingDetails.value = false
    closeMenus()
}

function closeDetails() {
    detailsNodeId.value = null
    isEditingDetails.value = false
}

function beginEdit() {
    const node = detailsNode.value
    if (!node) return
    editDraft.title = node.title
    editDraft.description = node.description
    editDraft.type = node.type
    isEditingDetails.value = true
    nextTick(() => {
        editTitleRef.value?.focus()
        editTitleRef.value?.select()
    })
}

function cancelEdit() {
    isEditingDetails.value = false
}

function saveEdit() {
    const node = detailsNode.value
    if (!node) return
    node.title = editDraft.title.trim() || 'Untitled node'
    node.description = editDraft.description.trim()
    node.type = editDraft.type
    isEditingDetails.value = false
    showToast('Node updated')
}

// --- Node creation & deletion -------------------------------------------
function createNodeAt(point) {
    const node = {
        id: nextNodeId(),
        title: 'Untitled node',
        description: '',
        type: 'Concept',
        x: point.x,
        y: point.y
    }
    nodes.value.push(node)
    openDetails(node)
    beginEdit()
    showToast('Node added')
}

function addNodeAtCenter() {
    const center = canvasCenterPoint()
    const offset = (nodes.value.length % 4) * 18
    createNodeAt({ x: center.x + offset, y: center.y + offset })
}

function addNodeAt(clientX, clientY) {
    createNodeAt(graphPoint(clientX, clientY))
    closeMenus()
}

function deleteNode(nodeId, options = {}) {
    const node = getNodeById(nodeId)
    if (!node) return

    nodes.value = nodes.value.filter(n => n.id !== nodeId)
    connections.value = connections.value.filter(c => c.from !== nodeId && c.to !== nodeId)

    if (selectedNodeId.value === nodeId || selectedNodeIds.value.includes(nodeId)) {
        setSelection(selectedNodeIds.value.filter(id => id !== nodeId))
    }
    if (detailsNodeId.value === nodeId) closeDetails()
    if (contextMenu.nodeId === nodeId) closeMenus()
    if (connecting.sourceId === nodeId) connecting.sourceId = null
    if (pendingConnection.value && (pendingConnection.value.fromId === nodeId || pendingConnection.value.toId === nodeId)) {
        pendingConnection.value = null
        cancelConnect()
    }

    if (!options.silent) showToast(`Deleted “${truncate(node.title, 22)}”`)
}

function deleteSelectedNodes() {
    const ids = [...new Set([
        ...selectedNodeIds.value,
        ...(selectedNodeId.value != null ? [selectedNodeId.value] : [])
    ])].filter(id => getNodeById(id))

    if (!ids.length) return

    ids.forEach(id => deleteNode(id, { silent: true }))
    showToast(`Deleted ${ids.length} node${ids.length === 1 ? '' : 's'}`)
}

function duplicateNode(node, options = {}) {
    if (!node) return null
    const offset = options.offset || 1
    const copy = {
        ...node,
        id: nextNodeId(),
        title: `${node.title} copy`,
        x: node.x + 48 * offset,
        y: node.y + 48 * offset
    }
    nodes.value.push(copy)

    const parent = getMainTopic(node.id)
    if (parent) {
        connections.value.push({
            id: nextEdgeId(),
            from: parent.node.id,
            to: copy.id,
            kind: 'topic'
        })
    }

    setSelection([copy.id])
    closeMenus()
    if (!options.silent) showToast('Node duplicated')
    return copy
}

function duplicateSelectedNodes() {
    const ids = selectedNodeIds.value.length
        ? [...selectedNodeIds.value]
        : (selectedNodeId.value != null ? [selectedNodeId.value] : [])

    const originals = ids.map(id => getNodeById(id)).filter(Boolean)
    if (!originals.length) return

    const copies = originals.map((node, index) => duplicateNode(node, {
        silent: true,
        offset: index + 1
    }))

    setSelection(copies.map(copy => copy.id))
    showToast(copies.length === 1 ? 'Node duplicated' : `${copies.length} nodes duplicated`)
}

function setNodeType(node, type) {
    if (!node) return
    node.type = type
    closeMenus()
    showToast(`Type set to ${type}`)
}

function detachMainTopic(nodeId) {
    const main = getMainTopic(nodeId)
    if (!main) return
    connections.value = connections.value.filter(c => c.id !== main.edge.id)
    closeMenus()
    showToast('Detached from main topic')
}

// --- Connections --------------------------------------------------------
function pairConnection(a, b) {
    return connections.value.find(c =>
        (c.from === a && c.to === b) || (c.from === b && c.to === a)
    )
}

function startConnect(sourceId = null) {
    closeDetails()
    closeMenus()
    pendingConnection.value = null
    connecting.active = true
    connecting.sourceId = sourceId
    pointerGraph.visible = false
}

function cancelConnect() {
    connecting.active = false
    connecting.sourceId = null
    pendingConnection.value = null
    pointerGraph.visible = false
}

function toggleConnect() {
    if (pendingConnection.value) return

    if (connecting.active) {
        cancelConnect()
        return
    }

    const selected = selectedNodeIds.value.filter(id => getNodeById(id))

    if (selected.length >= 2) {
        pendingConnection.value = { fromId: selected[0], toId: selected[1] }
        connecting.active = false
        connecting.sourceId = null
        pointerGraph.visible = false
        closeDetails()
        closeMenus()
        return
    }

    if (selected.length === 1) {
        startConnect(selected[0])
        showToast('Now click another node to connect')
        return
    }

    startConnect()
}

function activateNode(node) {
    if (connecting.active) {
        if (connecting.sourceId == null) {
            connecting.sourceId = node.id
            return
        }
        if (connecting.sourceId === node.id) return

        pendingConnection.value = { fromId: connecting.sourceId, toId: node.id }
        connecting.active = false
        connecting.sourceId = null
        pointerGraph.visible = false
        return
    }

    openDetails(node)
}

function setSubtopic(childId, parentId) {
    const child = getNodeById(childId)
    const parent = getNodeById(parentId)
    if (!child || !parent || childId === parentId) return

    // Ignore the pair being reassigned; every other topic edge still matters.
    const withoutPair = connections.value.filter(c => !(
        c.kind === 'topic'
        && ((c.from === childId && c.to === parentId) || (c.from === parentId && c.to === childId))
    ))

    if (wouldCreateTopicCycle(withoutPair, parentId, childId)) {
        showToast(`That would create a loop — “${truncate(parent.title, 18)}” is already inside “${truncate(child.title, 18)}”`)
        return
    }

    const existingTopic = connections.value.find(c =>
        c.kind === 'topic'
        && ((c.from === parentId && c.to === childId) || (c.from === childId && c.to === parentId))
    )

    let keepId = existingTopic?.id

    if (existingTopic) {
        existingTopic.from = parentId
        existingTopic.to = childId
    } else {
        keepId = nextEdgeId()
        connections.value.push({ id: keepId, from: parentId, to: childId, kind: 'topic' })
    }

    connections.value = connections.value.filter(c =>
        c.id === keepId || !(c.kind === 'topic' && c.to === childId)
    )

    showToast(`“${truncate(child.title, 18)}” is now under “${truncate(parent.title, 18)}”`)
}

function completeConnection(mode) {
    const pending = pendingConnection.value
    if (!pending) return

    const from = getNodeById(pending.fromId)
    const to = getNodeById(pending.toId)
    if (!from || !to) {
        cancelConnect()
        return
    }

    if (mode === 'related') {
        if (pairConnection(from.id, to.id)) {
            showToast('Those nodes are already connected')
        } else {
            connections.value.push({ id: nextEdgeId(), from: from.id, to: to.id, kind: 'related' })
            showToast('Nodes connected as related attachments')
        }
    } else if (mode === 'from-subtopic') {
        setSubtopic(from.id, to.id)
    } else if (mode === 'to-subtopic') {
        setSubtopic(to.id, from.id)
    }

    pendingConnection.value = null
    connecting.active = false
    connecting.sourceId = null
    pointerGraph.visible = false
    setSelection([])
}

function cancelPendingConnection() {
    pendingConnection.value = null
    cancelConnect()
}

function removeConnection(edgeId) {
    connections.value = connections.value.filter(c => c.id !== edgeId)
    showToast('Connection removed')
}

// --- Context menus ------------------------------------------------------
function openNodeMenu(node, event) {
    event.preventDefault()
    event.stopPropagation()

    setSelection([node.id])
    contextMenu.nodeId = node.id
    contextMenu.x = Math.max(12, Math.min(event.clientX, window.innerWidth - 292))
    contextMenu.y = Math.max(12, Math.min(event.clientY, window.innerHeight - 470))
    contextMenu.open = true
    canvasMenu.open = false
}

function openCanvasMenu(event) {
    if (event.target.closest?.('[data-node]')) return
    canvasMenu.x = Math.max(12, Math.min(event.clientX, window.innerWidth - 236))
    canvasMenu.y = Math.max(12, Math.min(event.clientY, window.innerHeight - 190))
    canvasMenu.open = true
    contextMenu.open = false
}

function closeMenus() {
    contextMenu.open = false
    canvasMenu.open = false
    shortcutsOpen.value = false
}

function deleteFromContext() {
    const nodeId = contextMenu.nodeId
    closeMenus()
    if (nodeId != null) deleteNode(nodeId)
}

// --- Layout -------------------------------------------------------------
function autoArrange() {
    if (!nodes.value.length) return

    const ids = nodes.value.map(node => node.id)
    const idSet = new Set(ids)
    const children = new Map(ids.map(id => [id, []]))
    const parents = new Map(ids.map(id => [id, []]))
    const indegree = new Map(ids.map(id => [id, 0]))
    const seenEdges = new Set()

    // Build the topic forest. Duplicate topic edges are ignored.
    for (const edge of connections.value) {
        if (edge.kind !== 'topic') continue
        if (!idSet.has(edge.from) || !idSet.has(edge.to) || edge.from === edge.to) continue

        const key = `${edge.from}:${edge.to}`
        if (seenEdges.has(key)) continue
        seenEdges.add(key)

        children.get(edge.from).push(edge.to)
        parents.get(edge.to).push(edge.from)
        indegree.set(edge.to, indegree.get(edge.to) + 1)
    }

    // Kahn's topological sort, also tracking each node's longest-path layer:
    // every child sits one row below its deepest parent.
    const level = new Map(ids.map(id => [id, 0]))
    const queue = ids.filter(id => indegree.get(id) === 0)
    const order = []
    let head = 0

    while (head < queue.length) {
        const id = queue[head]
        head += 1
        order.push(id)

        for (const childId of children.get(id) || []) {
            level.set(childId, Math.max(level.get(childId) || 0, (level.get(id) || 0) + 1))

            const remaining = (indegree.get(childId) || 0) - 1
            indegree.set(childId, remaining)
            if (remaining === 0) queue.push(childId)
        }
    }

    // Defensive fallback for legacy data that still contains a cycle.
    const settled = new Set(order)
    const leftovers = ids.filter(id => !settled.has(id))
    const fallbackLevel = order.reduce((max, id) => Math.max(max, level.get(id) || 0), 0) + 1
    leftovers.forEach(id => level.set(id, fallbackLevel))

    const layers = []
    for (const id of ids) {
        const row = level.get(id) || 0
        if (!layers[row]) layers[row] = []
        layers[row].push(id)
    }
    for (let row = 0; row < layers.length; row += 1) {
        if (!layers[row]) layers[row] = []
    }

    // Seed every row from the current horizontal order, preserving as much of
    // the user's arrangement as possible before reducing crossings.
    layers.forEach(layer => layer.sort((a, b) => {
        const nodeA = getNodeById(a)
        const nodeB = getNodeById(b)
        return (nodeA?.x || 0) - (nodeB?.x || 0) || a - b
    }))

    const indexInLayer = new Map()

    function refreshIndexes() {
        layers.forEach(layer => layer.forEach((id, index) => indexInLayer.set(id, index)))
    }

    function barycenter(id, neighbours) {
        const positions = (neighbours.get(id) || [])
            .map(neighbourId => indexInLayer.get(neighbourId))
            .filter(position => position != null)

        if (!positions.length) return null
        return positions.reduce((total, position) => total + position, 0) / positions.length
    }

    function orderLayer(row, neighbours) {
        const scored = layers[row].map((id, index) => ({
            id,
            index,
            score: barycenter(id, neighbours),
        }))

        scored.sort((a, b) => {
            if (a.score == null && b.score == null) return a.index - b.index
            if (a.score == null) return 1
            if (b.score == null) return -1
            return a.score - b.score || a.index - b.index
        })

        layers[row] = scored.map(item => item.id)
        layers[row].forEach((id, index) => indexInLayer.set(id, index))
    }

    refreshIndexes()

    // Alternate downward/upward sweeps, ordering first by parents and then by
    // children. This is the classic barycenter crossing-reduction heuristic.
    for (let sweep = 0; sweep < 4; sweep += 1) {
        if (sweep % 2 === 0) {
            for (let row = 1; row < layers.length; row += 1) {
                orderLayer(row, parents)
            }
        } else {
            for (let row = layers.length - 2; row >= 0; row -= 1) {
                orderLayer(row, children)
            }
        }
    }

    const columnWidth = 235
    const rowHeight = 165

    layers.forEach((layer, row) => {
        layer.forEach((id, index) => {
            const node = getNodeById(id)
            if (!node) return
            node.x = (index - (layer.length - 1) / 2) * columnWidth
            node.y = row * rowHeight
        })
    })

    nextTick(fitView)
    closeMenus()
    showToast('Layout arranged')
}

// --- Persistence --------------------------------------------------------
function persistGraph() {
    if (!graph.value) return

    clearTimeout(saveTimer)
    saveGraph(slug.value, {
        title: graph.value.title,
        description: graph.value.description,
        nodes: graph.value.nodes,
        connections: graph.value.connections,
        view: { x: transform.x, y: transform.y, zoom: transform.zoom }
    })
    saveState.value = 'saved'
}

function scheduleSave() {
    if (!graph.value) return
    saveState.value = 'saving'
    clearTimeout(saveTimer)
    saveTimer = setTimeout(persistGraph, 350)
}

function onVisibilityChange() {
    if (document.visibilityState === 'hidden') persistGraph()
}

watch(
    () => graph.value
        ? [graph.value.title, graph.value.description, graph.value.nodes, graph.value.connections]
        : null,
    scheduleSave,
    { deep: true }
)

watch(transform, scheduleSave, { deep: true })

watch(slug, () => {
    setSelection([])
    closeDetails()
    cancelConnect()
    shortcutsOpen.value = false
})

// --- Graph metadata -----------------------------------------------------
function beginTitleEdit() {
    if (!graph.value) return
    graphTitleDraft.value = graph.value.title
    isEditingGraphTitle.value = true
    nextTick(() => {
        titleInputRef.value?.focus()
        titleInputRef.value?.select()
    })
}

function saveTitle() {
    if (!graph.value) return
    graph.value.title = graphTitleDraft.value.trim() || 'Untitled graph'
    isEditingGraphTitle.value = false
    persistGraph()
    showToast('Graph renamed')
}

function cancelTitleEdit() {
    isEditingGraphTitle.value = false
}

function exportFlowchart() {
    if (!graph.value) return
    persistGraph()
    downloadGraphFile(graph.value)
    showToast('Graph exported as a .fl file')
}

// --- Helpers ------------------------------------------------------------
function showToast(message) {
    toast.value = message
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
        toast.value = ''
    }, 2400)
}

function isTypingTarget(target) {
    const tag = target?.tagName?.toLowerCase()
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable
}

function editSelectedNode() {
    const node = selectedNode.value
    if (!node) return
    if (detailsNodeId.value !== node.id) openDetails(node)
    beginEdit()
}

function onKeyDown(event) {
    if (event.key === 'Escape') {
        if (shortcutsOpen.value) {
            shortcutsOpen.value = false
        } else if (contextMenu.open || canvasMenu.open) {
            closeMenus()
        } else if (pendingConnection.value) {
            cancelPendingConnection()
        } else if (connecting.active) {
            cancelConnect()
        } else if (isEditingGraphTitle.value) {
            cancelTitleEdit()
        } else if (detailsNodeId.value != null) {
            if (isEditingDetails.value) cancelEdit()
            else closeDetails()
        } else if (selectedNodeId.value != null || selectedNodeIds.value.length) {
            setSelection([])
        }
        return
    }

    if (event.repeat) return

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (graph.value) {
            persistGraph()
            showToast('Graph saved')
        }
        return
    }

    if (isTypingTarget(event.target)) return

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        if (pendingConnection.value || shortcutsOpen.value) return
        event.preventDefault()
        duplicateSelectedNodes()
        return
    }

    // Plain shortcuts should not fire while a modal or popover owns the screen.
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
    if (pendingConnection.value || shortcutsOpen.value) return

    switch (event.key.toLowerCase()) {
        case 'n':
            event.preventDefault()
            addNodeAtCenter()
            break
        case 'c':
            event.preventDefault()
            toggleConnect()
            break
        case 'f':
            event.preventDefault()
            fitView()
            break
        case 'a':
            event.preventDefault()
            autoArrange()
            break
        case 'enter':
            // Let a focused button/link handle its own activation.
            if (event.target?.closest?.('button, a')) break
            if (selectedNode.value) {
                event.preventDefault()
                editSelectedNode()
            }
            break
        case 'delete':
        case 'backspace':
            if (selectedNodeId.value != null || selectedNodeIds.value.length) {
                event.preventDefault()
                deleteSelectedNodes()
            }
            break
    }
}

onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('beforeunload', persistGraph)
    document.addEventListener('visibilitychange', onVisibilityChange)

    if (graph.value?.view) {
        Object.assign(transform, graph.value.view)
    } else {
        nextTick(fitView)
    }
})

onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('beforeunload', persistGraph)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    stopPan()
    stopNodeDrag(null, false)
    clearTimeout(toastTimer)
    clearTimeout(saveTimer)
    persistGraph()
})
</script>

<template>
    <ClientOnly>
        <div v-if="!graph && awaitingCloud"
            class="flex h-screen w-screen flex-col items-center justify-center gap-5 bg-[#0E1117] px-6 geist-400 text-[#F5F4EF]">
            <span class="h-6 w-6 animate-spin rounded-full border-2 border-[#3155D9]/25 border-t-[#6D86FF]"></span>
            <div class="max-w-sm text-center">
                <h1 class="text-lg font-semibold tracking-tight text-white">Looking for your graph…</h1>
                <p class="mt-2 text-[12px] leading-relaxed text-white/40">
                    Checking your synced account for <span class="text-white/65">/dashboard/{{ slug }}</span>.
                </p>
            </div>
        </div>

        <div v-else-if="!graph"
            class="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[#0E1117] px-6 geist-400 text-[#F5F4EF]">
            <div
                class="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                <svg class="h-6 w-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"
                        d="M12 9v6m0 3h.01M10.3 3.6 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
                </svg>
            </div>
            <div class="max-w-sm text-center">
                <h1 class="text-xl font-semibold tracking-tight text-white">Graph not found</h1>
                <p class="mt-2 text-[12.5px] leading-relaxed text-white/40">
                    There is no graph saved at <span class="text-white/65">/dashboard/{{ slug }}</span>.
                    It may have been deleted, or the link may be incorrect.
                </p>
            </div>
            <NuxtLink to="/dashboard"
                class="rounded-xl bg-[#3155D9] px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#3E63E8]">
                Back to dashboard
            </NuxtLink>
        </div>

        <section v-else
            class="relative flex h-screen w-screen select-none flex-col overflow-hidden bg-[#0c0c0d] geist-400 text-[#F5F4EF]">
            <!-- Top navigation -->
            <header class="relative z-30 h-16 shrink-0 border-b border-white/[0.07] bg-[#111113]/90 backdrop-blur-xl">
                <div class="flex h-full items-center gap-3 px-4 md:px-5">
                    <NuxtLink to="/"
                        class="text-[19px] font-semibold tracking-tight text-white transition-opacity hover:opacity-80">
                        fleur<span class="text-[#6D86FF]">ıs.</span>
                    </NuxtLink>

                    <div class="mx-2 hidden h-4 w-px bg-white/[0.08] sm:block"></div>

                    <NuxtLink to="/dashboard"
                        class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white"
                        title="Back to all graphs">
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span class="hidden sm:inline">All graphs</span>
                    </NuxtLink>

                    <span class="hidden max-w-[180px] truncate text-[11.5px] text-white/30 lg:block">{{ graphTitle
                    }}</span>

                    <div class="ml-auto flex min-w-0 items-center gap-2">
                        <div class="flex items-center gap-1 p-1">
                            <button @click="addNodeAtCenter" :class="[toolClass, toolIdleClass]"
                                title="Add a node at the centre of the canvas (N)">
                                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 5v14m-7-7h14" />
                                </svg>
                                <span class="hidden sm:inline">Add node</span>
                            </button>

                            <button @click="toggleConnect"
                                :class="[toolClass, connecting.active ? toolActiveClass : toolIdleClass]"
                                :title="connecting.active ? 'Cancel connecting (C)' : 'Connect two nodes (C)'">
                                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M13.828 10.172a4 4 0 00-5.656 0l-2.343 2.343a4 4 0 105.657 5.657l1.414-1.415m-1.415-8.485l1.415-1.414a4 4 0 115.657 5.657l-2.343 2.343a4 4 0 01-5.657 0" />
                                </svg>
                                <span class="hidden sm:inline">Connect</span>
                            </button>

                            <button @click="autoArrange" :class="[toolClass, toolIdleClass, 'hidden md:flex']"
                                title="Arrange the graph by main topic">
                                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                Arrange
                            </button>

                            <button @click="fitView" :class="[toolClass, toolIdleClass, 'hidden md:flex']"
                                title="Fit all nodes in view">
                                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                Fit
                            </button>

                            <button @click="exportFlowchart" :class="[toolClass, toolIdleClass]"
                                title="Export this graph as a .fl file">
                                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                                </svg>
                                <span class="hidden sm:inline">Export .fl</span>
                            </button>

                            <button @click="shortcutsOpen = !shortcutsOpen"
                                :class="[toolClass, shortcutsOpen ? toolActiveClass : toolIdleClass]"
                                title="Keyboard shortcuts">
                                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                        d="M5 8h14M5 12h14M5 16h14M8 5v14m8-14v14M5 5h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
                                </svg>
                                <span class="hidden sm:inline">Shortcuts</span>
                            </button>
                        </div>

                        <span v-if="saveState === 'saving'"
                            class="hidden text-[10px] text-white/30 md:block">Saving…</span>
                        <span v-else-if="isCloud && cloudStatus === 'syncing'"
                            class="hidden text-[10px] text-[#8CA4FF]/70 md:block">Syncing…</span>
                        <span v-else-if="isCloud && cloudStatus === 'synced'"
                            class="hidden text-[10px] text-white/30 md:block">Synced</span>

                        <transition enter-active-class="transition duration-150 ease-out"
                            enter-from-class="translate-y-1 opacity-0"
                            leave-active-class="transition duration-100 ease-in"
                            leave-to-class="translate-y-1 opacity-0">
                            <div v-if="selectedNode"
                                class="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.025] py-1 pl-3 pr-1">
                                <span class="hidden max-w-[120px] truncate text-[11px] text-white/45 lg:block">
                                    {{ truncate(selectedNode.title, 16) }}
                                </span>
                                <span class="h-1.5 w-1.5 rounded-full"
                                    :style="{ background: typeColor(selectedNode.type) }"></span>
                                <button @click="deleteNode(selectedNode.id)" title="Delete selected node"
                                    class="rounded-lg p-2 text-white/35 transition-colors hover:bg-red-500/10 hover:text-red-400">
                                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </transition>
                    </div>
                </div>
            </header>

            <transition enter-active-class="transition duration-150 ease-out"
                enter-from-class="-translate-y-1 opacity-0" leave-active-class="transition duration-100 ease-in"
                leave-to-class="-translate-y-1 opacity-0">
                <div v-if="shortcutsOpen"
                    class="absolute right-4 top-[68px] z-40 w-[292px] rounded-xl border border-white/[0.09] bg-[#12141A]/95 p-4 backdrop-blur-md"
                    @pointerdown.stop>
                    <div class="flex items-center justify-between">
                        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                            Keyboard shortcuts
                        </p>
                        <button @click="shortcutsOpen = false" title="Close"
                            class="rounded-md p-1 text-white/30 transition-colors hover:bg-white/[0.05] hover:text-white">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div class="mt-3 space-y-2.5">
                        <div v-for="shortcut in shortcutRows" :key="shortcut.keys"
                            class="flex items-center justify-between gap-4 text-[11.5px] text-white/50">
                            <span>{{ shortcut.label }}</span>
                            <kbd
                                class="shrink-0 rounded border border-white/[0.09] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-white/65">
                                {{ shortcut.keys }}
                            </kbd>
                        </div>
                    </div>

                    <p class="mt-3 border-t border-white/[0.06] pt-3 text-[10.5px] leading-relaxed text-white/30">
                        Shift-click two nodes, then press C to connect them.
                    </p>
                </div>
            </transition>

            <div class="flex min-h-0 flex-1">
                <!-- Workspace sidebar -->
                <aside class="hidden w-[268px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0c0c0d]/75 lg:flex">
                    <div class="border-b border-white/[0.07] p-4">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0 flex-1">
                                <p class="mt-1 truncate text-[10px] text-white/25">/dashboard/{{ slug }}</p>

                                <div v-if="isEditingGraphTitle" class="mt-1">
                                    <input ref="titleInputRef" v-model="graphTitleDraft" maxlength="80"
                                        class="w-full rounded-md border border-[#3155D9]/60 bg-[#0E1117] px-2 py-1 text-[13px] font-semibold text-white outline-none focus:ring-1 focus:ring-[#3155D9]/50"
                                        @keydown.enter.prevent="saveTitle" @keydown.esc.prevent="cancelTitleEdit"
                                        @blur="isEditingGraphTitle && saveTitle()" />
                                </div>

                                <div v-else class="mt-1 flex items-center gap-1.5">
                                    <h1 class="min-w-0 truncate text-[13px] font-semibold text-white/85">
                                        {{ graphTitle }}
                                    </h1>
                                    <button @click="beginTitleEdit" title="Rename graph"
                                        class="shrink-0 rounded-md p-1 text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white">
                                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="m16.5 3.5 4 4L8 20H4v-4L16.5 3.5Z" />
                                        </svg>
                                    </button>
                                </div>


                            </div>
                            <button @click="addNodeAtCenter" title="Add node"
                                class="rounded-lg  bg-white/[0.03] p-1.5 text-white/45 transition-colors hover:border-[#3155D9]/50 hover:text-white">
                                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 5v14m-7-7h14" />
                                </svg>
                            </button>
                        </div>

                        <p v-if="graphDescription"
                            class="mt-3 line-clamp-2 text-[10.5px] leading-relaxed text-white/30">
                            {{ graphDescription }}
                        </p>

                        <div class="relative mt-4">
                            <svg class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                            </svg>
                            <input v-model="searchQuery" type="search" placeholder="Find a node…"
                                class="w-full rounded-full border border-white/[0.08] bg-transparent py-2 pl-9 pr-3 text-[12px] text-white/80 outline-none transition-colors placeholder:text-white/25 focus:border-[#0d0d0d]" />
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto p-2" @wheel.stop>
                        <div class="flex items-center justify-between px-2.5 pb-1 pt-1">
                            <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">Nodes</p>
                            <span class="font-mono text-[10px] text-white/30">{{ filteredNodes.length }}</span>
                        </div>

                        <div class="space-y-0.5 mt-1">
                            <button v-for="node in filteredNodes" :key="node.id" @click="openDetails(node)"
                                class="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors"
                                :class="selectedNodeId === node.id ? 'bg-white/[0.07] text-white' : 'hover:bg-white/[0.04] text-white/70'">
                                <span class="h-1.5 w-1.5 shrink-0 rounded-full"
                                    :style="{ backgroundColor: typeColor(node.type) }"></span>

                                <span class="min-w-0 flex-1">
                                    <span
                                        class="block truncate text-[12px] font-medium transition-colors group-hover:text-white">
                                        {{ node.title }}
                                    </span>
                                    <span class="mt-0.5 block truncate text-[10px] text-white/35">
                                        <template v-if="getMainTopic(node.id)">↳ {{ getMainTopic(node.id).node.title
                                            }}</template>
                                        <template v-else>Top-level topic</template>
                                    </span>
                                </span>

                                <span class="shrink-0 font-mono text-[10px] text-white/25">
                                    {{ degree(node.id) }}
                                </span>
                            </button>
                        </div>

                        <p v-if="!filteredNodes.length" class="px-3 py-10 text-center text-[11.5px] text-white/30">
                            No nodes match.
                        </p>
                    </div>
                </aside>

                <!-- Canvas -->
                <main ref="canvasRef" class="relative min-w-0 flex-1 touch-none overflow-hidden"
                    :class="isPanning ? 'cursor-grabbing' : 'cursor-grab'" @pointerdown="onCanvasPointerDown"
                    @pointermove="onCanvasPointerMove" @wheel.prevent="handleWheel"
                    @contextmenu.prevent="openCanvasMenu">
                    <div class="pointer-events-none absolute inset-0"></div>

                    <svg class="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                        <g :transform="`translate(${transform.x} ${transform.y}) scale(${transform.zoom})`">
                            <!-- Connections -->
                            <g fill="none">
                                <path v-for="item in renderedConnections" :key="item.id" :d="item.path"
                                    :stroke="item.color" :stroke-width="item.width"
                                    :stroke-opacity="item.opacity"
                                    :stroke-dasharray="item.dashed ? '5 7' : null"
                                    stroke-linecap="round"
                                    class="transition-all duration-150" />
                            </g>

                            <!-- Arrowheads, aligned to each curve's real end tangent -->
                            <g>
                                <polygon v-for="item in renderedArrows" :key="`arrow-${item.id}`" :points="item.arrow"
                                    :fill="item.color" :fill-opacity="item.opacity"
                                    class="transition-all duration-150" />
                            </g>

                            <!-- Live connector preview while choosing a target -->
                            <g v-if="connectPreview">
                                <path :d="connectPreview.path" fill="none" stroke="#F5A623" stroke-width="1.6"
                                    stroke-dasharray="6 6" stroke-opacity="0.9" stroke-linecap="round" />
                                <circle :cx="connectPreview.x" :cy="connectPreview.y" r="4" fill="#141A2B"
                                    stroke="#F5A623" stroke-width="1.6" />
                            </g>

                            <!-- Nodes -->
                            <g v-for="node in nodes" :key="node.id" data-node
                                class="group pointer-events-auto cursor-pointer"
                                :transform="`translate(${node.x} ${node.y})`" @pointerdown="startNodeDrag(node, $event)"
                                @contextmenu.prevent.stop="openNodeMenu(node, $event)">
                                <title>{{ node.title }}</title>

                                <!-- Hover / selection halo -->
                                <rect v-if="isNodeEmphasized(node)" :x="-NODE_W / 2 - 5" :y="-NODE_H / 2 - 5"
                                    :width="NODE_W + 10" :height="NODE_H + 10" rx="16" fill="none"
                                    :stroke="connecting.sourceId === node.id ? '#F5A623' : isPrimaryNode(node) ? '#7D93FF' : '#6379B8'"
                                    :stroke-width="isPrimaryNode(node) ? 1.5 : 1"
                                    :stroke-opacity="isPrimaryNode(node) ? 0.8 : 0.55" />

                                <rect
                                    :class="isNodeEmphasized(node) ? 'transition-colors' : 'transition-colors group-hover:stroke-[#4A5570]'"
                                    :x="-NODE_W / 2" :y="-NODE_H / 2" :width="NODE_W" :height="NODE_H" :rx="NODE_RADIUS"
                                    :fill="nodeFill(node)" :stroke="nodeStroke(node)" stroke-width="1.5" />

                                <!-- Main-topic accent -->
                                <rect v-if="isTopLevelTopic(node)" :x="-NODE_W / 2 + 15" :y="-NODE_H / 2 - 1.25"
                                    width="30" height="2.5" rx="1.25" fill="#5B7CFA" />

                                <!-- Type dot -->
                                <circle :cx="-NODE_W / 2 + 19" :cy="-3" r="4.5" :fill="typeColor(node.type)" />

                                <text :x="-NODE_W / 2 + 31" y="-1" fill="#F3F4F8" font-size="13.5" font-weight="600"
                                    style="letter-spacing: -0.01em" class="pointer-events-none">
                                    {{ truncate(node.title, 19) }}
                                </text>

                                <text :x="-NODE_W / 2 + 31" y="16" fill="#788298" font-size="10"
                                    class="pointer-events-none">
                                    {{ node.type }} · {{ degree(node.id) }} {{ degree(node.id) === 1 ? 'link' : 'links'
                                    }}
                                </text>

                                <!-- Link count -->
                                <g v-if="degree(node.id)"
                                    :transform="`translate(${NODE_W / 2 - 16} ${-NODE_H / 2 + 15})`">
                                    <circle r="9" fill="#0F1219" stroke="#2A3142" stroke-width="1" />
                                    <text y="3.4" text-anchor="middle" font-size="9" font-weight="600" fill="#7E879C">
                                        {{ degree(node.id) }}
                                    </text>
                                </g>
                            </g>
                        </g>
                    </svg>

                    <!-- Empty graph -->
                    <div v-if="!nodes.length"
                        class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
                        <div
                            class="pointer-events-auto max-w-sm rounded-2xl border border-dashed border-white/[0.12] bg-[#141821]/80 px-8 py-8 text-center shadow-2xl shadow-black/20 backdrop-blur-xl">
                            <span
                                class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[#3155D9]/30 bg-[#3155D9]/10 text-[#8CA4FF]">
                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                                        d="M12 5v14m-7-7h14" />
                                </svg>
                            </span>
                            <h2 class="mt-4 text-[15px] font-semibold text-white/85">This graph is empty</h2>
                            <p class="mt-1.5 text-[11.5px] leading-relaxed text-white/35">
                                Add your first node or press <span class="text-white/55">N</span>. Then drag it
                                around the canvas and press <span class="text-white/55">C</span> to connect it.
                            </p>
                            <button @click="addNodeAtCenter"
                                class="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#3155D9] px-3.5 py-2 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#3E63E8]">
                                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 5v14m-7-7h14" />
                                </svg>
                                Add first node
                            </button>
                        </div>
                    </div>

                    <!-- Connect mode hint -->
                    <transition enter-active-class="transition duration-200 ease-out"
                        enter-from-class="-translate-y-2 opacity-0" leave-active-class="transition duration-150 ease-in"
                        leave-to-class="-translate-y-2 opacity-0">
                        <div v-if="connecting.active"
                            class="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#3155D9]/40 bg-[#141A2B]/95 px-4 py-2.5 shadow-2xl shadow-black/30 backdrop-blur-xl"
                            @pointerdown.stop>
                            <span class="relative flex h-2 w-2">
                                <span
                                    class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6D86FF] opacity-60"></span>
                                <span class="relative inline-flex h-2 w-2 rounded-full bg-[#6D86FF]"></span>
                            </span>
                            <p class="text-[11px] text-white/65">
                                <template v-if="!connectSourceNode">
                                    Click the <span class="font-semibold text-white">first node</span> to connect, or
                                    <span class="font-semibold text-white">shift-click two nodes</span> and press
                                    <kbd class="rounded border border-white/10 px-1 font-mono text-[10px]">C</kbd>.
                                </template>
                                <template v-else>
                                    From <span class="font-semibold text-[#A9B8FF]">{{ truncate(connectSourceNode.title,
                                        20)
                                    }}</span> — now click the second node.
                                </template>
                            </p>
                            <button @click="cancelConnect"
                                class="ml-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-medium text-white/45 transition-colors hover:bg-white/5 hover:text-white">
                                Cancel
                            </button>
                        </div>
                    </transition>

                    <!-- Zoom controls -->
                    <div class="absolute bottom-5 left-5 z-20 flex items-center gap-1 rounded-lg border border-white/[0.06] bg-[#111319]/80 p-1 backdrop-blur-md"
                        @pointerdown.stop>
                        <button @click="zoomBy(-0.15)" title="Zoom out" :class="controlClass">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M20 12H4" />
                            </svg>
                        </button>

                        <span class="min-w-[42px] text-center font-mono text-[10.5px] text-white/50">
                            {{ Math.round(transform.zoom * 100) }}%
                        </span>

                        <button @click="zoomBy(0.15)" title="Zoom in" :class="controlClass">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                    d="M12 4v16m8-8H4" />
                            </svg>
                        </button>

                        <div class="mx-0.5 h-3.5 w-px bg-white/[0.06]"></div>

                        <button @click="fitView" title="Fit to view" :class="controlClass">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        </button>
                    </div>
                    <!-- Graph stats -->
                    <div
                        class="absolute bottom-5 right-5 z-20 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-[#111319]/80 px-3 py-1.5 text-[10.5px] text-white/40 backdrop-blur-md">
                        <span class="flex items-center gap-1.5 font-medium text-white/55">
                            {{ nodes.length }} nodes
                        </span>
                        <span class="h-2.5 w-px bg-white/[0.06]"></span>
                        <span class="text-white/40">{{ connections.length }} links</span>
                    </div>

                </main>
            </div>

            <!-- Node details popup -->
            <Teleport to="body">
                <transition enter-active-class="transition duration-150 ease-out"
                    enter-from-class="scale-[0.98] opacity-0" leave-active-class="transition duration-100 ease-in"
                    leave-to-class="scale-[0.98] opacity-0">
                    <div v-if="detailsNode" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <!-- Flat, dark backdrop -->
                        <div class="absolute inset-0 bg-[#050608]/80" @pointerdown="closeDetails"></div>

                        <!-- Modal Container: Matches #111319 node surface & 1px hairline border -->
                        <div class="relative flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111319] shadow-2xl"
                            @pointerdown.stop>
                            <!-- Top Utility Bar (Breadcrumb + Metadata + Close) -->
                            <div class="flex items-center justify-between border-b border-white/[0.06] px-6 py-3.5">
                                <div class="flex min-w-0 items-center gap-2 text-[11px]">
                                    <!-- Node Type Indicator (Matches canvas node subtitle) -->
                                    <span class="flex items-center gap-1.5 font-medium text-white/70">
                                        <span class="h-2 w-2 rounded-full"
                                            :style="{ backgroundColor: typeColor(detailsNode.type) }"></span>
                                        {{ detailsNode.type }}
                                    </span>

                                    <span class="text-white/20">·</span>

                                    <span class="text-white/40">
                                        {{ detailsConnectionCount }} {{ detailsConnectionCount === 1 ? 'link' : 'links'
                                        }}
                                    </span>

                                    <!-- Parent Topic Breadcrumb (Mirrors sidebar hierarchy) -->
                                    <template v-if="detailsMainTopic">
                                        <span class="text-white/20">/</span>
                                        <button @click="openDetails(detailsMainTopic.node)"
                                            class="flex min-w-0 items-center gap-1 truncate text-white/45 transition-colors hover:text-white"
                                            title="Go to parent topic">
                                            <span class="text-white/25">↳</span>
                                            <span class="truncate">{{ detailsMainTopic.node.title }}</span>
                                        </button>
                                    </template>
                                </div>

                                <button @click="closeDetails" title="Close (Esc)"
                                    class="ml-3 shrink-0 rounded-lg p-1.5 text-white/35 transition-colors hover:bg-white/[0.05] hover:text-white">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                            d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <!-- Main Content Area -->
                            <div class="flex-1 overflow-y-auto px-6 py-6">
                                <!-- EDIT MODE -->
                                <div v-if="isEditingDetails" class="space-y-5">
                                    <div>
                                        <label :class="fieldLabelClass">Node Title</label>
                                        <input ref="editTitleRef" v-model="editDraft.title" :class="fieldClass"
                                            placeholder="e.g., Cell membrane" @keydown.enter.prevent="saveEdit" />
                                    </div>

                                    <div>
                                        <label :class="fieldLabelClass">Type</label>
                                        <div class="grid grid-cols-4 gap-2">
                                            <button v-for="type in nodeTypes" :key="type" @click="editDraft.type = type"
                                                class="flex items-center justify-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] font-medium transition-colors"
                                                :class="editDraft.type === type
                                                    ? 'border-white/25 bg-white/[0.06] text-white'
                                                    : 'border-white/[0.06] bg-[#0B0C10] text-white/40 hover:border-white/[0.12] hover:text-white/70'">
                                                <span class="h-1.5 w-1.5 rounded-full"
                                                    :style="{ backgroundColor: typeColor(type) }"></span>
                                                {{ type }}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label :class="fieldLabelClass">Notes & Description</label>
                                        <textarea v-model="editDraft.description" rows="6"
                                            :class="[fieldClass, 'resize-none leading-relaxed']"
                                            placeholder="Write notes, definitions, or context for this node..."></textarea>
                                    </div>
                                </div>

                                <!-- VIEW MODE -->
                                <div v-else class="space-y-6">
                                    <!-- Title & Hierarchy Status -->
                                    <div>
                                        <h2 class="break-words text-[22px] font-semibold tracking-[-0.02em] text-white">
                                            {{ detailsNode.title }}
                                        </h2>
                                        <p v-if="!detailsMainTopic" class="mt-1 text-[11px] text-white/35">
                                            Top-level topic
                                        </p>
                                    </div>

                                    <!-- Description Block -->
                                    <div>
                                        <p v-if="detailsNode.description"
                                            class="whitespace-pre-line text-[13.5px] leading-[1.65] text-white/70">
                                            {{ detailsNode.description }}
                                        </p>
                                        <div v-else @click="beginEdit"
                                            class="cursor-pointer rounded-xl border border-dashed border-white/[0.08] bg-[#0B0C10]/60 px-4 py-3 text-[12px] text-white/30 transition-colors hover:border-white/[0.16] hover:text-white/50">
                                            No notes added yet. Click to add a description…
                                        </div>
                                    </div>

                                    <!-- Connected Nodes (Styled like mini canvas nodes) -->
                                    <div class="border-t border-white/[0.06] pt-5">
                                        <div class="mb-3 flex items-center justify-between">
                                            <span
                                                class="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                                                Connected Nodes
                                            </span>
                                            <span class="font-mono text-[10px] text-white/30">
                                                {{ detailsAttachments.length }}
                                            </span>
                                        </div>

                                        <div v-if="detailsAttachments.length"
                                            class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            <button v-for="item in detailsAttachments" :key="item.edgeId"
                                                @click="openDetails(item.node)"
                                                class="group flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#0B0C10] px-3.5 py-2.5 text-left transition-colors hover:border-white/[0.18] hover:bg-[#151821]">
                                                <div class="min-w-0 pr-2">
                                                    <div class="flex items-center gap-2">
                                                        <span class="h-1.5 w-1.5 shrink-0 rounded-full"
                                                            :style="{ backgroundColor: typeColor(item.node.type) }"></span>
                                                        <span
                                                            class="truncate text-[12.5px] font-medium text-white/85 group-hover:text-white">
                                                            {{ item.node.title }}
                                                        </span>
                                                    </div>
                                                    <span class="mt-0.5 block pl-3.5 text-[10px] text-white/35">
                                                        {{ item.relation === 'Related' ? 'Related' : item.relation ===
                                                            'Subtopic' ?
                                                            'Subtopic' : 'Main topic' }}
                                                    </span>
                                                </div>

                                                <span
                                                    class="shrink-0 text-[11px] text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60">
                                                    →
                                                </span>
                                            </button>
                                        </div>

                                        <p v-else class="text-[12px] text-white/30">
                                            No links yet. Press <span class="text-white/50">C</span> with this node
                                            selected, then click another — or shift-click two nodes and press
                                            <span class="text-white/50">C</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Minimal Footer -->
                            <div
                                class="flex items-center justify-between border-t border-white/[0.06] bg-[#0D0F14] px-6 py-3.5">
                                <span class="text-[11px] text-white/25">
                                    {{ isEditingDetails ? 'Editing node properties' : 'Right-click node on canvas for actions' }}
                                </span>

                                <div class="flex items-center gap-2">
                                    <template v-if="isEditingDetails">
                                        <button @click="cancelEdit"
                                            class="rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11.5px] font-medium text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white">
                                            Cancel
                                        </button>
                                        <button @click="saveEdit"
                                            class="rounded-lg bg-[#4B6BFF] px-3.5 py-1.5 text-[11.5px] font-medium text-white transition-colors hover:bg-[#5B78FF]">
                                            Save
                                        </button>
                                    </template>
                                    <template v-else>
                                        <button @click="beginEdit"
                                            class="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 text-[11.5px] font-medium text-white/70 transition-colors hover:border-white/[0.16] hover:bg-white/[0.05] hover:text-white">
                                            Edit
                                        </button>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </transition>
            </Teleport>

            <!-- Relationship chooser -->
            <Teleport to="body">
                <transition enter-active-class="transition duration-150 ease-out"
                    enter-from-class="scale-[0.98] opacity-0" leave-active-class="transition duration-100 ease-in"
                    leave-to-class="scale-[0.98] opacity-0">
                    <div v-if="pendingNodes" class="fixed inset-0 z-[75] flex items-center justify-center p-4">
                        <!-- Flat dark backdrop -->
                        <div class="absolute inset-0 bg-[#050608]/80" @pointerdown="cancelPendingConnection"></div>

                        <!-- Modal Box: Matches #111319 surface & hairline border -->
                        <div class="relative w-full max-w-[460px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111319] p-6 shadow-2xl shadow-black/50"
                            @pointerdown.stop>
                            <div class="relative">
                                <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                                    Connect nodes
                                </p>
                                <h3 class="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-white">
                                    How are these related?
                                </h3>

                                <!-- Node Source/Target Comparison Box -->
                                <div
                                    class="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0B0C10] p-3">
                                    <div class="min-w-0 flex-1">
                                        <p class="text-[9px] uppercase tracking-[0.12em] text-white/30">First</p>
                                        <p class="mt-0.5 truncate text-[12.5px] font-medium text-white/80">
                                            {{ pendingNodes.from.title }}
                                        </p>
                                    </div>

                                    <span
                                        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/50">
                                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                                d="M13.828 10.172a4 4 0 00-5.656 0l-2.343 2.343a4 4 0 105.657 5.657l1.414-1.415m-1.415-8.485l1.415-1.414a4 4 0 115.657 5.657l-2.343 2.343a4 4 0 01-5.657 0" />
                                        </svg>
                                    </span>

                                    <div class="min-w-0 flex-1 text-right">
                                        <p class="text-[9px] uppercase tracking-[0.12em] text-white/30">Second</p>
                                        <p class="mt-0.5 truncate text-[12.5px] font-medium text-white/80">
                                            {{ pendingNodes.to.title }}
                                        </p>
                                    </div>
                                </div>

                                <!-- Relationship Option Buttons (Using your defined classes) -->
                                <div class="mt-4 space-y-2">
                                    <button @click="completeConnection('related')" :class="relationOptionClass">
                                        <span :class="relationIconClass">↔</span>
                                        <span class="min-w-0 flex-1">
                                            <span class="block text-[12.5px] font-medium text-white/85">Related
                                                attachments</span>
                                            <span class="mt-0.5 block text-[11px] leading-relaxed text-white/35">
                                                Link both ways without creating a strict hierarchy.
                                            </span>
                                        </span>
                                    </button>

                                    <button @click="completeConnection('from-subtopic')" :class="relationOptionClass">
                                        <span :class="relationIconClass">⊂</span>
                                        <span class="min-w-0 flex-1">
                                            <span class="block text-[12.5px] font-medium text-white/85">
                                                “{{ truncate(pendingNodes.from.title, 22) }}” is a subtopic of “{{
                                                    truncate(pendingNodes.to.title, 22) }}”
                                            </span>
                                            <span class="mt-0.5 block text-[11px] leading-relaxed text-white/35">
                                                Sets “{{ truncate(pendingNodes.to.title, 24) }}” as its main topic.
                                            </span>
                                        </span>
                                    </button>

                                    <button @click="completeConnection('to-subtopic')" :class="relationOptionClass">
                                        <span :class="relationIconClass">⊃</span>
                                        <span class="min-w-0 flex-1">
                                            <span class="block text-[12.5px] font-medium text-white/85">
                                                “{{ truncate(pendingNodes.to.title, 22) }}” is a subtopic of “{{
                                                    truncate(pendingNodes.from.title, 22) }}”
                                            </span>
                                            <span class="mt-0.5 block text-[11px] leading-relaxed text-white/35">
                                                Sets “{{ truncate(pendingNodes.from.title, 24) }}” as its main topic.
                                            </span>
                                        </span>
                                    </button>
                                </div>

                                <!-- Footer Action -->
                                <div class="mt-5 flex justify-end">
                                    <button @click="cancelPendingConnection"
                                        class="rounded-lg border border-white/[0.08] px-3.5 py-1.5 text-[11.5px] font-medium text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </transition>
            </Teleport>

            <!-- Toast -->
            <Teleport to="body">
                <transition enter-active-class="transition duration-150 ease-out"
                    enter-from-class="translate-y-1.5 opacity-0" leave-active-class="transition duration-100 ease-in"
                    leave-to-class="translate-y-1.5 opacity-0">
                    <div v-if="toast"
                        class="fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111319] px-4 py-2.5 text-[11.5px] font-medium text-white/85 shadow-xl shadow-black/50">
                        <svg class="h-3.5 w-3.5 text-[#4B6BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {{ toast }}
                    </div>
                </transition>
            </Teleport>
            <!-- Node right-click menu -->

            <Teleport to="body">
                <transition enter-active-class="transition duration-100 ease-out"
                    enter-from-class="scale-[0.98] opacity-0" leave-active-class="transition duration-75 ease-in"
                    leave-to-class="scale-[0.98] opacity-0">
                    <div v-if="contextMenu.open && contextNode" class="fixed inset-0 z-[80]" @pointerdown="closeMenus"
                        @contextmenu.prevent>
                        <!-- Menu Container: Matches #111319 surface & hairline border -->
                        <div class="fixed w-[260px] max-h-[calc(100vh-24px)] overflow-y-auto rounded-xl border border-white/[0.08] bg-[#111319] p-1.5 shadow-2xl shadow-black/60"
                            :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }" @pointerdown.stop>
                            <!-- Node Identity Header -->
                            <div class="flex items-center gap-2.5 px-2.5 py-2.5">
                                <span class="h-2 w-2 shrink-0 rounded-full"
                                    :style="{ backgroundColor: typeColor(contextNode.type) }"></span>

                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-[12px] font-medium text-white/90">
                                        {{ contextNode.title }}
                                    </p>
                                    <p class="text-[10px] text-white/40">
                                        {{ contextNode.type }}
                                        <span class="mx-1 text-white/20">·</span>
                                        {{ contextConnections.length }} {{ contextConnections.length === 1 ? 'link' :
                                            'links' }}
                                    </p>
                                </div>

                                <span
                                    class="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-white/30">ESC</span>
                            </div>

                            <div class="my-1 h-px bg-white/[0.06]"></div>

                            <!-- Primary Actions -->
                            <div class="space-y-0.5">
                                <button :class="[menuItemClass, menuItemIdleClass]" @click="openDetails(contextNode)">
                                    <svg :class="menuIconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Open details
                                </button>

                                <button :class="[menuItemClass, menuItemIdleClass]"
                                    @click="startConnect(contextNode.id)">
                                    <svg :class="menuIconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                            d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.72 1.72 M14 11a5 5 0 00-7.07 0l-3 3A5 5 0 0011 21.07l1.72-1.72" />
                                    </svg>
                                    Connect to another node
                                </button>

                                <button :class="[menuItemClass, menuItemIdleClass]" @click="duplicateNode(contextNode)">
                                    <svg :class="menuIconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <rect x="8" y="8" width="13" height="13" rx="2" stroke-width="1.75" />
                                        <path stroke-linecap="round" stroke-width="1.75"
                                            d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3" />
                                    </svg>
                                    Duplicate
                                </button>
                            </div>

                            <div class="my-1.5 h-px bg-white/[0.06]"></div>

                            <!-- Node Type Selector -->
                            <div class="px-2 py-1.5">
                                <p class="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                                    Node Type
                                </p>

                                <div class="grid grid-cols-2 gap-1.5">
                                    <button v-for="type in nodeTypes" :key="type"
                                        @click="setNodeType(contextNode, type)"
                                        class="flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors"
                                        :class="contextNode.type === type
                                            ? 'border-white/25 bg-white/[0.08] text-white'
                                            : 'border-white/[0.06] bg-[#0B0C10] text-white/40 hover:border-white/[0.12] hover:text-white/70'">
                                        <span class="h-1.5 w-1.5 rounded-full"
                                            :style="{ backgroundColor: typeColor(type) }"></span>
                                        {{ type }}
                                    </button>
                                </div>
                            </div>

                            <!-- Relationships & Connections -->
                            <template v-if="getMainTopic(contextNode.id) || contextConnections.length">
                                <div class="my-1.5 h-px bg-white/[0.06]"></div>

                                <template v-if="getMainTopic(contextNode.id)">
                                    <button :class="[menuItemClass, menuItemIdleClass]"
                                        @click="detachMainTopic(contextNode.id)">
                                        <svg :class="menuIconClass" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                                d="M5 12h14m-6-6l6 6-6 6" />
                                        </svg>
                                        Detach from main topic
                                    </button>
                                </template>

                                <template v-if="contextConnections.length">
                                    <div class="px-2.5 pt-2 pb-1">
                                        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                                            Connections
                                            <span class="ml-1 text-white/25">{{ contextConnections.length }}</span>
                                        </p>
                                    </div>

                                    <div class="max-h-32 overflow-y-auto space-y-0.5">
                                        <button v-for="item in contextConnections" :key="item.edgeId"
                                            @click="removeConnection(item.edgeId)"
                                            class="group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[11px] text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white">
                                            <span
                                                class="h-1.5 w-1.5 shrink-0 rounded-full bg-white/30 group-hover:bg-red-400"></span>
                                            <span class="min-w-0 flex-1 truncate">
                                                {{ item.node.title }}
                                            </span>
                                            <span class="text-[9px] text-white/25 group-hover:text-red-400">
                                                Remove
                                            </span>
                                        </button>
                                    </div>
                                </template>
                            </template>

                            <div class="my-1.5 h-px bg-white/[0.06]"></div>

                            <!-- Destructive Action -->
                            <button
                                :class="[menuItemClass, '!text-red-400/80 hover:!bg-red-500/[0.1] hover:!text-red-400']"
                                @click="deleteFromContext">
                                <svg class="h-3.5 w-3.5 shrink-0 text-red-400/60 transition-colors group-hover:text-red-400"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                        d="M4 7h16 M10 11v6m4-6v6 M5 7l1 13h12l1-13 M9 7V4h6v3" />
                                </svg>
                                Delete node
                            </button>
                        </div>
                    </div>
                </transition>
            </Teleport>

            <!-- Canvas right-click menu -->
            <Teleport to="body">
                <transition enter-active-class="transition duration-100 ease-out"
                    enter-from-class="scale-[0.98] opacity-0" leave-active-class="transition duration-75 ease-in"
                    leave-to-class="scale-[0.98] opacity-0">
                    <div v-if="canvasMenu.open" class="fixed inset-0 z-[80]" @pointerdown="closeMenus"
                        @contextmenu.prevent>
                        <div class="fixed max-h-[calc(100vh-24px)] w-[220px] overflow-y-auto rounded-2xl border border-white/[0.09] bg-[#171B24] p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
                            :style="{ left: `${canvasMenu.x}px`, top: `${canvasMenu.y}px` }" @pointerdown.stop>
                            <button :class="[menuItemClass, menuItemIdleClass]"
                                @click="addNodeAt(canvasMenu.x, canvasMenu.y)">
                                <svg :class="menuIconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 5v14m-7-7h14" />
                                </svg>
                                Add node here
                            </button>

                            <button :class="[menuItemClass, menuItemIdleClass]" @click="autoArrange">
                                <svg :class="menuIconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                Auto arrange
                            </button>

                            <button :class="[menuItemClass, menuItemIdleClass]" @click="fitView(); closeMenus()">
                                <svg :class="menuIconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                Fit to view
                            </button>
                        </div>
                    </div>
                </transition>
            </Teleport>
        </section>
    </ClientOnly>
</template>
