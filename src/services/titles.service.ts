export interface Title {
  id: string
  name: string
  description: string
  icon: string
  color: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  requirement: {
    type: 'level' | 'xp' | 'achievements' | 'streak' | 'tasks' | 'goals' | 'special'
    value: number
    description: string
  }
}

export const TITLES: Title[] = [
  // Level-based
  {
    id: 'novice',
    name: 'Novato',
    description: 'Todo grande streamer começa assim',
    icon: '🌱',
    color: '#9ca3af',
    rarity: 'common',
    requirement: {
      type: 'level',
      value: 1,
      description: 'Alcance o nível 1'
    }
  },
  {
    id: 'streamer',
    name: 'Streamer',
    description: 'Você está indo bem!',
    icon: '🎮',
    color: '#06b6d4',
    rarity: 'common',
    requirement: {
      type: 'level',
      value: 5,
      description: 'Alcance o nível 5'
    }
  },
  {
    id: 'pro',
    name: 'Pro Player',
    description: 'Agora a coisa ficou séria',
    icon: '⚡',
    color: '#8b5cf6',
    rarity: 'rare',
    requirement: {
      type: 'level',
      value: 10,
      description: 'Alcance o nível 10'
    }
  },
  {
    id: 'legend',
    name: 'Lenda',
    description: 'Poucos chegam até aqui',
    icon: '👑',
    color: '#f59e0b',
    rarity: 'epic',
    requirement: {
      type: 'level',
      value: 25,
      description: 'Alcance o nível 25'
    }
  },
  {
    id: 'god',
    name: 'Deus do Stream',
    description: 'Você transcendeu a realidade',
    icon: '✨',
    color: '#ec4899',
    rarity: 'legendary',
    requirement: {
      type: 'level',
      value: 50,
      description: 'Alcance o nível 50'
    }
  },
  {
    id: 'immortal',
    name: 'Imortal',
    description: 'Seu nome será lembrado para sempre',
    icon: '🔥',
    color: '#ff0000',
    rarity: 'mythic',
    requirement: {
      type: 'level',
      value: 100,
      description: 'Alcance o nível 100'
    }
  },

  // Streak-based
  {
    id: 'consistent',
    name: 'Consistente',
    description: 'A consistência é a chave',
    icon: '📅',
    color: '#10b981',
    rarity: 'rare',
    requirement: {
      type: 'streak',
      value: 7,
      description: 'Mantenha 7 dias de streak'
    }
  },
  {
    id: 'marathoner',
    name: 'Maratonista',
    description: 'Você não para nunca!',
    icon: '🏃',
    color: '#f59e0b',
    rarity: 'epic',
    requirement: {
      type: 'streak',
      value: 30,
      description: 'Mantenha 30 dias de streak'
    }
  },
  {
    id: 'unstoppable',
    name: 'Imparável',
    description: 'Nada pode te deter',
    icon: '🚀',
    color: '#ec4899',
    rarity: 'legendary',
    requirement: {
      type: 'streak',
      value: 100,
      description: 'Mantenha 100 dias de streak'
    }
  },

  // Task-based
  {
    id: 'taskmaster',
    name: 'Mestre das Tarefas',
    description: 'Organizado e eficiente',
    icon: '✅',
    color: '#06b6d4',
    rarity: 'rare',
    requirement: {
      type: 'tasks',
      value: 100,
      description: 'Complete 100 tarefas'
    }
  },
  {
    id: 'workaholic',
    name: 'Workaholic',
    description: 'Você nunca descansa',
    icon: '💼',
    color: '#8b5cf6',
    rarity: 'epic',
    requirement: {
      type: 'tasks',
      value: 500,
      description: 'Complete 500 tarefas'
    }
  },
  {
    id: 'productivity_god',
    name: 'Deus da Produtividade',
    description: 'Produtividade level MÁXIMO',
    icon: '🌟',
    color: '#fbbf24',
    rarity: 'legendary',
    requirement: {
      type: 'tasks',
      value: 1000,
      description: 'Complete 1000 tarefas'
    }
  },

  // Goal-based
  {
    id: 'dreamer',
    name: 'Sonhador',
    description: 'Você tem grandes sonhos',
    icon: '💭',
    color: '#a78bfa',
    rarity: 'common',
    requirement: {
      type: 'goals',
      value: 5,
      description: 'Complete 5 metas'
    }
  },
  {
    id: 'achiever',
    name: 'Conquistador',
    description: 'Você conquista tudo que quer',
    icon: '🎯',
    color: '#ec4899',
    rarity: 'rare',
    requirement: {
      type: 'goals',
      value: 20,
      description: 'Complete 20 metas'
    }
  },
  {
    id: 'champion',
    name: 'Campeão',
    description: 'Sempre vencendo',
    icon: '🏆',
    color: '#fbbf24',
    rarity: 'epic',
    requirement: {
      type: 'goals',
      value: 50,
      description: 'Complete 50 metas'
    }
  },

  // Achievement-based
  {
    id: 'collector',
    name: 'Colecionador',
    description: 'Você adora conquistas',
    icon: '🎖️',
    color: '#8b5cf6',
    rarity: 'rare',
    requirement: {
      type: 'achievements',
      value: 5,
      description: 'Desbloqueie 5 conquistas'
    }
  },
  {
    id: 'completionist',
    name: 'Completista',
    description: '100% em tudo!',
    icon: '💯',
    color: '#fbbf24',
    rarity: 'legendary',
    requirement: {
      type: 'achievements',
      value: 11,
      description: 'Desbloqueie todas as conquistas'
    }
  },

  // Special titles
  {
    id: 'early_bird',
    name: 'Madrugador',
    description: 'Primeiro a chegar, último a sair',
    icon: '🌅',
    color: '#f59e0b',
    rarity: 'epic',
    requirement: {
      type: 'special',
      value: 0,
      description: 'Título especial - Early Adopter'
    }
  },
  {
    id: 'night_owl',
    name: 'Coruja Noturna',
    description: 'A noite é jovem',
    icon: '🦉',
    color: '#6366f1',
    rarity: 'rare',
    requirement: {
      type: 'special',
      value: 0,
      description: 'Título especial - Streamer noturno'
    }
  }
]

