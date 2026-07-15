<template>
  <div
    class="lexend mx-auto mt-6 sm:mt-9 max-w-sm sm:max-w-xl px-2 sm:px-0"
    v-if="store.settings.enableTasks"
  >
    <!-- HEADER -->
    <div class="mb-4 sm:mb-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-white">Tasks</h1>
          <p class="mt-0.5 text-xs sm:text-sm text-white/60">
            {{ doneCount }} of {{ totalCount }} done
          </p>
        </div>

        <div class="relative" ref="menuRef">
          <button
            class="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
            @click="toggleTaskMenu"
            aria-label="Task options"
          >
            <LucideMenu class="h-5 w-5" />
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 scale-95 -translate-y-1"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <ul
              v-if="isTaskMenuOpen"
              class="absolute right-0 top-11 z-10 flex w-64 flex-col gap-0.5 rounded-2xl bg-white p-2 text-sm text-slate-700 shadow-xl shadow-black/10 ring-1 ring-black/5"
            >
              <li
                @click="finishAllTasks"
                class="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition hover:bg-slate-100"
              >
                <LucideCheckCircle class="h-4 w-4 text-slate-400" /> Finish all tasks
              </li>
              <li
                @click="unfinishAllTasks"
                class="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition hover:bg-slate-100"
              >
                <LucideRotateCcw class="h-4 w-4 text-slate-400" /> Unfinish all tasks
              </li>
              <li
                @click="clearFinishedTasks"
                class="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition hover:bg-slate-100"
              >
                <LucideCheckSquare class="h-4 w-4 text-slate-400" /> Clear finished tasks
              </li>
              <li
                @click="resetTasks"
                class="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-red-500 transition hover:bg-red-50"
              >
                <LucideTrash2 class="h-4 w-4" /> Clear all tasks
              </li>
            </ul>
          </Transition>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
        <div
          class="h-full rounded-full bg-white transition-all duration-500 ease-out"
          :style="{ width: progressPct + '%' }"
        />
      </div>

      <!-- Filters -->
      <div class="mt-4 flex gap-1 rounded-full bg-black/15 p-1 w-fit">
        <button
          v-for="f in filters"
          :key="f.value"
          @click="filter = f.value"
          class="rounded-full px-3 py-1.5 text-xs font-medium tracking-wide transition-all duration-300"
          :class="
            filter === f.value ? 'bg-white text-slate-900 shadow-sm' : 'text-white/70 hover:text-white'
          "
        >
          {{ f.label }} <span class="opacity-60">{{ f.count }}</span>
        </button>
      </div>
    </div>

    <!-- ADD TASK INPUT -->
    <div
      v-if="isAddMenu"
      class="lexend my-3 w-full rounded-2xl bg-white p-3 shadow-md sm:p-4"
    >
      <input
        ref="addInputRef"
        v-model="newTask"
        type="text"
        placeholder="What are you working on?"
        class="mb-3 w-full rounded-lg p-2 text-base italic focus:outline-none sm:mb-4 sm:text-lg"
        @keyup.enter="addTask"
        @keyup.escape="toggleAddMenu"
      />
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Focus sessions:</span>
          <button
            @click="newTaskPomodoros = Math.max(1, newTaskPomodoros - 1)"
            class="h-5 w-5 rounded-full text-slate-500 transition hover:bg-slate-100"
          >
            −
          </button>
          <span class="w-4 text-center font-medium text-slate-700">{{ newTaskPomodoros }}</span>
          <button
            @click="newTaskPomodoros++"
            class="h-5 w-5 rounded-full text-slate-500 transition hover:bg-slate-100"
          >
            +
          </button>
        </div>

        <div class="flex gap-3 sm:gap-4">
          <button
            class="text-sm text-gray-500 hover:text-gray-700 sm:text-base"
            @click="toggleAddMenu"
          >
            Cancel
          </button>
          <button
            class="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-base"
            :disabled="!newTask.trim()"
            @click="addTask"
          >
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- TASK LIST -->
    <div
      class="scrollbar-thin space-y-2 overflow-y-auto px-1 sm:space-y-3 sm:px-2"
      :class="filteredTasks.length ? 'h-40 sm:h-48' : ''"
    >
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition duration-150 ease-in absolute w-full"
        leave-to-class="opacity-0 translate-x-2"
        move-class="transition duration-300"
      >
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="group flex items-center justify-between rounded-xl bg-white p-3 transition-shadow sm:p-4"
          :class="task.id === activeTaskId ? 'ring-2 ring-white/80' : ''"
        >
          <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <!-- Checkbox -->
            <button
              @click="toggleTask(task.id)"
              class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 sm:h-5 sm:w-5"
              :class="
                task.done
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-slate-300 hover:border-slate-500'
              "
              :aria-label="task.done ? 'Mark task incomplete' : 'Mark task complete'"
            >
              <svg v-if="task.done" class="h-2 w-2 sm:h-3 sm:w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>

            <!-- Text / inline edit -->
            <input
              v-if="editingId === task.id"
              v-model="editText"
              class="min-w-0 flex-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-sm text-gray-800 focus:outline-none sm:text-base"
              @keyup.enter="saveEdit(task)"
              @keyup.escape="cancelEdit"
              @blur="saveEdit(task)"
              ref="editInputRef"
            />
            <span
              v-else
              class="min-w-0 flex-1 truncate text-sm text-gray-800 sm:text-base"
              :class="{ 'text-gray-400 line-through': task.done }"
              @dblclick="startEdit(task)"
            >
              {{ task.text }}
            </span>
          </div>

          <div class="flex flex-shrink-0 items-center gap-1 sm:gap-2">
            <!-- Pomodoro estimate -->
            <div
              class="hidden items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-500 sm:flex"
            >
              <LucideFlame class="h-3 w-3 text-slate-400" />
              {{ task.pomodoros }}
            </div>

            <!-- Focus marker -->
            <button
              @click="setActiveTask(task.id)"
              :aria-label="task.id === activeTaskId ? 'Unfocus task' : 'Focus this task'"
              class="opacity-0 transition group-hover:opacity-100"
              :class="task.id === activeTaskId ? '!opacity-100' : ''"
            >
              <LucideStar
                class="h-4 w-4 transition"
                :class="task.id === activeTaskId ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'"
              />
            </button>

            <!-- Edit -->
            <button
              @click="startEdit(task)"
              aria-label="Edit task"
              class="opacity-0 text-gray-400 transition hover:text-slate-700 group-hover:opacity-100"
            >
              <LucidePencil class="h-4 w-4" />
            </button>

            <!-- Delete -->
            <button
              @click="deleteTask(task.id)"
              aria-label="Delete task"
              class="opacity-0 text-gray-400 transition hover:text-red-500 group-hover:opacity-100"
            >
              <LucideTrash2 class="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </TransitionGroup>

      <!-- Empty state -->
      <div
        v-if="!filteredTasks.length"
        class="flex h-32 flex-col items-center justify-center gap-1 text-center text-white/50 sm:h-40"
      >
        <LucideCheckCircle class="h-6 w-6" />
        <p class="text-sm">
          {{ filter === 'done' ? 'Nothing finished yet' : filter === 'active' ? 'All caught up' : 'No tasks yet' }}
        </p>
      </div>

      <!-- Add task button -->
      <button
        class="w-full rounded-xl border-2 border-dashed border-white/30 py-2 text-sm text-white/80 transition hover:border-white/50 hover:text-white sm:py-3 sm:text-base"
        @click="toggleAddMenu"
        v-if="!isAddMenu"
      >
        <span class="flex items-center justify-center gap-2">
          <LucidePlus class="h-4 w-4 sm:h-5 sm:w-5" />
          Add task
        </span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import {
  LucideMenu,
  LucideTrash2,
  LucideCheckSquare,
  LucideRotateCcw,
  LucideCheckCircle,
  LucidePlus,
  LucidePencil,
  LucideStar,
  LucideFlame,
} from 'lucide-vue-next'
import { ref, computed, watch, onMounted, onUnmounted, nextTick, defineComponent } from 'vue'
import { usePomodoroStore } from '@/stores/usePomodoroStore'

