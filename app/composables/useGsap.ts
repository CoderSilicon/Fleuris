let gsapPromise: Promise<{
  gsap: typeof import('gsap').gsap
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger
}> | null = null

/**
 * Lazily loads GSAP on the client and registers ScrollTrigger once.
 * Keeping the import dynamic keeps GSAP out of the server bundle.
 */
export const loadGsap = () => {
  if (!gsapPromise) {
    gsapPromise = Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]).then(([gsapModule, scrollTriggerModule]) => {
      const { gsap } = gsapModule
      const { ScrollTrigger } = scrollTriggerModule

      gsap.registerPlugin(ScrollTrigger)

      return { gsap, ScrollTrigger }
    })
  }

  return gsapPromise
}

export const useGsap = () => loadGsap()
