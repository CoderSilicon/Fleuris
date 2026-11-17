<script setup>
const principles = [
  {
    title: 'Local by default',
    detail: 'A local account is all you need. Your name and graphs stay in this browser, and your thinking space feels personal and close at hand.',
    tone: 'border-[#3155D9] bg-[#3155D9]/[0.04]',
  },
  {
    title: 'Cloud only when you choose',
    detail: 'Choosing a cloud account adds an optional synced copy through Supabase. Signing out returns you to the sign-in page to choose again.',
    tone: 'border-[#34D399] bg-[#34D399]/[0.08]',
  },
  {
    title: 'Yours to take with you',
    detail: 'You can export your graphs as a file whenever you want — for backup, moving to another place, or sharing with someone you trust.',
    tone: 'border-[#8CA4FF] bg-[#8CA4FF]/[0.08]',
  },
]

const controls = [
  { title: 'Create and change', detail: 'Add, edit, organize, duplicate, and remove your graphs whenever you like.' },
  { title: 'Keep a file copy', detail: 'Export a graph as a file so you have a backup you control.' },
  { title: 'Bring work back', detail: 'Import a saved graph file to continue where you left off.' },
  { title: 'Sign out anytime', detail: 'End the current account and return to the sign-in page. Your browser copy stays in place.' },
]

const accountData = [
  {
    title: 'Account details',
    detail: 'With a local account, only a display name is stored in this browser. With a cloud account, your email address and optional display name are used; passwords are handled by Supabase and never visible inside fleurıs.',
  },
  {
    title: 'Graph content',
    detail: 'Titles, descriptions, nodes, connections, and canvas positions for graphs you create or open while signed in.',
  },
  {
    title: 'Where it lives',
    detail: 'In your Supabase project. Row-level security policies restrict every row to the account that owns it.',
  },
  {
    title: 'What fleurıs does not do',
    detail: 'No advertising, no third-party analytics, no selling your data, and no tracking scripts beyond what the app needs to work.',
  },
]

const reminders = [
  'With a local account, everything stays in this browser. Clearing saved site data or using a private window removes the local account and its graphs, so keep a file copy of important work.',
  'Local and cloud graph libraries are kept separate. Signing into a cloud account never uploads this browser’s local graphs. On a shared device, sign out when you are finished.',
  'If you clear browser data while signed in, your synced copy remains in your account and can be restored by signing in again.',
  'Deleting a graph while signed in removes it from this browser and from your account. Export a copy first if you want to keep it.',
  'Supabase provides the account and database infrastructure. Like any hosted service, it may keep standard technical logs such as request times and IP addresses.',
]
</script>

<template>
  <div class="w-full px-6 py-12 md:px-12 md:py-16 lg:px-20">
    <header class="border-b border-neutral-300 pb-10">
      <h1 class="mt-4 text-4xl geist-500 tracking-tight text-[#17191F] md:text-5xl">Your work, your control</h1>
      <p class="mt-5 max-w-4xl text-base leading-relaxed text-neutral-600 geist-400 md:text-lg">
        fleurıs is built to feel safe and personal. It helps you keep your ideas connected without asking you to hand them over. This page explains how your work is treated, what changes when you sign in, and what you can do to look after it.
      </p>
      <div class="mt-5 border-l-2 border-[#3155D9] bg-[#3155D9]/[0.04] px-5 py-4">
        <p class="text-sm leading-relaxed text-neutral-700 geist-400 md:text-base">
          <span class="geist-500 text-[#17191F]">To get started:</span> create a local account with just a name. Your graphs stay in this browser, and you can save your own file copies anytime.
          <span class="geist-500 text-[#2445BB]"> A cloud account is optional</span> and only adds cloud sync between devices.
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
        <div class="flex flex-wrap items-end justify-between gap-4">
          <h2 class="text-2xl geist-500 tracking-tight text-[#17191F]">If you sign in</h2>
          <NuxtLink to="/documentation#accounts" class="text-xs geist-500 text-[#3155D9] transition-colors hover:text-[#2445BB]">
            How accounts and sync work →
          </NuxtLink>
        </div>
        <p class="mt-4 max-w-4xl text-sm leading-relaxed text-neutral-600 geist-400 md:text-base">
          An account exists to sync graphs, nothing more. This is the information involved when you choose to use one.
        </p>
        <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article v-for="item in accountData" :key="item.title" class="border border-neutral-300 bg-white/40 p-5">
            <p class="text-xs uppercase tracking-[0.16em] text-[#3155D9] geist-500">{{ item.title }}</p>
            <p class="mt-2 text-sm leading-relaxed text-neutral-600 geist-400">{{ item.detail }}</p>
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
          fleurıs is meant to help you think clearly, not to make things complicated. The goal stays the same: keep your ideas connected, keep your experience simple, and be clear and respectful about how your work is handled.
        </p>
      </section>
    </div>
  </div>
</template>
