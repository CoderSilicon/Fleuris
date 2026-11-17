<script setup>
import { computed, onMounted, ref } from 'vue'
import { authErrorMessage, safeRedirect } from '~/utils/auth'

useHead({ title: 'Finishing sign-in — Fleurıs' })

const route = useRoute()
const router = useRouter()
const { isConfigured } = useAuth()
const { supabase } = useSupabase()

const state = ref('working')
const message = ref('')

const redirect = computed(() => safeRedirect(route.query.redirect))

const redirectQuery = computed(() => (route.query.redirect ? { redirect: String(route.query.redirect) } : {}))

const localSignupLink = computed(() => ({
  path: '/signup',
  query: { ...redirectQuery.value, mode: 'local' },
}))

const loginLink = computed(() => ({
  path: '/login',
  query: redirectQuery.value,
}))

const title = computed(() => {
  if (state.value === 'success') return 'You’re in.'
  if (state.value === 'error') return 'That link didn’t work.'
  if (state.value === 'unconfigured') return 'Cloud accounts aren’t connected.'
  return 'Finishing sign-in…'
})

const subtitle = computed(() => {
  if (state.value === 'success') return 'Your account is ready. Taking you back to your graphs.'
  if (state.value === 'error') return 'The confirmation link may have expired, or it was already used.'
  if (state.value === 'unconfigured') return 'You can still continue with a local account on this device.'
  return 'Checking your confirmation link with Supabase.'
})

onMounted(async () => {
  if (!isConfigured.value || !supabase) {
    state.value = 'unconfigured'
    return
  }

  const queryError = route.query.error_description || route.query.error
  if (queryError) {
    state.value = 'error'
    message.value = authErrorMessage(decodeURIComponent(String(queryError)))
    return
  }

  try {
    const { data: existing } = await supabase.auth.getSession()
    let session = existing.session
    const code = route.query.code

    if (!session && code) {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(String(code))
        if (error && !data.session) throw error
        session = data.session
      } catch (issue) {
        const { data } = await supabase.auth.getSession()
        session = data.session
        if (!session) throw issue
      }
    }

    if (!session) {
      // Give Supabase a moment to detect hash-based sessions from older flows.
      await new Promise((resolve) => setTimeout(resolve, 350))
      const { data } = await supabase.auth.getSession()
      session = data.session
    }

    if (!session) {
      state.value = 'error'
      message.value = 'We could not find a session for this link. Sign in again to continue.'
      return
    }

    state.value = 'success'
    setTimeout(() => {
      router.replace(redirect.value)
    }, 650)
  } catch (issue) {
    state.value = 'error'
    message.value = issue instanceof Error
      ? authErrorMessage(issue.message)
      : 'Something went wrong while confirming your account.'
  }
})
</script>

<template>
  <AuthShell
    :title="title"
    :subtitle="subtitle"
  >
    <div>
      <template v-if="state === 'working'">
        <div class="flex items-center gap-3">
          <span class="h-4 w-4 animate-spin rounded-full border-2 border-[#3155D9]/25 border-t-[#3155D9]"></span>
          <p class="text-[12.5px] font-medium text-white/80">Verifying your link…</p>
        </div>
        <p class="mt-3 text-[11.5px] leading-relaxed text-white/35">
          Keep this tab open for a moment. You’ll be taken to your graphs automatically.
        </p>
      </template>

      <template v-else-if="state === 'success'">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg border border-[#34D399]/25 bg-[#34D399]/10 text-[#34D399]">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <p class="text-[12.5px] font-medium text-white/80">Signed in successfully.</p>
        </div>
        <p class="mt-3 text-[11.5px] leading-relaxed text-white/35">
          Taking you to your workspace now.
        </p>
      </template>

      <template v-else-if="state === 'unconfigured'">
        <p class="text-[12px] leading-relaxed text-white/45">
          Cloud sign-in isn’t configured for this installation. You can set up a local account instead,
          or check the setup notes if you manage this deployment.
        </p>
        <div class="mt-5 flex flex-wrap gap-2">
          <NuxtLink
            :to="localSignupLink"
            class="inline-flex items-center rounded-lg bg-[#3155D9] px-3.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#3E63E8]"
          >
            Create a local account
          </NuxtLink>
          <NuxtLink
            to="/documentation#accounts"
            class="inline-flex items-center rounded-lg border border-white/[0.09] bg-white/[0.025] px-3.5 py-2 text-[11px] font-medium text-white/55 transition-colors hover:border-white/[0.16] hover:text-white"
          >
            Setup notes
          </NuxtLink>
        </div>
      </template>

      <template v-else>
        <p class="text-[12px] leading-relaxed text-white/45">{{ message }}</p>
        <div class="mt-5 flex flex-wrap gap-2">
          <NuxtLink
            :to="loginLink"
            class="inline-flex items-center rounded-lg bg-[#3155D9] px-3.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#3E63E8]"
          >
            Try signing in
          </NuxtLink>
          <NuxtLink
            :to="localSignupLink"
            class="inline-flex items-center rounded-lg border border-white/[0.09] bg-white/[0.025] px-3.5 py-2 text-[11px] font-medium text-white/55 transition-colors hover:border-white/[0.16] hover:text-white"
          >
            Use a local account
          </NuxtLink>
        </div>
      </template>
    </div>
  </AuthShell>
</template>
