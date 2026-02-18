import { Router } from 'express'
import { z } from 'zod'
import { withTransaction } from '../db.js'
import { getShopItemById } from '../shop.js'

const router = Router()
const isProd = process.env.NODE_ENV === 'production'

const checkoutSchema = z.object({
  billingCycle: z.enum(['monthly', 'yearly']),
})

const setPremiumSchema = z.object({
  userId: z.string().uuid(),
  isPremium: z.boolean(),
  durationDays: z.union([z.literal('lifetime'), z.number().int().positive().max(3650)]).optional(),
})

const purchaseItemSchema = z.object({
  itemId: z.string().min(1).max(120),
})

const setActiveTitleSchema = z.object({
  titleId: z.string().max(120).nullable(),
})

const twitchConnectSchema = z.object({
  code: z.string().min(1).max(4096),
  redirectUri: z.string().url().optional(),
})

const twitchUpdateSettingsSchema = z.object({
  autoXpOnLive: z.boolean(),
  xpPerHourLive: z.number().int().min(1).max(500),
  autoGoalsFromTwitch: z.boolean(),
})

const claimWeeklyChallengeSchema = z.object({
  challengeId: z.string().min(1).max(120),
})

const applyDocumentRewardSchema = z.object({
  sourceType: z.enum(['task', 'goal', 'event']),
  sourceId: z.string().uuid(),
})

const setUserXPSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(0),
})

const setUserCoinsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(0),
})

const setUserLevelSchema = z.object({
  userId: z.string().uuid(),
  level: z.number().int().min(1),
})

const resetUserProgressSchema = z.object({
  userId: z.string().uuid(),
})

const DEFAULT_EQUIPPED_ITEMS = {
  avatar: null,
  badge: null,
  theme: null,
}

const TASK_REWARD_RULE = {
  xp: 10,
  coins: 2,
  maxPerDay: 20,
  minAgeMs: 5 * 60 * 1000,
}

const GOAL_REWARD_RULE = {
  xp: 100,
  coins: 20,
  maxPerDay: 5,
  minAgeMs: 5 * 60 * 1000,
}

const EVENT_REWARD_RULE = {
  xp: 5,
  coins: 1,
  maxPerDay: 15,
  minAgeMs: 0,
}

