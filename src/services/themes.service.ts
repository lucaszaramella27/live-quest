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

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Neon Purple',
    description: 'O clássico roxo neon que você conhece',
    isPremium: false,
    colors: {
      primary: '#a855f7',
      secondary: '#ec4899',
      accent: '#8b5cf6',
      background: '#0a0a0f',
      backgroundSecondary: '#1a1625',
      backgroundTertiary: '#252134',
      text: '#ffffff',
      textSecondary: '#9ca3af',
      gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
      glow: 'rgba(168, 85, 247, 0.5)'
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
    description: 'Vapor wave nostálgico dos anos 80',
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
    name: 'Dark Modern',
    description: 'Preto e cinza moderno com detalhes azuis',
    isPremium: false,
    colors: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#2563eb',
      background: '#0a0a0a',
      backgroundSecondary: '#141414',
      backgroundTertiary: '#1f1f1f',
      text: '#fafafa',
      textSecondary: '#737373',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      glow: 'rgba(59, 130, 246, 0.15)'
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
    description: 'Cores cósmicas do universo',
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
    name: 'Ocean Breeze',
    description: 'Tons aquáticos calmantes',
    isPremium: false,
    colors: {
      primary: '#06b6d4',
      secondary: '#0ea5e9',
      accent: '#3b82f6',
      background: '#0c1821',
      backgroundSecondary: '#1b2838',
      backgroundTertiary: '#2d3f52',
      text: '#f0f9ff',
      textSecondary: '#bae6fd',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 50%, #3b82f6 100%)',
      glow: 'rgba(6, 182, 212, 0.4)'
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

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  
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
  
  // Store theme preference
  localStorage.setItem('selectedTheme', theme.id)
  
  // Dispatch event for same-tab listeners
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }))
}

export function loadSavedTheme(): Theme {
  const savedThemeId = localStorage.getItem('selectedTheme')
  return savedThemeId ? getTheme(savedThemeId) : THEMES[0]
}
