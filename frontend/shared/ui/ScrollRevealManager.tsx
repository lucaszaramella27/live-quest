import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const REVEAL_SELECTOR = '[data-reveal], .reveal-on-scroll, .surface-card, .page-shell > *, main > section, main > article'
const STAGGER_STEP_MS = 55
const STAGGER_MAX_MS = 420

function supportsReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isRevealCandidate(element: Element): element is HTMLElement {
  return element instanceof HTMLElement && element.matches(REVEAL_SELECTOR) && !element.hasAttribute('data-no-reveal')
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
            threshold: 0.14,
            rootMargin: '0px 0px -10% 0px',
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
    const delayedScan = window.setTimeout(() => scanNode(document), 140)

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
