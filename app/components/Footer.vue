<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="border-t border-neutral-300">
    <div
      class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between md:px-12"
    >
      <span>fleurıs. © 2026</span>
      <div class="flex flex-wrap gap-x-8 gap-y-3">
        <RouterLink to="/concept" class="transition-colors hover:text-[#17191F]">Concept</RouterLink>
        <RouterLink to="/documentation" class="transition-colors hover:text-[#17191F]">Docs</RouterLink>
        <RouterLink to="/about" class="transition-colors hover:text-[#17191F]">About</RouterLink>
        <RouterLink to="/privacy" class="transition-colors hover:text-[#17191F]">Privacy</RouterLink>
      </div>
      <span>Built for curious minds.</span>
    </div>
  </footer>
</template>