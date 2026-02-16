import { backendClient } from './backend-client'
import {
  addCoins,
  addXP,
  checkAchievements,
  getUserStats,
  type Achievement,
} from './progress.service'
import { addDailyActivityRewards } from './activity.service'
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
  }
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  completed: boolean
  claimedAt: string | null
}

export interface WeeklyChallengesResponse {
  weekKey: string
  startDate: string
  endDate: string
  challenges: Challenge[]
}

export interface ChallengeAchievement {
  id: string
  name: string
  description: string
  icon: IconName
  rarity: 'bronze' | 'silver' | 'gold' | 'diamond'
  xpReward: number
}

export interface ClaimChallengeResponse {
  success: boolean
  reason?: string
  challenge?: Challenge
  achievements: ChallengeAchievement[]
}

interface WeeklyChallengeRow {
  id: string
  user_id: string
  week_key: string
  start_date: string
  end_date: string
  challenges: Array<Record<string, unknown>> | null
  created_at: string | null
  updated_at: string | null
}

interface DailyActivitySummaryRow {
  date: string
  tasks_completed: number | null
  goals_completed: number | null
  events_created: number | null
}

interface StreakSummaryRow {
  current_streak: number | null
}

interface WeeklyChallengeTemplate {
  id: string
  title: string
  description: string
  icon: IconName
  type: 'tasks' | 'goals' | 'streak' | 'events' | 'login'
  target: number
  reward: {
    xp: number
    coins: number
  }
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
}

interface StoredWeeklyChallenge extends WeeklyChallengeTemplate {
  claimedAt: string | null
}

const WEEKLY_CHALLENGE_POOL: WeeklyChallengeTemplate[] = [
  {
    id: 'tasks_5',
    title: 'Comecando a Semana',
    description: 'Complete 5 tarefas esta semana',
    icon: 'check',
    type: 'tasks',
    target: 5,
    reward: { xp: 50, coins: 10 },
    difficulty: 'easy',
  },
  {
    id: 'events_3',
    title: 'Organizador',
    description: 'Crie 3 eventos no calendario',
    icon: 'calendar',
    type: 'events',
    target: 3,
    reward: { xp: 40, coins: 8 },
    difficulty: 'easy',
  },
  {
    id: 'streak_3',
    title: 'Persistencia',
    description: 'Mantenha 3 dias de streak',
    icon: 'flame',
    type: 'streak',
    target: 3,
    reward: { xp: 60, coins: 12 },
    difficulty: 'easy',
  },
  {
    id: 'tasks_20',
    title: 'Produtivo',
    description: 'Complete 20 tarefas esta semana',
    icon: 'shield',
    type: 'tasks',
    target: 20,
    reward: { xp: 150, coins: 30 },
    difficulty: 'medium',
  },
  {
    id: 'goals_2',
    title: 'Focado nas Metas',
    description: 'Complete 2 metas esta semana',
    icon: 'target',
    type: 'goals',
    target: 2,
    reward: { xp: 200, coins: 40 },
    difficulty: 'medium',
  },
  {
    id: 'streak_5',
    title: 'Constancia',
    description: 'Mantenha 5 dias de streak',
    icon: 'zap',
    type: 'streak',
    target: 5,
    reward: { xp: 180, coins: 35 },
    difficulty: 'medium',
  },
  {
    id: 'events_10',
    title: 'Planejador Master',
    description: 'Organize 10 eventos',
    icon: 'trending',
    type: 'events',
    target: 10,
    reward: { xp: 120, coins: 25 },
    difficulty: 'medium',
  },
  {
    id: 'tasks_50',
    title: 'Maratona',
    description: 'Complete 50 tarefas esta semana',
    icon: 'footprints',
    type: 'tasks',
    target: 50,
    reward: { xp: 400, coins: 80 },
    difficulty: 'hard',
  },
  {
    id: 'goals_5',
    title: 'Conquistador',
    description: 'Complete 5 metas esta semana',
    icon: 'crown',
    type: 'goals',
    target: 5,
    reward: { xp: 500, coins: 100 },
    difficulty: 'hard',
  },
  {
    id: 'streak_7',
    title: 'Semana Perfeita',
    description: 'Mantenha 7 dias de streak',
    icon: 'star',
    type: 'streak',
    target: 7,
    reward: { xp: 600, coins: 120 },
    difficulty: 'hard',
  },
]

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getWeekRange(now: Date = new Date()): { start: Date; end: Date; key: string } {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay())

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  const key = start.toISOString().slice(0, 10)
  return { start, end, key }
}

function pickDeterministicChallenge(
  pool: WeeklyChallengeTemplate[],
  seed: string,
  usedIds: Set<string>
): WeeklyChallengeTemplate {
  const candidates = pool.filter((challenge) => !usedIds.has(challenge.id))
  const index = hashString(seed) % candidates.length
  return candidates[index]
}

