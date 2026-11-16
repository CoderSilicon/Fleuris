<script setup>
// Nuxt passes an error object automatically
const props = defineProps({
  error: Object
})

const isNotFound = computed(() => props.error?.statusCode === 404)

// Clear the error and safely redirect back to dashboard
const handleError = () => {
  clearError({ redirect: '/dashboard' })
}
</script>

<template>
  <div class="relative flex min-h-screen flex-col items-center justify-center bg-[#0B0C10] px-6 font-sans text-white selection:bg-[#4B6BFF]/30">

    <!-- Full-screen content layout -->
    <div class="relative z-10 max-w-md text-center">
      <!-- Status Code Badge / Number -->
      <div class="inline-flex items-center gap-2  px-3.5 py-1 geist-400 text-9xl tracking-wider text-[#4B6BFF] backdrop-blur-md">
        {{ error?.statusCode || 'ERROR' }}
      </div>

      <!-- Main Headline -->
      <h1 class="mt-6 text-[32px] font-semibold tracking-[-0.03em] text-white">
        {{ isNotFound ? 'Page not found.' : 'An error occurred.' }}
      </h1>

      <!-- Description -->
      <p class="mt-2.5 text-[13px] leading-relaxed text-white/40">
        <template v-if="isNotFound">
          The page or graph you are looking for doesn't exist, has been removed, or the link is incorrect.
        </template>
        <template v-else>
          {{ error?.message || 'Something went wrong while processing your request. Please try again.' }}
        </template>
      </p>

      <!-- Action Button -->
      <div class="mt-8 flex items-center justify-center gap-3">
        <button
          @click="handleError"
          class="inline-flex items-center gap-2 rounded-xl bg-[#4B6BFF] px-5 py-2.5 text-[12px] font-medium text-white transition-all hover:bg-[#5B78FF] active:scale-[0.98]"
        >
          Return 
        </button>
      </div>
    </div>

    <!-- Footer Branding -->
  </div>
</template>