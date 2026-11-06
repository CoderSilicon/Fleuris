import { loadGsap } from '../composables/useGsap'

type RevealOptions = {
  y?: number
  opacity?: number
  duration?: number
  delay?: number
  start?: string
  scale?: number
}

type StoredTween = {
  kill: () => void
  scrollTrigger?: {
    kill: () => void
  }
}

const tweens = new WeakMap<HTMLElement, StoredTween>()

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', {
    getSSRProps() {
      return {}
    },
    async mounted(el: HTMLElement, binding) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const options: RevealOptions = binding.value ?? {}
      const { gsap } = await loadGsap()

      // The element may have been removed while GSAP was loading.
      if (!el.isConnected) return

      const tween = gsap.from(el, {
        y: options.y ?? 32,
        scale: options.scale ?? 1,
        opacity: options.opacity ?? 0,
        duration: options.duration ?? 0.85,
        delay: options.delay ?? 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: options.start ?? 'top 88%',
          once: true,
        },
      })

      tweens.set(el, tween)
    },
    unmounted(el: HTMLElement) {
      const tween = tweens.get(el)

      tween?.scrollTrigger?.kill()
      tween?.kill()
      tweens.delete(el)
    },
  })
})
