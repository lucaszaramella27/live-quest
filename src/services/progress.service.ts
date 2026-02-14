import { doc, getDoc, setDoc, updateDoc, onSnapshot, Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'

export interface UserProgress {
  userId: string
  xp: number
  level: number
  coins: number
  achievements: string[]
  unlockedTitles: string[]
  activeTitle: string | null
  weeklyXP: number
  monthlyXP: number
  userName?: string
  userPhotoURL?: string
  createdAt: Date
  updatedAt: Date
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'bronze' | 'silver' | 'gold' | 'diamond'
  xpReward: number
  condition: (stats: UserStats) => boolean
}

export interface UserStats {
  totalGoalsCompleted: number
  totalTasksCompleted: number
  currentStreak: number
  longestStreak: number
  totalEventsCreated: number
  daysActive: number
}

// XP needed for each level (exponential growth)
export function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export function getLevelFromXP(xp: number): number {
  let level = 1
  let totalXP = 0
  
  while (totalXP + getXPForLevel(level) <= xp) {
    totalXP += getXPForLevel(level)
    level++
  }
  
  return level
}

export function getXPProgress(xp: number, level: number): { current: number; needed: number; percentage: number } {
  let totalXPForPreviousLevels = 0
  for (let i = 1; i < level; i++) {
    totalXPForPreviousLevels += getXPForLevel(i)
  }
  
  const currentLevelXP = xp - totalXPForPreviousLevels
  const neededForNextLevel = getXPForLevel(level)
  const percentage = (currentLevelXP / neededForNextLevel) * 100
  
  return {
    current: currentLevelXP,
    needed: neededForNextLevel,
    percentage: Math.min(percentage, 100)
  }
}

// Achievements definitions
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_goal',
    name: 'Primeiro Passo',
    description: 'Crie sua primeira meta',
    icon: '🎯',
    rarity: 'bronze',
    xpReward: 50,
    condition: (stats) => stats.totalGoalsCompleted >= 1
  },
  {
    id: 'goal_master',
    name: 'Mestre das Metas',
    description: 'Complete 10 metas',
    icon: '🏆',
    rarity: 'gold',
    xpReward: 200,
    condition: (stats) => stats.totalGoalsCompleted >= 10
  },
  {
    id: 'first_task',
    name: 'Produtivo',
    description: 'Complete sua primeira tarefa',
    icon: '✅',
    rarity: 'bronze',
    xpReward: 25,
    condition: (stats) => stats.totalTasksCompleted >= 1
  },
  {
    id: 'task_warrior',
    name: 'Guerreiro das Tarefas',
    description: 'Complete 50 tarefas',
    icon: '⚔️',
    rarity: 'silver',
    xpReward: 150,
    condition: (stats) => stats.totalTasksCompleted >= 50
  },
  {
    id: 'task_legend',
    name: 'Lenda Produtiva',
    description: 'Complete 200 tarefas',
    icon: '👑',
    rarity: 'diamond',
    xpReward: 500,
    condition: (stats) => stats.totalTasksCompleted >= 200
  },
  {
    id: 'streak_starter',
    name: 'Consistência Iniciada',
    description: 'Mantenha 7 dias de streak',
    icon: '🔥',
    rarity: 'bronze',
    xpReward: 100,
    condition: (stats) => stats.currentStreak >= 7
  },
  {
    id: 'streak_master',
    name: 'Mestre da Consistência',
    description: 'Mantenha 30 dias de streak',
    icon: '💎',
    rarity: 'gold',
    xpReward: 300,
    condition: (stats) => stats.currentStreak >= 30
  },
  {
    id: 'streak_legend',
    name: 'Imparável',
    description: 'Mantenha 100 dias de streak',
    icon: '🌟',
    rarity: 'diamond',
    xpReward: 1000,
    condition: (stats) => stats.currentStreak >= 100
  },
  {
    id: 'scheduler',
    name: 'Planejador',
    description: 'Agende 5 lives',
    icon: '📅',
    rarity: 'bronze',
    xpReward: 75,
    condition: (stats) => stats.totalEventsCreated >= 5
  },
  {
    id: 'early_adopter',
    name: 'Pioneiro',
    description: 'Use o app por 7 dias',
    icon: '🚀',
    rarity: 'silver',
    xpReward: 100,
    condition: (stats) => stats.daysActive >= 7
  },
  {
    id: 'dedicated',
    name: 'Dedicado',
    description: 'Use o app por 30 dias',
    icon: '💪',
    rarity: 'gold',
    xpReward: 250,
    condition: (stats) => stats.daysActive >= 30
  }
]

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  const progressRef = doc(db, 'userProgress', userId)
  const progressDoc = await getDoc(progressRef)
  
  if (!progressDoc.exists()) {
    return null
  }
  
  return {
    ...progressDoc.data(),
    createdAt: progressDoc.data().createdAt?.toDate() || new Date(),
    updatedAt: progressDoc.data().updatedAt?.toDate() || new Date(),
  } as UserProgress
}

/**
 * Listener em tempo real para o progresso do usuário
 * Atualiza automaticamente quando XP, nível, coins ou achievements mudarem
 */
export function subscribeToUserProgress(
  userId: string,
  callback: (progress: UserProgress | null) => void
): Unsubscribe {
  const progressRef = doc(db, 'userProgress', userId)
  
  return onSnapshot(progressRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }
    
    const data = snapshot.data()
    callback({
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as UserProgress)
  }, (error) => {
    console.error('Erro no listener do progresso:', error)
    callback(null)
  })
}

