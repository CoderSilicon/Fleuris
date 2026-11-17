<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { userDisplayName, userInitials } from '~/utils/auth'

const props = defineProps({
  theme: { type: String, default: 'light' },
})

const isDark = computed(() => props.theme === 'dark')

const router = useRouter()
const { user, isAuthenticated, isLocal, isCloud, signOut, busy } = useAuth()
const { cloudStatus, cloudError, syncNow } = useGraphs()

const open = ref(false)
const root = ref(null)
const mounted = ref(false)

// Render the signed-out controls during SSR and the first client render so
// hydration matches, then reveal the account once the session is known.
const signedIn = computed(() => mounted.value && isAuthenticated.value)

const displayName = computed(() => userDisplayName(user.value))
const email = computed(() => user.value?.email || (isLocal.value ? 'Local account' : ''))
const initials = computed(() => userInitials(user.value))
const firstName = computed(() => displayName.value.split(/\s+/)[0] || 'Account')

const syncLabel = computed(() => {
  if (!isAuthenticated.value) return 'Not signed in'
  if (isLocal.value) return 'Local account'
  if (cloudStatus.value === 'syncing') return 'Syncing…'
  if (cloudStatus.value === 'error') return 'Sync paused'
  if (cloudStatus.value === 'synced') return 'Synced'
  return 'Ready to sync'
})

const syncTone = computed(() => {
  if (cloudStatus.value === 'error') return 'bg-[#F5A623]'
  if (cloudStatus.value === 'synced') return 'bg-[#34D399]'
  if (cloudStatus.value === 'syncing') return 'bg-[#8CA4FF] animate-pulse'
  return isDark.value ? 'bg-white/25' : 'bg-neutral-400'
})

const ghostClass = computed(() => (
  isDark.value
    ? 'text-white/55 hover:text-white'
    : 'text-neutral-500 hover:text-[#17191F]'
))

const primaryClass = 'inline-flex items-center rounded-full bg-[#3155D9] px-4 py-2.5 text-[11.5px] geist-500 text-white transition-colors hover:bg-[#2445BB]'

const localBadgeClass = computed(() => (
  isDark.value
    ? 'border-white/[0.09] bg-white/[0.035] text-white/40'
    : 'border-neutral-300 bg-white/50 text-neutral-500'
))

const triggerClass = computed(() => (
  isDark.value
    ? 'border-white/[0.09] bg-white/[0.035] text-white/80 hover:border-white/[0.16] hover:bg-white/[0.06]'
    : 'border-neutral-300 bg-white/60 text-[#17191F] hover:border-neutral-400 hover:bg-white'
))

const panelClass = computed(() => (
  isDark.value
    ? 'border-white/[0.09] bg-[#141821] text-[#F5F4EF] shadow-black/60'
    : 'border-neutral-300 bg-[#FBFAF6] text-[#17191F] shadow-neutral-400/30'
))

const dividerClass = computed(() => (
  isDark.value ? 'border-white/[0.07]' : 'border-neutral-300/80'
))

const mutedClass = computed(() => (isDark.value ? 'text-white/40' : 'text-neutral-500'))

const itemClass = computed(() => (
  isDark.value
    ? 'text-white/60 hover:bg-white/[0.05] hover:text-white'
    : 'text-neutral-600 hover:bg-[#17191F]/[0.04] hover:text-[#17191F]'
))

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onPointerDown(event) {
  if (root.value && !root.value.contains(event.target)) close()
}

function onKeyDown(event) {
  if (event.key === 'Escape') close()
}

watch(() => user.value?.id, close)

onMounted(() => {
  mounted.value = true
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeyDown)
})

async function handleSignOut() {
  close()
  await signOut()
  await router.push('/login')
}

async function handleSync() {
  if (cloudStatus.value === 'syncing') return
  await syncNow()
}
</script>

<template>
  <div ref="root" class="relative flex items-center gap-2">
    <template v-if="!signedIn">
      <NuxtLink to="/login" class="rounded-full px-2 py-2 text-[12px] transition-colors" :class="ghostClass">
        Sign in
      </NuxtLink>
      <NuxtLink to="/signup" :class="primaryClass">
        Get started
      </NuxtLink>
    </template>

    <template v-else>
      <button
        type="button"
        class="inline-flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition-colors"
        :class="triggerClass"
        :aria-expanded="open"
        aria-haspopup="menu"
        @click="toggle"
      >
        <span class="flex h-7 w-7 items-center justify-center rounded-full bg-[#3155D9] geist-600 text-xl tracking-wide text-white">
          {{ initials }}
        </span>
        <span class="hidden max-w-[130px] text-left leading-tight sm:block">
          <span class="block truncate text-[11px] font-medium">{{ firstName }}</span>
          <span class="block truncate text-[9px] opacity-50">{{ email }}</span>
        </span>
        <svg
          class="h-3 w-3 shrink-0 opacity-40 transition-transform"
          :class="open ? 'rotate-180' : ''"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9 6 6 6-6" />
        </svg>
      </button>

<transition
  enter-active-class="transition duration-150 ease-out"
  enter-from-class="translate-y-1 scale-[0.98] opacity-0"
  leave-active-class="transition duration-100 ease-in"
  leave-to-class="translate-y-1 scale-[0.98] opacity-0"
>
  <div
    v-if="open"
    class="absolute right-0 top-full z-50 mt-2 w-[272px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111319]"
    role="menu"
  >
    <!-- Header / Account Info -->
    <div class="border-b border-white/[0.06] px-4 py-3.5">
      <div class="flex items-center gap-3">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4B6BFF] text-[11px] font-semibold tracking-wide text-[#8CA4FF]">
          {{ initials }}
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="truncate text-[12.5px] font-medium text-white/90">{{ displayName || 'Your account' }}</p>
          </div>
          <p class="truncate text-[10.5px] text-white/40">{{ email }}</p>
        </div>
      </div>


      <p v-if="cloudError" class="mt-2 text-[10px] leading-relaxed text-amber-400/85">
        {{ cloudError }}
      </p>
    </div>

    <!-- Navigation Links -->
    <div class="p-1.5">
      <NuxtLink
        to="/dashboard"
        class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11.5px] text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white"
        role="menuitem"
        @click="close"
      >
        <svg class="h-3.5 w-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13ZM8 4v16" />
        </svg>
        Your graphs
      </NuxtLink>

      <button
        v-if="isCloud"
        type="button"
        class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11.5px] text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white disabled:cursor-wait disabled:opacity-40"
        :disabled="cloudStatus === 'syncing'"
        role="menuitem"
        @click="handleSync"
      >
        <svg class="h-3.5 w-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />
        </svg>
        {{ cloudStatus === 'syncing' ? 'Syncing…' : 'Sync now' }}
      </button>

      <NuxtLink
        to="/documentation#accounts"
        class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11.5px] text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white"
        role="menuitem"
        @click="close"
      >
        <svg class="h-3.5 w-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 16v-4m0-4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />
        </svg>
        Account & sync
      </NuxtLink>
    </div>

    <!-- Sign Out Footer -->
    <div class="border-t border-white/[0.06] p-1.5">
      <button
        type="button"
        class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11.5px] text-red-400 transition-colors hover:bg-red-500/[0.08] disabled:opacity-40"
        :disabled="busy"
        role="menuitem"
        @click="handleSignOut"
      >
        <svg class="h-3.5 w-3.5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
        </svg>
        Sign out
      </button>
    </div>
  </div>
</transition>
    </template>
  </div>
</template>