function buildWeeklyChallenges(userId: string, weekKey: string): StoredWeeklyChallenge[] {
  const easy = WEEKLY_CHALLENGE_POOL.filter((challenge) => challenge.difficulty === 'easy')
  const medium = WEEKLY_CHALLENGE_POOL.filter((challenge) => challenge.difficulty === 'medium')
  const hard = WEEKLY_CHALLENGE_POOL.filter((challenge) => challenge.difficulty === 'hard')
  const usedIds = new Set<string>()

  const selected: WeeklyChallengeTemplate[] = []

  const first = pickDeterministicChallenge(easy, `${userId}:${weekKey}:easy:1`, usedIds)
  usedIds.add(first.id)
  selected.push(first)

  const second = pickDeterministicChallenge(medium, `${userId}:${weekKey}:medium:1`, usedIds)
  usedIds.add(second.id)
  selected.push(second)

  const third = pickDeterministicChallenge(medium, `${userId}:${weekKey}:medium:2`, usedIds)
  usedIds.add(third.id)
  selected.push(third)

  const fourth = pickDeterministicChallenge(hard, `${userId}:${weekKey}:hard:1`, usedIds)
  selected.push(fourth)

  return selected.map((challenge) => ({
    ...challenge,
    claimedAt: null,
  }))
}

function resolveChallengeCurrentValue(
  challenge: WeeklyChallengeTemplate,
  progress: Record<string, number>
): number {
  if (challenge.type === 'tasks') return progress.tasks ?? 0
  if (challenge.type === 'goals') return progress.goals ?? 0
  if (challenge.type === 'events') return progress.events ?? 0
  if (challenge.type === 'login') return progress.login ?? 0
  return progress.streak ?? 0
}

function mapAchievement(achievement: Achievement): ChallengeAchievement {
  return {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    rarity: achievement.rarity,
    xpReward: achievement.xpReward,
  }
}

function parseStoredChallenge(raw: Record<string, unknown>): StoredWeeklyChallenge {
  return {
    id: String(raw.id || ''),
    title: String(raw.title || ''),
    description: String(raw.description || ''),
    icon: (String(raw.icon || 'target') as IconName),
    type: (raw.type as WeeklyChallengeTemplate['type']) || 'tasks',
    target: Number(raw.target ?? 1),
    reward: {
      xp: Number((raw.reward as Record<string, unknown> | undefined)?.xp ?? 0),
      coins: Number((raw.reward as Record<string, unknown> | undefined)?.coins ?? 0),
    },
    difficulty: (raw.difficulty as WeeklyChallengeTemplate['difficulty']) || 'easy',
    claimedAt: raw.claimedAt ? String(raw.claimedAt) : null,
  }
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await backendClient.auth.getUser()

  if (!user) {
    throw new Error('Usuario nao autenticado.')
  }

  return user.id
}