interface Task {
  id: string
  text: string
  done: boolean
  pomodoros: number
}

const STORAGE_KEY = 'focusnest-tasks'

function makeId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default defineComponent({
  name: 'AppTasks',
  components: {
    LucideTrash2,
    LucideMenu,
    LucideCheckSquare,
    LucideRotateCcw,
    LucideCheckCircle,
    LucidePlus,
    LucidePencil,
    LucideStar,
    LucideFlame,
  },

  setup() {
    const store = usePomodoroStore()

    const tasks = ref<Task[]>([])
    const newTask = ref('')
    const newTaskPomodoros = ref(1)
    const isAddMenu = ref(false)
    const isTaskMenuOpen = ref(false)
    const filter = ref<'all' | 'active' | 'done'>('all')
    const editingId = ref<string | null>(null)
    const editText = ref('')
    const activeTaskId = ref<string | null>(null)
    const menuRef = ref<HTMLElement | null>(null)
    const addInputRef = ref<HTMLInputElement | null>(null)
    const editInputRef = ref<HTMLInputElement[] | HTMLInputElement | null>(null)

    const doneCount = computed(() => tasks.value.filter((t) => t.done).length)
    const totalCount = computed(() => tasks.value.length)
    const progressPct = computed(() =>
      totalCount.value ? Math.round((doneCount.value / totalCount.value) * 100) : 0,
    )

    const filters = computed(() => [
      { value: 'all' as const, label: 'All', count: totalCount.value },
      { value: 'active' as const, label: 'Active', count: totalCount.value - doneCount.value },
      { value: 'done' as const, label: 'Done', count: doneCount.value },
    ])

    const filteredTasks = computed(() => {
      if (filter.value === 'active') return tasks.value.filter((t) => !t.done)
      if (filter.value === 'done') return tasks.value.filter((t) => t.done)
      return tasks.value
    })

    function persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ tasks: tasks.value, activeTaskId: activeTaskId.value }),
        )
      } catch (error) {
        console.error('Error saving tasks:', error)
      }
    }

    function load() {
      // Migrate from the old plain "tasks" key if present
      const legacy = localStorage.getItem('tasks')
      const saved = localStorage.getItem(STORAGE_KEY)

      if (saved) {
        try {
          const data = JSON.parse(saved)
          tasks.value = (data.tasks ?? []).map((t: Partial<Task>) => ({
            id: t.id ?? makeId(),
            text: t.text ?? '',
            done: !!t.done,
            pomodoros: t.pomodoros ?? 1,
          }))
          activeTaskId.value = data.activeTaskId ?? null
          return
        } catch (error) {
          console.error('Error loading tasks:', error)
        }
      }

      if (legacy) {
        try {
          const legacyTasks = JSON.parse(legacy) as { text: string; done: boolean }[]
          tasks.value = legacyTasks.map((t) => ({
            id: makeId(),
            text: t.text,
            done: t.done,
            pomodoros: 1,
          }))
          persist()
        } catch (error) {
          console.error('Error migrating legacy tasks:', error)
        }
      }
    }

    async function addTask() {
      const trimmed = newTask.value.trim()
      if (trimmed) {
        tasks.value.push({
          id: makeId(),
          text: trimmed,
          done: false,
          pomodoros: newTaskPomodoros.value,
        })
        newTask.value = ''
        newTaskPomodoros.value = 1
      }
      toggleAddMenu()
    }

    function toggleTask(id: string) {
      const task = tasks.value.find((t) => t.id === id)
      if (task) task.done = !task.done
    }

    function deleteTask(id: string) {
      tasks.value = tasks.value.filter((t) => t.id !== id)
      if (activeTaskId.value === id) activeTaskId.value = null
    }

    function startEdit(task: Task) {
      editingId.value = task.id
      editText.value = task.text
      nextTick(() => {
        const el = Array.isArray(editInputRef.value) ? editInputRef.value[0] : editInputRef.value
        el?.focus()
      })
    }

    function saveEdit(task: Task) {
      if (editingId.value !== task.id) return
      const trimmed = editText.value.trim()
      if (trimmed) task.text = trimmed
      editingId.value = null
    }

    function cancelEdit() {
      editingId.value = null
    }

    function setActiveTask(id: string) {
      activeTaskId.value = activeTaskId.value === id ? null : id
    }

    function toggleAddMenu() {
      isAddMenu.value = !isAddMenu.value
      if (isAddMenu.value) {
        nextTick(() => addInputRef.value?.focus())
      } else {
        newTask.value = ''
        newTaskPomodoros.value = 1
      }
    }

    function toggleTaskMenu() {
      isTaskMenuOpen.value = !isTaskMenuOpen.value
    }

    function resetTasks() {
      tasks.value = []
      activeTaskId.value = null
      isTaskMenuOpen.value = false
    }

    function clearFinishedTasks() {
      tasks.value = tasks.value.filter((t) => !t.done)
      isTaskMenuOpen.value = false
    }

    function finishAllTasks() {
      tasks.value.forEach((t) => (t.done = true))
      isTaskMenuOpen.value = false
    }

    function unfinishAllTasks() {
      tasks.value.forEach((t) => (t.done = false))
      isTaskMenuOpen.value = false
    }

    function handleClickOutside(event: MouseEvent) {
      if (isTaskMenuOpen.value && menuRef.value && !menuRef.value.contains(event.target as Node)) {
        isTaskMenuOpen.value = false
      }
    }

    watch(tasks, persist, { deep: true })
    watch(activeTaskId, persist)

    onMounted(() => {
      load()
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      store,
      tasks,
      newTask,
      newTaskPomodoros,
      isAddMenu,
      isTaskMenuOpen,
      filter,
      filters,
      filteredTasks,
      doneCount,
      totalCount,
      progressPct,
      editingId,
      editText,
      activeTaskId,
      menuRef,
      addInputRef,
      editInputRef,
      addTask,
      toggleTask,
      deleteTask,
      startEdit,
      saveEdit,
      cancelEdit,
      setActiveTask,
      toggleAddMenu,
      toggleTaskMenu,
      resetTasks,
      clearFinishedTasks,
      finishAllTasks,
      unfinishAllTasks,
    }
  },
})
</script>

<style>
.scrollbar-thin {
  scrollbar-width: thin;
  scroll-behavior: smooth;
  scrollbar-color: #0000004b transparent;
}
</style>