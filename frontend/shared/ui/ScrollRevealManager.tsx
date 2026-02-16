import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const REVEAL_SELECTOR = '[data-reveal], .reveal-on-scroll, .surface-card, .page-shell > *, main > section, main > article'
const STAGGER_STEP_MS = 55
const STAGGER_MAX_MS = 420

function supportsReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function markVisible(elements: HTMLElement[]): void {
  elements.forEach((element) => {
    element.classList.add('reveal')
    element.classList.add('reveal-visible')
  })
}

export function ScrollRevealManager() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const elements = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)).filter(
      (element) => !element.hasAttribute('data-no-reveal')
    )

    if (elements.length === 0) return

    if (supportsReducedMotion() || !('IntersectionObserver' in window)) {
      markVisible(elements)
      return
    }

    const observer = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const element = entry.target as HTMLElement
          element.classList.add('reveal-visible')
          observerInstance.unobserve(element)
        })
      },
      {
        root: null,
        threshold: 0.14,
        rootMargin: '0px 0px -10% 0px',
      }
    )

    elements.forEach((element, index) => {
      element.classList.add('reveal')

      if (!element.style.getPropertyValue('--reveal-delay')) {
        const delay = Math.min(index * STAGGER_STEP_MS, STAGGER_MAX_MS)
        element.style.setProperty('--reveal-delay', `${delay}ms`)
      }

      observer.observe(element)
    })

    return () => {
      observer.disconnect()
    }
  }, [location.pathname])

  return null
}
