<script setup>
import { downloadGraphFile } from '~/utils/graph'

useHead({ title: 'Dashboard — Fleurıs' })

const router = useRouter()
const {
  graphs,
  ready,
  storageError,
  createGraph,
  deleteGraph,
  duplicateGraph,
  importGraph,
  slugify,
} = useGraphs()

const searchQuery = ref('')
const createOpen = ref(false)
const deleteTarget = ref(null)
const titleInput = ref(null)
const fileInput = ref(null)
const creating = ref(false)
const importing = ref(false)

const form = reactive({
  title: '',
  slug: '',
  description: '',
  slugTouched: false,
})

const formError = ref('')
const toast = ref('')
let toastTimer = null

const filteredGraphs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const sorted = [...graphs.value].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  if (!query) return sorted

  return sorted.filter((graph) =>
    `${graph.title} ${graph.slug} ${graph.description}`.toLowerCase().includes(query),
  )
})

const totals = computed(() => graphs.value.reduce((total, graph) => ({
  nodes: total.nodes + graph.nodes.length,
  links: total.links + graph.connections.length,
}), { nodes: 0, links: 0 }))

const slugPreview = computed(() => slugify(form.slug || form.title) || 'your-graph')

const canCreate = computed(() => form.title.trim().length > 0)

watch(
  () => form.title,
  (title) => {
    if (!form.slugTouched) form.slug = slugify(title)
  },
)

watch(createOpen, (open) => {
  if (open) nextTick(() => titleInput.value?.focus())
})

