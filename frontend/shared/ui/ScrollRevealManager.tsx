import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const REVEAL_SELECTOR = '[data-reveal], .reveal-on-scroll'
const STAGGER_STEP_MS = 24
const STAGGER_MAX_MS = 140

function supportsReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function shouldSkipReveal(element: HTMLElement): boolean {
  if (element.hasAttribute('data-no-reveal')) return true
  if (element.closest('[data-no-reveal], [role="dialog"], [aria-modal="true"]')) return true

  if (typeof window !== 'undefined') {
    const computedStyle = window.getComputedStyle(element)
    if (computedStyle.position === 'fixed') return true
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') return true
  }

  return false
}

function isRevealCandidate(element: Element): element is HTMLElement {
  return element instanceof HTMLElement && element.matches(REVEAL_SELECTOR) && !shouldSkipReveal(element)
}

function isElementInViewport(element: HTMLElement): boolean {
  if (typeof window === 'undefined') return true

  const rect = element.getBoundingClientRect()
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight

  return rect.top < viewportHeight * 0.94 && rect.bottom > 0
}

export function ScrollRevealManager() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const reducedMotion = supportsReducedMotion()
    const canUseObserver = !reducedMotion && 'IntersectionObserver' in window
    const preparedElements = new WeakSet<HTMLElement>()
    let revealIndex = 0

    const intersectionObserver = canUseObserver
      ? new IntersectionObserver(
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
            threshold: 0.04,
            rootMargin: '0px 0px -4% 0px',
          }
        )
      : null

    const prepareElement = (element: HTMLElement) => {
      if (preparedElements.has(element)) return
      preparedElements.add(element)

      element.classList.add('reveal')

      if (!element.style.getPropertyValue('--reveal-delay')) {
        const delay = Math.min(revealIndex * STAGGER_STEP_MS, STAGGER_MAX_MS)
        element.style.setProperty('--reveal-delay', `${delay}ms`)
      }
      revealIndex += 1

      if (!canUseObserver) {
        element.classList.add('reveal-visible')
        return
      }

      if (isElementInViewport(element)) {
        element.classList.add('reveal-visible')
        return
      }

      intersectionObserver?.observe(element)
    }

    const scanNode = (node: ParentNode) => {
      if (node instanceof Element && isRevealCandidate(node)) {
        prepareElement(node)
      }

      const descendants = Array.from(node.querySelectorAll?.(REVEAL_SELECTOR) || [])
      descendants.forEach((candidate) => {
        if (isRevealCandidate(candidate)) {
          prepareElement(candidate)
        }
      })
    }

    scanNode(document)

    const rafId = window.requestAnimationFrame(() => scanNode(document))
    const delayedScan = window.setTimeout(() => scanNode(document), 80)

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((addedNode) => {
          if (addedNode instanceof HTMLElement) {
            scanNode(addedNode)
          }
        })
      })
    })

    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(delayedScan)
      mutationObserver.disconnect()
      intersectionObserver?.disconnect()
    }
  }, [location.pathname])

  return null
}