export interface UserTitles {
  userId: string
  unlockedTitles: string[]
  activeTitle: string | null
  createdAt: Date
  updatedAt: Date
}

export function checkUnlockedTitles(stats: {
  level: number
  totalXP: number
  achievementsCount: number
  longestStreak: number
  totalTasks: number
  totalGoals: number
}): string[] {
  const unlocked: string[] = []

  for (const title of TITLES) {
    let isUnlocked = false
    
    switch (title.requirement.type) {
      case 'level':
        isUnlocked = stats.level >= title.requirement.value
        break
      case 'xp':
        isUnlocked = stats.totalXP >= title.requirement.value
        break
      case 'achievements':
        isUnlocked = stats.achievementsCount >= title.requirement.value
        break
      case 'streak':
        isUnlocked = stats.longestStreak >= title.requirement.value
        break
      case 'tasks':
        isUnlocked = stats.totalTasks >= title.requirement.value
        break
      case 'goals':
        isUnlocked = stats.totalGoals >= title.requirement.value
        break
      case 'special':
        // Special titles are unlocked manually
        break
    }
    
    if (isUnlocked) {
      unlocked.push(title.id)
    }
  }

  return unlocked
}

export function getTitleById(titleId: string): Title | undefined {
  return TITLES.find(t => t.id === titleId)
}

export function getHighestTitle(unlockedTitles: string[]): Title | null {
  const rarityOrder = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 }
  
  const unlocked = TITLES.filter(t => unlockedTitles.includes(t.id))
  if (unlocked.length === 0) return null
  
  return unlocked.sort((a, b) => 
    rarityOrder[b.rarity] - rarityOrder[a.rarity]
  )[0]
}

export function getRarityColor(rarity: Title['rarity']): string {
  const colors = {
    common: '#9ca3af',
    rare: '#06b6d4',
    epic: '#8b5cf6',
    legendary: '#fbbf24',
    mythic: '#ec4899'
  }
  return colors[rarity]
}

export function getRarityGradient(rarity: Title['rarity']): string {
  const gradients = {
    common: 'from-gray-500/20 to-gray-600/20',
    rare: 'from-cyan-500/20 to-blue-500/20',
    epic: 'from-purple-500/20 to-indigo-500/20',
    legendary: 'from-yellow-500/20 to-orange-500/20',
    mythic: 'from-pink-500/20 to-rose-500/20'
  }
  return gradients[rarity]
}
