import { backendClient } from './backend-client'
import { getRewardPowerupModifiers } from './inventory.service'
import { reportError } from './logger.service'
import { addCoins, addXP, checkAchievements, getUserStats, type Achievement } from './progress.service'
import { recordDailyActivity } from './activity.service'

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

interface RewardDailyRow {
  id: string
  user_id: string
  date: string
  task_count: number | null
  goal_count: number | null
  event_count: number | null
  xp_total: number | null
  coins_total: number | null
  created_at: string | null
  updated_at: string | null
}

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function getCounterField(sourceType: 'task' | 'goal' | 'event'): 'task_count' | 'goal_count' | 'event_count' {
  if (sourceType === 'task') return 'task_count'
  if (sourceType === 'goal') return 'goal_count'
  return 'event_count'
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const maybeCode = (error as { code?: unknown }).code
  return maybeCode === '23505'
}

async function upsertRewardDaily(
  userId: string,
  sourceType: 'task' | 'goal' | 'event',
  xp: number,
  coins: number
): Promise<void> {
  const today = getTodayIsoDate()
  const rowId = `${userId}_${today}`
  const counterField = getCounterField(sourceType)

  const { data: current, error: currentError } = await backendClient
    .from('reward_daily')
    .select('*')
    .eq('id', rowId)
    .maybeSingle<RewardDailyRow>()

  if (currentError) throw currentError

  const nowIso = new Date().toISOString()

  if (!current) {
    const base = {
      id: rowId,
      user_id: userId,
      date: today,
      task_count: 0,
      goal_count: 0,
      event_count: 0,
      xp_total: 0,
      coins_total: 0,
      created_at: nowIso,
      updated_at: nowIso,
    }

    const { error: insertError } = await backendClient.from('reward_daily').insert({
      ...base,
      [counterField]: 1,
      xp_total: xp,
      coins_total: coins,
    })

    if (insertError) throw insertError
    return
  }

  const { error: updateError } = await backendClient
    .from('reward_daily')
    .update({
      [counterField]: Number(current[counterField] ?? 0) + 1,
      xp_total: Number(current.xp_total ?? 0) + xp,
      coins_total: Number(current.coins_total ?? 0) + coins,
      updated_at: nowIso,
    })
    .eq('id', rowId)

  if (updateError) throw updateError
}

async function getTodayRewardCount(userId: string, sourceType: 'task' | 'goal' | 'event'): Promise<number> {
  const today = getTodayIsoDate()
  const rowId = `${userId}_${today}`
  const counterField = getCounterField(sourceType)

  const { data, error } = await backendClient
    .from('reward_daily')
    .select(counterField)
    .eq('id', rowId)
    .maybeSingle<Record<string, number | null>>()

  if (error) throw error
  return Number(data?.[counterField] ?? 0)
}

function applyMultiplier(baseValue: number, multiplier: number): number {
  if (!Number.isFinite(baseValue) || baseValue <= 0) return 0

  const safeMultiplier = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1
  return Math.max(0, Math.round(baseValue * safeMultiplier))
}

export async function applyDocumentReward(params: {
  userId: string
  sourceType: 'task' | 'goal' | 'event'
  sourceId: string
  createdAt: Date
  alreadyRewarded: boolean
  rule: RewardRule
  markRewarded?: () => Promise<void>
}): Promise<{ awarded: boolean; reason?: string; achievements: Achievement[] }> {
  if (params.alreadyRewarded) {
    return { awarded: false, reason: 'already_rewarded', achievements: [] }
  }

  if (params.rule.minAgeMs > 0) {
    const ageMs = Date.now() - params.createdAt.getTime()
    if (ageMs < params.rule.minAgeMs) {
      return { awarded: false, reason: 'cooldown_not_reached', achievements: [] }
    }
  }

  const [dailyCount, modifiers] = await Promise.all([
    getTodayRewardCount(params.userId, params.sourceType),
    getRewardPowerupModifiers(params.userId),
  ])

  if (dailyCount >= params.rule.maxPerDay) {
    return { awarded: false, reason: 'daily_limit_reached', achievements: [] }
  }

  const awardedXP = applyMultiplier(params.rule.xp, modifiers.xpMultiplier)
  const awardedCoins = applyMultiplier(params.rule.coins, modifiers.coinMultiplier)

  const ledgerId = `${params.userId}:${params.sourceType}:${params.sourceId}`
  const nowIso = new Date().toISOString()

  const { error: ledgerError } = await backendClient.from('xp_ledger').insert({
    id: ledgerId,
    user_id: params.userId,
    source_type: params.sourceType,
    source_id: params.sourceId,
    xp: awardedXP,
    coins: awardedCoins,
    created_at: nowIso,
  })

  if (ledgerError) {
    if (isUniqueViolation(ledgerError)) {
      return { awarded: false, reason: 'already_rewarded', achievements: [] }
    }
    throw ledgerError
  }

  try {
    await addXP(params.userId, awardedXP)
    await addCoins(params.userId, awardedCoins)
    await upsertRewardDaily(params.userId, params.sourceType, awardedXP, awardedCoins)
    await recordDailyActivity(params.userId, params.sourceType, awardedXP, awardedCoins)

    if (params.markRewarded) {
      await params.markRewarded()
    }

    const stats = await getUserStats(params.userId)
    const achievements = await checkAchievements(params.userId, stats)

    return {
      awarded: true,
      achievements,
    }
  } catch (error) {
    reportError('reward_apply_failed', error, {
      userId: params.userId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    })

    await backendClient.from('xp_ledger').delete().eq('id', ledgerId)
    throw error
  }
}
