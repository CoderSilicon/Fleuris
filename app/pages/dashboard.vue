<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'

useHead({ title: 'Graph — Fleurıs' })

const NODE_W = 192
const NODE_H = 66

const TYPE_META = {
    Concept: { color: '#8CA4FF', soft: 'rgba(140, 164, 255, 0.12)' },
    Resource: { color: '#F5A623', soft: 'rgba(245, 166, 35, 0.12)' },
    Question: { color: '#C084FC', soft: 'rgba(192, 132, 252, 0.12)' },
    Task: { color: '#34D399', soft: 'rgba(52, 211, 153, 0.12)' }
}

const nodeTypes = Object.keys(TYPE_META)
let nodeSeq = 100
let edgeSeq = 100

// Reusable Tailwind class strings

const toolClass = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-[7px] text-[11px] font-medium transition-colors'

const toolIdleClass = 'text-white/45 hover:bg-white/[0.05] hover:text-white'

const toolActiveClass = 'bg-[#3155D9]/20 text-[#8CA4FF]'

const controlClass = 'inline-flex items-center justify-center rounded-md p-1.5 text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white'

const menuItemClass = 'group flex w-full items-center gap-2.5 rounded-md px-2.5 py-[8px] text-left text-[11.5px] transition-colors'

const menuItemIdleClass = 'text-white/55 hover:bg-white/[0.055] hover:text-white'

const menuIconClass = 'h-3.5 w-3.5 shrink-0 text-white/30 transition-colors group-hover:text-[#8CA4FF]'

const sectionLabelClass = 'text-[9px] font-semibold uppercase tracking-[0.14em] text-white/25'

const fieldLabelClass = 'mb-1.5 block text-[9px] font-medium uppercase tracking-[0.12em] text-white/30'

const fieldClass = 'w-full rounded-md bg-white/[0.045] px-3 py-2.5 text-[12.5px] text-white outline-none transition-colors placeholder:text-white/20 focus:bg-[#3155D9]/[0.10] focus:ring-1 focus:ring-[#3155D9]/50'

const relationOptionClass = 'flex w-full items-start gap-3 rounded-lg bg-white/[0.025] px-3 py-2.5 text-left transition-colors hover:bg-[#3155D9]/[0.12]'

const relationIconClass = 'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-[#3155D9]/15 text-[15px] leading-none text-[#8CA4FF]'


// --- Graph data ---------------------------------------------------------
const nodes = ref([
    {
        id: 1,
        title: 'Biology',
        description: 'The study of life: from single cells to whole ecosystems. This map gathers the branches, questions, and resources that belong to the topic.',
        type: 'Concept',
        x: 0,
        y: 0
    },
    {
        id: 2,
        title: 'Cell biology',
        description: 'The basic unit of life and the machinery inside it. Covers membranes, organelles, and the processes that keep a cell alive.',
        type: 'Concept',
        x: -300,
        y: 170
    },
    {
        id: 3,
        title: 'Genetics',
        description: 'Heredity, genes, and variation. How information is stored, copied, and passed between generations.',
        type: 'Concept',
        x: 0,
        y: 170
    },
    {
        id: 4,
        title: 'Anatomy',
        description: 'Structure and organisation of organisms, from tissues to organ systems.',
        type: 'Concept',
        x: 300,
        y: 170
    },
    {
        id: 5,
        title: 'Evolution',
        description: 'Change in populations over time through selection, drift, and mutation. Connects to genetics and the broader story of life.',
        type: 'Concept',
        x: 250,
        y: 345
    },
    {
        id: 6,
        title: 'Cell membrane',
        description: 'A selective barrier around the cell that controls what enters and leaves. Kept as a resource under cell biology.',
        type: 'Resource',
        x: -420,
        y: 340
    },
    {
        id: 7,
        title: 'Mitochondria',
        description: 'Organelles that convert energy into ATP. Often called the powerhouse of the cell.',
        type: 'Concept',
        x: -210,
        y: 340
    },
    {
        id: 8,
        title: 'DNA',
        description: 'The double-helix molecule that carries genetic instructions. A subtopic of genetics and the starting point for most questions about heredity.',
        type: 'Resource',
        x: 0,
        y: 340
    }
])

const connections = ref([
    { id: 1, from: 1, to: 2, kind: 'topic' },
    { id: 2, from: 1, to: 3, kind: 'topic' },
    { id: 3, from: 1, to: 4, kind: 'topic' },
    { id: 4, from: 2, to: 6, kind: 'topic' },
    { id: 5, from: 2, to: 7, kind: 'topic' },
    { id: 6, from: 3, to: 8, kind: 'topic' },
    { id: 7, from: 1, to: 5, kind: 'related' },
    { id: 8, from: 3, to: 5, kind: 'related' }
])

// --- UI state -----------------------------------------------------------
const selectedNodeId = ref(null)
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

const contextMenu = reactive({ open: false, nodeId: null, x: 0, y: 0 })
const canvasMenu = reactive({ open: false, x: 0, y: 0 })

const toast = ref('')
let toastTimer = null