const WEEKLY_CHALLENGE_POOL = [
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

const ACHIEVEMENT_RULES = [
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

let cachedTwitchAppToken = null
let cachedTwitchAppTokenExpiresAt = 0

function createHttpError(status, message, code) {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

function getFrontendBaseUrl(req) {
  const fromEnv = (process.env.APP_BASE_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '')
    .split(',')[0]
    .trim()
  if (fromEnv) return fromEnv

  const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin.trim() : ''
  if (originHeader) return originHeader

  return 'http://localhost:5173'
}

function buildRedirectUrl(baseUrl, pathWithQuery) {
  try {
    return new URL(pathWithQuery, baseUrl).toString()
  } catch {
    return `http://localhost:5173${pathWithQuery}`
  }
}

function appendQueryParams(rawUrl, params) {
  const url = new URL(rawUrl)

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

function resolveCheckoutUrl(billingCycle) {
  const generic = (process.env.BILLING_CHECKOUT_URL || '').trim()
  const monthly = (process.env.BILLING_CHECKOUT_URL_MONTHLY || '').trim() || generic
  const yearly = (process.env.BILLING_CHECKOUT_URL_YEARLY || '').trim() || generic

  if (billingCycle === 'yearly') return yearly || monthly
  return monthly
}

function resolvePortalUrl() {
  return (process.env.BILLING_PORTAL_URL || '').trim()
}

function resolvePremiumExpiresAt(isPremium, durationDays) {
  if (!isPremium) return null
  if (durationDays === 'lifetime' || !durationDays) return null
  return new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
}

function getXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

function getLevelFromXP(xp) {
  let level = 1
  let totalXP = 0

  while (totalXP + getXPForLevel(level) <= xp) {
    totalXP += getXPForLevel(level)
    level += 1
  }

  return level
}

function getTotalXPForLevel(level) {
  if (level <= 1) return 0
  let total = 0
  for (let i = 1; i < level; i += 1) {
    total += getXPForLevel(i)
  }
  return total
}

function normalizeActivePowerup(entry) {
  const itemId = typeof entry?.itemId === 'string' ? entry.itemId : ''
  const type = typeof entry?.type === 'string' ? entry.type : ''
  const value = Number(entry?.value ?? 0)
  const activatedAt = typeof entry?.activatedAt === 'string' ? entry.activatedAt : ''
  const expiresAt = typeof entry?.expiresAt === 'string' ? entry.expiresAt : null

  if (!itemId || !type || !activatedAt || !Number.isFinite(value) || value <= 0) return null
  if (expiresAt) {
    const expirationDate = new Date(expiresAt)
    if (!Number.isNaN(expirationDate.getTime()) && expirationDate.getTime() < Date.now()) return null
  }

  return { itemId, type, value, activatedAt, expiresAt }
}

function getTwitchClientId() {
  return (process.env.TWITCH_CLIENT_ID || '').trim()
}

function getTwitchClientSecret() {
  return (process.env.TWITCH_CLIENT_SECRET || '').trim()
}

function parseDateOrNull(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10)
}

function getTodayIsoDate() {
  return toIsoDate(new Date())
}

function toNonNegativeInt(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.floor(numeric))
}

function hashString(input) {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getWeekRange(now = new Date()) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay())

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return {
    start,
    end,
    key: toIsoDate(start),
  }
}

function pickDeterministicChallenge(pool, seed, usedIds) {
  const candidates = pool.filter((challenge) => !usedIds.has(challenge.id))
  if (candidates.length === 0) {
    return pool[hashString(seed) % pool.length]
  }
  return candidates[hashString(seed) % candidates.length]
}

function buildWeeklyChallenges(userId, weekKey) {
  const easy = WEEKLY_CHALLENGE_POOL.filter((challenge) => challenge.difficulty === 'easy')
  const medium = WEEKLY_CHALLENGE_POOL.filter((challenge) => challenge.difficulty === 'medium')
  const hard = WEEKLY_CHALLENGE_POOL.filter((challenge) => challenge.difficulty === 'hard')
  const usedIds = new Set()

  const selected = []

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

function parseStoredWeeklyChallenge(raw) {
  const reward = raw && typeof raw.reward === 'object' ? raw.reward : {}

  return {
    id: String(raw?.id || ''),
    title: String(raw?.title || ''),
    description: String(raw?.description || ''),
    icon: String(raw?.icon || 'target'),
    type: String(raw?.type || 'tasks'),
    target: Math.max(1, toNonNegativeInt(raw?.target || 1)),
    reward: {
      xp: toNonNegativeInt(reward?.xp),
      coins: toNonNegativeInt(reward?.coins),
    },
    difficulty: String(raw?.difficulty || 'easy'),
    claimedAt: raw?.claimedAt ? String(raw.claimedAt) : null,
  }
}

function serializeStoredWeeklyChallenge(challenge) {
  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    icon: challenge.icon,
    type: challenge.type,
    target: challenge.target,
    reward: {
      xp: toNonNegativeInt(challenge.reward?.xp),
      coins: toNonNegativeInt(challenge.reward?.coins),
    },
    difficulty: challenge.difficulty,
    claimedAt: challenge.claimedAt || null,
  }
}

function resolveChallengeCurrentValue(challenge, progress) {
  if (challenge.type === 'tasks') return toNonNegativeInt(progress.tasks)
  if (challenge.type === 'goals') return toNonNegativeInt(progress.goals)
  if (challenge.type === 'events') return toNonNegativeInt(progress.events)
  if (challenge.type === 'login') return toNonNegativeInt(progress.login)
  return toNonNegativeInt(progress.streak)
}

function normalizeWeeklyChallenges(storedChallenges, progressMap) {
  return storedChallenges.map((challenge) => {
    const current = resolveChallengeCurrentValue(challenge, progressMap)
    return {
      ...challenge,
      current,
      completed: current >= challenge.target,
    }
  })
}

async function getWeeklyProgressMap(client, userId, startDate, endDate) {
  const activityQuery = await client.query(
    `
      SELECT date, tasks_completed, goals_completed, events_created
      FROM public.daily_activity
      WHERE user_id = $1
        AND date >= $2
        AND date <= $3
    `,
    [userId, startDate, endDate]
  )

  const streakQuery = await client.query(
    `
      SELECT current_streak
      FROM public.streaks
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  )

  let tasks = 0
  let goals = 0
  let events = 0
  let login = 0

  for (const row of activityQuery.rows) {
    const dayTasks = toNonNegativeInt(row.tasks_completed)
    const dayGoals = toNonNegativeInt(row.goals_completed)
    const dayEvents = toNonNegativeInt(row.events_created)

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
    streak: toNonNegativeInt(streakQuery.rows[0]?.current_streak),
  }
}

async function ensureWeeklyChallengeRow(client, userId, weekKey, startDate, endDate) {
  const rowId = `${userId}_${weekKey}`
  const existing = await client.query(
    `
      SELECT id, user_id, week_key, start_date, end_date, challenges
      FROM public.user_challenges
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
    `,
    [rowId]
  )

  if (existing.rowCount) return existing.rows[0]

  const nowIso = new Date().toISOString()
  const generatedChallenges = buildWeeklyChallenges(userId, weekKey)

  try {
    const inserted = await client.query(
      `
        INSERT INTO public.user_challenges (
          id,
          user_id,
          week_key,
          start_date,
          end_date,
          challenges,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $7)
        RETURNING id, user_id, week_key, start_date, end_date, challenges
      `,
      [rowId, userId, weekKey, startDate, endDate, JSON.stringify(generatedChallenges), nowIso]
    )
    return inserted.rows[0]
  } catch (error) {
    if (String(error?.code || '') !== '23505') throw error

    const conflict = await client.query(
      `
        SELECT id, user_id, week_key, start_date, end_date, challenges
        FROM public.user_challenges
        WHERE id = $1
        LIMIT 1
        FOR UPDATE
      `,
      [rowId]
    )
    if (!conflict.rowCount) throw error
    return conflict.rows[0]
  }
}

async function getWeeklyChallengesForUser(client, userId) {
  const weekRange = getWeekRange()
  const startDate = toIsoDate(weekRange.start)
  const endDate = toIsoDate(weekRange.end)
  const weeklyRow = await ensureWeeklyChallengeRow(client, userId, weekRange.key, startDate, endDate)
  const storedChallenges = (Array.isArray(weeklyRow.challenges) ? weeklyRow.challenges : [])
    .map((rawChallenge) => parseStoredWeeklyChallenge(rawChallenge))
    .filter((challenge) => Boolean(challenge.id))
  const progressMap = await getWeeklyProgressMap(client, userId, startDate, endDate)
  const challenges = normalizeWeeklyChallenges(storedChallenges, progressMap)

  return {
    rowId: String(weeklyRow.id || `${userId}_${weekRange.key}`),
    weekKey: weekRange.key,
    startDate,
    endDate,
    challenges,
  }
}

async function addChallengeRewardsToDailyActivity(client, userId, xpAmount, coinsAmount) {
  const xp = toNonNegativeInt(xpAmount)
  const coins = toNonNegativeInt(coinsAmount)
  if (xp === 0 && coins === 0) return

  const today = getTodayIsoDate()
  const rowId = `${userId}_${today}`
  const nowIso = new Date().toISOString()
  const existing = await client.query(
    `
      SELECT xp_earned, coins_earned
      FROM public.daily_activity
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
    `,
    [rowId]
  )

  if (!existing.rowCount) {
    await client.query(
      `
        INSERT INTO public.daily_activity (
          id,
          user_id,
          date,
          tasks_completed,
          goals_completed,
          events_created,
          xp_earned,
          coins_earned,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, 0, 0, 0, $4, $5, $6, $6)
      `,
      [rowId, userId, today, xp, coins, nowIso]
    )
    return
  }

  await client.query(
    `
      UPDATE public.daily_activity
      SET
        xp_earned = $2,
        coins_earned = $3,
        updated_at = $4
      WHERE id = $1
    `,
    [
      rowId,
      toNonNegativeInt(existing.rows[0].xp_earned) + xp,
      toNonNegativeInt(existing.rows[0].coins_earned) + coins,
      nowIso,
    ]
  )
}

async function addChallengeRewardsToRewardDaily(client, userId, xpAmount, coinsAmount) {
  const xp = toNonNegativeInt(xpAmount)
  const coins = toNonNegativeInt(coinsAmount)
  if (xp === 0 && coins === 0) return

  const today = getTodayIsoDate()
  const rowId = `${userId}_${today}`
  const nowIso = new Date().toISOString()
  const existing = await client.query(
    `
      SELECT task_count, goal_count, event_count, xp_total, coins_total
      FROM public.reward_daily
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
    `,
    [rowId]
  )

  if (!existing.rowCount) {
    await client.query(
      `
        INSERT INTO public.reward_daily (
          id,
          user_id,
          date,
          task_count,
          goal_count,
          event_count,
          xp_total,
          coins_total,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, 0, 0, 0, $4, $5, $6, $6)
      `,
      [rowId, userId, today, xp, coins, nowIso]
    )
    return
  }

  await client.query(
    `
      UPDATE public.reward_daily
      SET
        xp_total = $2,
        coins_total = $3,
        updated_at = $4
      WHERE id = $1
    `,
    [
      rowId,
      toNonNegativeInt(existing.rows[0].xp_total) + xp,
      toNonNegativeInt(existing.rows[0].coins_total) + coins,
      nowIso,
    ]
  )
}

async function getAchievementStats(client, userId) {
  const sinceDate = new Date()
  sinceDate.setHours(0, 0, 0, 0)
  sinceDate.setDate(sinceDate.getDate() - 364)

  const activityQuery = await client.query(
    `
      SELECT date, tasks_completed, goals_completed, events_created
      FROM public.daily_activity
      WHERE user_id = $1
        AND date >= $2
    `,
    [userId, toIsoDate(sinceDate)]
  )

  const streakQuery = await client.query(
    `
      SELECT current_streak, longest_streak
      FROM public.streaks
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  )

  let totalTasksCompleted = 0
  let totalGoalsCompleted = 0
  let totalEventsCreated = 0
  let daysActive = 0

  for (const activity of activityQuery.rows) {
    const tasks = toNonNegativeInt(activity.tasks_completed)
    const goals = toNonNegativeInt(activity.goals_completed)
    const events = toNonNegativeInt(activity.events_created)

    totalTasksCompleted += tasks
    totalGoalsCompleted += goals
    totalEventsCreated += events

    if (tasks > 0 || goals > 0 || events > 0) {
      daysActive += 1
    }
  }

  return {
    totalGoalsCompleted,
    totalTasksCompleted,
    currentStreak: toNonNegativeInt(streakQuery.rows[0]?.current_streak),
    longestStreak: toNonNegativeInt(streakQuery.rows[0]?.longest_streak),
    totalEventsCreated,
    daysActive,
  }
}

function resolveUnlockedAchievements(existingAchievementIds, stats) {
  const known = new Set(
    (Array.isArray(existingAchievementIds) ? existingAchievementIds : [])
      .map((value) => String(value))
      .filter(Boolean)
  )
  const unlocked = []
  let bonusXP = 0

  for (const achievement of ACHIEVEMENT_RULES) {
    if (known.has(achievement.id)) continue
    if (!achievement.condition(stats)) continue

    known.add(achievement.id)
    bonusXP += toNonNegativeInt(achievement.xpReward)
    unlocked.push({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      rarity: achievement.rarity,
      xpReward: toNonNegativeInt(achievement.xpReward),
    })
  }

  return {
    achievements: Array.from(known),
    unlocked,
    bonusXP,
  }
}

function getRewardRule(sourceType) {
  if (sourceType === 'task') return TASK_REWARD_RULE
  if (sourceType === 'goal') return GOAL_REWARD_RULE
  return EVENT_REWARD_RULE
}

function getRewardCounterField(sourceType) {
  if (sourceType === 'task') return 'task_count'
  if (sourceType === 'goal') return 'goal_count'
  return 'event_count'
}

function getPowerupExpirationTimestamp(powerup) {
  if (!powerup?.expiresAt) return Number.POSITIVE_INFINITY
  const timestamp = new Date(powerup.expiresAt).getTime()
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp
}

function parseInventoryPowerups(inventoryRow) {
  const rawPowerups = Array.isArray(inventoryRow?.active_powerups) ? inventoryRow.active_powerups : []
  return rawPowerups.map((entry) => normalizeActivePowerup(entry)).filter((entry) => Boolean(entry))
}

function getRewardPowerupModifiers(activePowerups) {
  let xpMultiplier = 1
  let coinMultiplier = 1

  for (const powerup of activePowerups) {
    if (powerup.type === 'xp_boost') {
      xpMultiplier = Math.max(xpMultiplier, Math.max(1, Number(powerup.value || 1)))
    }
    if (powerup.type === 'double_coins') {
      coinMultiplier = Math.max(coinMultiplier, Math.max(1, Number(powerup.value || 1)))
    }
  }

  return {
    xpMultiplier,
    coinMultiplier,
  }
}

function applyRewardMultiplier(baseValue, multiplier) {
  if (!Number.isFinite(baseValue) || baseValue <= 0) return 0
  const safeMultiplier = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1
  return Math.max(0, Math.round(baseValue * safeMultiplier))
}

function getIsoUtcDate(date) {
  return date.toISOString().slice(0, 10)
}

function getUtcStartOfDayTimestamp(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function getDayDifference(from, to) {
  const fromTs = getUtcStartOfDayTimestamp(from)
  const toTs = getUtcStartOfDayTimestamp(to)
  return Math.floor((toTs - fromTs) / (24 * 60 * 60 * 1000))
}

function getStreakFreezeUses(activePowerups) {
  return activePowerups.reduce((total, powerup) => {
    if (powerup.type !== 'streak_freeze') return total
    return total + toNonNegativeInt(powerup.value)
  }, 0)
}

function consumeStreakFreezeUses(activePowerups, usesToConsume) {
  const requiredUses = toNonNegativeInt(usesToConsume)
  const availableUses = getStreakFreezeUses(activePowerups)
  if (requiredUses <= 0) {
    return {
      success: true,
      consumedUses: 0,
      remainingUses: availableUses,
      nextPowerups: activePowerups,
    }
  }

  if (availableUses < requiredUses) {
    return {
      success: false,
      consumedUses: 0,
      remainingUses: availableUses,
      nextPowerups: activePowerups,
    }
  }

  let remainingToConsume = requiredUses
  const nextPowerups = []
  const sortedPowerups = [...activePowerups].sort(
    (left, right) => getPowerupExpirationTimestamp(left) - getPowerupExpirationTimestamp(right)
  )

  for (const powerup of sortedPowerups) {
    if (powerup.type !== 'streak_freeze') {
      nextPowerups.push(powerup)
      continue
    }

    const currentUses = toNonNegativeInt(powerup.value)
    if (remainingToConsume <= 0) {
      nextPowerups.push(powerup)
      continue
    }

    const consumedNow = Math.min(currentUses, remainingToConsume)
    const remainingUses = currentUses - consumedNow
    remainingToConsume -= consumedNow

    if (remainingUses > 0) {
      nextPowerups.push({
        ...powerup,
        value: remainingUses,
      })
    }
  }

  return {
    success: true,
    consumedUses: requiredUses,
    remainingUses: getStreakFreezeUses(nextPowerups),
    nextPowerups,
  }
}

async function ensureStreakRowForUser(client, userId) {
  const existing = await client.query(
    `
      SELECT user_id, current_streak, longest_streak, last_checkin
      FROM public.streaks
      WHERE user_id = $1
      LIMIT 1
      FOR UPDATE
    `,
    [userId]
  )
  if (existing.rowCount) return existing.rows[0]

  const inserted = await client.query(
    `
      INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_checkin)
      VALUES ($1, 0, 0, NULL)
      RETURNING user_id, current_streak, longest_streak, last_checkin
    `,
    [userId]
  )
  return inserted.rows[0]
}

async function registerStreakActivityForUser(client, userId, checkinDate = new Date()) {
  const streakRow = await ensureStreakRowForUser(client, userId)
  const inventoryRow = await ensureInventoryRowForUser(client, userId)
  const activePowerups = parseInventoryPowerups(inventoryRow)
  const currentDateKey = getIsoUtcDate(checkinDate)
  const lastCheckinDate = parseDateOrNull(streakRow.last_checkin)

  if (lastCheckinDate && getIsoUtcDate(lastCheckinDate) === currentDateKey) {
    return {
      streak: {
        userId,
        currentStreak: toNonNegativeInt(streakRow.current_streak),
        longestStreak: toNonNegativeInt(streakRow.longest_streak),
        lastCheckin: lastCheckinDate,
      },
      freezeUsed: false,
      consumedFreezeUses: 0,
      remainingFreezeUses: getStreakFreezeUses(activePowerups),
      resetOccurred: false,
    }
  }

  let nextCurrentStreak = Math.max(1, toNonNegativeInt(streakRow.current_streak))
  let consumedFreezeUses = 0
  let remainingFreezeUses = getStreakFreezeUses(activePowerups)
  let freezeUsed = false
  let resetOccurred = false
  let nextPowerups = activePowerups

  if (!lastCheckinDate) {
    nextCurrentStreak = 1
  } else {
    const daysSinceLastCheckin = getDayDifference(lastCheckinDate, checkinDate)

    if (daysSinceLastCheckin <= 0) {
      nextCurrentStreak = toNonNegativeInt(streakRow.current_streak)
    } else if (daysSinceLastCheckin === 1) {
      nextCurrentStreak = toNonNegativeInt(streakRow.current_streak) + 1
    } else {
      const missedDays = daysSinceLastCheckin - 1
      const freezeResult = consumeStreakFreezeUses(activePowerups, missedDays)

      if (freezeResult.success) {
        nextCurrentStreak = toNonNegativeInt(streakRow.current_streak) + 1
        freezeUsed = freezeResult.consumedUses > 0
        consumedFreezeUses = freezeResult.consumedUses
        remainingFreezeUses = freezeResult.remainingUses
        nextPowerups = freezeResult.nextPowerups
      } else {
        nextCurrentStreak = 1
        resetOccurred = true
        remainingFreezeUses = freezeResult.remainingUses
      }
    }
  }

  const nextLongestStreak = Math.max(toNonNegativeInt(streakRow.longest_streak), nextCurrentStreak)
  const nextCheckinIso = checkinDate.toISOString()

  await client.query(
    `
      UPDATE public.streaks
      SET
        current_streak = $2,
        longest_streak = $3,
        last_checkin = $4
      WHERE user_id = $1
    `,
    [userId, nextCurrentStreak, nextLongestStreak, nextCheckinIso]
  )

  if (freezeUsed) {
    await client.query(
      `
        UPDATE public.user_inventories
        SET active_powerups = $2::jsonb, updated_at = $3
        WHERE user_id = $1
      `,
      [userId, JSON.stringify(nextPowerups), new Date().toISOString()]
    )
  }

  return {
    streak: {
      userId,
      currentStreak: nextCurrentStreak,
      longestStreak: nextLongestStreak,
      lastCheckin: new Date(nextCheckinIso),
    },
    freezeUsed,
    consumedFreezeUses,
    remainingFreezeUses,
    resetOccurred,
  }
}

async function getRewardSourceRowForUpdate(client, userId, sourceType, sourceId) {
  if (sourceType === 'task') {
    const result = await client.query(
      `
        SELECT id, user_id, created_at, rewarded_at, completed, completed_at
        FROM public.checklists
        WHERE id = $1 AND user_id = $2
        LIMIT 1
        FOR UPDATE
      `,
      [sourceId, userId]
    )
    return result.rows[0] || null
  }

  if (sourceType === 'goal') {
    const result = await client.query(
      `
        SELECT id, user_id, created_at, rewarded_at, completed, completed_at
        FROM public.goals
        WHERE id = $1 AND user_id = $2
        LIMIT 1
        FOR UPDATE
      `,
      [sourceId, userId]
    )
    return result.rows[0] || null
  }

  const result = await client.query(
    `
      SELECT id, user_id, created_at, rewarded_at, true AS completed, NULL::timestamptz AS completed_at
      FROM public.calendar_events
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      FOR UPDATE
    `,
    [sourceId, userId]
  )
  return result.rows[0] || null
}

async function markRewardSourceAsRewarded(client, sourceType, sourceId, nowIso) {
  if (sourceType === 'task') {
    await client.query(
      `
        UPDATE public.checklists
        SET
          rewarded_at = $2,
          completed_at = COALESCE(completed_at, $2)
        WHERE id = $1
      `,
      [sourceId, nowIso]
    )
    return
  }

  if (sourceType === 'goal') {
    await client.query(
      `
        UPDATE public.goals
        SET
          rewarded_at = $2,
          completed_at = COALESCE(completed_at, $2)
        WHERE id = $1
      `,
      [sourceId, nowIso]
    )
    return
  }

  await client.query(
    `
      UPDATE public.calendar_events
      SET rewarded_at = $2
      WHERE id = $1
    `,
    [sourceId, nowIso]
  )
}

async function ensureRewardDailyRow(client, userId, date) {
  const rowId = `${userId}_${date}`
  const existing = await client.query(
    `
      SELECT id, task_count, goal_count, event_count, xp_total, coins_total
      FROM public.reward_daily
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
    `,
    [rowId]
  )
  if (existing.rowCount) return existing.rows[0]

  const nowIso = new Date().toISOString()
  const inserted = await client.query(
    `
      INSERT INTO public.reward_daily (
        id,
        user_id,
        date,
        task_count,
        goal_count,
        event_count,
        xp_total,
        coins_total,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, 0, 0, 0, 0, 0, $4, $4)
      RETURNING id, task_count, goal_count, event_count, xp_total, coins_total
    `,
    [rowId, userId, date, nowIso]
  )
  return inserted.rows[0]
}

async function ensureDailyActivityRow(client, userId, date) {
  const rowId = `${userId}_${date}`
  const existing = await client.query(
    `
      SELECT id, tasks_completed, goals_completed, events_created, xp_earned, coins_earned
      FROM public.daily_activity
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
    `,
    [rowId]
  )
  if (existing.rowCount) return existing.rows[0]

  const nowIso = new Date().toISOString()
  const inserted = await client.query(
    `
      INSERT INTO public.daily_activity (
        id,
        user_id,
        date,
        tasks_completed,
        goals_completed,
        events_created,
        xp_earned,
        coins_earned,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, 0, 0, 0, 0, 0, $4, $4)
      RETURNING id, tasks_completed, goals_completed, events_created, xp_earned, coins_earned
    `,
    [rowId, userId, date, nowIso]
  )
  return inserted.rows[0]
}

async function applyDocumentRewardForUser(client, userId, sourceType, sourceId) {
  const sourceRow = await getRewardSourceRowForUpdate(client, userId, sourceType, sourceId)
  if (!sourceRow) {
    return { awarded: false, reason: 'source_not_found', achievements: [] }
  }

  if (sourceRow.rewarded_at) {
    return { awarded: false, reason: 'already_rewarded', achievements: [] }
  }

  if (!sourceRow.completed) {
    return { awarded: false, reason: 'not_completed', achievements: [] }
  }

  const rewardRule = getRewardRule(sourceType)
  const createdAt = parseDateOrNull(sourceRow.created_at) || new Date()
  if (rewardRule.minAgeMs > 0 && Date.now() - createdAt.getTime() < rewardRule.minAgeMs) {
    return { awarded: false, reason: 'cooldown_not_reached', achievements: [] }
  }

  const progress = await ensureProgressRowForUser(client, userId)
  const inventory = await ensureInventoryRowForUser(client, userId)
  const activePowerups = parseInventoryPowerups(inventory)
  const modifiers = getRewardPowerupModifiers(activePowerups)
  const awardedXP = applyRewardMultiplier(rewardRule.xp, modifiers.xpMultiplier)
  const awardedCoins = applyRewardMultiplier(rewardRule.coins, modifiers.coinMultiplier)

  const today = getTodayIsoDate()
  const rewardDailyRow = await ensureRewardDailyRow(client, userId, today)
  const counterField = getRewardCounterField(sourceType)
  const dailyCount = toNonNegativeInt(rewardDailyRow[counterField])
  if (dailyCount >= rewardRule.maxPerDay) {
    return { awarded: false, reason: 'daily_limit_reached', achievements: [] }
  }

  const ledgerId = `${userId}:${sourceType}:${sourceId}`
  const nowIso = new Date().toISOString()

  try {
    await client.query(
      `
        INSERT INTO public.xp_ledger (id, user_id, source_type, source_id, xp, coins, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [ledgerId, userId, sourceType, sourceId, awardedXP, awardedCoins, nowIso]
    )
  } catch (error) {
    if (String(error?.code || '') === '23505') {
      return { awarded: false, reason: 'already_rewarded', achievements: [] }
    }
    throw error
  }

  await markRewardSourceAsRewarded(client, sourceType, sourceId, nowIso)

  await client.query(
    `
      UPDATE public.reward_daily
      SET
        task_count = $2,
        goal_count = $3,
        event_count = $4,
        xp_total = $5,
        coins_total = $6,
        updated_at = $7
      WHERE id = $1
    `,
    [
      rewardDailyRow.id,
      sourceType === 'task' ? dailyCount + 1 : toNonNegativeInt(rewardDailyRow.task_count),
      sourceType === 'goal' ? dailyCount + 1 : toNonNegativeInt(rewardDailyRow.goal_count),
      sourceType === 'event' ? dailyCount + 1 : toNonNegativeInt(rewardDailyRow.event_count),
      toNonNegativeInt(rewardDailyRow.xp_total) + awardedXP,
      toNonNegativeInt(rewardDailyRow.coins_total) + awardedCoins,
      nowIso,
    ]
  )

  const activityRow = await ensureDailyActivityRow(client, userId, today)
  await client.query(
    `
      UPDATE public.daily_activity
      SET
        tasks_completed = $2,
        goals_completed = $3,
        events_created = $4,
        xp_earned = $5,
        coins_earned = $6,
        updated_at = $7
      WHERE id = $1
    `,
    [
      activityRow.id,
      sourceType === 'task' ? toNonNegativeInt(activityRow.tasks_completed) + 1 : toNonNegativeInt(activityRow.tasks_completed),
      sourceType === 'goal' ? toNonNegativeInt(activityRow.goals_completed) + 1 : toNonNegativeInt(activityRow.goals_completed),
      sourceType === 'event' ? toNonNegativeInt(activityRow.events_created) + 1 : toNonNegativeInt(activityRow.events_created),
      toNonNegativeInt(activityRow.xp_earned) + awardedXP,
      toNonNegativeInt(activityRow.coins_earned) + awardedCoins,
      nowIso,
    ]
  )

  const streak = await registerStreakActivityForUser(client, userId, new Date())

  const stats = await getAchievementStats(client, userId)
  const achievementResolution = resolveUnlockedAchievements(progress.achievements, stats)
  const totalXPGain = awardedXP + toNonNegativeInt(achievementResolution.bonusXP)
  const nextXP = toNonNegativeInt(progress.xp) + totalXPGain
  const nextCoins = toNonNegativeInt(progress.coins) + awardedCoins
  const nextLevel = getLevelFromXP(nextXP)
  const nextWeeklyXP = toNonNegativeInt(progress.weekly_xp) + totalXPGain
  const nextMonthlyXP = toNonNegativeInt(progress.monthly_xp) + totalXPGain

  await client.query(
    `
      UPDATE public.user_progress
      SET
        xp = $2,
        level = $3,
        coins = $4,
        weekly_xp = $5,
        monthly_xp = $6,
        achievements = $7,
        updated_at = $8
      WHERE user_id = $1
    `,
    [
      userId,
      nextXP,
      nextLevel,
      nextCoins,
      nextWeeklyXP,
      nextMonthlyXP,
      achievementResolution.achievements,
      nowIso,
    ]
  )

  return {
    awarded: true,
    reason: undefined,
    achievements: achievementResolution.unlocked,
    streak,
  }
}

async function ensureProgressRowForUser(client, userId) {
  const existing = await client.query(
    `
      SELECT user_id, xp, level, coins, achievements, unlocked_titles, active_title, weekly_xp, monthly_xp, user_name, user_photo_url, is_premium
      FROM public.user_progress
      WHERE user_id = $1
      LIMIT 1
      FOR UPDATE
    `,
    [userId]
  )
  if (existing.rowCount) return existing.rows[0]

  const userQuery = await client.query(
    `
      SELECT id, display_name, photo_url, is_premium
      FROM public.users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  )
  const userRow = userQuery.rows[0]
  if (!userRow) {
    throw createHttpError(404, 'User not found.', 'user_not_found')
  }

  const inserted = await client.query(
    `
      INSERT INTO public.user_progress (
        user_id,
        xp,
        level,
        coins,
        achievements,
        unlocked_titles,
        active_title,
        weekly_xp,
        monthly_xp,
        user_name,
        user_photo_url,
        is_premium,
        premium_expires_at
      )
      VALUES ($1, 0, 1, 0, '{}', '{novice}', 'novice', 0, 0, $2, $3, $4, NULL)
      RETURNING user_id, xp, level, coins, achievements, unlocked_titles, active_title, weekly_xp, monthly_xp, user_name, user_photo_url, is_premium
    `,
    [userId, userRow.display_name || 'Usuario', userRow.photo_url || '', Boolean(userRow.is_premium)]
  )
  return inserted.rows[0]
}

async function ensureInventoryRowForUser(client, userId) {
  const existing = await client.query(
    `
      SELECT user_id, purchased_item_ids, active_powerups
      FROM public.user_inventories
      WHERE user_id = $1
      LIMIT 1
      FOR UPDATE
    `,
    [userId]
  )
  if (existing.rowCount) return existing.rows[0]

  const inserted = await client.query(
    `
      INSERT INTO public.user_inventories (user_id, purchased_item_ids, active_powerups)
      VALUES ($1, '{}', '[]'::jsonb)
      RETURNING user_id, purchased_item_ids, active_powerups
    `,
    [userId]
  )
  return inserted.rows[0]
}

async function setPremiumForUser(client, userId, isPremium, premiumExpiresAt) {
  const userUpdate = await client.query(
    `
      UPDATE public.users
      SET is_premium = $2
      WHERE id = $1
      RETURNING id
    `,
    [userId, isPremium]
  )

  if (!userUpdate.rowCount) {
    throw createHttpError(404, 'User not found.', 'user_not_found')
  }

  await client.query(
    `
      INSERT INTO public.user_progress (user_id, is_premium, premium_expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE
      SET
        is_premium = EXCLUDED.is_premium,
        premium_expires_at = EXCLUDED.premium_expires_at
    `,
    [userId, isPremium, premiumExpiresAt]
  )
}

async function fetchTwitchAppAccessToken() {
  const clientId = getTwitchClientId()
  const clientSecret = getTwitchClientSecret()
  if (!clientId || !clientSecret) {
    throw createHttpError(503, 'Twitch backend integration is not configured.', 'twitch_not_configured')
  }

  const now = Date.now()
  if (cachedTwitchAppToken && cachedTwitchAppTokenExpiresAt > now + 60_000) {
    return cachedTwitchAppToken
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  })

  const response = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, { method: 'POST' })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.access_token) {
    throw createHttpError(502, 'Failed to obtain Twitch app token.', 'twitch_app_token_error')
  }

  cachedTwitchAppToken = String(body.access_token)
  const expiresIn = Number(body.expires_in ?? 3600)
  cachedTwitchAppTokenExpiresAt = now + Math.max(60_000, expiresIn * 1000)
  return cachedTwitchAppToken
}

