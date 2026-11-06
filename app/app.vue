<script setup>
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import "./styles/globals.css"

useHead({
  title: 'Fleurıs'
})

</script>

<template>
  <div class="flex min-h-screen flex-col overflow-x-hidden bg-[#F5F4EF] text-[#17191F]">
    <!-- <Navbar /> -->
    <main class="flex-1">
      <NuxtPage />
    </main>
    <!-- <Footer /> -->
  </div>
</template>