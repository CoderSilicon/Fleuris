<script setup>
import GraphMark from '../components/Graphmark.vue'
import Cta from '../components/Cta.vue'

const steps = [
  {
    num: '01',
    title: 'Capture',
    desc: 'Save a fragment, quote, question, or source. No title, folder, or perfect wording required.',
  },
  {
    num: '02',
    title: 'Connect',
    desc: 'Link any idea to any other. Related notes resurface as clusters form across topics.',
  },
  {
    num: '03',
    title: 'Synthesize',
    desc: 'Zoom out to see the bridges between ideas and turn scattered notes into durable frameworks.',
  },
]

const features = [
  {
    num: '01',
    title: 'Bidirectional linking',
    desc: 'Every link works both ways. Open a note and see everything that points back to it—including connections you forgot you made.',
  },
  {
    num: '02',
    title: 'Local-first by default',
    desc: 'Your notes live on your machine, not on someone else’s server. No cloud relay, no tracking, no lock-in.',
  },
  {
    num: '03',
    title: 'A graph that keeps up',
    desc: 'Pan and zoom through thousands of notes in real time with a canvas built for fluid exploration.',
  },
]

const page = ref(null)
let mm
let ctx

onMounted(async () => {
  const { gsap } = await useGsap()

  mm = gsap.matchMedia()
  ctx = gsap.context(() => {
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('[data-hero-line]', {
        yPercent: 112,
        duration: 1.05,
        stagger: 0.09,
        delay: 0.1,
        ease: 'power4.out',
      })

      gsap.from('[data-hero-fade]', {
        y: 24,
        opacity: 0,
        duration: 0.85,
        stagger: 0.1,
        delay: 0.42,
        ease: 'power3.out',
      })

      const paths = gsap.utils.toArray('[data-graph-path]')

      paths.forEach((path) => {
        const length = path.getTotalLength()
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })
      })

      gsap.to(paths, {
        strokeDashoffset: 0,
        duration: 1.5,
        stagger: 0.12,
        delay: 0.2,
        ease: 'power2.inOut',
      })

      gsap.from('[data-graph-node]', {
        scale: 0,
        opacity: 0,
        transformOrigin: '50% 50%',
        duration: 0.7,
        stagger: 0.06,
        delay: 0.5,
        ease: 'back.out(2.2)',
      })

      gsap.from('[data-graph-ring]', {
        scale: 0.5,
        opacity: 0,
        transformOrigin: '50% 50%',
        duration: 0.9,
        stagger: 0.12,
        delay: 0.7,
        ease: 'back.out(1.8)',
      })

      gsap.fromTo(
        '[data-graph-pulse]',
        { scale: 0.85, opacity: 0.5, transformOrigin: '50% 50%' },
        {
          scale: 1.9,
          opacity: 0,
          duration: 2.6,
          delay: 1.4,
          repeat: -1,
          ease: 'power1.out',
        },
      )

      gsap.from('[data-philosophy-line]', {
        yPercent: 112,
        duration: 1,
        stagger: 0.1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '[data-philosophy]',
          start: 'top 72%',
          once: true,
        },
      })
    })
  }, page.value)
})

onBeforeUnmount(() => {
  mm?.revert()
  ctx?.revert()
})
</script>

