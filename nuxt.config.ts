// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  vite: {
    optimizeDeps: {
      include: ['@supabase/supabase-js'],
    },
  },
  runtimeConfig: {
    public: {
      // Values come from `.env.local` (or `.env`) at startup.
      // Use the publishable/anon key only — never a service-role secret.
      // Runtime overrides still work via NUXT_PUBLIC_SUPABASE_URL and
      // NUXT_PUBLIC_SUPABASE_KEY.
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
})
