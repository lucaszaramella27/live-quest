import type { RealtimeChannel } from './backend-client'
import { backendClient } from './backend-client'
import type { IconName } from '@/shared/ui'
import { reportError } from './logger.service'
import { toDateOrNull, toDateOrNow } from './date-utils.service'

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
  userName: string
  userPhotoURL: string
  isPremium: boolean
  premiumExpiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: IconName
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

interface UserProgressRow {
  user_id: string
  xp: number | null
  level: number | null
  coins: number | null
  achievements: string[] | null
  unlocked_titles: string[] | null
  active_title: string | null
  weekly_xp: number | null
  monthly_xp: number | null
  user_name: string | null
  user_photo_url: string | null
  is_premium: boolean | null
  premium_expires_at: string | null
  created_at: string | null
  updated_at: string | null
}

const FALLBACK_ADMIN_UIDS = (import.meta.env.VITE_ADMIN_UIDS || '')
  .split(',')
  .map((uid) => uid.trim())
  .filter(Boolean)

const DEFAULT_TITLE_ID = 'novice'
const progressSubscribers = new Map<string, Set<(progress: UserProgress | null) => void>>()

function notifyProgressSubscribers(userId: string, progress: UserProgress | null): void {
  const listeners = progressSubscribers.get(userId)
  if (!listeners || listeners.size === 0) return

  listeners.forEach((listener) => {
    try {
      listener(progress)
    } catch (error) {
      reportError('progress_subscriber_callback_failed', error, { userId })
    }
  })
}

function registerProgressSubscriber(
  userId: string,
  callback: (progress: UserProgress | null) => void
): void {
  const listeners = progressSubscribers.get(userId)
  if (listeners) {
    listeners.add(callback)
    return
  }

  progressSubscribers.set(userId, new Set([callback]))
}

function unregisterProgressSubscriber(
  userId: string,
  callback: (progress: UserProgress | null) => void
): void {
  const listeners = progressSubscribers.get(userId)
  if (!listeners) return

  listeners.delete(callback)
  if (listeners.size === 0) {
    progressSubscribers.delete(userId)
  }
}

function mapProgressRow(row: UserProgressRow): UserProgress {
  return {
    userId: row.user_id,
    xp: Number(row.xp ?? 0),
    level: Number(row.level ?? 1),
    coins: Number(row.coins ?? 0),
    achievements: Array.isArray(row.achievements) ? row.achievements : [],
    unlockedTitles: Array.isArray(row.unlocked_titles) && row.unlocked_titles.length > 0
      ? row.unlocked_titles
      : [DEFAULT_TITLE_ID],
    activeTitle: row.active_title ?? DEFAULT_TITLE_ID,
    weeklyXP: Number(row.weekly_xp ?? 0),
    monthlyXP: Number(row.monthly_xp ?? 0),
    userName: row.user_name || 'Usuario',
    userPhotoURL: row.user_photo_url || '',
    isPremium: Boolean(row.is_premium),
    premiumExpiresAt: toDateOrNull(row.premium_expires_at),
    createdAt: toDateOrNow(row.created_at),
    updatedAt: toDateOrNow(row.updated_at),
  }
}

function toProgressInsert(progress: UserProgress): Record<string, unknown> {
  return {
    user_id: progress.userId,
    xp: progress.xp,
    level: progress.level,
    coins: progress.coins,
    achievements: progress.achievements,
    unlocked_titles: progress.unlockedTitles,
    active_title: progress.activeTitle,
    weekly_xp: progress.weeklyXP,
    monthly_xp: progress.monthlyXP,
    user_name: progress.userName,
    user_photo_url: progress.userPhotoURL,
    is_premium: progress.isPremium,
    premium_expires_at: progress.premiumExpiresAt ? progress.premiumExpiresAt.toISOString() : null,
    created_at: progress.createdAt.toISOString(),
    updated_at: progress.updatedAt.toISOString(),
  }
}

async function getProgressRow(userId: string): Promise<UserProgressRow | null> {
  const { data, error } = await backendClient
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<UserProgressRow>()

  if (error) {
    throw error
  }

  return data
}