function showToast(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2800)
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown date'

  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 30) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`
  if (diffDays < 7) return `${diffDays}d ${diffHours % 24}h ago`

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
function openCreate() {
  form.title = ''
  form.slug = ''
  form.description = ''
  form.slugTouched = false
  formError.value = ''
  createOpen.value = true
}

function closeCreate() {
  createOpen.value = false
  formError.value = ''
}

function submitCreate() {
  if (creating.value) return

  const title = form.title.trim()
  if (!title) {
    formError.value = 'Give your graph a name before creating it.'
    titleInput.value?.focus()
    return
  }

  creating.value = true
  try {
    const graph = createGraph({
      title,
      slug: form.slug || title,
      description: form.description,
    })
    createOpen.value = false
    showToast(`Created “${graph.title}”`)
    router.push(`/dashboard/${graph.slug}`)
  } finally {
    creating.value = false
  }
}

function startImport() {
  if (fileInput.value) fileInput.value.value = ''
  fileInput.value?.click()
}

async function importFile(file) {
  if (!file || importing.value) return

  importing.value = true
  try {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('That file is too large to be a graph.')
    }

    const graph = importGraph(await file.text())
    showToast(`Imported “${graph.title}”`)
    router.push(`/dashboard/${graph.slug}`)
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'That file could not be imported.')
  } finally {
    importing.value = false
  }
}

function onFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (file) importFile(file)
}

function onDrop(event) {
  const file = event.dataTransfer?.files?.[0]
  if (file) importFile(file)
}

function exportGraph(graph) {
  downloadGraphFile(graph)
  showToast(`Exported “${graph.title}” as ${graph.slug}.fl`)
}

function duplicate(graph) {
  const copy = duplicateGraph(graph.slug)
  if (copy) showToast(`Created “${copy.title}”`)
}

function confirmDelete() {
  if (!deleteTarget.value) return

  const title = deleteTarget.value.title
  deleteGraph(deleteTarget.value.slug)
  deleteTarget.value = null
  showToast(`Deleted “${title}”`)
}
</script>

<template>
  <ClientOnly>
    <section class="min-h-screen bg-[#0c0c0d] geist-400 text-[#F5F4EF]" @dragover.prevent @drop.prevent="onDrop">
      <header class="sticky top-0 z-30 border-b border-white/[0.07] bg-[#111113]/90 b
">
        <div class="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-5 md:px-8">
          <NuxtLink to="/"
            class="text-[19px] font-semibold tracking-tight text-white transition-opacity hover:opacity-80">
            fleur<span class="text-[#6D86FF]">ıs.</span>
          </NuxtLink>

          <span class="h-4 w-px bg-white/[0.08]"></span>
          <span class="text-[12px] font-medium text-white/45">Dashboard</span>

          <div class="ml-auto flex items-center gap-2">
            <input ref="fileInput" type="file" accept=".fl,application/json,.json" class="hidden"
              @change="onFileChange" />

            <button @click="startImport" :disabled="importing"
              class="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.025] px-3 py-2 text-[11.5px] font-medium text-white/55 transition-colors hover:border-white/[0.16] hover:bg-white/[0.05] hover:text-white disabled:cursor-wait disabled:opacity-50">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 21V9m0 0 4 4m-4-4-4 4M4 7V5a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v2" />
              </svg>
              <span class="hidden sm:inline">{{ importing ? 'Importing…' : 'Import .fl' }}</span>
            </button>

            <button @click="openCreate"
              class="inline-flex items-center gap-1.5 rounded-lg bg-[#3155D9] px-3.5 py-2 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#3E63E8]">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m-7-7h14" />
              </svg>
              New graph
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto w-full max-w-7xl px-5 pb-24 pt-10 md:px-8 md:pt-14">
        <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 class="mt-2 text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-none tracking-[-0.05em] text-white">
              Hi, {{ user }}.
            </h1>
            <p class="mt-4 max-w-lg text-[13px] leading-relaxed text-white/40">
              Open a flowchart, start a new one, or carry a graph between machines with a
              <span class="font-medium text-white/65">.fl</span> file. Everything is stored locally in this browser.
            </p>
          </div>

          <div class="flex items-stretch gap-3">
            <div class="min-w-[92px] rounded-lg flex justify-center gap-2 px-4 py-3">
              <p class="text-[20px] font-semibold leading-none tracking-tight text-white tabular-nums">
                {{ graphs.length }}
              </p>
              <p class="mt-2 text-[9px] font-medium uppercase tracking-[0.16em] text-white/35">
                Graphs
              </p>
            </div>

            <div class="min-w-[92px] rounded-lg flex justify-center gap-2 px-4 py-3">
              <p class="text-[20px] font-semibold leading-none tracking-tight text-white tabular-nums">
                {{ totals.nodes }}
              </p>
              <p class="mt-2 text-[9px] font-medium uppercase tracking-[0.16em] text-white/35">
                Nodes
              </p>
            </div>

            <div class="min-w-[92px] rounded-lg flex justify-center gap-2 px-4 py-3">
              <p class="text-[20px] font-semibold leading-none tracking-tight text-white tabular-nums">
                {{ totals.links }}
              </p>
              <p class="mt-2 text-[9px] font-medium uppercase tracking-[0.16em] text-white/35">
                Links
              </p>
            </div>
          </div>
        </div>

        <div class="relative mt-9 max-w-md">
          <svg class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" fill="none"
            stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
          </svg>
          <input v-model="searchQuery" type="search" placeholder="Find a graph by name, slug, or description…"
            class="w-full rounded-xl bg-white/[0.025] py-2.5 pl-10 pr-3 text-[12.5px] text-white/80 outline-none transition-colors placeholder:text-white/25 focus:border-[#3155D9]" />
        </div>

        <p v-if="storageError"
          class="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-[11.5px] text-red-300/80">
          {{ storageError }}
        </p>

        <div v-if="!graphs.length"
          class="mt-10 rounded-2xl border border-dashed border-white/[0.12] px-6 py-16 text-center">
          <span
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#3155D9]/30 bg-[#3155D9]/10 text-[#8CA4FF]">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 5v14m-7-7h14" />
            </svg>
          </span>
          <h2 class="mt-5 text-[17px] font-semibold tracking-tight text-white">No graphs yet</h2>
          <p class="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-white/35">
            Create a blank graph, or import a <span class="text-white/55">.fl</span> file to restore a
            flowchart with all of its notes, links, and canvas positions.
          </p>
          <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button @click="openCreate"
              class="inline-flex items-center gap-1.5 rounded-lg bg-[#3155D9] px-4 py-2.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#3E63E8]">
              New graph
            </button>
            <button @click="startImport"
              class="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.025] px-4 py-2.5 text-[11.5px] font-medium text-white/55 transition-colors hover:border-white/[0.16] hover:text-white">
              Import .fl
            </button>
          </div>
        </div>

        <div v-else-if="!filteredGraphs.length"
          class="mt-10 rounded-2xl border border-dashed border-white/[0.10] px-6 py-14 text-center">
          <p class="text-[13px] font-medium text-white/55">No graphs match “{{ searchQuery }}”.</p>
          <button @click="searchQuery = ''" class="mt-2 text-[11.5px] text-[#8CA4FF] hover:text-white">
            Clear search
          </button>
        </div>

        <div v-else class="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article v-for="graph in filteredGraphs" :key="graph.slug"
            class="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111319] transition-all hover:border-[#4B6BFF]/40">
            <NuxtLink :to="`/dashboard/${graph.slug}`" class="block">
              <!-- Thumbnail Container -->
              <div class="h-[150px] border-b border-white/[0.06] bg-[#0B0C10]">
                <GraphThumbnail :nodes="graph.nodes" :connections="graph.connections" />
              </div>

              <!-- Content Section -->
              <div class="p-4">
                <div class="flex items-start justify-between gap-3">
                  <h2
                    class="min-w-0 truncate text-[14px] font-semibold tracking-tight text-white/90 group-hover:text-white">
                    {{ graph.title }}
                  </h2>
                  <span
                    class="mt-0.5 shrink-0 rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 font-mono text-[9.5px] text-white/40">
                    {{ graph.nodes.length }}/{{ graph.connections.length }}
                  </span>
                </div>

                <p class="mt-1 truncate text-[10.5px] font-mono text-[#8CA4FF]/70">/dashboard/{{ graph.slug }}</p>

                <p class="mt-2.5 line-clamp-2 min-h-[32px] text-[11px] leading-relaxed text-white/40">
                  {{ graph.description || 'No description yet.' }}
                </p>

                <div
                  class="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[10px] text-white/30">
                  <span>{{ graph.nodes.length }} nodes · {{ graph.connections.length }} links</span>
                  <span>{{ formatDate(graph.updatedAt) }}</span>
                </div>
              </div>
            </NuxtLink>

            <!-- Floating Action Toolbar on Hover -->
            <div
              class="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#111319]/90 p-1 shadow-xl shadow-black/40 backdrop-blur-md transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
              <button @click.stop="exportGraph(graph)" title="Export .fl"
                class="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                    d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
              </button>
              <button @click.stop="duplicate(graph)" title="Duplicate graph"
                class="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="8" y="8" width="12" height="12" rx="2" stroke-width="1.75" />
                  <path stroke-linecap="round" stroke-width="1.75"
                    d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                </svg>
              </button>
              <button @click.stop="deleteTarget = graph" title="Delete graph"
                class="rounded-md p-1.5 text-white/40 transition-colors hover:bg-red-500/[0.1] hover:text-red-400">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                    d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3" />
                </svg>
              </button>
            </div>
          </article>
        </div>

        <p class="mt-10 flex items-center gap-2 text-[10.5px] text-white/20">
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
              d="M12 16v-4m0-4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
          </svg>
          Drop a .fl file anywhere on this page to import it.
        </p>
      </main>

      <!-- Create graph -->
      <Teleport to="body">
        <transition enter-active-class="transition duration-150 ease-out" enter-from-class="scale-[0.98] opacity-0"
          leave-active-class="transition duration-100 ease-in" leave-to-class="scale-[0.98] opacity-0">
          <div v-if="createOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/65 backdrop-blur-[2px]" @pointerdown="closeCreate"></div>

            <form
              class="relative w-full max-w-[480px] overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#141821] shadow-2xl shadow-black/60"
              @pointerdown.stop @submit.prevent="submitCreate">
              <div
                class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#3155D9]/15 to-transparent">
              </div>

              <div class="relative border-b border-white/[0.07] px-6 pb-5 pt-6">
                <p class="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8CA4FF]/70">New graph</p>
                <h2 class="mt-1.5 text-[22px] font-semibold tracking-tight text-white">Start a fresh canvas</h2>
                <p class="mt-2 text-[11.5px] leading-relaxed text-white/35">
                  Give it a name and a slug. You can add nodes and links right after.
                </p>
              </div>

              <div class="relative space-y-4 px-6 py-5">
                <div>
                  <label class="mb-1.5 block text-[9px] font-medium uppercase tracking-[0.12em] text-white/30">
                    Name
                  </label>
                  <input ref="titleInput" v-model="form.title" maxlength="80" placeholder="e.g. Systems thinking"
                    class="w-full rounded-lg border border-white/[0.08] bg-white/[0.045] px-3 py-2.5 text-[12.5px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#3155D9]/60 focus:bg-[#3155D9]/[0.08]" />
                </div>

                <div>
                  <label class="mb-1.5 block text-[9px] font-medium uppercase tracking-[0.12em] text-white/30">
                    Slug
                  </label>
                  <div
                    class="flex items-stretch overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.045] focus-within:border-[#3155D9]/60">
                    <span
                      class="flex shrink-0 items-center border-r border-white/[0.07] px-3 text-[11px] text-white/25">
                      /dashboard/
                    </span>
                    <input v-model="form.slug" maxlength="64" placeholder="systems-thinking"
                      @input="form.slugTouched = true"
                      class="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[12.5px] text-white/80 outline-none placeholder:text-white/20" />
                  </div>
                  <p class="mt-1.5 truncate text-[10px] text-white/25">
                    Opens at <span class="text-white/40">/dashboard/{{ slugPreview }}</span>
                    <span v-if="graphs.some((graph) => graph.slug === slugPreview)" class="text-[#F5A623]/70">
                      · name already used, a number will be added
                    </span>
                  </p>
                </div>

                <div>
                  <label class="mb-1.5 block text-[9px] font-medium uppercase tracking-[0.12em] text-white/30">
                    Description <span class="normal-case tracking-normal text-white/20">(optional)</span>
                  </label>
                  <textarea v-model="form.description" rows="3" maxlength="240" placeholder="What is this graph for?"
                    class="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.045] px-3 py-2.5 text-[12.5px] leading-relaxed text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#3155D9]/60 focus:bg-[#3155D9]/[0.08]"></textarea>
                </div>

                <p v-if="formError" class="text-[11px] text-red-300/80">{{ formError }}</p>
              </div>

              <div class="relative flex items-center justify-end gap-2 border-t border-white/[0.07] px-6 py-4">
                <button type="button" @click="closeCreate"
                  class="rounded-lg border border-white/[0.08] px-3.5 py-2 text-[11px] font-medium text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white">
                  Cancel
                </button>
                <button type="submit" :disabled="!canCreate || creating"
                  class="rounded-lg bg-[#3155D9] px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#3E63E8] disabled:cursor-not-allowed disabled:opacity-40">
                  {{ creating ? 'Creating…' : 'Create graph' }}
                </button>
              </div>
            </form>
          </div>
        </transition>
      </Teleport>

      <!-- Delete graph -->
<Teleport to="body">
    <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="scale-[0.98] opacity-0"
        leave-active-class="transition duration-100 ease-in"
        leave-to-class="scale-[0.98] opacity-0"
    >
        <div v-if="deleteTarget" class="fixed inset-0 z-[75] flex items-center justify-center p-4">
            <!-- Semi-transparent flat dark backdrop -->
            <div class="absolute inset-0 bg-[#050608]/80 backdrop-blur-sm" @pointerdown="deleteTarget = null"></div>

            <!-- Modal Box -->
            <div
                class="relative w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[#111319]/90 p-6 backdrop-blur-md"
                @pointerdown.stop
            >
                <div class="flex items-start gap-4">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/[0.08] text-red-400">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                                d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3" />
                        </svg>
                    </span>

                    <div class="min-w-0 flex-1">
                        <h2 class="text-[18px] font-semibold tracking-[-0.02em] text-white">Delete this graph?</h2>
                        <p class="mt-1.5 text-[12px] leading-relaxed text-white/45">
                            <span class="font-medium text-white/80">“{{ deleteTarget.title }}”</span>
                            and all of its nodes, links, and saved canvas positions will be removed from this browser. This cannot be undone.
                        </p>
                    </div>
                </div>

                <div class="mt-6 flex justify-end gap-2">
                    <button
                        @click="deleteTarget = null"
                        class="rounded-lg border border-white/[0.08] px-3.5 py-1.5 text-[11.5px] font-medium text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        @click="confirmDelete"
                        class="rounded-lg bg-red-500/85 px-3.5 py-1.5 text-[11.5px] font-medium text-white transition-colors hover:bg-red-500"
                    >
                        Delete graph
                    </button>
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
    </section>
  </ClientOnly>
</template>
