<script setup>
defineProps({
  eyebrow: String,
  cta: { type: String, default: 'Create your first graph' },
})

const section = ref(null)
let mm
let ctx

onMounted(async () => {
  const { gsap } = await useGsap()

  mm = gsap.matchMedia()
  ctx = gsap.context(() => {
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('[data-cta-line]', {
        yPercent: 112,
        duration: 1,
        stagger: 0.1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: section.value,
          start: 'top 78%',
          once: true,
        },
      })
    })
  }, section.value)
})

onBeforeUnmount(() => {
  mm?.revert()
  ctx?.revert()
})
</script>

<template>
  <section
    ref="section"
    class="mx-auto w-full max-w-7xl border-t border-neutral-300 px-6 py-24 md:px-12 md:py-36"
  >
    <div class="flex flex-col items-start">
      <p
        v-if="eyebrow"
        v-reveal
        class="mb-7 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-[#3155D9]"
      >
        <span class="h-px w-7 bg-[#3155D9]"></span>
        {{ eyebrow }}
      </p>

      <h2 class="max-w-4xl text-[clamp(3rem,7vw,7.5rem)] geist-500 leading-[0.92] tracking-[-0.07em]">
        <span class="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <span data-cta-line class="block">Make your thoughts</span>
        </span>
        <span class="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <span data-cta-line class="block text-[#3155D9]">connect.</span>
        </span>
      </h2>

      <NuxtLink
        v-reveal="{ delay: 0.15 }"
        to="/pricing"
        class="mt-12 inline-flex items-center justify-center rounded-full bg-[#3155D9] px-8 py-5 text-sm geist-500 text-white transition-all duration-200 hover:bg-[#2744b5] active:scale-[0.98]"
      >
        {{ cta }}
      </NuxtLink>
    </div>
  </section>
</template>