async function upsertProgress(progress: UserProgress): Promise<UserProgress> {
  const { data, error } = await backendClient
    .from('user_progress')
    .upsert(toProgressInsert(progress), { onConflict: 'user_id' })
    .select('*')
    .single<UserProgressRow>()

  if (error) {
    throw error
  }

  const mapped = mapProgressRow(data)
  notifyProgressSubscribers(mapped.userId, mapped)
  return mapped
}

async function hasAdminAccess(): Promise<boolean> {
  const {
    data: { user },
  } = await backendClient.auth.getUser()

  if (!user) return false
  if (import.meta.env.DEV && FALLBACK_ADMIN_UIDS.includes(user.id)) return true

  const appMetadata = user.app_metadata as Record<string, unknown> | undefined
  if (appMetadata?.admin === true || appMetadata?.role === 'admin') return true
  if (Array.isArray(appMetadata?.roles) && appMetadata.roles.includes('admin')) return true

  const { data, error } = await backendClient
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle<{ is_admin: boolean | null }>()

  if (error) return false
  return Boolean(data?.is_admin)
}

// XP needed for each level (exponential growth)
export function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export function getTotalXPForLevel(level: number): number {
  if (level <= 1) return 0

  let total = 0
  for (let i = 1; i < level; i += 1) {
    total += getXPForLevel(i)
  }
  return total
}

export function getLevelFromXP(xp: number): number {
  let level = 1
  let totalXP = 0

  while (totalXP + getXPForLevel(level) <= xp) {
    totalXP += getXPForLevel(level)
    level += 1
  }

  return level
}

export function getXPProgress(xp: number, level: number): { current: number; needed: number; percentage: number } {
  const totalXPForPreviousLevels = getTotalXPForLevel(level)

  const currentLevelXP = xp - totalXPForPreviousLevels
  const neededForNextLevel = getXPForLevel(level)
  const percentage = (currentLevelXP / neededForNextLevel) * 100

  return {
    current: currentLevelXP,
    needed: neededForNextLevel,
    percentage: Math.min(percentage, 100),
  }
}

// Achievements definitions
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_goal',
    name: 'Primeiro Passo',
    description: 'Crie sua primeira meta',
    icon: 'target',
    rarity: 'bronze',
    xpReward: 50,
    condition: (stats) => stats.totalGoalsCompleted >= 1,
  },
  {
    id: 'goal_master',
    name: 'Mestre das Metas',
    description: 'Complete 10 metas',
    icon: 'trophy',
    rarity: 'gold',
    xpReward: 200,
    condition: (stats) => stats.totalGoalsCompleted >= 10,
  },
  {
    id: 'first_task',
    name: 'Produtivo',
    description: 'Complete sua primeira tarefa',
    icon: 'check',
    rarity: 'bronze',
    xpReward: 25,
    condition: (stats) => stats.totalTasksCompleted >= 1,
  },
  {
    id: 'task_warrior',
    name: 'Guerreiro das Tarefas',
    description: 'Complete 50 tarefas',
    icon: 'sword',
    rarity: 'silver',
    xpReward: 150,
    condition: (stats) => stats.totalTasksCompleted >= 50,
  },
  {
    id: 'task_legend',
    name: 'Lenda Produtiva',
    description: 'Complete 200 tarefas',
    icon: 'crown',
    rarity: 'diamond',
    xpReward: 500,
    condition: (stats) => stats.totalTasksCompleted >= 200,
  },
  {
    id: 'streak_starter',
    name: 'Consistencia Iniciada',
    description: 'Mantenha 7 dias de streak',
    icon: 'flame',
    rarity: 'bronze',
    xpReward: 100,
    condition: (stats) => stats.currentStreak >= 7,
  },
  {
    id: 'streak_master',
    name: 'Mestre da Consistencia',
    description: 'Mantenha 30 dias de streak',
    icon: 'diamond',
    rarity: 'gold',
    xpReward: 300,
    condition: (stats) => stats.currentStreak >= 30,
  },
  {
    id: 'streak_legend',
    name: 'Imparavel',
    description: 'Mantenha 100 dias de streak',
    icon: 'star',
    rarity: 'diamond',
    xpReward: 1000,
    condition: (stats) => stats.currentStreak >= 100,
  },
  {
    id: 'scheduler',
    name: 'Planejador',
    description: 'Agende 5 lives',
    icon: 'calendar',
    rarity: 'bronze',
    xpReward: 75,
    condition: (stats) => stats.totalEventsCreated >= 5,
  },
  {
    id: 'early_adopter',
    name: 'Pioneiro',
    description: 'Use o app por 7 dias',
    icon: 'rocket',
    rarity: 'silver',
    xpReward: 100,
    condition: (stats) => stats.daysActive >= 7,
  },
  {
    id: 'dedicated',
    name: 'Dedicado',
    description: 'Use o app por 30 dias',
    icon: 'shield',
    rarity: 'gold',
    xpReward: 250,
    condition: (stats) => stats.daysActive >= 30,
  },
]

