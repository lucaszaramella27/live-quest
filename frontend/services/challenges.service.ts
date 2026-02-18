import { callBackendFunction } from './functions-api.service'
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

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getCurrentWeekRange(): { weekKey: string; startDate: string; endDate: string } {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay())

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return {
    weekKey: toIsoDate(start),
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  }
}

function toNonNegativeInt(value: unknown): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.floor(numeric))
}

function normalizeChallenge(raw: unknown): Challenge {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const reward = source.reward && typeof source.reward === 'object'
    ? (source.reward as Record<string, unknown>)
    : {}

  return {
    id: String(source.id || ''),
    title: String(source.title || ''),
    description: String(source.description || ''),
    icon: String(source.icon || 'target') as IconName,
    type: (String(source.type || 'tasks') as Challenge['type']),
    target: Math.max(1, toNonNegativeInt(source.target)),
    current: toNonNegativeInt(source.current),
    reward: {
      xp: toNonNegativeInt(reward.xp),
      coins: toNonNegativeInt(reward.coins),
    },
    difficulty: (String(source.difficulty || 'easy') as Challenge['difficulty']),
    completed: Boolean(source.completed),
    claimedAt: source.claimedAt ? String(source.claimedAt) : null,
  }
}

function normalizeAchievement(raw: unknown): ChallengeAchievement {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    id: String(source.id || ''),
    name: String(source.name || ''),
    description: String(source.description || ''),
    icon: String(source.icon || 'star') as IconName,
    rarity: (String(source.rarity || 'bronze') as ChallengeAchievement['rarity']),
    xpReward: toNonNegativeInt(source.xpReward),
  }
}

export async function getWeeklyChallenges(): Promise<WeeklyChallengesResponse> {
  const fallback = getCurrentWeekRange()
  const response = await callBackendFunction<Partial<WeeklyChallengesResponse>>('getWeeklyChallenges')

  return {
    weekKey: typeof response?.weekKey === 'string' ? response.weekKey : fallback.weekKey,
    startDate: typeof response?.startDate === 'string' ? response.startDate : fallback.startDate,
    endDate: typeof response?.endDate === 'string' ? response.endDate : fallback.endDate,
    challenges: Array.isArray(response?.challenges)
      ? response.challenges
          .map((challenge) => (challenge && typeof challenge === 'object' ? normalizeChallenge(challenge) : null))
          .filter((challenge): challenge is Challenge => Boolean(challenge && challenge.id))
      : [],
  }
}

export async function claimWeeklyChallengeReward(challengeId: string): Promise<ClaimChallengeResponse> {
  const response = await callBackendFunction<Partial<ClaimChallengeResponse>>('claimWeeklyChallengeReward', {
    challengeId,
  })

  const challenge =
    response?.challenge && typeof response.challenge === 'object'
      ? normalizeChallenge(response.challenge)
      : undefined

  return {
    success: response?.success === true,
    reason: typeof response?.reason === 'string' ? response.reason : undefined,
    challenge: challenge && challenge.id ? challenge : undefined,
    achievements: Array.isArray(response?.achievements)
      ? response.achievements
          .map((achievement) =>
            achievement && typeof achievement === 'object'
              ? normalizeAchievement(achievement)
              : null
          )
          .filter((achievement): achievement is ChallengeAchievement => Boolean(achievement && achievement.id))
      : [],
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