async function exchangeTwitchCodeForToken(code, redirectUri) {
  const clientId = getTwitchClientId()
  const clientSecret = getTwitchClientSecret()
  if (!clientId || !clientSecret) {
    throw createHttpError(503, 'Twitch backend integration is not configured.', 'twitch_not_configured')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  })

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.access_token) {
    throw createHttpError(401, 'Invalid Twitch OAuth code.', 'twitch_oauth_error')
  }
  return String(body.access_token)
}

async function fetchTwitchUser(accessToken) {
  const clientId = getTwitchClientId()
  const response = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      'Client-Id': clientId,
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const body = await response.json().catch(() => null)
  const user = Array.isArray(body?.data) ? body.data[0] : null
  if (!response.ok || !user?.id) {
    throw createHttpError(401, 'Could not fetch Twitch user profile.', 'twitch_profile_error')
  }
  return user
}

async function fetchTwitchStreamByUserId(twitchUserId) {
  const clientId = getTwitchClientId()
  const appToken = await fetchTwitchAppAccessToken()
  const params = new URLSearchParams({ user_id: String(twitchUserId) })
  const response = await fetch(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
    headers: {
      'Client-Id': clientId,
      Authorization: `Bearer ${appToken}`,
    },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw createHttpError(502, 'Could not fetch Twitch stream status.', 'twitch_stream_error')
  }
  return Array.isArray(body?.data) ? body.data[0] || null : null
}