function createDefaultUserProgress(
  userId: string,
  userName: string = 'Usuario',
  userPhotoURL: string = ''
): UserProgress {
  const now = new Date()
  return {
    userId,
    xp: 0,
    level: 1,
    coins: 0,
    achievements: [],
    unlockedTitles: [DEFAULT_TITLE_ID],
    activeTitle: DEFAULT_TITLE_ID,
    weeklyXP: 0,
    monthlyXP: 0,
    userName,
    userPhotoURL,
    isPremium: false,
    premiumExpiresAt: null,
    createdAt: now,
    updatedAt: now,
  }
}

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  const row = await getProgressRow(userId)
  return row ? mapProgressRow(row) : null
}

export function publishUserProgressSnapshot(progress: UserProgress): void {
  notifyProgressSubscribers(progress.userId, progress)
}

export async function refreshUserProgressSubscriptions(userId: string): Promise<UserProgress | null> {
  const progress = await getUserProgress(userId)
  notifyProgressSubscribers(userId, progress)
  return progress
}

/**
 * Listener em tempo real para o progresso do usuário
 * Atualiza automaticamente quando XP, nível, coins ou achievements mudarem
 */
export function subscribeToUserProgress(
  userId: string,
  callback: (progress: UserProgress | null) => void
): () => void {
  registerProgressSubscriber(userId, callback)

  const channelName = `user_progress:${userId}:${Math.random().toString(36).slice(2)}`
  const channel: RealtimeChannel = backendClient
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_progress',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          notifyProgressSubscribers(userId, null)
          return
        }

        const next = payload.new as UserProgressRow | undefined
        if (!next) {
          void refreshUserProgressSubscriptions(userId)
            .catch((error) => {
              reportError('Erro no listener do progresso:', error)
              notifyProgressSubscribers(userId, null)
            })
          return
        }

        notifyProgressSubscribers(userId, mapProgressRow(next))
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void refreshUserProgressSubscriptions(userId)
          .catch((error) => {
            reportError('Erro no listener do progresso:', error)
            notifyProgressSubscribers(userId, null)
          })
      }
    })

  return () => {
    unregisterProgressSubscriber(userId, callback)
    void backendClient.removeChannel(channel)
  }
}

export async function createUserProgress(
  userId: string,
  userName: string = 'Usuario',
  userPhotoURL: string = ''
): Promise<UserProgress> {
  const existing = await getUserProgress(userId)
  if (existing) return existing

  const newProgress = createDefaultUserProgress(userId, userName, userPhotoURL)
  return upsertProgress(newProgress)
}

export async function addXP(
  userId: string,
  amount: number
): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  const currentProgress = (await getUserProgress(userId)) || (await createUserProgress(userId))

  const normalizedAmount = Number.isFinite(amount) ? amount : 0
  const newXP = Math.max(0, currentProgress.xp + normalizedAmount)
  const newLevel = getLevelFromXP(newXP)
  const leveledUp = newLevel > currentProgress.level

  const updated: UserProgress = {
    ...currentProgress,
    xp: newXP,
    level: newLevel,
    weeklyXP: Math.max(0, currentProgress.weeklyXP + normalizedAmount),
    monthlyXP: Math.max(0, currentProgress.monthlyXP + normalizedAmount),
    updatedAt: new Date(),
  }

  await upsertProgress(updated)

  return { newXP, newLevel, leveledUp }
}

