import { backendClient } from './backend-client'
import { toDateOrNull } from './date-utils.service'
import { consumeStreakFreezeUses } from './inventory.service'

export interface Streak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastCheckin: Date | null
}

export interface RegisterStreakActivityResult {
  streak: Streak
  freezeUsed: boolean
  consumedFreezeUses: number
  remainingFreezeUses: number
  resetOccurred: boolean
}

interface StreakRow {
  user_id: string
  current_streak: number | null
  longest_streak: number | null
  last_checkin: string | null
}

const MS_IN_DAY = 24 * 60 * 60 * 1000

function mapStreakRow(row: StreakRow): Streak {
  return {
    userId: row.user_id,
    currentStreak: Number(row.current_streak ?? 0),
    longestStreak: Number(row.longest_streak ?? 0),
    lastCheckin: toDateOrNull(row.last_checkin),
  }
}

function getIsoUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getUtcStartOfDayTimestamp(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function getDayDifference(from: Date, to: Date): number {
  const fromTs = getUtcStartOfDayTimestamp(from)
  const toTs = getUtcStartOfDayTimestamp(to)
  return Math.floor((toTs - fromTs) / MS_IN_DAY)
}

export async function getUserStreak(userId: string): Promise<Streak> {
  const { data, error } = await backendClient
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<StreakRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastCheckin: null,
    }
  }

  return mapStreakRow(data)
}

export async function updateStreak(
  userId: string,
  currentStreak: number,
  longestStreak: number
): Promise<void> {
  const { error } = await backendClient
    .from('streaks')
    .upsert(
      {
        user_id: userId,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_checkin: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    throw error
  }
}

export async function registerStreakActivity(
  userId: string,
  checkinDate: Date = new Date()
): Promise<RegisterStreakActivityResult> {
  const streak = await getUserStreak(userId)
  const currentDateKey = getIsoUtcDate(checkinDate)
  const lastCheckinDate = streak.lastCheckin

  if (lastCheckinDate && getIsoUtcDate(lastCheckinDate) === currentDateKey) {
    return {
      streak,
      freezeUsed: false,
      consumedFreezeUses: 0,
      remainingFreezeUses: 0,
      resetOccurred: false,
    }
  }

  let nextCurrentStreak = Math.max(1, streak.currentStreak)
  let consumedFreezeUses = 0
  let remainingFreezeUses = 0
  let freezeUsed = false
  let resetOccurred = false

  if (!lastCheckinDate) {
    nextCurrentStreak = 1
  } else {
    const daysSinceLastCheckin = getDayDifference(lastCheckinDate, checkinDate)

    if (daysSinceLastCheckin <= 0) {
      nextCurrentStreak = streak.currentStreak
    } else if (daysSinceLastCheckin === 1) {
      nextCurrentStreak = streak.currentStreak + 1
    } else {
      const missedDays = daysSinceLastCheckin - 1
      const freezeResult = await consumeStreakFreezeUses(userId, missedDays)

      if (freezeResult.success) {
        nextCurrentStreak = streak.currentStreak + 1
        freezeUsed = freezeResult.consumedUses > 0
        consumedFreezeUses = freezeResult.consumedUses
        remainingFreezeUses = freezeResult.remainingUses
      } else {
        nextCurrentStreak = 1
        resetOccurred = true
        remainingFreezeUses = freezeResult.remainingUses
      }
    }
  }

  const nextLongestStreak = Math.max(streak.longestStreak, nextCurrentStreak)
  const nextCheckinIso = checkinDate.toISOString()

  const { error } = await backendClient
    .from('streaks')
    .upsert(
      {
        user_id: userId,
        current_streak: nextCurrentStreak,
        longest_streak: nextLongestStreak,
        last_checkin: nextCheckinIso,
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    throw error
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
