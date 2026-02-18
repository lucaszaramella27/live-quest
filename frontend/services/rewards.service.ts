import { callBackendFunction } from './functions-api.service'
import { ACHIEVEMENTS, type Achievement } from './progress.service'
import type { RegisterStreakActivityResult } from './streaks.service'
import { reportError } from './logger.service'

export interface RewardRule {
  xp: number
  coins: number
  maxPerDay: number
  minAgeMs: number
}

export const TASK_REWARD_RULE: RewardRule = {
  xp: 10,
  coins: 2,
  maxPerDay: 20,
  minAgeMs: 5 * 60 * 1000,
}

export const GOAL_REWARD_RULE: RewardRule = {
  xp: 100,
  coins: 20,
  maxPerDay: 5,
  minAgeMs: 5 * 60 * 1000,
}

export const EVENT_REWARD_RULE: RewardRule = {
  xp: 5,
  coins: 1,
  maxPerDay: 15,
  minAgeMs: 0,
}

interface BackendAchievement {
  id: string
  name: string
  description: string
  icon: Achievement['icon']
  rarity: Achievement['rarity']
  xpReward: number
}

interface ApplyDocumentRewardBackendResponse {
  awarded: boolean
  reason?: string
  achievements?: BackendAchievement[]
  streak?: RegisterStreakActivityResult
}

function mapAchievement(raw: BackendAchievement): Achievement {
  const known = ACHIEVEMENTS.find((achievement) => achievement.id === raw.id)
  if (known) return known

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    icon: raw.icon,
    rarity: raw.rarity,
    xpReward: Number(raw.xpReward || 0),
    condition: () => false,
  }
}

export async function applyDocumentReward(params: {
  sourceType: 'task' | 'goal' | 'event'
  sourceId: string
}): Promise<{ awarded: boolean; reason?: string; achievements: Achievement[]; streak?: RegisterStreakActivityResult }> {
  try {
    const response = await callBackendFunction<ApplyDocumentRewardBackendResponse>('applyDocumentReward', {
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    })

    return {
      awarded: response.awarded === true,
      reason: typeof response.reason === 'string' ? response.reason : undefined,
      achievements: Array.isArray(response.achievements)
        ? response.achievements.map((achievement) => mapAchievement(achievement))
        : [],
      streak: response.streak,
    }
  } catch (error) {
    reportError('reward_apply_failed', error, {
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    })
    throw error
  }
}
