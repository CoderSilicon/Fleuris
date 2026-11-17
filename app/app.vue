<script setup>
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import './styles/globals.css'

const route = useRoute()

const isDashboard = computed(() => (
  route.path === '/dashboard' || route.path.startsWith('/dashboard/')
))

const isEditor = computed(() => /^\/dashboard\/[^/]+\/?$/.test(route.path))

const isAuth = computed(() => (
  route.path === '/login'
  || route.path === '/signup'
  || route.path.startsWith('/auth/')
))

const showNavbar = computed(() => !isEditor.value && !isAuth.value)
const showFooter = computed(() => !isDashboard.value && !isAuth.value)
const navbarTheme = computed(() => (isDashboard.value ? 'dark' : 'light'))

useHead({
  title: 'Fleurıs',
})
</script>

<template>
  <div
    class="flex min-h-screen flex-col overflow-x-hidden"
    :class="isDashboard ? 'bg-[#0c0c0d] text-[#F5F4EF]' : 'bg-[#F5F4EF] text-[#17191F]'"
  >
    <Navbar v-if="showNavbar" :theme="navbarTheme" />
    <main class="flex-1">
      <NuxtPage />
    </main>
    <Footer v-if="showFooter" />
  </div>
</template>
