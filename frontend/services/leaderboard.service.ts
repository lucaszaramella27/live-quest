import type { RealtimeChannel } from './backend-client'
import { backendClient } from './backend-client'
import { reportError } from './logger.service'

export interface LeaderboardUser {
  id: string
  name: string
  level: number
  xp: number
  photoURL: string
  activeTitle: string
  weeklyXP: number
  monthlyXP: number
  isPremium: boolean
}

interface LeaderboardRow {
  user_id: string
  user_name: string | null
  level: number | null
  xp: number | null
  user_photo_url: string | null
  active_title: string | null
  weekly_xp: number | null
  monthly_xp: number | null
  is_premium: boolean | null
}

function mapLeaderboardRow(row: LeaderboardRow): LeaderboardUser {
  return {
    id: row.user_id,
    name: row.user_name || 'Usuario',
    level: Number(row.level ?? 1),
    xp: Number(row.xp ?? 0),
    photoURL: row.user_photo_url || '',
    activeTitle: row.active_title || '',
    weeklyXP: Number(row.weekly_xp ?? 0),
    monthlyXP: Number(row.monthly_xp ?? 0),
    isPremium: Boolean(row.is_premium),
  }
}

function getOrderField(period: 'weekly' | 'monthly' | 'alltime'): 'weekly_xp' | 'monthly_xp' | 'xp' {
  if (period === 'weekly') return 'weekly_xp'
  if (period === 'monthly') return 'monthly_xp'
  return 'xp'
}

export async function getLeaderboard(
  period: 'weekly' | 'monthly' | 'alltime' = 'weekly',
  limitCount: number = 100
): Promise<LeaderboardUser[]> {
  try {
    const orderField = getOrderField(period)
    const { data, error } = await backendClient
      .from('user_progress')
      .select(
        'user_id, user_name, level, xp, user_photo_url, active_title, weekly_xp, monthly_xp, is_premium'
      )
      .order(orderField, { ascending: false })
      .limit(limitCount)
      .returns<LeaderboardRow[]>()

    if (error) throw error

    return (data || []).map(mapLeaderboardRow)
  } catch (error) {
    reportError('Erro ao buscar leaderboard:', error)
    return []
  }
}

export async function getUserRank(
  userId: string,
  period: 'weekly' | 'monthly' | 'alltime' = 'weekly'
): Promise<number> {
  try {
    const leaderboard = await getLeaderboard(period, 1000)
    const userIndex = leaderboard.findIndex((user) => user.id === userId)
    return userIndex >= 0 ? userIndex + 1 : -1
  } catch (error) {
    reportError('Erro ao buscar rank do usuário:', error)
    return -1
  }
}

/**
 * Listener em tempo real para o leaderboard
 * Atualiza automaticamente quando qualquer usuário ganhar XP ou subir de nível
 */
export function subscribeToLeaderboard(
  period: 'weekly' | 'monthly' | 'alltime',
  callback: (leaderboard: LeaderboardUser[]) => void,
  limitCount: number = 100
): () => void {
  const channelName = `leaderboard:${period}:${Math.random().toString(36).slice(2)}`
  const channel: RealtimeChannel = backendClient
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_progress' },
      () => {
        void getLeaderboard(period, limitCount)
          .then((nextLeaderboard) => callback(nextLeaderboard))
          .catch((error) => {
            reportError('Erro no listener do leaderboard:', error)
            callback([])
          })
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void getLeaderboard(period, limitCount)
          .then((nextLeaderboard) => callback(nextLeaderboard))
          .catch((error) => {
            reportError('Erro no listener do leaderboard:', error)
            callback([])
          })
      }
    })

  return () => {
    void backendClient.removeChannel(channel)
  }
}