export async function createUserProgress(userId: string, userName?: string, userPhotoURL?: string): Promise<UserProgress> {
  const progressRef = doc(db, 'userProgress', userId)
  const newProgress: UserProgress = {
    userId,
    xp: 0,
    level: 1,
    coins: 0,
    achievements: [],
    unlockedTitles: ['novice'], // Start with novice title
    activeTitle: 'novice',
    weeklyXP: 0,
    monthlyXP: 0,
    userName,
    userPhotoURL,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  await setDoc(progressRef, newProgress)
  return newProgress
}

export async function addXP(userId: string, amount: number): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  const progressRef = doc(db, 'userProgress', userId)
  const progressDoc = await getDoc(progressRef)
  
  let currentProgress: UserProgress
  
  if (!progressDoc.exists()) {
    currentProgress = await createUserProgress(userId)
  } else {
    currentProgress = progressDoc.data() as UserProgress
  }
  
  const newXP = currentProgress.xp + amount
  const currentLevel = currentProgress.level
  const newLevel = getLevelFromXP(newXP)
  const leveledUp = newLevel > currentLevel
  
  await updateDoc(progressRef, {
    xp: newXP,
    level: newLevel,
    weeklyXP: (currentProgress.weeklyXP || 0) + amount,
    monthlyXP: (currentProgress.monthlyXP || 0) + amount,
    updatedAt: new Date(),
  })
  
  return { newXP, newLevel, leveledUp }
}

export async function unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
  const progressRef = doc(db, 'userProgress', userId)
  const progressDoc = await getDoc(progressRef)
  
  if (!progressDoc.exists()) {
    await createUserProgress(userId)
    return false
  }
  
  const currentProgress = progressDoc.data() as UserProgress
  
  if (currentProgress.achievements.includes(achievementId)) {
    return false // Already unlocked
  }
  
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
  if (!achievement) return false
  
  await updateDoc(progressRef, {
    achievements: [...currentProgress.achievements, achievementId],
    updatedAt: new Date(),
  })
  
  // Add XP reward
  await addXP(userId, achievement.xpReward)
  
  return true
}

export async function checkAchievements(userId: string, stats: UserStats): Promise<string[]> {
  const progress = await getUserProgress(userId)
  if (!progress) return []
  
  const newAchievements: string[] = []
  
  for (const achievement of ACHIEVEMENTS) {
    if (progress.achievements.includes(achievement.id)) continue
    
    if (achievement.condition(stats)) {
      const unlocked = await unlockAchievement(userId, achievement.id)
      if (unlocked) {
        newAchievements.push(achievement.id)
      }
    }
  }
  
  return newAchievements
}

// Coins management
export async function addCoins(userId: string, amount: number): Promise<number> {
  const progressRef = doc(db, 'userProgress', userId)
  const progressDoc = await getDoc(progressRef)
  
  let currentProgress: UserProgress
  
  if (!progressDoc.exists()) {
    currentProgress = await createUserProgress(userId)
  } else {
    currentProgress = progressDoc.data() as UserProgress
  }
  
  const newCoins = (currentProgress.coins || 0) + amount
  
  await updateDoc(progressRef, {
    coins: newCoins,
    updatedAt: new Date(),
  })
  
  return newCoins
}

export async function spendCoins(userId: string, amount: number): Promise<{ success: boolean; newBalance: number }> {
  const progressRef = doc(db, 'userProgress', userId)
  const progressDoc = await getDoc(progressRef)
  
  if (!progressDoc.exists()) {
    return { success: false, newBalance: 0 }
  }
  
  const currentProgress = progressDoc.data() as UserProgress
  const currentCoins = currentProgress.coins || 0
  
  if (currentCoins < amount) {
    return { success: false, newBalance: currentCoins }
  }
  
  const newCoins = currentCoins - amount
  
  await updateDoc(progressRef, {
    coins: newCoins,
    updatedAt: new Date(),
  })
  
  return { success: true, newBalance: newCoins }
}

// Titles management
export async function unlockTitle(userId: string, titleId: string): Promise<boolean> {
  const progressRef = doc(db, 'userProgress', userId)
  const progressDoc = await getDoc(progressRef)
  
  if (!progressDoc.exists()) return false
  
  const currentProgress = progressDoc.data() as UserProgress
  const unlockedTitles = currentProgress.unlockedTitles || []
  
  if (unlockedTitles.includes(titleId)) return false
  
  await updateDoc(progressRef, {
    unlockedTitles: [...unlockedTitles, titleId],
    updatedAt: new Date(),
  })
  
  return true
}

export async function setActiveTitle(userId: string, titleId: string | null): Promise<boolean> {
  const progressRef = doc(db, 'userProgress', userId)
  const progressDoc = await getDoc(progressRef)
  
  if (!progressDoc.exists()) return false
  
  const currentProgress = progressDoc.data() as UserProgress
  const unlockedTitles = currentProgress.unlockedTitles || []
  
  // If setting a title, verify it's unlocked
  if (titleId && !unlockedTitles.includes(titleId)) return false
  
  await updateDoc(progressRef, {
    activeTitle: titleId,
    updatedAt: new Date(),
  })
  
  return true
}

// Reset functions for leaderboard periods
export async function resetWeeklyXP(): Promise<void> {
  // This should be called by a Cloud Function or scheduled task
  // For now, it's a placeholder for future implementation
  console.log('Weekly XP reset would happen here')
}

export async function resetMonthlyXP(): Promise<void> {
  // This should be called by a Cloud Function or scheduled task
  // For now, it's a placeholder for future implementation
  console.log('Monthly XP reset would happen here')
}
