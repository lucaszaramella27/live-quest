export interface Theme {
  id: string
  name: string
  description: string
  isPremium: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    backgroundSecondary: string
    backgroundTertiary: string
    text: string
    textSecondary: string
    gradient: string
    glow: string
  }
  effects: {
    particles: boolean
    glow: 'low' | 'medium' | 'high'
    animations: 'minimal' | 'normal' | 'intense'
  }
}

interface ApplyThemeOptions {
  persist?: boolean
  dispatchEvent?: boolean
}

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Aether Dark',
    description: 'Dark SaaS moderno com cyan e electric blue',
    isPremium: false,
    colors: {
      primary: '#5ef7e2',
      secondary: '#8fa1ff',
      accent: '#57d7ff',
      background: '#050913',
      backgroundSecondary: '#0b1322',
      backgroundTertiary: '#111d33',
      text: '#e7efff',
      textSecondary: '#9aaccc',
      gradient: 'linear-gradient(125deg, #5ef7e2 0%, #57d7ff 44%, #8fa1ff 100%)',
      glow: 'rgba(94, 247, 226, 0.38)'
    },
    effects: {
      particles: false,
      glow: 'medium',
      animations: 'normal'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    description: 'Neon vibrante estilo Night City',
    isPremium: true,
    colors: {
      primary: '#00ff9f',
      secondary: '#ff003c',
      accent: '#00d9ff',
      background: '#0d0208',
      backgroundSecondary: '#1a0f1a',
      backgroundTertiary: '#2d1b2e',
      text: '#00ff9f',
      textSecondary: '#8892b0',
      gradient: 'linear-gradient(135deg, #00ff9f 0%, #00d9ff 50%, #ff003c 100%)',
      glow: 'rgba(0, 255, 159, 0.6)'
    },
    effects: {
      particles: true,
      glow: 'high',
      animations: 'intense'
    }
  },
  {
    id: 'aesthetic',
    name: 'Aesthetic Dreams',
    description: 'Tons pastel relaxantes e suaves',
    isPremium: true,
    colors: {
      primary: '#ff6b9d',
      secondary: '#c06c84',
      accent: '#f67280',
      background: '#1a1423',
      backgroundSecondary: '#2d2638',
      backgroundTertiary: '#3d3350',
      text: '#fef5ef',
      textSecondary: '#d4b5c4',
      gradient: 'linear-gradient(135deg, #ff6b9d 0%, #f67280 50%, #c06c84 100%)',
      glow: 'rgba(255, 107, 157, 0.4)'
    },
    effects: {
      particles: true,
      glow: 'low',
      animations: 'minimal'
    }
  },
  {
    id: 'retro',
    name: 'Retro 80s',
    description: 'Vapor wave nostalgico dos anos 80',
    isPremium: true,
    colors: {
      primary: '#ff6ac1',
      secondary: '#bd00ff',
      accent: '#00ffff',
      background: '#1a0033',
      backgroundSecondary: '#2d0052',
      backgroundTertiary: '#400070',
      text: '#ffffff',
      textSecondary: '#d4a5ff',
      gradient: 'linear-gradient(135deg, #ff6ac1 0%, #bd00ff 50%, #00ffff 100%)',
      glow: 'rgba(255, 106, 193, 0.5)'
    },
    effects: {
      particles: true,
      glow: 'high',
      animations: 'intense'
    }
  },
  {
    id: 'dark',
    name: 'Graphite Core',
    description: 'Visual enterprise dark com acento azul frio',
    isPremium: false,
    colors: {
      primary: '#6bc4ff',
      secondary: '#60a5fa',
      accent: '#4f7bf7',
      background: '#080d16',
      backgroundSecondary: '#0f1726',
      backgroundTertiary: '#172235',
      text: '#edf4ff',
      textSecondary: '#94a8c8',
      gradient: 'linear-gradient(135deg, #6bc4ff 0%, #60a5fa 48%, #4f7bf7 100%)',
      glow: 'rgba(99, 179, 237, 0.24)'
    },
    effects: {
      particles: false,
      glow: 'low',
      animations: 'minimal'
    }
  },
  {
    id: 'galaxy',
    name: 'Galaxy Dreams',
    description: 'Cores cosmicas do universo',
    isPremium: true,
    colors: {
      primary: '#9d4edd',
      secondary: '#c77dff',
      accent: '#e0aaff',
      background: '#10002b',
      backgroundSecondary: '#240046',
      backgroundTertiary: '#3c096c',
      text: '#ffffff',
      textSecondary: '#c8b6ff',
      gradient: 'linear-gradient(135deg, #240046 0%, #3c096c 25%, #5a189a 50%, #7209b7 75%, #9d4edd 100%)',
      glow: 'rgba(157, 78, 221, 0.5)'
    },
    effects: {
      particles: true,
      glow: 'high',
      animations: 'intense'
    }
  },
  {
    id: 'ocean',
    name: 'Arctic Flux',
    description: 'Paleta fria com contraste alto para foco',
    isPremium: false,
    colors: {
      primary: '#39e5ff',
      secondary: '#2ec5ff',
      accent: '#5f92ff',
      background: '#07121d',
      backgroundSecondary: '#0d1c2b',
      backgroundTertiary: '#163047',
      text: '#effbff',
      textSecondary: '#9fd3eb',
      gradient: 'linear-gradient(135deg, #39e5ff 0%, #2ec5ff 48%, #5f92ff 100%)',
      glow: 'rgba(57, 229, 255, 0.34)'
    },
    effects: {
      particles: false,
      glow: 'medium',
      animations: 'normal'
    }
  },
  {
    id: 'fire',
    name: 'Fire & Fury',
    description: 'Chamas intensas e energia',
    isPremium: true,
    colors: {
      primary: '#ff4500',
      secondary: '#ff6b35',
      accent: '#ffa500',
      background: '#1a0a00',
      backgroundSecondary: '#2d1500',
      backgroundTertiary: '#4d2600',
      text: '#fff5eb',
      textSecondary: '#ffcca7',
      gradient: 'linear-gradient(135deg, #ff4500 0%, #ff6b35 50%, #ffa500 100%)',
      glow: 'rgba(255, 69, 0, 0.6)'
    },
    effects: {
      particles: true,
      glow: 'high',
      animations: 'intense'
    }
  }
]