router.post('/:functionName', async (req, res) => {
  try {
    const { functionName } = req.params
    const authUserId = String(req.auth?.userId || '')

    if (!authUserId) {
      throw createHttpError(401, 'Unauthorized: missing auth context.', 'unauthorized')
    }

    if (functionName === 'healthz') {
      res.json({ status: 'ok', timestamp: new Date().toISOString() })
      return
    }

    if (functionName === 'createStripeCheckoutSession') {
      const parsed = checkoutSchema.safeParse(req.body)
      if (!parsed.success) throw createHttpError(400, 'Invalid checkout payload.', 'validation_failed')

      const checkoutUrl = resolveCheckoutUrl(parsed.data.billingCycle)
      if (checkoutUrl) {
        const url = appendQueryParams(checkoutUrl, {
          client_reference_id: authUserId,
          billing_cycle: parsed.data.billingCycle,
        })
        res.json({ url })
        return
      }

      if (isProd) {
        throw createHttpError(
          503,
          'Billing checkout is not configured. Set BILLING_CHECKOUT_URL(_MONTHLY/_YEARLY).',
          'billing_not_configured'
        )
      }

      await withTransaction(async (client) => {
        await setPremiumForUser(client, authUserId, true, null)
      })
      res.json({ url: buildRedirectUrl(getFrontendBaseUrl(req), '/plans?checkout=success&source=dev-fallback') })
      return
    }

    if (functionName === 'createStripePortalSession') {
      const portalUrl = resolvePortalUrl()
      if (portalUrl) {
        const url = appendQueryParams(portalUrl, { client_reference_id: authUserId })
        res.json({ url })
        return
      }

      if (isProd) {
        throw createHttpError(503, 'Billing portal is not configured. Set BILLING_PORTAL_URL.', 'billing_not_configured')
      }

      res.json({ url: buildRedirectUrl(getFrontendBaseUrl(req), '/plans') })
      return
    }

    if (functionName === 'setPremiumStatus') {
      if (!req.auth?.isAdmin) throw createHttpError(403, 'Forbidden: admin access required.', 'forbidden')
      const parsed = setPremiumSchema.safeParse(req.body)
      if (!parsed.success) throw createHttpError(400, 'Invalid premium payload.', 'validation_failed')

      const premiumExpiresAt = resolvePremiumExpiresAt(parsed.data.isPremium, parsed.data.durationDays ?? 'lifetime')
      await withTransaction(async (client) => {
        await setPremiumForUser(client, parsed.data.userId, parsed.data.isPremium, premiumExpiresAt)
      })

      res.json({
        success: true,
        premiumExpiresAt: premiumExpiresAt ? premiumExpiresAt.toISOString() : null,
      })
      return
    }

    if (functionName === 'setUserXP') {
      if (!req.auth?.isAdmin) throw createHttpError(403, 'Forbidden: admin access required.', 'forbidden')
      const parsed = setUserXPSchema.safeParse(req.body)
      if (!parsed.success) throw createHttpError(400, 'Invalid XP payload.', 'validation_failed')

      await withTransaction(async (client) => {
        const progress = await ensureProgressRowForUser(client, parsed.data.userId)
        const nextXP = toNonNegativeInt(parsed.data.amount)
        const nextLevel = getLevelFromXP(nextXP)

        await client.query(
          `
            UPDATE public.user_progress
            SET xp = $2, level = $3, updated_at = $4
            WHERE user_id = $1
          `,
          [parsed.data.userId, nextXP, nextLevel, new Date().toISOString()]
        )

        return progress
      })

      res.json({ success: true })
      return
    }

    if (functionName === 'setUserCoins') {
      if (!req.auth?.isAdmin) throw createHttpError(403, 'Forbidden: admin access required.', 'forbidden')
      const parsed = setUserCoinsSchema.safeParse(req.body)
      if (!parsed.success) throw createHttpError(400, 'Invalid coins payload.', 'validation_failed')

      await withTransaction(async (client) => {
        await ensureProgressRowForUser(client, parsed.data.userId)
        await client.query(
          `
            UPDATE public.user_progress
            SET coins = $2, updated_at = $3
            WHERE user_id = $1
          `,
          [parsed.data.userId, toNonNegativeInt(parsed.data.amount), new Date().toISOString()]
        )
      })

      res.json({ success: true })
      return
    }

    if (functionName === 'setUserLevel') {
      if (!req.auth?.isAdmin) throw createHttpError(403, 'Forbidden: admin access required.', 'forbidden')
      const parsed = setUserLevelSchema.safeParse(req.body)
      if (!parsed.success) throw createHttpError(400, 'Invalid level payload.', 'validation_failed')

      await withTransaction(async (client) => {
        await ensureProgressRowForUser(client, parsed.data.userId)
        const safeLevel = Math.max(1, toNonNegativeInt(parsed.data.level))
        await client.query(
          `
            UPDATE public.user_progress
            SET level = $2, xp = $3, updated_at = $4
            WHERE user_id = $1
          `,
          [parsed.data.userId, safeLevel, getTotalXPForLevel(safeLevel), new Date().toISOString()]
        )
      })

      res.json({ success: true })
      return
    }

    if (functionName === 'resetUserProgress') {
      if (!req.auth?.isAdmin) throw createHttpError(403, 'Forbidden: admin access required.', 'forbidden')
      const parsed = resetUserProgressSchema.safeParse(req.body)
      if (!parsed.success) throw createHttpError(400, 'Invalid reset payload.', 'validation_failed')

      await withTransaction(async (client) => {
        await ensureProgressRowForUser(client, parsed.data.userId)
        await client.query(
          `
            UPDATE public.user_progress
            SET
              xp = 0,
              level = 1,
              coins = 0,
              achievements = '{}',
              unlocked_titles = '{novice}',
              active_title = 'novice',
              weekly_xp = 0,
              monthly_xp = 0,
              updated_at = $2
            WHERE user_id = $1
          `,
          [parsed.data.userId, new Date().toISOString()]
        )
      })

      res.json({ success: true })
      return
    }

    if (functionName === 'ensureUserProgress') {
      await withTransaction(async (client) => {
        await ensureProgressRowForUser(client, authUserId)
      })
      res.json({ success: true })
      return
    }

    if (functionName === 'setActiveTitle') {
      const parsed = setActiveTitleSchema.safeParse(req.body)
      if (!parsed.success) throw createHttpError(400, 'Invalid active title payload.', 'validation_failed')

      const result = await withTransaction(async (client) => {
        const progress = await ensureProgressRowForUser(client, authUserId)
        const unlockedTitles = Array.isArray(progress.unlocked_titles) ? progress.unlocked_titles : []

        if (parsed.data.titleId && !unlockedTitles.includes(parsed.data.titleId)) {
          return { success: false }
        }

        await client.query(
          `
            UPDATE public.user_progress
            SET active_title = $2
            WHERE user_id = $1
          `,
          [authUserId, parsed.data.titleId]
        )
        return { success: true }
      })

      res.json(result)
      return
    }

    if (functionName === 'purchaseShopItem') {
      const parsed = purchaseItemSchema.safeParse(req.body)
      if (!parsed.success) throw createHttpError(400, 'Invalid purchase payload.', 'validation_failed')

      const result = await withTransaction(async (client) => {
        const item = getShopItemById(parsed.data.itemId)
        if (!item) {
          return {
            success: false,
            reason: 'item_unavailable',
            newBalance: 0,
            newXP: 0,
            newLevel: 1,
            purchasedItemIds: [],
            activePowerups: [],
            equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
          }
        }

        const progress = await ensureProgressRowForUser(client, authUserId)
        const inventory = await ensureInventoryRowForUser(client, authUserId)
        const currentCoins = Number(progress.coins ?? 0)
        const purchasedSet = new Set(Array.isArray(inventory.purchased_item_ids) ? inventory.purchased_item_ids : [])
        const activePowerups = (Array.isArray(inventory.active_powerups) ? inventory.active_powerups : [])
          .map((entry) => normalizeActivePowerup(entry))
          .filter((entry) => Boolean(entry))

        if (item.category !== 'powerup' && purchasedSet.has(item.id)) {
          return {
            success: false,
            reason: 'item_already_owned',
            newBalance: currentCoins,
            newXP: Number(progress.xp ?? 0),
            newLevel: Number(progress.level ?? 1),
            purchasedItemIds: Array.from(purchasedSet),
            activePowerups,
            equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
          }
        }

        if (item.isPremiumOnly && !progress.is_premium) {
          return {
            success: false,
            reason: 'premium_required',
            newBalance: currentCoins,
            newXP: Number(progress.xp ?? 0),
            newLevel: Number(progress.level ?? 1),
            purchasedItemIds: Array.from(purchasedSet),
            activePowerups,
            equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
          }
        }

        if (currentCoins < Number(item.price)) {
          return {
            success: false,
            reason: 'coins_insufficient',
            newBalance: currentCoins,
            newXP: Number(progress.xp ?? 0),
            newLevel: Number(progress.level ?? 1),
            purchasedItemIds: Array.from(purchasedSet),
            activePowerups,
            equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
          }
        }

        if (item.isLimited && Number.isFinite(item.stock)) {
          const stockQuery = await client.query(
            `
              SELECT item_id, stock
              FROM public.shop_stock
              WHERE item_id = $1
              LIMIT 1
              FOR UPDATE
            `,
            [item.id]
          )

          const currentStock = stockQuery.rowCount
            ? Number(stockQuery.rows[0].stock ?? 0)
            : Number(item.stock)

          if (currentStock <= 0) {
            return {
              success: false,
              reason: 'item_unavailable',
              newBalance: currentCoins,
              newXP: Number(progress.xp ?? 0),
              newLevel: Number(progress.level ?? 1),
              purchasedItemIds: Array.from(purchasedSet),
              activePowerups,
              equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
            }
          }

          if (stockQuery.rowCount) {
            await client.query(
              `
                UPDATE public.shop_stock
                SET stock = $2, updated_at = $3
                WHERE item_id = $1
              `,
              [item.id, currentStock - 1, new Date().toISOString()]
            )
          } else {
            await client.query(
              `
                INSERT INTO public.shop_stock (item_id, stock, updated_at)
                VALUES ($1, $2, $3)
              `,
              [item.id, currentStock - 1, new Date().toISOString()]
            )
          }
        }

        let nextXP = Number(progress.xp ?? 0)
        let nextLevel = Number(progress.level ?? 1)
        if (item.effect) {
          if (item.effect.type === 'instant_level') {
            nextLevel += Math.max(1, Number(item.effect.value || 1))
            nextXP = Math.max(nextXP, getTotalXPForLevel(nextLevel))
          } else {
            const activatedAt = new Date().toISOString()
            const expiresAt =
              typeof item.effect.duration === 'number'
                ? new Date(Date.now() + item.effect.duration * 60 * 60 * 1000).toISOString()
                : null
            activePowerups.push({
              itemId: item.id,
              type: item.effect.type,
              value: Number(item.effect.value || 1),
              activatedAt,
              expiresAt,
            })
          }
        }

        const nextCoins = currentCoins - Number(item.price)
        purchasedSet.add(item.id)
        const nowIso = new Date().toISOString()

        await client.query(
          `
            UPDATE public.user_progress
            SET coins = $2, xp = $3, level = $4, updated_at = $5
            WHERE user_id = $1
          `,
          [authUserId, nextCoins, nextXP, nextLevel, nowIso]
        )

        await client.query(
          `
            UPDATE public.user_inventories
            SET purchased_item_ids = $2, active_powerups = $3::jsonb, updated_at = $4
            WHERE user_id = $1
          `,
          [authUserId, Array.from(purchasedSet), JSON.stringify(activePowerups), nowIso]
        )

        return {
          success: true,
          reason: null,
          newBalance: nextCoins,
          newXP: nextXP,
          newLevel: nextLevel,
          purchasedItemIds: Array.from(purchasedSet),
          activePowerups,
          equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
        }
      })

      res.json(result)
      return
    }

    if (functionName === 'applyDocumentReward') {
      const parsed = applyDocumentRewardSchema.safeParse(req.body)
      if (!parsed.success) throw createHttpError(400, 'Invalid reward payload.', 'validation_failed')

      const result = await withTransaction((client) =>
        applyDocumentRewardForUser(client, authUserId, parsed.data.sourceType, parsed.data.sourceId)
      )

      res.json(result)
      return
    }

    if (functionName === 'twitchConnect') {
      const parsed = twitchConnectSchema.safeParse(req.body)
      if (!parsed.success) throw createHttpError(400, 'Invalid Twitch connect payload.', 'validation_failed')

      const redirectUri =
        parsed.data.redirectUri ||
        process.env.TWITCH_REDIRECT_URI ||
        `${getFrontendBaseUrl(req).replace(/\/+$/, '')}/twitch/callback`

      const userAccessToken = await exchangeTwitchCodeForToken(parsed.data.code, redirectUri)
      const twitchUser = await fetchTwitchUser(userAccessToken)
      const nowIso = new Date().toISOString()

      await withTransaction(async (client) => {
        await client.query(
          `
            INSERT INTO public.twitch_integrations (
              user_id,
              twitch_user_id,
              twitch_login,
              twitch_display_name,
              twitch_profile_image,
              broadcaster_type,
              connected_at,
              last_stream_check,
              is_live,
              total_followers,
              total_subscribers,
              total_views,
              auto_xp_on_live,
              xp_per_hour_live,
              auto_goals_from_twitch,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $7, false, 0, 0, 0, true, 50, true, $7)
            ON CONFLICT (user_id) DO UPDATE
            SET
              twitch_user_id = EXCLUDED.twitch_user_id,
              twitch_login = EXCLUDED.twitch_login,
              twitch_display_name = EXCLUDED.twitch_display_name,
              twitch_profile_image = EXCLUDED.twitch_profile_image,
              broadcaster_type = EXCLUDED.broadcaster_type,
              connected_at = EXCLUDED.connected_at,
              last_stream_check = EXCLUDED.last_stream_check,
              updated_at = EXCLUDED.updated_at
          `,
          [
            authUserId,
            String(twitchUser.id || ''),
            String(twitchUser.login || ''),
            String(twitchUser.display_name || ''),
            String(twitchUser.profile_image_url || ''),
            String(twitchUser.broadcaster_type || ''),
            nowIso,
          ]
        )
      })

      res.json({ success: true })
      return
    }

    if (functionName === 'twitchDisconnect') {
      await withTransaction(async (client) => {
        await client.query('DELETE FROM public.twitch_integrations WHERE user_id = $1', [authUserId])
      })
      res.json({ success: true })
      return
    }

    if (functionName === 'twitchUpdateSettings') {
      const parsed = twitchUpdateSettingsSchema.safeParse(req.body)
      if (!parsed.success) throw createHttpError(400, 'Invalid Twitch settings payload.', 'validation_failed')

      await withTransaction(async (client) => {
        const existing = await client.query(
          `
            SELECT user_id
            FROM public.twitch_integrations
            WHERE user_id = $1
            LIMIT 1
            FOR UPDATE
          `,
          [authUserId]
        )
        if (!existing.rowCount) {
          throw createHttpError(400, 'Connect Twitch before changing settings.', 'twitch_not_connected')
        }

        await client.query(
          `
            UPDATE public.twitch_integrations
            SET
              auto_xp_on_live = $2,
              xp_per_hour_live = $3,
              auto_goals_from_twitch = $4,
              updated_at = $5
            WHERE user_id = $1
          `,
          [
            authUserId,
            parsed.data.autoXpOnLive,
            parsed.data.xpPerHourLive,
            parsed.data.autoGoalsFromTwitch,
            new Date().toISOString(),
          ]
        )
      })

      res.json({ success: true })
      return
    }

    if (functionName === 'twitchCheckLiveStatusAndReward') {
      const now = new Date()
      const result = await withTransaction(async (client) => {
        const integrationQuery = await client.query(
          `
            SELECT *
            FROM public.twitch_integrations
            WHERE user_id = $1
            LIMIT 1
            FOR UPDATE
          `,
          [authUserId]
        )
        const integration = integrationQuery.rows[0]
        if (!integration || !integration.twitch_user_id) {
          return { isLive: false, xpAwarded: 0, streamInfo: null }
        }

        const stream = await fetchTwitchStreamByUserId(integration.twitch_user_id)
        const isLive = Boolean(stream && stream.type === 'live')
        let xpAwarded = 0

        if (isLive && integration.auto_xp_on_live) {
          const lastCheckin = parseDateOrNull(integration.last_stream_check)
          if (lastCheckin) {
            const elapsedHours = Math.floor(Math.max(0, now.getTime() - lastCheckin.getTime()) / (60 * 60 * 1000))
            const cappedHours = Math.min(6, elapsedHours)
            if (cappedHours > 0) {
              xpAwarded = cappedHours * Math.max(1, Number(integration.xp_per_hour_live || 50))

              const progress = await ensureProgressRowForUser(client, authUserId)
              const nextXP = Math.max(0, Number(progress.xp ?? 0) + xpAwarded)
              const nextLevel = getLevelFromXP(nextXP)
              const nextWeeklyXP = Math.max(0, Number(progress.weekly_xp ?? 0) + xpAwarded)
              const nextMonthlyXP = Math.max(0, Number(progress.monthly_xp ?? 0) + xpAwarded)

              await client.query(
                `
                  UPDATE public.user_progress
                  SET xp = $2, level = $3, weekly_xp = $4, monthly_xp = $5
                  WHERE user_id = $1
                `,
                [authUserId, nextXP, nextLevel, nextWeeklyXP, nextMonthlyXP]
              )
            }
          }
        }

        await client.query(
          `
            UPDATE public.twitch_integrations
            SET
              is_live = $2,
              twitch_display_name = COALESCE($3, twitch_display_name),
              twitch_login = COALESCE($4, twitch_login),
              last_stream_check = $5,
              total_views = $6,
              updated_at = $5
            WHERE user_id = $1
          `,
          [
            authUserId,
            isLive,
            stream ? String(stream.user_name || '') : null,
            stream ? String(stream.user_login || '') : null,
            now.toISOString(),
            stream ? Number(stream.viewer_count || 0) : Number(integration.total_views || 0),
          ]
        )

        const streamInfo = stream
          ? {
              id: String(stream.id || ''),
              userId: String(stream.user_id || ''),
              userName: String(stream.user_name || ''),
              gameId: String(stream.game_id || ''),
              gameName: String(stream.game_name || ''),
              type: String(stream.type || ''),
              title: String(stream.title || ''),
              viewerCount: Number(stream.viewer_count || 0),
              startedAt: String(stream.started_at || ''),
              thumbnailUrl: String(stream.thumbnail_url || ''),
              tags: Array.isArray(stream.tags) ? stream.tags.map((tag) => String(tag)) : [],
            }
          : null

        return { isLive, xpAwarded, streamInfo }
      })

      res.json(result)
      return
    }

    if (functionName === 'getWeeklyChallenges') {
      const weeklyChallenges = await withTransaction((client) => getWeeklyChallengesForUser(client, authUserId))
      res.json({
        weekKey: weeklyChallenges.weekKey,
        startDate: weeklyChallenges.startDate,
        endDate: weeklyChallenges.endDate,
        challenges: weeklyChallenges.challenges,
      })
      return
    }

    if (functionName === 'claimWeeklyChallengeReward') {
      const parsed = claimWeeklyChallengeSchema.safeParse(req.body)
      if (!parsed.success) throw createHttpError(400, 'Invalid challenge claim payload.', 'validation_failed')

      const result = await withTransaction(async (client) => {
        const weeklyChallenges = await getWeeklyChallengesForUser(client, authUserId)
        const challenge = weeklyChallenges.challenges.find((entry) => entry.id === parsed.data.challengeId)

        if (!challenge) {
          return { success: false, reason: 'invalid_challenge', achievements: [] }
        }

        if (challenge.claimedAt) {
          return { success: false, reason: 'already_claimed', achievements: [] }
        }

        if (!challenge.completed) {
          return { success: false, reason: 'challenge_not_completed', achievements: [] }
        }

        const ledgerId = `${authUserId}:challenge:${weeklyChallenges.weekKey}:${challenge.id}`
        const existingLedger = await client.query(
          `
            SELECT id
            FROM public.xp_ledger
            WHERE id = $1
            LIMIT 1
            FOR UPDATE
          `,
          [ledgerId]
        )
        if (existingLedger.rowCount) {
          return { success: false, reason: 'already_claimed', achievements: [] }
        }

        const challengeXP = toNonNegativeInt(challenge.reward?.xp)
        const challengeCoins = toNonNegativeInt(challenge.reward?.coins)
        const nowIso = new Date().toISOString()

        const progress = await ensureProgressRowForUser(client, authUserId)
        const stats = await getAchievementStats(client, authUserId)
        const achievementResolution = resolveUnlockedAchievements(progress.achievements, stats)

        const totalXPGain = challengeXP + toNonNegativeInt(achievementResolution.bonusXP)
        const nextXP = toNonNegativeInt(progress.xp) + totalXPGain
        const nextCoins = toNonNegativeInt(progress.coins) + challengeCoins
        const nextLevel = getLevelFromXP(nextXP)
        const nextWeeklyXP = toNonNegativeInt(progress.weekly_xp) + totalXPGain
        const nextMonthlyXP = toNonNegativeInt(progress.monthly_xp) + totalXPGain

        await client.query(
          `
            UPDATE public.user_progress
            SET
              xp = $2,
              level = $3,
              coins = $4,
              weekly_xp = $5,
              monthly_xp = $6,
              achievements = $7,
              updated_at = $8
            WHERE user_id = $1
          `,
          [
            authUserId,
            nextXP,
            nextLevel,
            nextCoins,
            nextWeeklyXP,
            nextMonthlyXP,
            achievementResolution.achievements,
            nowIso,
          ]
        )

        await addChallengeRewardsToRewardDaily(client, authUserId, challengeXP, challengeCoins)
        await addChallengeRewardsToDailyActivity(client, authUserId, challengeXP, challengeCoins)

        const updatedChallenges = weeklyChallenges.challenges.map((entry) =>
          serializeStoredWeeklyChallenge(entry.id === challenge.id ? { ...entry, claimedAt: nowIso } : entry)
        )

        await client.query(
          `
            UPDATE public.user_challenges
            SET challenges = $2::jsonb, updated_at = $3
            WHERE id = $1
          `,
          [weeklyChallenges.rowId, JSON.stringify(updatedChallenges), nowIso]
        )

        await client.query(
          `
            INSERT INTO public.xp_ledger (
              id,
              user_id,
              source_type,
              source_id,
              xp,
              coins,
              created_at
            )
            VALUES ($1, $2, 'challenge', $3, $4, $5, $6)
          `,
          [ledgerId, authUserId, `${weeklyChallenges.weekKey}:${challenge.id}`, challengeXP, challengeCoins, nowIso]
        )

        return {
          success: true,
          challenge: {
            ...challenge,
            claimedAt: nowIso,
          },
          achievements: achievementResolution.unlocked,
        }
      })

      res.json(result)
      return
    }

    throw createHttpError(404, `Function "${functionName}" is not available.`, 'function_not_found')
  } catch (error) {
    const status = Number(error?.status) || 400
    res.status(status).json({
      error: error?.message || 'Function call failed.',
      code: error?.code || 'function_error',
    })
  }
})

export { router as functionsRouter }
