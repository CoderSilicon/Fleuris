<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#0c0c0d] text-[#F5F4EF] geist-400">
    <header class="border-b border-white/[0.06]">
      <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:px-8">
        <NuxtLink
          to="/"
          class="text-[19px] font-semibold tracking-tight text-white transition-opacity hover:opacity-80"
        >
          fleur<span class="text-[#6D86FF]">ıs.</span>
        </NuxtLink>
        <NuxtLink to="/" class="text-[11px] text-white/35 transition-colors hover:text-white geist-400">
          Back to home
        </NuxtLink>
      </div>
    </header>

    <main class="flex flex-1 items-center justify-center px-5 py-12 md:py-16">
      <div class="w-full max-w-[400px]">
        <h1 class="mt-3 text-[clamp(1.9rem,4vw,2.55rem)] leading-[1.04] tracking-[-0.045em] text-white">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="mt-2 mx-1 text-[13px] leading-relaxed text-white/40">
          {{ subtitle }}
        </p>

        <div class="mt-7 p-6 md:p-7">
          <slot />
        </div>
      </div>
    </main>

    <footer class="border-t border-white/[0.06]">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 text-[10px] text-white/30 md:px-8">
        <span>fleurıs. © 2026</span>
        <div class="flex items-center gap-5">
          <NuxtLink to="/privacy" class="transition-colors hover:text-white">Privacy</NuxtLink>
          <NuxtLink to="/documentation" class="transition-colors hover:text-white">Docs</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
