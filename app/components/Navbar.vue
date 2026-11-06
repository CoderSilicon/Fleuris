<script setup>
const links = [
  { to: '/concept', label: 'Concept' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About us' },
]

const header = ref(null)
let mm
let ctx

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
  <header ref="header" class="w-full">
    <nav
      aria-label="Primary navigation"
      class="grid h-20 w-full grid-cols-[1fr_auto_1fr] items-center px-6 md:px-12"
    >
      <NuxtLink
        data-nav-brand
        to="/"
        class="geist-600 justify-self-start text-xl tracking-tight"
      >
        fleur<span class="text-[#3155D9]">ıs.</span>
      </NuxtLink>

      <div class="hidden items-center justify-center gap-9 text-sm text-neutral-500 md:flex">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          data-nav-link
          :to="link.to"
          class="transition-colors hover:text-[#17191F]"
          active-class="!text-[#17191F]"
        >
          {{ link.label }}
        </NuxtLink>
      </div>

      <div class="col-start-3 flex items-center justify-self-end gap-2 text-sm text-neutral-500">
        <NuxtLink
          data-nav-cta
          to="/pricing"
          class="hidden rounded-full px-4 py-3 text-[#3155D9] transition-colors hover:text-[#2445BB] sm:inline-flex"
        >
          Sign in
        </NuxtLink>
        <NuxtLink
          data-nav-cta
          to="/pricing"
          class="inline-flex items-center rounded-full bg-[#3155D9] px-5 py-3 text-sm text-white transition-colors hover:bg-[#2445BB]"
        >
          Get started
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>