async function getWeeklyProgressMap(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const { data: activities, error: activitiesError } = await backendClient
    .from('daily_activity')
    .select('date, tasks_completed, goals_completed, events_created')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .returns<DailyActivitySummaryRow[]>()

  if (activitiesError) {
    throw activitiesError
  }

  const { data: streakData, error: streakError } = await backendClient
    .from('streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .maybeSingle<StreakSummaryRow>()

  if (streakError) {
    throw streakError
  }

  let tasks = 0
  let goals = 0
  let events = 0
  let login = 0

  for (const activity of activities || []) {
    const dayTasks = Number(activity.tasks_completed ?? 0)
    const dayGoals = Number(activity.goals_completed ?? 0)
    const dayEvents = Number(activity.events_created ?? 0)

    tasks += dayTasks
    goals += dayGoals
    events += dayEvents
    if (dayTasks > 0 || dayGoals > 0 || dayEvents > 0) {
      login += 1
    }
  }

  return {
    tasks,
    goals,
    events,
    login,
    streak: Number(streakData?.current_streak ?? 0),
  }
}

async function ensureWeeklyChallengeRow(
  userId: string,
  weekKey: string,
  startDate: string,
  endDate: string
): Promise<WeeklyChallengeRow> {
  const rowId = `${userId}_${weekKey}`
  const { data: existingRow, error: fetchError } = await backendClient
    .from('user_challenges')
    .select('*')
    .eq('id', rowId)
    .maybeSingle<WeeklyChallengeRow>()

  if (fetchError) {
    throw fetchError
  }

  if (existingRow) {
    return existingRow
  }

  const nowIso = new Date().toISOString()
  const generatedChallenges = buildWeeklyChallenges(userId, weekKey)

  const { data: createdRow, error: createError } = await backendClient
    .from('user_challenges')
    .insert({
      id: rowId,
      user_id: userId,
      week_key: weekKey,
      start_date: startDate,
      end_date: endDate,
      challenges: generatedChallenges,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select('*')
    .single<WeeklyChallengeRow>()

  if (createError) {
    throw createError
  }

  return createdRow
}

export async function getWeeklyChallenges(): Promise<WeeklyChallengesResponse> {
  const userId = await getCurrentUserId()
  const weekRange = getWeekRange()
  const startDate = weekRange.start.toISOString().slice(0, 10)
  const endDate = weekRange.end.toISOString().slice(0, 10)

  const challengeRow = await ensureWeeklyChallengeRow(userId, weekRange.key, startDate, endDate)
  const storedChallenges = (challengeRow.challenges || []).map(parseStoredChallenge)
  const progressMap = await getWeeklyProgressMap(userId, startDate, endDate)

  const challenges: Challenge[] = storedChallenges.map((challenge) => {
    const current = resolveChallengeCurrentValue(challenge, progressMap)
    const completed = current >= challenge.target

    return {
      ...challenge,
      current,
      completed,
    }
  })

  return {
    weekKey: weekRange.key,
    startDate,
    endDate,
    challenges,
  }
}

export async function claimWeeklyChallengeReward(challengeId: string): Promise<ClaimChallengeResponse> {
  const userId = await getCurrentUserId()
  const weekly = await getWeeklyChallenges()
  const targetChallenge = weekly.challenges.find((challenge) => challenge.id === challengeId)

  if (!targetChallenge) {
    return { success: false, reason: 'invalid_challenge', achievements: [] }
  }

  if (targetChallenge.claimedAt) {
    return { success: false, reason: 'already_claimed', achievements: [] }
  }

  if (!targetChallenge.completed) {
    return { success: false, reason: 'challenge_not_completed', achievements: [] }
  }

  const ledgerId = `${userId}:challenge:${weekly.weekKey}:${challengeId}`
  const { data: existingLedger, error: ledgerFetchError } = await backendClient
    .from('xp_ledger')
    .select('id')
    .eq('id', ledgerId)
    .maybeSingle<{ id: string }>()

  if (ledgerFetchError) {
    throw ledgerFetchError
  }

  if (existingLedger) {
    return { success: false, reason: 'already_claimed', achievements: [] }
  }

  await addXP(userId, targetChallenge.reward.xp)
  await addCoins(userId, targetChallenge.reward.coins)
  await addDailyActivityRewards(userId, targetChallenge.reward.xp, targetChallenge.reward.coins)

  const rowId = `${userId}_${weekly.weekKey}`
  const { data: challengeRow, error: challengeRowError } = await backendClient
    .from('user_challenges')
    .select('challenges')
    .eq('id', rowId)
    .single<{ challenges: Array<Record<string, unknown>> }>()

  if (challengeRowError) {
    throw challengeRowError
  }

  const claimedAtIso = new Date().toISOString()
  const updatedChallenges = (challengeRow.challenges || []).map((raw) => {
    const parsed = parseStoredChallenge(raw)
    if (parsed.id !== challengeId) return parsed
    return {
      ...parsed,
      claimedAt: claimedAtIso,
    }
  })

  const { error: challengeUpdateError } = await backendClient
    .from('user_challenges')
    .update({
      challenges: updatedChallenges,
      updated_at: claimedAtIso,
    })
    .eq('id', rowId)

  if (challengeUpdateError) {
    throw challengeUpdateError
  }

  const { error: ledgerInsertError } = await backendClient.from('xp_ledger').insert({
    id: ledgerId,
    user_id: userId,
    source_type: 'challenge',
    source_id: `${weekly.weekKey}:${challengeId}`,
    xp: targetChallenge.reward.xp,
    coins: targetChallenge.reward.coins,
    created_at: claimedAtIso,
  })

  if (ledgerInsertError) {
    throw ledgerInsertError
  }

  const stats = await getUserStats(userId)
  const achievements = await checkAchievements(userId, stats)

  return {
    success: true,
    challenge: {
      ...targetChallenge,
      claimedAt: claimedAtIso,
    },
    achievements: achievements.map(mapAchievement),
  }
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
    extreme: '#dc2626',
  }
  return colors[difficulty]
}

export function getDifficultyGradient(difficulty: Challenge['difficulty']): string {
  const gradients = {
    easy: 'from-green-500/20 to-emerald-500/20',
    medium: 'from-yellow-500/20 to-orange-500/20',
    hard: 'from-red-500/20 to-rose-500/20',
    extreme: 'from-rose-500/20 to-pink-500/20',
  }
  return gradients[difficulty]
}
