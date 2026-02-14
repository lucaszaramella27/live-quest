import type { IconName } from '@/shared/ui'

export interface Challenge {
  id: string
  title: string
  description: string
  icon: IconName
  type: 'tasks' | 'goals' | 'streak' | 'events' | 'login'
  target: number
  current: number
  reward: {
    xp: number
    coins: number
    title?: string
  }
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  startDate: Date
  endDate: Date
  completed: boolean
}

type ChallengeTemplate = Omit<Challenge, 'id' | 'current' | 'startDate' | 'endDate' | 'completed'>

const WEEKLY_CHALLENGES_POOL: ChallengeTemplate[] = [
  // Easy challenges
  {
    title: 'Começando a Semana',
    description: 'Complete 5 tarefas esta semana',
    icon: 'check',
    type: 'tasks' as const,
    target: 5,
    reward: { xp: 50, coins: 10 },
    difficulty: 'easy' as const
  },
  {
    title: 'Organizador',
    description: 'Crie 3 eventos no calendário',
    icon: 'calendar',
    type: 'events' as const,
    target: 3,
    reward: { xp: 40, coins: 8 },
    difficulty: 'easy' as const
  },
  {
    title: 'Persistência',
    description: 'Mantenha 3 dias de streak',
    icon: 'flame',
    type: 'streak' as const,
    target: 3,
    reward: { xp: 60, coins: 12 },
    difficulty: 'easy' as const
  },

  // Medium challenges
  {
    title: 'Produtivo',
    description: 'Complete 20 tarefas esta semana',
    icon: 'shield',
    type: 'tasks' as const,
    target: 20,
    reward: { xp: 150, coins: 30 },
    difficulty: 'medium' as const
  },
  {
    title: 'Focado nas Metas',
    description: 'Complete 2 metas esta semana',
    icon: 'target',
    type: 'goals' as const,
    target: 2,
    reward: { xp: 200, coins: 40 },
    difficulty: 'medium' as const
  },
  {
    title: 'Constância',
    description: 'Mantenha 5 dias de streak',
    icon: 'zap',
    type: 'streak' as const,
    target: 5,
    reward: { xp: 180, coins: 35 },
    difficulty: 'medium' as const
  },
  {
    title: 'Planejador Master',
    description: 'Organize 10 eventos',
    icon: 'trending',
    type: 'events' as const,
    target: 10,
    reward: { xp: 120, coins: 25 },
    difficulty: 'medium' as const
  },

  // Hard challenges
  {
    title: 'Maratona',
    description: 'Complete 50 tarefas esta semana',
    icon: 'footprints',
    type: 'tasks' as const,
    target: 50,
    reward: { xp: 400, coins: 80 },
    difficulty: 'hard' as const
  },
  {
    title: 'Conquistador',
    description: 'Complete 5 metas esta semana',
    icon: 'crown',
    type: 'goals' as const,
    target: 5,
    reward: { xp: 500, coins: 100 },
    difficulty: 'hard' as const
  },
  {
    title: 'Semana Perfeita',
    description: 'Mantenha 7 dias de streak completos',
    icon: 'star',
    type: 'streak' as const,
    target: 7,
    reward: { xp: 600, coins: 120, title: 'consistent' },
    difficulty: 'hard' as const
  },

  // Extreme challenges
  {
    title: 'Workaholic',
    description: 'Complete 100 tarefas esta semana',
    icon: 'briefcase',
    type: 'tasks' as const,
    target: 100,
    reward: { xp: 1000, coins: 200 },
    difficulty: 'extreme' as const
  },
  {
    title: 'Imparável',
    description: 'Complete 10 metas esta semana',
    icon: 'rocket',
    type: 'goals' as const,
    target: 10,
    reward: { xp: 1500, coins: 300 },
    difficulty: 'extreme' as const
  }
]

export function generateWeeklyChallenges(): Challenge[] {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday
  endOfWeek.setHours(23, 59, 59, 999)

  // Select random challenges: 1 easy, 2 medium, 1 hard
  const easy = WEEKLY_CHALLENGES_POOL.filter(c => c.difficulty === 'easy')
  const medium = WEEKLY_CHALLENGES_POOL.filter(c => c.difficulty === 'medium')
  const hard = WEEKLY_CHALLENGES_POOL.filter(c => c.difficulty === 'hard')
  
  const selectedEasy = easy[Math.floor(Math.random() * easy.length)]
  const selectedMedium1 = medium[Math.floor(Math.random() * medium.length)]
  let selectedMedium2 = medium[Math.floor(Math.random() * medium.length)]
  while (selectedMedium2.title === selectedMedium1.title) {
    selectedMedium2 = medium[Math.floor(Math.random() * medium.length)]
  }
  const selectedHard = hard[Math.floor(Math.random() * hard.length)]

  const challenges = [selectedEasy, selectedMedium1, selectedMedium2, selectedHard]

  return challenges.map((challenge, index) => ({
    id: `challenge_${startOfWeek.getTime()}_${index}`,
    ...challenge,
    current: 0,
    startDate: startOfWeek,
    endDate: endOfWeek,
    completed: false
  }))
}

export function updateChallengeProgress(
  challenges: Challenge[],
  type: Challenge['type'],
  increment: number = 1
): Challenge[] {
  return challenges.map(challenge => {
    if (challenge.type === type && !challenge.completed) {
      const newCurrent = Math.min(challenge.current + increment, challenge.target)
      const completed = newCurrent >= challenge.target
      
      return {
        ...challenge,
        current: newCurrent,
        completed
      }
    }
    return challenge
  })
}

export function getTimeUntilWeekEnd(): string {
  const now = new Date()
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + (6 - now.getDay()))
  endOfWeek.setHours(23, 59, 59, 999)
  
  const diff = endOfWeek.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) {
    return `${days}d ${hours}h`
  }
  return `${hours}h`
}

export function getDifficultyColor(difficulty: Challenge['difficulty']): string {
  const colors = {
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#ef4444',
    extreme: '#dc2626'
  }
  return colors[difficulty]
}

export function getDifficultyGradient(difficulty: Challenge['difficulty']): string {
  const gradients = {
    easy: 'from-green-500/20 to-emerald-500/20',
    medium: 'from-yellow-500/20 to-orange-500/20',
    hard: 'from-red-500/20 to-rose-500/20',
    extreme: 'from-rose-500/20 to-pink-500/20'
  }
  return gradients[difficulty]
}

export function getCompletedChallengesCount(challenges: Challenge[]): number {
  return challenges.filter(c => c.completed).length
}

export function getTotalPossibleRewards(challenges: Challenge[]): { xp: number; coins: number } {
  return challenges.reduce(
    (acc, challenge) => ({
      xp: acc.xp + challenge.reward.xp,
      coins: acc.coins + challenge.reward.coins
    }),
    { xp: 0, coins: 0 }
  )
}

export function getEarnedRewards(challenges: Challenge[]): { xp: number; coins: number } {
  return challenges
    .filter(c => c.completed)
    .reduce(
      (acc, challenge) => ({
        xp: acc.xp + challenge.reward.xp,
        coins: acc.coins + challenge.reward.coins
      }),
      { xp: 0, coins: 0 }
    )
}