<template>
  <div ref="page">
    <!-- Hero -->
    <section class="mx-auto w-full px-6 pb-20 pt-10 md:px-12 md:pb-28 md:pt-16">
      <div class="grid items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 class="text-[clamp(3.5rem,8vw,7.5rem)] geist-500 leading-[0.92] tracking-[-0.07em]">
            <span class="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
              <span data-hero-line class="block">Ideas don't</span>
            </span>
            <span class="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
              <span data-hero-line class="block">exist <span class="text-[#3155D9]">alone.</span></span>
            </span>
          </h1>

          <p data-hero-fade class="mt-8 max-w-md text-lg leading-relaxed text-neutral-600 md:text-xl geist-400">
            fleuris connects your notes, questions, and discoveries into one living graph—so every
            idea keeps the context that gave it meaning.
          </p>

          <div data-hero-fade class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <NuxtLink to="/pricing"
              class="inline-flex items-center justify-center rounded-full bg-[#3155D9] px-6 py-3.5 text-sm geist-500 text-white transition-colors hover:bg-[#2445BB]">
              Start for free
            </NuxtLink>
            <NuxtLink to="/concept"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 px-6 py-3.5 text-sm geist-500 transition-colors hover:border-[#17191F]">
              See how it works <span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </div>

        <GraphMark class="mx-auto aspect-square w-full max-w-[280px] opacity-90 sm:max-w-[360px] lg:max-w-none" />
      </div>
    </section>
    <!-- Philosophy -->
    <section data-philosophy
      class="flex min-h-[80vh] items-center rounded-t-[3rem] bg-[#17191F] text-[#F5F4EF] md:rounded-t-[5rem]">
      <div class="mx-auto w-full max-w-7xl px-6 py-24 md:px-12 md:py-32">
        <p class="mb-8 text-xs geist-200 tracking-[0.005em] text-[#8CA4FF]">But why a graph?</p>

        <div class="grid items-end gap-16 md:grid-cols-2">
          <div>
            <h2 class="text-5xl geist-500 leading-[1.02] tracking-[-0.06em] md:text-7xl">
              <span class="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
                <span data-philosophy-line class="block">One thought.</span>
              </span>
              <span class="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
                <span data-philosophy-line class="block">Infinite</span>
              </span>
              <span class="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
                <span data-philosophy-line class="block">directions.</span>
              </span>
            </h2>
          </div>

          <div>
            <p v-reveal class="max-w-md text-lg leading-relaxed text-neutral-400 geist-400">
              A question rarely stays in one place. It opens another, then another—until an idea you
              had years ago suddenly belongs to what you are reading now.
            </p>
            <p v-reveal="{ delay: 0.12 }" class="mt-8 text-sm text-[#8CA4FF] geist-400 md:text-base">
              “Don’t just collect knowledge. Connect it.”
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="mx-auto w-full max-w-7xl px-6 py-20 md:px-12 md:py-32 ">
      <div class="grid gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <h2 v-reveal class="text-[clamp(2.5rem,5vw,4.5rem)] geist-500 leading-[0.98] tracking-[-0.06em]">
            From scattered notes<br />
            to a <span class="text-[#3155D9]">connected mind.</span>
          </h2>

          <p v-reveal="{ delay: 0.1 }" class="mt-6 max-w-lg text-lg leading-relaxed text-neutral-600 geist-400">
            Linear note-taking asks every idea to pick one home. fleuris lets ideas live beside
            everything they are related to—so structure emerges instead of being forced.
          </p>
        </div>

        <ol class="flex flex-col gap-4">
          <li v-for="(step, index) in steps" :key="step.num" v-reveal="{ delay: index * 0.08 }"
            class="flex gap-5 rounded-2xl border border-neutral-300/80 bg-white/50 p-6 transition-colors duration-300 hover:border-[#3155D9]/40 hover:bg-white/80 md:p-8">
            <span class="mt-1 text-xs tracking-[0.2em] text-[#3155D9] geist-500">
              {{ step.num }}
            </span>
            <div>
              <h3 class="text-xl geist-500 tracking-tight">{{ step.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-neutral-600 geist-400">{{ step.desc }}</p>
            </div>
          </li>
        </ol>
      </div>
    </section>


    <!-- Features -->
    <section class="mx-auto w-full max-w-7xl px-6 py-20 md:px-12 md:py-32">
      <div class="grid gap-10 md:grid-cols-2 md:items-end">
        <div>

          <h2 v-reveal class="text-[clamp(2.5rem,5vw,5rem)] geist-500 leading-[0.95] tracking-[-0.06em]">
            Quiet software for<br />
            <span class="text-[#3155D9]">deep thinking.</span>
          </h2>
        </div>

        <p v-reveal="{ delay: 0.1 }" class="max-w-md text-lg leading-relaxed text-neutral-600 geist-400 md:ml-auto">
          No feeds. No notifications. No busywork. Every surface is designed to keep you with the
          idea—not the interface.
        </p>
      </div>

      <div class="mt-20 grid gap-12 md:grid-cols-3">
        <div v-for="(feature, index) in features" :key="feature.num" v-reveal="{ delay: index * 0.08 }"
          class="border-t border-neutral-300 pt-8">
          <span class="text-sm tracking-wider text-[#3155D9] geist-500">{{ feature.num }}</span>
          <h3 class="mt-4 text-2xl geist-500 tracking-tight">{{ feature.title }}</h3>
          <p class="mt-4 text-sm leading-relaxed text-neutral-600 geist-400">{{ feature.desc }}</p>
        </div>
      </div>
    </section>

    <Cta />
  </div>
</template>
