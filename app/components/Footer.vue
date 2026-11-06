<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="border-t border-neutral-300">
    <div
      class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between md:px-12"
    >
      <span>fleurıs. © 2026</span>
      <div class="flex gap-8">
        <RouterLink to="/about" class="hover:text-black">About</RouterLink>
        <RouterLink to="/concept" class="hover:text-black">Concept</RouterLink>
        <RouterLink to="/pricing" class="hover:text-black">Pricing</RouterLink>
      </div>
      <span>Built for curious minds.</span>
    </div>
  </footer>
</template>