export function getTheme(themeId: string): Theme {
  return THEMES.find(t => t.id === themeId) || THEMES[0]
}

export function getFreeThemes(): Theme[] {
  return THEMES.filter(t => !t.isPremium)
}

export function getPremiumThemes(): Theme[] {
  return THEMES.filter(t => t.isPremium)
}

let isApplyingTheme = false
let lastAppliedThemeId: string | null = null

export function applyTheme(theme: Theme, options: ApplyThemeOptions = {}) {
  if (typeof document === 'undefined') return
  if (isApplyingTheme) return

  const { persist = true, dispatchEvent = true } = options
  const root = document.documentElement

  isApplyingTheme = true
  try {
    // Apply CSS custom properties
    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-secondary', theme.colors.secondary)
    root.style.setProperty('--color-accent', theme.colors.accent)
    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-background-secondary', theme.colors.backgroundSecondary)
    root.style.setProperty('--color-background-tertiary', theme.colors.backgroundTertiary)
    root.style.setProperty('--color-text', theme.colors.text)
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary)
    root.style.setProperty('--gradient-primary', theme.colors.gradient)
    root.style.setProperty('--glow-color', theme.colors.glow)

    // Apply effect level classes
    root.setAttribute('data-glow', theme.effects.glow)
    root.setAttribute('data-animations', theme.effects.animations)
    root.setAttribute('data-particles', theme.effects.particles.toString())

    if (persist) {
      try {
        if (localStorage.getItem('selectedTheme') !== theme.id) {
          localStorage.setItem('selectedTheme', theme.id)
        }
      } catch {
        // Ignore storage errors (private mode / blocked storage).
      }
    }

    const shouldDispatch = dispatchEvent && theme.id !== lastAppliedThemeId
    lastAppliedThemeId = theme.id

    if (shouldDispatch) {
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }))
    }
  } finally {
    isApplyingTheme = false
  }
}

export function loadSavedTheme(): Theme {
  if (typeof window === 'undefined') return THEMES[0]
  try {
    const savedThemeId = localStorage.getItem('selectedTheme')
    return savedThemeId ? getTheme(savedThemeId) : THEMES[0]
  } catch {
    return THEMES[0]
  }
}

