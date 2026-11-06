<script setup>
import Cta from '../components/Cta.vue'

const values = [
  { n: '01', title: 'Curiosity first', body: 'We build for people who follow a question wherever it leads, not for people who file things away.' },
  { n: '02', title: 'Connections over folders', body: 'Hierarchies force a single home for every idea. Graphs let an idea live in many places at once.' },
  { n: '03', title: 'Calm by design', body: 'No feeds, no notifications, no noise. Just you and the shape of what you know.' },
]

const team = [
  { name: 'Mara Okafor', role: 'Co-founder, Product' },
  { name: 'Jonas Lind', role: 'Co-founder, Engineering' },
  { name: 'Priya Raman', role: 'Design' },
  { name: 'Theo Marchand', role: 'Research' },
]
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-6 pb-20 pt-10 md:px-12 md:pb-28 md:pt-16">
    <p
      v-reveal
      class="mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-[#3155D9]"
    >
      <span class="h-px w-7 bg-[#3155D9]"></span>
      About fleuris.
    </p>
    <h1
      v-reveal
      class="max-w-5xl text-[clamp(3rem,7vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.06em]"
    >
      We make tools for thinking that <span class="text-[#3155D9]">grow with you.</span>
    </h1>
    <div class="mt-12 grid gap-10 md:grid-cols-2">
      <p v-reveal="{ delay: 0.1 }" class="max-w-lg text-lg leading-relaxed text-neutral-500">
        fleuris started as a notebook full of arrows. Every time we learned something, we drew a
        line back to something older. The notebook ran out of pages long before the ideas ran out
        of connections.
      </p>
      <p v-reveal="{ delay: 0.18 }" class="max-w-lg text-lg leading-relaxed text-neutral-500">
        So we built the space we wanted: a living graph where notes, questions and discoveries
        link to each other, and where the shape of your thinking becomes visible.
      </p>
    </div>
  </section>

  <section class="bg-[#17191F] text-[#F5F4EF]">
    <div class="mx-auto w-full max-w-7xl px-6 py-24 md:px-12 md:py-28">
      <p v-reveal class="mb-14 text-xs uppercase tracking-[0.25em] text-[#8CA4FF]">What we believe</p>
      <div class="grid gap-px overflow-hidden bg-neutral-700 md:grid-cols-3">
        <div
          v-for="(v, index) in values"
          :key="v.n"
          v-reveal="{ delay: index * 0.08 }"
          class="flex flex-col bg-[#17191F] p-8 md:p-10"
        >
          <span class="mb-16 text-xs tracking-[0.2em] text-[#8CA4FF]">{{ v.n }}</span>
          <h3 class="mb-4 text-2xl tracking-tight">{{ v.title }}</h3>
          <p class="leading-relaxed text-neutral-400">{{ v.body }}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="mx-auto w-full max-w-7xl px-6 py-24 md:px-12 md:py-28">
    <p v-reveal class="mb-14 text-xs uppercase tracking-[0.25em] text-[#3155D9]">The people</p>
    <ul class="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      <li
        v-for="(p, index) in team"
        :key="p.name"
        v-reveal="{ delay: index * 0.06 }"
        class="border-t border-[#17191F] pt-5"
      >
        <p class="text-xl tracking-tight">{{ p.name }}</p>
        <p class="mt-1 text-sm text-neutral-500">{{ p.role }}</p>
      </li>
    </ul>
  </section>

  <Cta eyebrow="Join us." cta="Start for free ↗" />
</template>