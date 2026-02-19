import { backendClient } from './backend-client'
import { callBackendFunction } from './functions-api.service'
import { toDateOrNull } from './date-utils.service'

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

function mapStreakRow(row: StreakRow): Streak {
  return {
    userId: row.user_id,
    currentStreak: Number(row.current_streak ?? 0),
    longestStreak: Number(row.longest_streak ?? 0),
    lastCheckin: toDateOrNull(row.last_checkin),
  }
}

function mapRawStreak(raw: unknown, fallbackUserId: string): Streak {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    userId: typeof source.userId === 'string' ? source.userId : fallbackUserId,
    currentStreak: Number(source.currentStreak ?? 0),
    longestStreak: Number(source.longestStreak ?? 0),
    lastCheckin: toDateOrNull(source.lastCheckin as string | null),
  }
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
  const response = await callBackendFunction<{ success: boolean }>('updateStreak', {
    userId,
    currentStreak: Math.max(0, Math.floor(currentStreak)),
    longestStreak: Math.max(0, Math.floor(longestStreak)),
  })

  if (!response?.success) throw new Error('update_streak_failed')
}

export async function registerStreakActivity(
  userId: string,
  checkinDate: Date = new Date()
): Promise<RegisterStreakActivityResult> {
  const response = await callBackendFunction<{
    streak?: unknown
    freezeUsed?: boolean
    consumedFreezeUses?: number
    remainingFreezeUses?: number
    resetOccurred?: boolean
  }>('registerStreakActivity', {
    userId,
    checkinDate: checkinDate.toISOString(),
  })

  const streak = mapRawStreak(response?.streak, userId)
  return {
    streak,
    freezeUsed: response?.freezeUsed === true,
    consumedFreezeUses: Number(response?.consumedFreezeUses ?? 0),
    remainingFreezeUses: Number(response?.remainingFreezeUses ?? 0),
    resetOccurred: response?.resetOccurred === true,
  }
}
