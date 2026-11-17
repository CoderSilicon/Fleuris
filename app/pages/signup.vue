<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { authErrorKind, safeRedirect } from '~/utils/auth'

useHead({ title: 'Create account — Fleurıs' })

const route = useRoute()
const router = useRouter()
const { signUp, signInLocal, isConfigured, isAuthenticated } = useAuth()

const redirect = computed(() => safeRedirect(route.query.redirect))
const loginLink = computed(() => ({
  path: '/login',
  query: route.query.redirect ? { redirect: String(route.query.redirect) } : {},
}))
const signInWithEmailLink = computed(() => ({
  path: '/login',
  query: {
    ...(route.query.redirect ? { redirect: String(route.query.redirect) } : {}),
    ...(form.email ? { email: form.email } : {}),
  },
}))

const initialEmail = Array.isArray(route.query.email) ? route.query.email[0] : route.query.email
const mode = ref(route.query.mode === 'local' ? 'local' : 'cloud')

const form = reactive({
  fullName: '',
  email: typeof initialEmail === 'string' ? initialEmail : '',
  password: '',
  confirm: '',
})

const localForm = reactive({
  name: '',
})

const showPassword = ref(false)
const error = ref('')
const accountExists = ref(false)
const submitting = ref(false)
const needsConfirmation = ref(false)
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
  needsConfirmation.value = false
  localError.value = ''
  error.value = ''
  accountExists.value = false
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
  accountExists.value = false

  if (!isConfigured.value) {
    error.value = 'Cloud accounts are not configured. Choose Local to set up this browser.'
    return
  }

  if (!form.email.trim()) {
    error.value = 'Enter an email address so we can create your account.'
    return
  }

  if (form.password.length < 6) {
    error.value = 'Use a password with at least 6 characters.'
    return
  }

  if (form.password !== form.confirm) {
    error.value = 'Those passwords don’t match yet.'
    return
  }

  submitting.value = true
  try {
    const result = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
    })

    if (result.needsConfirmation) {
      needsConfirmation.value = true
      return
    }

    await router.replace(redirect.value)
  } catch (issue) {
    const message = issue instanceof Error ? issue.message : ''
    error.value = message || 'Could not create your account.'
    accountExists.value = authErrorKind(message) === 'account-exists'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthShell
    title="Give your ideas a place to meet."
    subtitle="One account, optional cloud sync, and the same quiet workspace you already know."
  >
    <div class="mb-6 grid grid-cols-3 rounded-lg border border-white/[0.07] bg-white/[0.02] p-1 text-[11px]">
      <NuxtLink :to="loginLink" :class="tabClass(false)">
        Sign in
      </NuxtLink>
      <button type="button" :class="tabClass(mode === 'cloud')" @click="mode = 'cloud'">
        Create account
      </button>
      <button type="button" :class="tabClass(mode === 'local')" @click="showLocal">
        Local
      </button>
    </div>

    <template v-if="mode === 'local'">
      <div class="mb-5 rounded-lg  px-4 py-3">
        <p class="text-[11px] font-medium text-white/75">Local account</p>
        <p class="mt-1 text-[10.5px] leading-relaxed text-white/35">
          Your name and graphs stay in this browser. No email, no password, no cloud copy.
        </p>
      </div>

      <div
        v-if="localError"
        class="mb-5 bg-red-400/[0.06] px-3.5 py-3 text-[11.5px] leading-relaxed text-red-300/80"
        role="alert"
      >
        {{ localError }}
      </div>

      <form class="space-y-4" @submit.prevent="submitLocal">
        <div>
          <label for="local-name" class="mb-1.5 block text-[9.5px] geist-400 tracking-[0.14em] text-white/35">
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
        v-if="needsConfirmation"
        class="rounded-lg  p-5"
      >
        <span class="flex h-10 w-10 items-center justify-center rounded-lg border border-[#34D399]/25 bg-[#34D399]/10 text-[#34D399]">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-9Z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m3.5 7 8.5 6 8.5-6" />
          </svg>
        </span>
        <h3 class="mt-4 text-[17px] font-medium tracking-tight text-white">Check your inbox.</h3>
        <p class="mt-2 text-[11.5px] leading-relaxed text-white/45">
          We sent a confirmation link to <strong class="text-white/80">{{ form.email }}</strong>.
          Open it to finish creating your account, and we’ll bring you straight back.
        </p>
        <div class="mt-5 flex flex-wrap gap-2">
          <NuxtLink
            :to="loginLink"
            class="inline-flex items-center rounded-lg bg-[#3155D9] px-3.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#3E63E8]"
          >
            Go to sign in
          </NuxtLink>
          <button
            type="button"
            class="inline-flex items-center rounded-lg border border-white/[0.09] bg-white/[0.025] px-3.5 py-2 text-[11px] font-medium text-white/55 transition-colors hover:border-white/[0.16] hover:text-white"
            @click="showLocal"
          >
            Use a local account
          </button>
        </div>
      </div>

      <template v-else>
        <div
          v-if="error"
          class="mb-5 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3.5 py-3 text-[11.5px] leading-relaxed text-red-300/80"
          role="alert"
        >
          {{ error }}
          <NuxtLink
            v-if="accountExists"
            :to="signInWithEmailLink"
            class="mt-2 inline-block font-medium text-[#8CA4FF] transition-colors hover:text-white"
          >
            Sign in instead
          </NuxtLink>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <div>
            <label for="signup-name" class="mb-1.5 block text-[9.5px] font-medium uppercase tracking-[0.14em] text-white/35">
              Name <span class="normal-case tracking-normal text-white/25">(optional)</span>
            </label>
            <input
              id="signup-name"
              v-model="form.fullName"
              type="text"
              autocomplete="name"
              placeholder="How should we greet you?"
              :class="inputClass"
            />
          </div>

          <div>
            <label for="signup-email" class="mb-1.5 block text-[9.5px] font-medium uppercase tracking-[0.14em] text-white/35">
              Email
            </label>
            <input
              id="signup-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              inputmode="email"
              placeholder="you@example.com"
              :class="inputClass"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="signup-password" class="mb-1.5 block text-[9.5px] font-medium uppercase tracking-[0.14em] text-white/35">
                Password
              </label>
              <div class="relative">
                <input
                  id="signup-password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="6+ characters"
                  :class="[inputClass, 'pr-11']"
                />
                <button
                  type="button"
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white"
                  :aria-label="showPassword ? 'Hide passwords' : 'Show passwords'"
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

            <div>
              <label for="signup-confirm" class="mb-1.5 block text-[9.5px] font-medium uppercase tracking-[0.14em] text-white/35">
                Confirm
              </label>
              <input
                id="signup-confirm"
                v-model="form.confirm"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Repeat it"
                :class="inputClass"
              />
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
            {{ submitting ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="mt-3 text-center text-[10px] leading-relaxed text-white/25">
          By creating an account you agree to the
          <NuxtLink to="/privacy" class="text-white/45 underline underline-offset-2 hover:text-white">privacy notes</NuxtLink>.
        </p>

        <p class="mt-6 text-center text-[11px] text-white/35">
          Already have an account?
          <NuxtLink :to="loginLink" class="font-medium text-[#8CA4FF] transition-colors hover:text-white">
            Sign in
          </NuxtLink>
        </p>
      </template>
    </template>
  </AuthShell>
</template>