// --- Lookups ------------------------------------------------------------
function getNodeById(id) {
    return nodes.value.find(n => n.id === id) || null
}

function typeColor(type) {
    return TYPE_META[type]?.color || TYPE_META.Concept.color
}

function truncate(text, max = 20) {
    if (!text) return ''
    return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function degree(nodeId) {
    return connections.value.filter(c => c.from === nodeId || c.to === nodeId).length
}

function isTopLevelTopic(node) {
    const hasParent = connections.value.some(c => c.kind === 'topic' && c.to === node.id)
    const hasChildren = connections.value.some(c => c.kind === 'topic' && c.from === node.id)
    return !hasParent && hasChildren
}

function getMainTopic(nodeId) {
    const edge = connections.value.find(c => c.kind === 'topic' && c.to === nodeId)
    if (!edge) return null
    const node = getNodeById(edge.from)
    return node ? { edge, node } : null
}

function getAttachments(nodeId) {
    const mainEdge = connections.value.find(c => c.kind === 'topic' && c.to === nodeId)
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
function nodeWidth() {
    return NODE_W
}

function nodeHeight() {
    return NODE_H
}

function boundaryPoint(from, to) {
    const dx = to.x - from.x
    const dy = to.y - from.y
    if (dx === 0 && dy === 0) return { x: from.x, y: from.y }
    const scale = Math.min(
        (NODE_W / 2) / Math.max(Math.abs(dx), 0.0001),
        (NODE_H / 2) / Math.max(Math.abs(dy), 0.0001)
    )
    return { x: from.x + dx * scale, y: from.y + dy * scale }
}

function getEdgePath(edge) {
    const from = getNodeById(edge.from)
    const to = getNodeById(edge.to)
    if (!from || !to) return ''

    const start = boundaryPoint(from, to)
    const end = boundaryPoint(to, from)
    const dx = end.x - start.x
    const dy = end.y - start.y

    let c1x, c1y, c2x, c2y
    if (Math.abs(dx) > Math.abs(dy)) {
        c1x = start.x + dx * 0.5
        c1y = start.y
        c2x = end.x - dx * 0.5
        c2y = end.y
    } else {
        c1x = start.x
        c1y = start.y + dy * 0.5
        c2x = end.x
        c2y = end.y - dy * 0.5
    }

    return `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`
}

function edgeActive(edge) {
    return focusNodeId.value != null && (edge.from === focusNodeId.value || edge.to === focusNodeId.value)
}

function edgeStroke(edge) {
    if (edgeActive(edge)) return '#6D86FF'
    return edge.kind === 'topic' ? '#3D4760' : '#333B4D'
}

function edgeWidth(edge) {
    if (edgeActive(edge)) return 2.4
    return edge.kind === 'topic' ? 2 : 1.6
}

function edgeOpacity(edge) {
    if (edgeActive(edge)) return 1
    return focusNodeId.value != null ? 0.42 : 0.82
}

function isNodeEmphasized(node) {
    return selectedNodeId.value === node.id
        || detailsNodeId.value === node.id
        || connecting.sourceId === node.id
        || (contextMenu.open && contextMenu.nodeId === node.id)
}

function nodeFill(node) {
    if (isNodeEmphasized(node)) return '#1E2639'
    if (isTopLevelTopic(node)) return '#191F2D'
    return '#161A23'
}

function nodeStroke(node) {
    if (isNodeEmphasized(node)) return '#7D93FF'
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

function startNodeDrag(node, event) {
    if (event.button !== 0) return
    event.stopPropagation()
    closeMenus()

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
    selectedNodeId.value = node.id
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
        id: nodeSeq++,
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

function deleteNode(nodeId) {
    const node = getNodeById(nodeId)
    if (!node) return

    nodes.value = nodes.value.filter(n => n.id !== nodeId)
    connections.value = connections.value.filter(c => c.from !== nodeId && c.to !== nodeId)

    if (selectedNodeId.value === nodeId) selectedNodeId.value = null
    if (detailsNodeId.value === nodeId) closeDetails()
    if (contextMenu.nodeId === nodeId) closeMenus()
    if (connecting.sourceId === nodeId) connecting.sourceId = null
    if (pendingConnection.value && (pendingConnection.value.fromId === nodeId || pendingConnection.value.toId === nodeId)) {
        pendingConnection.value = null
        cancelConnect()
    }

    showToast(`Deleted “${truncate(node.title, 22)}”`)
}

function duplicateNode(node) {
    if (!node) return
    const copy = {
        ...node,
        id: nodeSeq++,
        title: `${node.title} copy`,
        x: node.x + 48,
        y: node.y + 48
    }
    nodes.value.push(copy)

    const parent = getMainTopic(node.id)
    if (parent) {
        connections.value.push({
            id: edgeSeq++,
            from: parent.node.id,
            to: copy.id,
            kind: 'topic'
        })
    }

    selectedNodeId.value = copy.id
    closeMenus()
    showToast('Node duplicated')
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
}

function cancelConnect() {
    connecting.active = false
    connecting.sourceId = null
    pendingConnection.value = null
}

function toggleConnect() {
    if (connecting.active) cancelConnect()
    else startConnect()
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
        return
    }

    openDetails(node)
}

function setSubtopic(childId, parentId) {
    const child = getNodeById(childId)
    const parent = getNodeById(parentId)
    if (!child || !parent || childId === parentId) return

    const existing = pairConnection(childId, parentId)
    let keepId = existing?.id

    if (existing) {
        existing.from = parentId
        existing.to = childId
        existing.kind = 'topic'
    } else {
        keepId = edgeSeq++
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
            connections.value.push({ id: edgeSeq++, from: from.id, to: to.id, kind: 'related' })
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

    selectedNodeId.value = node.id
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
}

function deleteFromContext() {
    const nodeId = contextMenu.nodeId
    closeMenus()
    if (nodeId != null) deleteNode(nodeId)
}

// --- Layout -------------------------------------------------------------
function autoArrange() {
    if (!nodes.value.length) return

    const children = new Map()
    nodes.value.forEach(n => children.set(n.id, []))

    const incoming = new Set()
    connections.value
        .filter(c => c.kind === 'topic')
        .forEach(c => {
            if (children.has(c.from)) children.get(c.from).push(c.to)
            incoming.add(c.to)
        })

    const roots = nodes.value.filter(n => !incoming.has(n.id)).map(n => n.id)
    const levels = []
    const visited = new Set()
    let queue = roots.length ? roots : nodes.value.map(n => n.id)
    let depth = 0

    while (queue.length && depth < 50) {
        const level = []
        const next = []

        for (const id of queue) {
            if (visited.has(id)) continue
            visited.add(id)
            level.push(id)
            for (const childId of children.get(id) || []) {
                if (!visited.has(childId)) next.push(childId)
            }
        }

        if (level.length) levels.push(level)
        queue = next
        depth++
    }

    const leftovers = nodes.value.map(n => n.id).filter(id => !visited.has(id))
    if (leftovers.length) levels.push(leftovers)

    const columnWidth = 235
    const rowHeight = 165

    levels.forEach((ids, levelIndex) => {
        ids.forEach((id, index) => {
            const node = getNodeById(id)
            if (!node) return
            node.x = (index - (ids.length - 1) / 2) * columnWidth
            node.y = levelIndex * rowHeight
        })
    })

    nextTick(fitView)
    closeMenus()
    showToast('Layout arranged')
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

function onKeyDown(event) {
    if (event.key === 'Escape') {
        if (contextMenu.open || canvasMenu.open) {
            closeMenus()
        } else if (pendingConnection.value) {
            cancelPendingConnection()
        } else if (connecting.active) {
            cancelConnect()
        } else if (detailsNodeId.value != null) {
            if (isEditingDetails.value) cancelEdit()
            else closeDetails()
        } else if (selectedNodeId.value != null) {
            selectedNodeId.value = null
        }
        return
    }

    if (isTypingTarget(event.target)) return

    if ((event.key === 'Delete' || event.key === 'Backspace') && detailsNodeId.value == null && !contextMenu.open && !canvasMenu.open && selectedNodeId.value != null) {
        event.preventDefault()
        deleteNode(selectedNodeId.value)
    }
}

onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    nextTick(fitView)
})

onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
    stopPan()
    stopNodeDrag(null, false)
    clearTimeout(toastTimer)
})
</script>

<template>
    <section
        class="flex h-screen w-screen select-none flex-col overflow-hidden bg-[#0E1117] geist-400 text-[#F5F4EF]">
        <!-- Top navigation -->
        <header class="relative z-30 h-16 shrink-0 border-b border-white/[0.07] bg-[#11141B]/90 backdrop-blur-xl">
            <div class="flex h-full items-center gap-3 px-4 md:px-5">
                <NuxtLink to="/"
                    class="text-[19px] font-semibold tracking-tight text-white transition-opacity hover:opacity-80">
                    fleur<span class="text-[#6D86FF]">ıs.</span>
                </NuxtLink>


                <div class="ml-auto flex min-w-0 items-center gap-2">
                    <div class="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.025] p-1">
                        <button @click="addNodeAtCenter" :class="[toolClass, toolIdleClass]"
                            title="Add a node at the centre of the canvas">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 5v14m-7-7h14" />
                            </svg>
                            <span class="hidden sm:inline">Add node</span>
                        </button>

                        <button @click="toggleConnect"
                            :class="[toolClass, connecting.active ? toolActiveClass : toolIdleClass]"
                            :title="connecting.active ? 'Cancel connecting' : 'Connect two nodes'">
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
                    </div>

                    <transition enter-active-class="transition duration-150 ease-out"
                        enter-from-class="translate-y-1 opacity-0" leave-active-class="transition duration-100 ease-in"
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

        <div class="flex min-h-0 flex-1">
            <!-- Workspace sidebar -->
            <aside class="hidden w-[268px] shrink-0 flex-col border-r border-white/[0.07] bg-[#11141B]/75 lg:flex">
                <div class="border-b border-white/[0.07] p-4">
                    <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <p class="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">Workspace</p>
                            <h1 class="mt-1 truncate text-[13px] font-semibold text-white/85">Biology map</h1>
                        </div>
                        <button @click="addNodeAtCenter" title="Add node"
                            class="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-white/45 transition-colors hover:border-[#3155D9]/50 hover:text-white">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 5v14m-7-7h14" />
                            </svg>
                        </button>
                    </div>

                    <div class="relative mt-4">
                        <svg class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                        </svg>
                        <input v-model="searchQuery" type="search" placeholder="Find a node…"
                            class="w-full rounded-lg border border-white/[0.08] bg-[#0E1117] py-2 pl-9 pr-3 text-[12px] text-white/80 outline-none transition-colors placeholder:text-white/25 focus:border-[#3155D9]" />
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-2.5" @wheel.stop>
                    <div class="flex items-center justify-between px-2 pb-1.5 pt-1">
                        <p class="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25">Nodes</p>
                        <span class="text-[10px] text-white/25">{{ filteredNodes.length }}</span>
                    </div>

                    <button v-for="node in filteredNodes" :key="node.id" @click="openDetails(node)"
                        class="group flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors"
                        :class="selectedNodeId === node.id ? 'bg-white/[0.07]' : 'hover:bg-white/[0.035]'">
                        <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            :style="{ background: typeColor(node.type), boxShadow: `0 0 0 3px ${TYPE_META[node.type]?.soft || 'transparent'}` }"></span>
                        <span class="min-w-0 flex-1">
                            <span
                                class="block truncate text-[12.5px] text-white/75 transition-colors group-hover:text-white">
                                {{ node.title }}
                            </span>
                            <span class="mt-0.5 block truncate text-[10px] text-white/30">
                                <template v-if="getMainTopic(node.id)">↳ {{ getMainTopic(node.id).node.title
                                }}</template>
                                <template v-else>Top-level topic</template>
                            </span>
                        </span>
                        <span class="mt-0.5 shrink-0 text-[9px] tabular-nums text-white/20">{{ degree(node.id) }}</span>
                    </button>

                    <p v-if="!filteredNodes.length" class="px-3 py-10 text-center text-[11px] text-white/30">
                        No nodes match.
                    </p>
                </div>
            </aside>

            <!-- Canvas -->
            <main ref="canvasRef" class="relative min-w-0 flex-1 touch-none overflow-hidden"
                :class="isPanning ? 'cursor-grabbing' : 'cursor-grab'" @pointerdown="onCanvasPointerDown"
                @wheel.prevent="handleWheel" @contextmenu.prevent="openCanvasMenu">
                <div class="pointer-events-none absolute inset-0"></div>

                <svg class="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                    <defs>
                        <marker id="graph-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6"
                            markerHeight="6" orient="auto-start-reverse">
                            <path d="M0,0 L10,5 L0,10 z" fill="#3D4760" />
                        </marker>
                        <marker id="graph-arrow-active" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6"
                            markerHeight="6" orient="auto-start-reverse">
                            <path d="M0,0 L10,5 L0,10 z" fill="#6D86FF" />
                        </marker>
                    </defs>

                    <g :transform="`translate(${transform.x} ${transform.y}) scale(${transform.zoom})`">
                        <!-- Connections -->
                        <g fill="none">
                            <path v-for="edge in connections" :key="edge.id" :d="getEdgePath(edge)"
                                :stroke="edgeStroke(edge)" :stroke-width="edgeWidth(edge)"
                                :stroke-opacity="edgeOpacity(edge)"
                                :stroke-dasharray="edge.kind === 'related' ? '5 7' : null"
                                :marker-end="edge.kind === 'topic' ? `url(#${edgeActive(edge) ? 'graph-arrow-active' : 'graph-arrow'})` : null"
                                class="transition-all duration-150" />
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
                                :stroke="connecting.sourceId === node.id ? '#F5A623' : '#4D65D8'" stroke-width="1.5"
                                class="opacity-75" />

                            <rect
                                :class="isNodeEmphasized(node) ? 'transition-colors' : 'transition-colors group-hover:stroke-[#4A5570]'"
                                :x="-NODE_W / 2" :y="-NODE_H / 2" :width="NODE_W" :height="NODE_H" rx="13"
                                :fill="nodeFill(node)" :stroke="nodeStroke(node)" stroke-width="1.5" />

                            <!-- Main-topic accent -->
                            <rect v-if="isTopLevelTopic(node)" :x="-NODE_W / 2 + 15" :y="-NODE_H / 2 - 1.25" width="30"
                                height="2.5" rx="1.25" fill="#5B7CFA" />

                            <!-- Type dot -->
                            <circle :cx="-NODE_W / 2 + 19" :cy="-3" r="4.5" :fill="typeColor(node.type)" />

                            <text :x="-NODE_W / 2 + 31" y="-1" fill="#F3F4F8" font-size="13.5" font-weight="600"
                                style="letter-spacing: -0.01em" class="pointer-events-none">
                                {{ truncate(node.title, 19) }}
                            </text>

                            <text :x="-NODE_W / 2 + 31" y="16" fill="#788298" font-size="10"
                                class="pointer-events-none">
                                {{ node.type }} · {{ degree(node.id) }} {{ degree(node.id) === 1 ? 'link' : 'links' }}
                            </text>

                            <!-- Link count -->
                            <g v-if="degree(node.id)" :transform="`translate(${NODE_W / 2 - 16} ${-NODE_H / 2 + 15})`">
                                <circle r="9" fill="#0F1219" stroke="#2A3142" stroke-width="1" />
                                <text y="3.4" text-anchor="middle" font-size="9" font-weight="600" fill="#7E879C">
                                    {{ degree(node.id) }}
                                </text>
                            </g>
                        </g>
                    </g>
                </svg>

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
                                Click the <span class="font-semibold text-white">first node</span> to connect.
                            </template>
                            <template v-else>
                                From <span class="font-semibold text-[#A9B8FF]">{{ truncate(connectSourceNode.title, 20)
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
                <div class="absolute bottom-5 left-5 z-20 flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#151922]/90 p-1.5 shadow-2xl shadow-black/20 backdrop-blur-xl"
                    @pointerdown.stop>
                    <button @click="zoomBy(-0.15)" title="Zoom out" :class="controlClass">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                        </svg>
                    </button>

                    <span class="min-w-[48px] text-center text-[10px] font-medium tabular-nums text-white/45">
                        {{ Math.round(transform.zoom * 100) }}%
                    </span>

                    <button @click="zoomBy(0.15)" title="Zoom in" :class="controlClass">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>

                    <div class="mx-1 h-4 w-px bg-white/[0.08]"></div>

                    <button @click="fitView" title="Fit to view" :class="controlClass">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    </button>
                </div>
                <!-- Graph stats -->
                <div
                    class="absolute bottom-5 right-5 z-20 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#151922]/90 px-3.5 py-2 text-[10px] text-white/35 shadow-2xl shadow-black/20 backdrop-blur-xl">
                    <span class="flex items-center gap-1.5">
                        <span class="h-1.5 w-1.5 rounded-full bg-[#6D86FF]"></span>
                        {{ nodes.length }} nodes
                    </span>
                    <span class="h-3 w-px bg-white/[0.08]"></span>
                    <span>{{ connections.length }} links</span>
                </div>

            </main>
        </div>

        <!-- Node details popup -->
        <Teleport to="body">
            <transition enter-active-class="transition duration-200 ease-out" enter-from-class="scale-[0.98] opacity-0"
                leave-active-class="transition duration-150 ease-in" leave-to-class="scale-[0.98] opacity-0">
                <div v-if="detailsNode" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div class="absolute inset-0 bg-black/60 backdrop-blur-[2px]" @pointerdown="closeDetails"></div>

                    <div class="relative flex max-h-[86vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#141821] shadow-2xl shadow-black/60"
                        @pointerdown.stop>
                        <div
                            class="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#3155D9]/15 to-transparent">
                        </div>

                        <!-- Popup header -->
                        <div class="relative border-b border-white/[0.07] px-6 pb-5 pt-6">
                            <div class="flex items-start justify-between gap-4">
                                <div class="min-w-0">
                                    <div class="flex flex-wrap items-center gap-2.5">
                                        <span
                                            class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em]"
                                            :style="{
                                                color: typeColor(detailsNode.type),
                                                borderColor: `${typeColor(detailsNode.type)}40`,
                                                backgroundColor: `${typeColor(detailsNode.type)}14`
                                            }">
                                            <span class="h-1.5 w-1.5 rounded-full"
                                                :style="{ background: typeColor(detailsNode.type) }"></span>
                                            {{ detailsNode.type }}
                                        </span>
                                        <span class="text-[10px] text-white/30">
                                            {{ detailsConnectionCount }} {{ detailsConnectionCount === 1 ? 'connection'
                                                :
                                                'connections' }}
                                        </span>
                                    </div>

                                    <h2
                                        class="mt-3 break-words text-[26px] font-semibold leading-tight tracking-[-0.03em] text-white">
                                        {{ detailsNode.title }}
                                    </h2>
                                </div>

                                <button @click="closeDetails" title="Close"
                                    class="shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Popup body -->
                        <div class="relative flex-1 overflow-y-auto px-6 py-5">
                            <div v-if="isEditingDetails" class="space-y-5">
                                <div>
                                    <label :class="fieldLabelClass">Title</label>
                                    <input v-model="editDraft.title" :class="fieldClass"
                                        placeholder="Give this node a title…" @keydown.enter.prevent="saveEdit" />
                                </div>

                                <div>
                                    <label :class="fieldLabelClass">Type</label>
                                    <div class="grid grid-cols-4 gap-1.5">
                                        <button v-for="type in nodeTypes" :key="type" @click="editDraft.type = type"
                                            class="rounded-lg border px-2 py-2 text-[10px] font-medium transition-colors"
                                            :style="editDraft.type === type
                                                ? { color: typeColor(type), borderColor: `${typeColor(type)}70`, backgroundColor: `${typeColor(type)}18` }
                                                : { color: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.07)' }">
                                            {{ type }}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label :class="fieldLabelClass">Description</label>
                                    <textarea v-model="editDraft.description" rows="6"
                                        :class="[fieldClass, 'resize-none leading-relaxed']"
                                        placeholder="What does this node contain? Add notes, context, or a summary…"></textarea>
                                </div>

                                <p
                                    class="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-[10.5px] leading-relaxed text-white/30">
                                    Main topic and attachments are managed on the canvas. Right-click the node for those
                                    actions.
                                </p>
                            </div>

                            <div v-else class="space-y-6">
                                <section>
                                    <p :class="sectionLabelClass">Main topic</p>

                                    <button v-if="detailsMainTopic" @click="openDetails(detailsMainTopic.node)"
                                        class="mt-2.5 flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-left transition-colors hover:border-[#3155D9]/40 hover:bg-[#3155D9]/10">
                                        <span
                                            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-[#0F1219]"
                                            :style="{ color: typeColor(detailsMainTopic.node.type) }">
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M3 7v10a2 2 0 002 2h5m11-12v10a2 2 0 01-2 2h-5M9 5l3 3-3 3" />
                                            </svg>
                                        </span>
                                        <span class="min-w-0 flex-1">
                                            <span class="block truncate text-[13px] font-medium text-white/80">
                                                {{ detailsMainTopic.node.title }}
                                            </span>
                                            <span class="mt-0.5 block text-[10px] text-white/30">
                                                {{ detailsMainTopic.node.type }} · this node is a subset of it
                                            </span>
                                        </span>
                                        <svg class="h-4 w-4 shrink-0 text-white/20" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    <div v-else
                                        class="mt-2.5 rounded-xl border border-dashed border-white/[0.09] px-4 py-3.5 text-[11px] leading-relaxed text-white/30">
                                        This is a top-level topic. It is not a subset of another node.
                                    </div>
                                </section>

                                <section>
                                    <p :class="sectionLabelClass">Description</p>
                                    <p v-if="detailsNode.description"
                                        class="mt-2.5 whitespace-pre-line text-[13px] leading-relaxed text-white/55">
                                        {{ detailsNode.description }}
                                    </p>
                                    <p v-else class="mt-2.5 text-[12px] italic text-white/25">No description yet.</p>
                                </section>

                                <section>
                                    <div class="flex items-center justify-between">
                                        <p :class="[sectionLabelClass, '!mb-0']">Attachments</p>
                                        <span class="text-[10px] text-white/25">{{ detailsAttachments.length }}
                                            connected</span>
                                    </div>

                                    <div v-if="detailsAttachments.length" class="mt-2.5 space-y-1.5">
                                        <button v-for="item in detailsAttachments" :key="item.edgeId"
                                            @click="openDetails(item.node)"
                                            class="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-left transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]">
                                            <span class="h-1.5 w-1.5 shrink-0 rounded-full"
                                                :style="{ background: typeColor(item.node.type) }"></span>
                                            <span class="min-w-0 flex-1">
                                                <span class="block truncate text-[12.5px] text-white/75">{{
                                                    item.node.title
                                                }}</span>
                                                <span class="mt-0.5 block text-[10px] text-white/30">
                                                    {{ item.relation === 'Related' ? 'Related attachment' :
                                                        item.relation ===
                                                            'Subtopic' ? 'Subtopic of this node' : 'Main topic' }}
                                                </span>
                                            </span>
                                            <svg class="h-3.5 w-3.5 shrink-0 text-white/20" fill="none"
                                                stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div v-else
                                        class="mt-2.5 rounded-xl border border-dashed border-white/[0.09] px-4 py-3.5 text-[11px] text-white/30">
                                        No attachments yet. Use Connect to link this node to another.
                                    </div>
                                </section>
                            </div>
                        </div>

                        <!-- Popup footer -->
                        <div
                            class="relative flex items-center justify-between gap-3 border-t border-white/[0.07] px-6 py-4">
                            <p class="hidden text-[10px] text-white/20 sm:block">Right-click the node for more actions
                            </p>

                            <div class="ml-auto flex items-center gap-2">
                                <template v-if="isEditingDetails">
                                    <button @click="cancelEdit"
                                        class="rounded-lg border border-white/[0.08] px-3.5 py-2 text-[11px] font-medium text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white">
                                        Cancel
                                    </button>
                                    <button @click="saveEdit"
                                        class="rounded-lg bg-[#3155D9] px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#3E63E8]">
                                        Save changes
                                    </button>
                                </template>
                                <template v-else>
                                    <button @click="beginEdit"
                                        class="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3.5 py-2 text-[11px] font-medium text-white/55 transition-colors hover:border-white/[0.16] hover:text-white">
                                        Edit details
                                    </button>
                                    <button @click="closeDetails"
                                        class="rounded-lg bg-[#3155D9] px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#3E63E8]">
                                        Close
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
            <transition enter-active-class="transition duration-200 ease-out" enter-from-class="scale-[0.98] opacity-0"
                leave-active-class="transition duration-150 ease-in" leave-to-class="scale-[0.98] opacity-0">
                <div v-if="pendingNodes" class="fixed inset-0 z-[75] flex items-center justify-center p-4">
                    <div class="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                        @pointerdown="cancelPendingConnection"></div>

                    <div class="relative w-full max-w-[460px] overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#141821] p-6 shadow-2xl shadow-black/60"
                        @pointerdown.stop>
                        <div
                            class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#3155D9]/15 to-transparent">
                        </div>

                        <div class="relative">
                            <p class="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8CA4FF]/70">Connect
                                nodes</p>
                            <h3 class="mt-1.5 text-xl font-semibold tracking-tight text-white">How are these related?
                            </h3>

                            <div
                                class="mt-5 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
                                <div class="min-w-0 flex-1">
                                    <p class="text-[9px] uppercase tracking-[0.15em] text-white/25">First</p>
                                    <p class="mt-1 truncate text-[12.5px] font-medium text-white/80">
                                        {{ pendingNodes.from.title }}
                                    </p>
                                </div>

                                <span
                                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#3155D9]/30 bg-[#3155D9]/10 text-[#8CA4FF]">
                                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13.828 10.172a4 4 0 00-5.656 0l-2.343 2.343a4 4 0 105.657 5.657l1.414-1.415m-1.415-8.485l1.415-1.414a4 4 0 115.657 5.657l-2.343 2.343a4 4 0 01-5.657 0" />
                                    </svg>
                                </span>

                                <div class="min-w-0 flex-1 text-right">
                                    <p class="text-[9px] uppercase tracking-[0.15em] text-white/25">Second</p>
                                    <p class="mt-1 truncate text-[12.5px] font-medium text-white/80">
                                        {{ pendingNodes.to.title }}
                                    </p>
                                </div>
                            </div>

                            <div class="mt-4 space-y-2">
                                <button @click="completeConnection('related')" :class="relationOptionClass">
                                    <span :class="relationIconClass">↔</span>
                                    <span class="min-w-0 flex-1">
                                        <span class="block text-[12.5px] font-medium text-white/80">Related
                                            attachments</span>
                                        <span class="mt-0.5 block text-[10.5px] leading-relaxed text-white/35">
                                            Link both ways without creating a hierarchy.
                                        </span>
                                    </span>
                                </button>

                                <button @click="completeConnection('from-subtopic')" :class="relationOptionClass">
                                    <span :class="relationIconClass">⊂</span>
                                    <span class="min-w-0 flex-1">
                                        <span class="block text-[12.5px] font-medium text-white/80">
                                            “{{ truncate(pendingNodes.from.title, 22) }}” is a subtopic of
                                            “{{ truncate(pendingNodes.to.title, 22) }}”
                                        </span>
                                        <span class="mt-0.5 block text-[10.5px] leading-relaxed text-white/35">
                                            Sets “{{ truncate(pendingNodes.to.title, 24) }}” as its main topic.
                                        </span>
                                    </span>
                                </button>

                                <button @click="completeConnection('to-subtopic')" :class="relationOptionClass">
                                    <span :class="relationIconClass">⊃</span>
                                    <span class="min-w-0 flex-1">
                                        <span class="block text-[12.5px] font-medium text-white/80">
                                            “{{ truncate(pendingNodes.to.title, 22) }}” is a subtopic of
                                            “{{ truncate(pendingNodes.from.title, 22) }}”
                                        </span>
                                        <span class="mt-0.5 block text-[10.5px] leading-relaxed text-white/35">
                                            Sets “{{ truncate(pendingNodes.from.title, 24) }}” as its main topic.
                                        </span>
                                    </span>
                                </button>
                            </div>

                            <div class="mt-5 flex justify-end">
                                <button @click="cancelPendingConnection"
                                    class="rounded-lg border border-white/[0.08] px-3.5 py-2 text-[11px] font-medium text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white">
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
            <transition enter-active-class="transition duration-200 ease-out" enter-from-class="translate-y-2 opacity-0"
                leave-active-class="transition duration-150 ease-in" leave-to-class="translate-y-2 opacity-0">
                <div v-if="toast"
                    class="fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/[0.09] bg-[#1A1F2B]/95 px-4 py-2.5 text-[11px] text-white/70 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    <svg class="h-3.5 w-3.5 text-[#6D86FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ toast }}
                </div>
            </transition>
        </Teleport>

        <!-- Node right-click menu -->

        <Teleport to="body">
            <transition enter-active-class="transition duration-100 ease-out" enter-from-class="scale-[0.98] opacity-0"
                leave-active-class="transition duration-75 ease-in" leave-to-class="scale-[0.98] opacity-0">
                <div v-if="contextMenu.open && contextNode" class="fixed inset-0 z-[80]" @pointerdown="closeMenus"
                    @contextmenu.prevent>
                    <div class="fixed w-[260px] max-h-[calc(100vh-24px)] overflow-y-auto rounded-xl border border-white/[0.10] bg-[#1C2029] p-1.5 shadow-2xl shadow-black/50"
                        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }" @pointerdown.stop>

                        <!-- Node identity -->
                        <div class="flex items-center gap-2.5 px-2.5 py-2.5">
                            <span class="h-2 w-2 shrink-0 rounded-full"
                                :style="{ background: typeColor(contextNode.type) }"></span>

                            <div class="min-w-0 flex-1">
                                <p class="truncate text-[12px] font-medium text-white/90">
                                    {{ contextNode.title }}
                                </p>
                                <p class="text-[10px] text-white/35">
                                    {{ contextNode.type }}
                                    <span class="mx-1 text-white/15">·</span>
                                    {{ contextConnections.length }} connections
                                </p>
                            </div>

                            <span class="text-[10px] text-white/20">ESC</span>
                        </div>

                        <div class="h-px bg-white/[0.07] my-1"></div>

                        <!-- Primary actions -->
                        <div class="space-y-0.5">
                            <button :class="[menuItemClass, menuItemIdleClass]" @click="openDetails(contextNode)">
                                <svg :class="menuIconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Open details
                            </button>

                            <button :class="[menuItemClass, menuItemIdleClass]" @click="startConnect(contextNode.id)">
                                <svg :class="menuIconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"
                                        d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.72 1.72 M14 11a5 5 0 00-7.07 0l-3 3A5 5 0 0011 21.07l1.72-1.72" />
                                </svg>
                                Connect to another node
                            </button>

                            <button :class="[menuItemClass, menuItemIdleClass]" @click="duplicateNode(contextNode)">
                                <svg :class="menuIconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <rect x="8" y="8" width="13" height="13" rx="2" stroke-width="1.7" />
                                    <path stroke-linecap="round" stroke-width="1.7"
                                        d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3" />
                                </svg>
                                Duplicate
                            </button>
                        </div>

                        <div class="h-px bg-white/[0.07] my-1.5"></div>

                        <!-- Node type -->
                        <div class="px-2 py-1.5">
                            <p class="mb-2 text-[10px] font-medium text-white/35">
                                NODE TYPE
                            </p>

                            <div class="flex items-center gap-1">
                                <button v-for="type in nodeTypes" :key="type" @click="setNodeType(contextNode, type)"
                                    class="flex-1 rounded-md py-1.5 text-[10px] font-medium transition-colors" :style="contextNode.type === type
                                        ? {
                                            color: typeColor(type),
                                            backgroundColor: `${typeColor(type)}18`,
                                            boxShadow: `inset 0 0 0 1px ${typeColor(type)}50`
                                        }
                                        : {
                                            color: 'rgba(255,255,255,0.38)',
                                            backgroundColor: 'rgba(255,255,255,0.025)'
                                        }">
                                    {{ type }}
                                </button>
                            </div>
                        </div>

                        <!-- Relationships -->
                        <template v-if="getMainTopic(contextNode.id) || contextConnections.length">
                            <div class="h-px bg-white/[0.07] my-1.5"></div>

                            <template v-if="getMainTopic(contextNode.id)">
                                <button :class="[menuItemClass, menuItemIdleClass]"
                                    @click="detachMainTopic(contextNode.id)">
                                    <svg :class="menuIconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"
                                            d="M5 12h14m-6-6l6 6-6 6" />
                                    </svg>
                                    Detach from main topic
                                </button>
                            </template>

                            <template v-if="contextConnections.length">
                                <div class="px-2.5 pt-2 pb-1">
                                    <p class="text-[10px] font-medium text-white/35">
                                        CONNECTIONS
                                        <span class="ml-1 text-white/20">{{ contextConnections.length }}</span>
                                    </p>
                                </div>

                                <div class="max-h-32 overflow-y-auto">
                                    <button v-for="item in contextConnections" :key="item.edgeId"
                                        @click="removeConnection(item.edgeId)"
                                        class="group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[11px] text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white">
                                        <span
                                            class="h-1.5 w-1.5 shrink-0 rounded-full bg-white/25 group-hover:bg-red-400"></span>
                                        <span class="min-w-0 flex-1 truncate">
                                            {{ item.node.title }}
                                        </span>
                                        <span class="text-[9px] text-white/20 group-hover:text-red-400">
                                            Remove
                                        </span>
                                    </button>
                                </div>
                            </template>
                        </template>

                        <div class="h-px bg-white/[0.07] my-1.5"></div>

                        <!-- Destructive action -->
                        <button
                            :class="[menuItemClass, '!text-red-400/75 hover:!bg-red-400/[0.08] hover:!text-red-400']"
                            @click="deleteFromContext">
                            <svg :class="menuIconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"
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
            <transition enter-active-class="transition duration-100 ease-out" enter-from-class="scale-[0.98] opacity-0"
                leave-active-class="transition duration-75 ease-in" leave-to-class="scale-[0.98] opacity-0">
                <div v-if="canvasMenu.open" class="fixed inset-0 z-[80]" @pointerdown="closeMenus" @contextmenu.prevent>
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
</template>
