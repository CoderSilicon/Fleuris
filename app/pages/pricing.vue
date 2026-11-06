<script setup>
import Cta from '../components/Cta.vue'

const plans = [
  {
    name: 'Seed',
    price: '$0',
    note: 'For getting started',
    features: ['Up to 200 notes', 'Unlimited connections', 'Graph view', 'Web access'],
    cta: 'Start free',
    featured: false,
  },
  {
    name: 'Bloom',
    price: '$9',
    note: 'per month, for individuals',
    features: ['Unlimited notes', 'Suggested links', 'Sync across devices', 'Export to Markdown'],
    cta: 'Choose Bloom',
    featured: true,
  },
  {
    name: 'Grove',
    price: '$24',
    note: 'per seat, for teams',
    features: ['Everything in Bloom', 'Shared graphs', 'Roles and permissions', 'Priority support'],
    cta: 'Choose Grove',
    featured: false,
  },
]
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-6 pb-16 pt-10 md:px-12 md:pb-20 md:pt-16">
    <p
      v-reveal
      class="mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-[#3155D9]"
    >
      <span class="h-px w-7 bg-[#3155D9]"></span>
      Pricing
    </p>
    <h1
      v-reveal
      class="max-w-4xl text-[clamp(3rem,7vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.06em]"
    >
      Start small. <span class="text-[#3155D9]">Grow freely.</span>
    </h1>
  </section>

  <section class="mx-auto w-full max-w-7xl px-6 pb-24 md:px-12 md:pb-32">
    <div class="grid items-stretch gap-6 md:grid-cols-3">
      <article
        v-for="(p, index) in plans"
        :key="p.name"
        v-reveal="{ delay: index * 0.08 }"
        class="flex flex-col p-8 md:p-10"
        :class="p.featured ? 'bg-[#17191F] text-[#F5F4EF]' : 'border border-neutral-300'"
      >
        <h3 class="text-xl tracking-tight">{{ p.name }}</h3>
        <p class="mt-8 text-6xl font-medium tracking-[-0.05em]">{{ p.price }}</p>
        <p class="mt-2 text-sm" :class="p.featured ? 'text-neutral-400' : 'text-neutral-500'">{{ p.note }}</p>

        <ul class="my-10 flex-1 space-y-3 text-sm">
          <li v-for="f in p.features" :key="f" class="flex gap-3">
            <span class="text-[#3155D9]" :class="{ '!text-[#8CA4FF]': p.featured }">●</span>
            {{ f }}
          </li>
        </ul>

        <a
          href="/app"
          class="px-6 py-4 text-center text-sm transition"
          :class="p.featured
            ? 'bg-[#3155D9] text-white hover:bg-[#2445BB]'
            : 'border border-[#17191F] hover:bg-[#17191F] hover:text-white'"
        >
          {{ p.cta }} ↗
        </a>
      </article>
    </div>
  </section>

  <Cta eyebrow="Questions?" cta="Talk to us ↗" />
</template>