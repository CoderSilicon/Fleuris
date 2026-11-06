<script setup>
import Cta from '../components/Cta.vue'

const steps = [
  { n: '01', title: 'Capture', body: 'Drop in a thought, a link, a quote or a question. Nothing needs a folder or a title to begin.' },
  { n: '02', title: 'Connect', body: 'Link any idea to any other. Suggested links surface forgotten notes that relate to what you are writing now.' },
  { n: '03', title: 'Explore', body: 'Zoom out to see clusters and bridges. Follow a path from today back to something you learned years ago.' },
  { n: '04', title: 'Grow', body: 'Your graph compounds. Every new note gains meaning from everything already there.' },
]
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-6 pb-20 pt-10 md:px-12 md:pb-28 md:pt-16">
    <p
      v-reveal
      class="mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-[#3155D9]"
    >
      <span class="h-px w-7 bg-[#3155D9]"></span>
      The concept
    </p>
    <h1
      v-reveal
      class="max-w-5xl text-[clamp(3rem,7vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.06em]"
    >
      Knowledge is a <span class="text-[#3155D9]">network,</span> not a list.
    </h1>
    <p
      v-reveal="{ delay: 0.1 }"
      class="mt-12 max-w-xl text-lg leading-relaxed text-neutral-500 md:text-xl"
    >
      The way you actually think is associative. fleuris gives that structure a home, so every
      note arrives already connected to the rest.
    </p>
  </section>

  <section class="rounded-t-[3rem] bg-[#17191F] text-[#F5F4EF] md:rounded-t-[6rem]">
    <div class="mx-auto w-full max-w-7xl px-6 py-24 md:px-12 md:py-32">
      <p v-reveal class="mb-14 text-xs uppercase tracking-[0.25em] text-[#8CA4FF]">How it works</p>
      <ol class="grid gap-12 md:grid-cols-2">
        <li
          v-for="(s, index) in steps"
          :key="s.n"
          v-reveal="{ delay: index * 0.07 }"
          class="grid grid-cols-[3rem_1fr] gap-4 border-t border-neutral-700 pt-6"
        >
          <span class="text-xs tracking-[0.2em] text-[#8CA4FF]">{{ s.n }}</span>
          <div>
            <h3 class="mb-3 text-3xl tracking-tight">{{ s.title }}</h3>
            <p class="max-w-md leading-relaxed text-neutral-400">{{ s.body }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>

  <Cta />
</template>