export async function unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
  const currentProgress = (await getUserProgress(userId)) || (await createUserProgress(userId))

  if (currentProgress.achievements.includes(achievementId)) {
    return false
  }

  const achievement = ACHIEVEMENTS.find((entry) => entry.id === achievementId)
  if (!achievement) return false

  const updated: UserProgress = {
    ...currentProgress,
    achievements: [...currentProgress.achievements, achievementId],
    updatedAt: new Date(),
  }

  await upsertProgress(updated)
  await addXP(userId, achievement.xpReward)

  return true
}

export async function checkAchievements(userId: string, stats: UserStats): Promise<Achievement[]> {
  const progress = await getUserProgress(userId)
  if (!progress) return []

  const newAchievements: Achievement[] = []

  for (const achievement of ACHIEVEMENTS) {
    if (progress.achievements.includes(achievement.id)) continue

    if (achievement.condition(stats)) {
      const unlocked = await unlockAchievement(userId, achievement.id)
      if (unlocked) {
        newAchievements.push(achievement)
      }
    }
  }

  return newAchievements
}

/**
 * Busca estatísticas do usuário de todas as collections
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    // Importa dinamicamente para evitar dependências circulares.
    const { getUserActivity } = await import('./activity.service')
    const { getUserStreak } = await import('./streaks.service')

    const [activities, streak] = await Promise.all([
      getUserActivity(userId, 365),
      getUserStreak(userId),
    ])

    const totalTasksCompleted = activities.reduce((sum, activity) => sum + activity.tasksCompleted, 0)
    const totalGoalsCompleted = activities.reduce((sum, activity) => sum + activity.goalsCompleted, 0)
    const totalEventsCreated = activities.reduce((sum, activity) => sum + activity.eventsCreated, 0)
    const daysActive = activities.filter(
      (activity) =>
        activity.tasksCompleted > 0 ||
        activity.goalsCompleted > 0 ||
        activity.eventsCreated > 0
    ).length

    return {
      totalGoalsCompleted,
      totalTasksCompleted,
      currentStreak: streak.currentStreak || 0,
      longestStreak: streak.longestStreak || 0,
      totalEventsCreated,
      daysActive,
    }
  } catch (error) {
    reportError('Erro ao buscar stats:', error)
    return {
      totalGoalsCompleted: 0,
      totalTasksCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalEventsCreated: 0,
      daysActive: 0,
    }
  }
}

// Coins management
export async function addCoins(userId: string, amount: number): Promise<number> {
  const currentProgress = (await getUserProgress(userId)) || (await createUserProgress(userId))
  const normalizedAmount = Number.isFinite(amount) ? amount : 0
  const coins = Math.max(0, currentProgress.coins + normalizedAmount)

  await upsertProgress({
    ...currentProgress,
    coins,
    updatedAt: new Date(),
  })

  return coins
}

export async function spendCoins(userId: string, amount: number): Promise<{ success: boolean; newBalance: number }> {
  if (!userId || amount <= 0) {
    return { success: false, newBalance: 0 }
  }

  const currentProgress = (await getUserProgress(userId)) || (await createUserProgress(userId))
  if (currentProgress.coins < amount) {
    return { success: false, newBalance: currentProgress.coins }
  }

  const newBalance = currentProgress.coins - amount
  await upsertProgress({
    ...currentProgress,
    coins: newBalance,
    updatedAt: new Date(),
  })

  return { success: true, newBalance }
}

// Titles management
export async function unlockTitle(userId: string, titleId: string): Promise<boolean> {
  const currentProgress = await getUserProgress(userId)
  if (!currentProgress) return false

  const unlockedTitles = currentProgress.unlockedTitles || []
  if (unlockedTitles.includes(titleId)) return false

  await upsertProgress({
    ...currentProgress,
    unlockedTitles: [...unlockedTitles, titleId],
    updatedAt: new Date(),
  })

  return true
}

export async function setActiveTitle(userId: string, titleId: string | null): Promise<boolean> {
  const currentProgress = await getUserProgress(userId)
  if (!currentProgress) return false

  const unlockedTitles = currentProgress.unlockedTitles || []
  if (titleId && !unlockedTitles.includes(titleId)) return false

  await upsertProgress({
    ...currentProgress,
    activeTitle: titleId,
    updatedAt: new Date(),
  })

  return true
}

// Reset functions for leaderboard periods
export async function resetWeeklyXP(): Promise<void> {
  const { error } = await backendClient.from('user_progress').update({ weekly_xp: 0 }).gte('weekly_xp', 0)
  if (error) {
    reportError('Erro ao resetar XP semanal:', error)
  }
}

export async function resetMonthlyXP(): Promise<void> {
  const { error } = await backendClient.from('user_progress').update({ monthly_xp: 0 }).gte('monthly_xp', 0)
  if (error) {
    reportError('Erro ao resetar XP mensal:', error)
  }
}

// Premium functions
export async function activatePremium(
  userId: string,
  durationDays: number | 'lifetime' = 'lifetime'
): Promise<boolean> {
  const currentProgress = (await getUserProgress(userId)) || (await createUserProgress(userId))
  const premiumExpiresAt =
    durationDays === 'lifetime'
      ? null
      : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

  await upsertProgress({
    ...currentProgress,
    isPremium: true,
    premiumExpiresAt,
    updatedAt: new Date(),
  })

  return true
}

export async function deactivatePremium(userId: string): Promise<boolean> {
  const currentProgress = (await getUserProgress(userId)) || (await createUserProgress(userId))

  await upsertProgress({
    ...currentProgress,
    isPremium: false,
    premiumExpiresAt: null,
    updatedAt: new Date(),
  })

  return true
}

export function isPremiumActive(progress: UserProgress | null): boolean {
  if (!progress || !progress.isPremium) return false

  if (!progress.premiumExpiresAt) return true
  const expirationDate =
    progress.premiumExpiresAt instanceof Date
      ? progress.premiumExpiresAt
      : new Date(progress.premiumExpiresAt)

  return expirationDate > new Date()
}

// Admin functions
export async function setUserXP(userId: string, amount: number): Promise<boolean> {
  try {
    if (!(await hasAdminAccess())) return false
    const currentProgress = (await getUserProgress(userId)) || (await createUserProgress(userId))

    await upsertProgress({
      ...currentProgress,
      xp: Math.max(0, amount),
      level: getLevelFromXP(Math.max(0, amount)),
      updatedAt: new Date(),
    })

    return true
  } catch (error) {
    reportError('Erro ao definir XP:', error)
    return false
  }
}

export async function setUserCoins(userId: string, amount: number): Promise<boolean> {
  try {
    if (!(await hasAdminAccess())) return false
    const currentProgress = (await getUserProgress(userId)) || (await createUserProgress(userId))

    await upsertProgress({
      ...currentProgress,
      coins: Math.max(0, amount),
      updatedAt: new Date(),
    })

    return true
  } catch (error) {
    reportError('Erro ao definir moedas:', error)
    return false
  }
}

export async function setUserLevel(userId: string, level: number): Promise<boolean> {
  try {
    if (!(await hasAdminAccess())) return false
    const currentProgress = (await getUserProgress(userId)) || (await createUserProgress(userId))
    const safeLevel = Math.max(1, Math.floor(level))

    await upsertProgress({
      ...currentProgress,
      level: safeLevel,
      xp: getTotalXPForLevel(safeLevel),
      updatedAt: new Date(),
    })

    return true
  } catch (error) {
    reportError('Erro ao definir nivel:', error)
    return false
  }
}

export async function resetUserProgress(userId: string): Promise<boolean> {
  try {
    if (!(await hasAdminAccess())) return false
    const currentProgress = (await getUserProgress(userId)) || (await createUserProgress(userId))

    await upsertProgress({
      ...currentProgress,
      xp: 0,
      level: 1,
      coins: 0,
      achievements: [],
      unlockedTitles: [],
      activeTitle: null,
      weeklyXP: 0,
      monthlyXP: 0,
      updatedAt: new Date(),
    })

    return true
  } catch (error) {
    reportError('Erro ao resetar progresso:', error)
    return false
  }
}
