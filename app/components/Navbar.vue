<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  theme: { type: String, default: 'light' },
})

const route = useRoute()
const { isAuthenticated } = useAuth()

const links = computed(() => {
  const base = [
    { to: '/documentation', label: 'Docs' },
    { to: '/about', label: 'About' },
    { to: '/privacy', label: 'Privacy' },
  ]

  // Signed-in visitors need an obvious way back from the landing/info pages.
  if (!isAuthenticated.value || route.path.startsWith('/dashboard')) return base

  return [{ to: '/dashboard', label: 'Dashboard' }, ...base]
})

const isDark = computed(() => props.theme === 'dark')
const mobileOpen = ref(false)

const header = ref(null)
let mm
let ctx

const linkClass = computed(() => (
  isDark.value
    ? 'text-white/45 transition-colors hover:text-white'
    : 'text-neutral-500 transition-colors hover:text-[#17191F]'
))

const activeLinkClass = computed(() => (isDark.value ? '!text-white' : '!text-[#17191F]'))

const utilityClass = computed(() => (
  isDark.value
    ? 'border-white/[0.09] text-white/55 hover:bg-white/[0.06] hover:text-white'
    : 'border-neutral-300 text-neutral-500 hover:bg-white/70 hover:text-[#17191F]'
))

watch(() => route.fullPath, () => {
  mobileOpen.value = false
})

onMounted(async () => {
  const { gsap } = await useGsap()

  mm = gsap.matchMedia()
  ctx = gsap.context(() => {
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('[data-nav-brand]', {
        y: -12,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
      })

      gsap.from('[data-nav-link]', {
        y: -10,
        opacity: 0,
        duration: 0.55,
        stagger: 0.06,
        delay: 0.12,
        ease: 'power3.out',
      })

      gsap.from('[data-nav-cta]', {
        y: -10,
        opacity: 0,
        duration: 0.55,
        stagger: 0.06,
        delay: 0.2,
        ease: 'power3.out',
      })
    })
  }, header.value)
})

onBeforeUnmount(() => {
  mm?.revert()
  ctx?.revert()
})
</script>

<template>
  <header
    ref="header"
    class="sticky top-0 z-40 w-full  transition-colors"
    :class="isDark ? 'border-white/[0.07] bg-[#0c0c0d]/85' : 'border-neutral-300/70 bg-[#F5F4EF]/85'"
  >
    <nav
      aria-label="Primary navigation"
      class="grid h-20 w-full grid-cols-[1fr_auto_1fr] items-center px-6 md:px-12"
    >
      <NuxtLink
        data-nav-brand
        to="/"
        class="geist-600 justify-self-start text-xl tracking-tight"
        :class="isDark ? 'text-white' : 'text-[#17191F]'"
      >
        fleur<span :class="isDark ? 'text-[#6D86FF]' : 'text-[#3155D9]'">ıs.</span>
      </NuxtLink>

      <div class="hidden items-center justify-center gap-9 text-sm md:flex geist-500" :class="isDark ? 'text-white/45' : 'text-neutral-500'">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          data-nav-link
          :to="link.to"
          :class="linkClass"
          :active-class="activeLinkClass"
        >
          {{ link.label }}
        </NuxtLink>
      </div>

      <div class="col-start-3 flex items-center justify-self-end gap-1.5 sm:gap-2">
        <div data-nav-cta>
          <AccountMenu :theme="theme" />
        </div>

        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors md:hidden"
          :class="utilityClass"
          :aria-expanded="mobileOpen"
          aria-label="Toggle navigation menu"
          @click="mobileOpen = !mobileOpen"
        >
          <svg v-if="!mobileOpen" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </nav>

    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="-translate-y-1 opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <div
        v-if="mobileOpen"
        class="border-t px-6 py-4 md:hidden"
        :class="isDark ? 'border-white/[0.07] bg-[#0c0c0d]/95' : 'border-neutral-300/70 bg-[#F5F4EF]/95'"
      >
        <div class="flex flex-col gap-1">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="rounded-lg px-3 py-2.5 text-[13px] transition-colors"
            :class="linkClass"
            :active-class="activeLinkClass"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>
    </transition>
  </header>
</template>
