<template>
  <div
    class="lexend relative mx-auto max-w-md rounded-[2rem] p-8 sm:p-10 transition-colors duration-700 select-none shadow-2xl shadow-black/10 ring-1 ring-white/15"
    :class="[ComputedColor]"
  >
    <!-- Mode Navigation -->
    <nav class="mb-10 flex justify-center">
      <ul class="flex gap-1 rounded-full bg-black/15 p-1 list-none">
        <li
          v-for="m in modes"
          :key="m"
          @click="switchMode(m)"
          class="cursor-pointer rounded-full px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300"
          :class="
            mode === m
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-white/70 hover:text-white'
          "
        >
          <span class="hidden sm:inline">{{ labelMap[m] }}</span>
          <span class="sm:hidden">{{ abbreviatedLabels[m] }}</span>
        </li>
      </ul>
    </nav>

    <!-- Timer Ring -->
    <div class="relative mx-auto mb-10 flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
      <svg viewBox="0 0 240 240" class="h-full w-full -rotate-90">
        <circle
          cx="120"
          cy="120"
          r="108"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          stroke-width="6"
        />
        <circle
          cx="120"
          cy="120"
          r="108"
          fill="none"
          stroke="white"
          stroke-width="6"
          stroke-linecap="round"
          :stroke-dasharray="ringCircumference"
          :stroke-dashoffset="ringDashOffset"
          class="transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
        />
      </svg>

      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <p class="font-mono text-5xl sm:text-6xl font-semibold tabular-nums tracking-tight text-white">
          {{ formattedTime }}
        </p>
        <p class="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-white/70">
          {{ sessionLabel }}
        </p>
      </div>
    </div>

    <!-- Session dots (pomodoro cycle progress) -->
    <div class="mb-10 flex justify-center gap-2">
      <span
        v-for="i in 4"
        :key="i"
        class="h-1.5 w-1.5 rounded-full transition-all duration-300"
        :class="i <= cycleDot ? 'bg-white' : 'bg-white/25'"
      />
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-center gap-5">
      <button
        @click="reset"
        aria-label="Reset timer"
        title="Reset"
        class="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-95"
      >
        <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5">
          <path
            d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0 1 14.32-4.86M20 14a8 8 0 0 1-14.32 4.86"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <button
        @click="toggle"
        @keyup.space.prevent="toggle"
        :aria-label="running ? 'Pause timer' : 'Start timer'"
        class="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition-all duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 active:scale-95 motion-reduce:hover:scale-100"
      >
        <svg v-if="!running" viewBox="0 0 24 24" fill="currentColor" class="ml-1 h-6 w-6">
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6">
          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
        </svg>
      </button>

      <!-- spacer to balance the reset button so the play/pause stays centered -->
      <div class="h-11 w-11" aria-hidden="true" />
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, defineComponent } from 'vue'
import { usePomodoroStore } from '@/stores/usePomodoroStore'
import { usePomoColor } from '@/functions/pomoColor'

export default defineComponent({
  name: 'AppPomodoro',

  setup() {
    const store = usePomodoroStore()
    const { getHomePageColor } = usePomoColor()
    const ComputedColor = computed(() => getHomePageColor())

    const modes = ['pomodoro', 'short', 'long'] as const
    type Mode = (typeof modes)[number]
    const labelMap: Record<Mode, string> = {
      pomodoro: 'Pomodoro',
      short: 'Short Break',
      long: 'Long Break',
    }
    const abbreviatedLabels: Record<Mode, string> = {
      pomodoro: 'Pomo',
      short: 'Short',
      long: 'Long',
    }

    const mode = ref<Mode>('pomodoro')
    const timer = ref(0)
    const running = ref(false)
    let interval: ReturnType<typeof setInterval> | null = null

    const durationInSeconds = computed(() => {
      switch (mode.value) {
        case 'short':
          return store.shortBreakDuration * 60
        case 'long':
          return store.longBreakDuration * 60
        default:
          return store.pomodoroDuration * 60
      }
    })

    const formattedTime = computed(() => {
      const minutes = Math.floor(timer.value / 60)
        .toString()
        .padStart(2, '0')
      const seconds = (timer.value % 60).toString().padStart(2, '0')
      return `${minutes}:${seconds}`
    })

    const progressPercentage = computed(() => {
      const total = durationInSeconds.value
      const remaining = timer.value
      return total > 0 ? ((total - remaining) / total) * 100 : 0
    })

    // Circular progress ring math (r = 108)
    const ringCircumference = 2 * Math.PI * 108
    const ringDashOffset = computed(
      () => ringCircumference * (1 - progressPercentage.value / 100),
    )

    const sessionLabel = computed(() => {
      if (mode.value === 'pomodoro') {
        return store.isLongBreakTime ? 'Focus • long break next' : 'Focus session'
      }
      return mode.value === 'short' ? 'Short break' : 'Long break'
    })

    // Fills 1–4 dots based on completed pomodoros in the current cycle
    const cycleDot = computed(() => {
      const n = store.pomodoroCount % 4
      return n === 0 && store.pomodoroCount > 0 ? 4 : n
    })

    function toggle() {
      if (running.value) {
        stop()
        store.pauseTimer()
      } else {
        start()
        store.startTimer()
      }
    }

    function start() {
      if (running.value) return
      running.value = true
      interval = setInterval(() => {
        if (timer.value > 0) {
          timer.value--
          store.timeRemaining = timer.value
        } else {
          handleTimerComplete()
        }
      }, 1000)
    }

    function stop() {
      running.value = false
      if (interval) clearInterval(interval)
    }

    function reset() {
      stop()
      timer.value = durationInSeconds.value
      store.resetTimer()
    }

    function switchMode(newMode: Mode) {
      mode.value = newMode
      store.setMode(newMode)
      reset()
    }

    function handleTimerComplete() {
      stop()
      store.completeTimer()

      if (mode.value === 'pomodoro') {
        const nextMode = store.isLongBreakTime ? 'long' : 'short'
        if (store.settings.autoStartBreaks) {
          setTimeout(() => {
            switchMode(nextMode)
            if (store.settings.autoStartBreaks) {
              setTimeout(() => start(), 500)
            }
          }, 1000)
        } else {
          switchMode(nextMode)
        }
      } else {
        if (store.settings.autoStartPomodoros) {
          setTimeout(() => {
            switchMode('pomodoro')
            setTimeout(() => start(), 500)
          }, 1000)
        } else {
          switchMode('pomodoro')
        }
      }
    }

    watch(durationInSeconds, () => {
      if (!running.value) {
        timer.value = durationInSeconds.value
        store.timeRemaining = timer.value
      }
    })

    watch(
      () => store.currentMode,
      (newMode) => {
        if (newMode !== mode.value) {
          mode.value = newMode
          reset()
        }
      },
    )

    onMounted(() => {
      store.loadFromLocalStorage()
      reset()
      if ('Notification' in window && store.settings.notifications) {
        Notification.requestPermission()
      }
    })

    onUnmounted(() => {
      stop()
    })

    return {
      store,
      modes,
      labelMap,
      abbreviatedLabels,
      mode,
      timer,
      running,
      formattedTime,
      progressPercentage,
      ringCircumference,
      ringDashOffset,
      sessionLabel,
      cycleDot,
      toggle,
      reset,
      switchMode,
      ComputedColor,
    }
  },
})
</script>