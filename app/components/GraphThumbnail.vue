
<script setup>
import { NODE_TYPE_META } from '~/utils/graph'

const WIDTH = 320
const HEIGHT = 150
const PADDING = 26

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  connections: { type: Array, default: () => [] },
})

function nodeRadius(node) {
  return node?.type === 'Concept' ? 3.5 : 2.8
}

const layout = computed(() => {
  if (!props.nodes.length) return null

  const xs = props.nodes.map(n => Number(n.x) || 0)
  const ys = props.nodes.map(n => Number(n.y) || 0)

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const graphWidth = Math.max(maxX - minX, 1)
  const graphHeight = Math.max(maxY - minY, 1)

  const scale = Math.min(
    (WIDTH - PADDING * 2) / graphWidth,
    (HEIGHT - PADDING * 2) / graphHeight,
    1.15,
  )

  const offsetX = WIDTH / 2 - ((minX + maxX) / 2) * scale
  const offsetY = HEIGHT / 2 - ((minY + maxY) / 2) * scale

  const positions = new Map(
    props.nodes.map(node => [
      node.id,
      {
        node,
        x: (Number(node.x) || 0) * scale + offsetX,
        y: (Number(node.y) || 0) * scale + offsetY,
      },
    ]),
  )

  const edges = props.connections
    .map(connection => {
      const from = positions.get(connection.from)
      const to = positions.get(connection.to)

      if (!from || !to) return null

      const dx = to.x - from.x
      const dy = to.y - from.y
      const distance = Math.hypot(dx, dy)

      if (!distance) return null

      // Stop each line at the visible circle edge instead of running it
      // through the middle of the node.
      const ux = dx / distance
      const uy = dy / distance
      const fromRadius = nodeRadius(from.node) + 0.5
      const toRadius = nodeRadius(to.node) + 1.2

      return {
        ...connection,
        x1: from.x + ux * fromRadius,
        y1: from.y + uy * fromRadius,
        x2: to.x - ux * toRadius,
        y2: to.y - uy * toRadius,
      }
    })
    .filter(Boolean)

  return { positions, edges }
})

function nodeColor(node) {
  return NODE_TYPE_META[node.type]?.color
    || NODE_TYPE_META.Concept.color
}
</script>

<template>
  <svg
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    class="h-full w-full"
    aria-hidden="true"
  >
    <g v-if="layout">
      <!-- Connections -->
      <line
        v-for="edge in layout.edges"
        :key="`${edge.from}-${edge.to}-${edge.kind}`"
        :x1="edge.x1"
        :y1="edge.y1"
        :x2="edge.x2"
        :y2="edge.y2"
        stroke="#64748B"
        :stroke-opacity="edge.kind === 'topic' ? 0.42 : 0.22"
        :stroke-width="edge.kind === 'topic' ? 1.15 : 0.85"
        :stroke-dasharray="edge.kind === 'related' ? '2.5 4' : undefined"
        stroke-linecap="round"
      />

      <!-- Nodes -->
      <circle
        v-for="node in nodes"
        :key="node.id"
        :cx="layout.positions.get(node.id)?.x"
        :cy="layout.positions.get(node.id)?.y"
        :r="nodeRadius(node)"
        :fill="nodeColor(node)"
      />
    </g>

    <!-- Empty state -->
    <g v-else>
      <g
        fill="none"
        stroke="#64748B"
        stroke-opacity="0.3"
        stroke-width="1"
        stroke-linecap="round"
      >
        <path d="M112 75 L160 48 L208 75 L160 102 Z" />
        <path d="M112 75 L160 102" />
      </g>

      <g fill="#64748B" fill-opacity="0.55">
        <circle cx="112" cy="75" r="3" />
        <circle cx="160" cy="48" r="3" />
        <circle cx="208" cy="75" r="3" />
        <circle cx="160" cy="102" r="3" />
      </g>
    </g>
  </svg>
</template>
