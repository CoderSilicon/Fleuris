<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { authErrorKind, safeRedirect } from '~/utils/auth'

useHead({ title: 'Sign in — Fleurıs' })

const route = useRoute()
const router = useRouter()
const { signIn, signInLocal, isConfigured, isAuthenticated } = useAuth()

const redirect = computed(() => safeRedirect(route.query.redirect))
const redirectQuery = computed(() => (route.query.redirect ? { redirect: String(route.query.redirect) } : {}))
const signupLink = computed(() => ({ path: '/signup', query: redirectQuery.value }))
const signupWithEmailLink = computed(() => ({
  path: '/signup',
  query: { ...redirectQuery.value, ...(form.email ? { email: form.email } : {}) },
}))

const initialEmail = Array.isArray(route.query.email) ? route.query.email[0] : route.query.email
const mode = ref(route.query.mode === 'local' ? 'local' : 'cloud')

const form = reactive({
  email: typeof initialEmail === 'string' ? initialEmail : '',
  password: '',
})

const localForm = reactive({
  name: '',
})

const showPassword = ref(false)
const error = ref('')
const needsAccount = ref(false)
const submitting = ref(false)
const localError = ref('')

const inputClass = 'w-full rounded-lg border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 text-[13px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#3155D9]/70 focus:bg-[#3155D9]/[0.06]'

function tabClass(active) {
  return active
    ? 'rounded-md bg-white/[0.07] px-2 py-2 text-center font-medium text-white'
    : 'rounded-md px-2 py-2 text-center text-white/40 transition-colors hover:text-white'
}

onMounted(() => {
  if (isAuthenticated.value) router.replace(redirect.value)
})

function showLocal() {
  mode.value = 'local'
  localError.value = ''
  error.value = ''
  needsAccount.value = false
}

async function submitLocal() {
  if (submitting.value) return

  localError.value = ''

  if (!localForm.name.trim()) {
    localError.value = 'Enter a name to finish setting up your local account.'
    return
  }

  submitting.value = true
  try {
    await signInLocal({ name: localForm.name })
    await router.replace(redirect.value)
  } catch (issue) {
    localError.value = issue instanceof Error ? issue.message : 'Could not set up your local account.'
  } finally {
    submitting.value = false
  }
}

async function submit() {
  if (submitting.value) return

  error.value = ''
  needsAccount.value = false

  if (!isConfigured.value) {
    error.value = 'Cloud accounts are not configured. Choose Local to set up this browser.'
    return
  }

  if (!form.email.trim() || !form.password) {
    error.value = 'Enter your email and password to continue.'
    return
  }

  submitting.value = true
  try {
    await signIn({ email: form.email, password: form.password })
    await router.replace(redirect.value)
  } catch (issue) {
    const message = issue instanceof Error ? issue.message : ''
    error.value = message || 'Could not sign in.'
    needsAccount.value = authErrorKind(message) === 'invalid-credentials'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthShell
    title="Welcome back."
    subtitle="Pick up where you left off. Cloud sync keeps your thinking close on every device you use."
  >
    <div class="mb-6 grid grid-cols-3 rounded-lg border border-white/[0.07] bg-white/[0.02] p-1 text-[11px]">
      <button type="button" :class="tabClass(mode === 'cloud')" @click="mode = 'cloud'">
        Sign in
      </button>
      <NuxtLink :to="signupLink" :class="tabClass(false)">
        Create account
      </NuxtLink>
      <button type="button" :class="tabClass(mode === 'local')" @click="showLocal">
        Local
      </button>
    </div>

    <template v-if="mode === 'local'">
      <div class="mb-5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3">
        <p class="text-[11px] font-medium text-white/75">Local account</p>
        <p class="mt-1 text-[10.5px] leading-relaxed text-white/35">
          Your name and graphs stay in this browser. No email, no password, no cloud copy.
        </p>
      </div>

      <div
        v-if="localError"
        class="mb-5 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3.5 py-3 text-[11.5px] leading-relaxed text-red-300/80"
        role="alert"
      >
        {{ localError }}
      </div>

      <form class="space-y-4" @submit.prevent="submitLocal">
        <div>
          <label for="local-name" class="mb-1.5 block text-[9.5px] font-medium uppercase tracking-[0.14em] text-white/35">
            Your name
          </label>
          <input
            id="local-name"
            v-model="localForm.name"
            type="text"
            autocomplete="name"
            maxlength="60"
            placeholder="What should we call you?"
            :class="inputClass"
          />
        </div>

        <button
          type="submit"
          :disabled="submitting"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#3155D9] px-4 py-3 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#3E63E8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span
            v-if="submitting"
            class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
          ></span>
          {{ submitting ? 'Setting up…' : 'Continue to dashboard' }}
        </button>
      </form>

      <p class="mt-5 text-center text-[11px] text-white/35">
        Want sync instead?
        <button type="button" class="font-medium text-[#8CA4FF] transition-colors hover:text-white" @click="mode = 'cloud'">
          Use a cloud account
        </button>
      </p>
    </template>

    <template v-else>

      <div
        v-if="error"
        class="mb-5 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3.5 py-3 text-[11.5px] leading-relaxed text-red-300/80"
        role="alert"
      >
        {{ error }}
        <NuxtLink
          v-if="needsAccount"
          :to="signupWithEmailLink"
          class="mt-2 inline-block font-medium text-[#8CA4FF] transition-colors hover:text-white"
        >
          Create an account instead →
        </NuxtLink>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label for="login-email" class="mb-1.5 block text-[9.5px] font-medium uppercase tracking-[0.14em] text-white/35">
            Email
          </label>
          <input
            id="login-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            inputmode="email"
            placeholder="you@example.com"
            :class="inputClass"
          />
        </div>

        <div>
          <div class="mb-1.5 flex items-center justify-between">
            <label for="login-password" class="block text-[9.5px] font-medium uppercase tracking-[0.14em] text-white/35">
              Password
            </label>
            <span class="text-[10px] text-white/25">6+ characters</span>
          </div>
          <div class="relative">
            <input
              id="login-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Your password"
              :class="[inputClass, 'pr-12']"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <svg v-if="showPassword" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 5.2A10.5 10.5 0 0 1 12 5c5.4 0 9 4.5 9 7 0 .9-.4 2-1.2 3.1M6.2 6.3C4.2 7.7 3 9.8 3 12c0 2.5 3.6 7 9 7 1.2 0 2.3-.2 3.3-.6" />
              </svg>
              <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7Z" />
                <circle cx="12" cy="12" r="2.5" stroke-width="1.7" />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="submitting || !isConfigured"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#3155D9] px-4 py-3 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#3E63E8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span
            v-if="submitting"
            class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
          ></span>
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="mt-6 text-center text-[11px] text-white/35">
        New to fleurıs?
        <NuxtLink :to="signupLink" class="font-medium text-[#8CA4FF] transition-colors hover:text-white">
          Create an account
        </NuxtLink>
      </p>
    </template>
  </AuthShell>
</template>
