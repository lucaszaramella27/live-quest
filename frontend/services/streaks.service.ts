import { backendClient } from './backend-client'
import { toDateOrNull } from './date-utils.service'

export interface Streak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastCheckin: Date | null
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
    const newStreak: Streak = {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastCheckin: null,
    }

    const { error: insertError } = await backendClient.from('streaks').insert({
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_checkin: null,
    })

    if (insertError) {
      throw insertError
    }

    return newStreak
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
