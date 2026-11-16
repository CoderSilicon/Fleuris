<script setup>
useHead({ title: 'Privacy & data — fleurıs' })

const principles = [
  {
    title: 'Your work stays with you',
    detail: 'fleurıs is designed so your graphs remain with you on your device. You don’t need an account to start, and your thinking space is meant to feel personal.',
    tone: 'border-[#3155D9] bg-[#3155D9]/[0.04]',
  },
  {
    title: 'You choose what to keep and share',
    detail: 'You can save a copy of a graph as a file whenever you want — for backup, moving to another place, or sharing with someone you trust.',
    tone: 'border-[#34D399] bg-[#34D399]/[0.08]',
  },
  {
    title: 'Simple and clear',
    detail: 'fleurıs avoids unnecessary complexity. If features change in the future (like adding sign-in), the app will explain what that means in plain language.',
    tone: 'border-[#8CA4FF] bg-[#8CA4FF]/[0.08]',
  },
]

const controls = [
  { title: 'Create and change', detail: 'Add, edit, organize, duplicate, and remove your graphs whenever you like.' },
  { title: 'Keep a file copy', detail: 'Export a graph as a file so you have a backup you control.' },
  { title: 'Bring work back', detail: 'Import a saved graph file to continue where you left off.' },
  { title: 'Let go of work', detail: 'Delete graphs you no longer need, and clear your browser’s site data if you want to remove what’s kept on this device.' },
]

const reminders = [
  'Because your graphs stay on this device, they may not automatically appear on another device or browser. Saving a file copy is the easiest way to move them.',
  'If you clear your browser’s saved site data or use a temporary/private window, work kept on this device may be removed. Keeping a file copy of important graphs is a good habit.',
  'If sign-in or other connected features are added later, this page will be updated to clearly explain what changes and what choices you have.',
]
</script>

<template>
  <div class="w-full px-6 py-12 md:px-12 md:py-16 lg:px-20">
    <header class="border-b border-neutral-300 pb-10">
      <p class="text-xs uppercase tracking-[0.2em] text-[#3155D9] geist-500">Privacy & care</p>
      <h1 class="mt-4 text-4xl geist-500 tracking-tight text-[#17191F] md:text-5xl">Your work, your control</h1>
      <p class="mt-5 max-w-4xl text-base leading-relaxed text-neutral-600 geist-400 md:text-lg">
        fleurıs is built to feel safe and personal. It helps you keep your ideas connected without asking you to hand them over. This page explains, in plain language, how your work is treated and what you can do to look after it.
      </p>
      <div class="mt-5 border-l-2 border-[#3155D9] bg-[#3155D9]/[0.04] px-5 py-4">
        <p class="text-sm leading-relaxed text-neutral-700 geist-400 md:text-base">
          <span class="geist-500 text-[#17191F]">Right now:</span> you can use fleurıs without an account. Your graphs stay with you on this device, and you can save your own file copies anytime.
          <span class="geist-500 text-[#2445BB]"> Sign-in will be added later</span> to make access easier across places, and this page will be updated clearly if anything changes.
        </p>
      </div>
    </header>

    <div class="mt-12 space-y-14">
      <section>
        <h2 class="text-2xl geist-500 tracking-tight text-[#17191F]">What fleurıs aims to do for you</h2>
        <div class="mt-5 grid gap-4 lg:grid-cols-3">
          <article v-for="item in principles" :key="item.title" :class="['border-l-2 p-5', item.tone]">
            <h3 class="text-base geist-500 tracking-tight text-[#17191F]">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-neutral-700 geist-400 md:text-base">{{ item.detail }}</p>
          </article>
        </div>
      </section>

      <section class="border-t border-neutral-300 pt-10">
        <h2 class="text-2xl geist-500 tracking-tight text-[#17191F]">What you’re in control of</h2>
        <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article v-for="item in controls" :key="item.title" class="border border-neutral-300 bg-white/40 p-5">
            <p class="text-xs uppercase tracking-[0.16em] text-[#3155D9] geist-500">{{ item.title }}</p>
            <p class="mt-2 text-sm leading-relaxed text-neutral-600 geist-400">{{ item.detail }}</p>
          </article>
        </div>
      </section>

      <section class="border-t border-neutral-300 pt-10">
        <h2 class="text-2xl geist-500 tracking-tight text-[#17191F]">Good to keep in mind</h2>
        <div class="mt-5 grid gap-4 lg:grid-cols-3">
          <div v-for="item in reminders" :key="item" class="border border-neutral-300 bg-white/40 p-5">
            <p class="text-sm leading-relaxed text-neutral-600 geist-400 md:text-base">{{ item }}</p>
          </div>
        </div>
      </section>

      <section class="border-t border-neutral-300 pt-10">
        <h2 class="text-2xl geist-500 tracking-tight text-[#17191F]">A simple promise</h2>
        <p class="mt-4 max-w-4xl text-sm leading-relaxed text-neutral-600 geist-400 md:text-base">
          fleurıs is meant to help you think clearly, not to make things complicated. As the app grows, the goal stays the same: keep your ideas connected, keep your experience simple, and be clear and respectful about how your work is handled.
        </p>
      </section>
    </div>
  </div>
</template>
