import { backendClient } from './backend-client'
import { callBackendFunction } from './functions-api.service'
import { reportError } from './logger.service'
import { toDateOrNow } from './date-utils.service'

export interface DailyActivity {
  userId: string
  date: string // YYYY-MM-DD format
  tasksCompleted: number
  goalsCompleted: number
  eventsCreated: number
  xpEarned: number
  coinsEarned: number
  createdAt: Date
  updatedAt: Date
}

interface DailyActivityRow {
  id: string
  user_id: string
  date: string
  tasks_completed: number | null
  goals_completed: number | null
  events_created: number | null
  xp_earned: number | null
  coins_earned: number | null
  created_at: string | null
  updated_at: string | null
}

function mapDailyActivityRow(row: DailyActivityRow): DailyActivity {
  return {
    userId: row.user_id,
    date: row.date,
    tasksCompleted: Number(row.tasks_completed ?? 0),
    goalsCompleted: Number(row.goals_completed ?? 0),
    eventsCreated: Number(row.events_created ?? 0),
    xpEarned: Number(row.xp_earned ?? 0),
    coinsEarned: Number(row.coins_earned ?? 0),
    createdAt: toDateOrNow(row.created_at),
    updatedAt: toDateOrNow(row.updated_at),
  }
}

/**
 * Registra ou atualiza a atividade do dia
 */
export async function recordDailyActivity(
  userId: string,
  type: 'task' | 'goal' | 'event',
  xpEarned: number = 0,
  coinsEarned: number = 0
): Promise<void> {
  try {
    await callBackendFunction<{ success: boolean }>('recordDailyActivity', {
      userId,
      type,
      xpEarned: Math.max(0, Math.floor(xpEarned)),
      coinsEarned: Math.max(0, Math.floor(coinsEarned)),
    })
  } catch (error) {
    reportError('Erro ao registrar atividade:', error)
  }
}

export async function addDailyActivityRewards(
  userId: string,
  xpEarned: number = 0,
  coinsEarned: number = 0
): Promise<void> {
  try {
    await callBackendFunction<{ success: boolean }>('addDailyActivityRewards', {
      userId,
      xpEarned: Math.max(0, Math.floor(xpEarned)),
      coinsEarned: Math.max(0, Math.floor(coinsEarned)),
    })
  } catch (error) {
    reportError('Erro ao atualizar recompensas diarias:', error)
  }
}

/**
 * Busca atividades dos ultimos N dias
 */
export async function getUserActivity(userId: string, days: number = 84): Promise<DailyActivity[]> {
  try {
    const limitCount = Math.max(days * 4, days)
    const { data, error } = await backendClient
      .from('daily_activity')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limitCount)
      .returns<DailyActivityRow[]>()

    if (error) throw error

    return (data || []).map(mapDailyActivityRow).slice(0, days)
  } catch (error) {
    reportError('Erro ao buscar atividades:', error)
    return []
  }
}

/**
 * Formata atividades para o formato do StreakCalendar
 */
export function formatActivityForCalendar(
  activities: DailyActivity[],
  days: number = 84
): Array<{ date: string; count: number }> {
  const activityMap = new Map<string, number>()

  activities.forEach((activity) => {
    const totalActivity =
      activity.tasksCompleted + activity.goalsCompleted + activity.eventsCreated
    activityMap.set(activity.date, totalActivity)
  })

  const calendarData: Array<{ date: string; count: number }> = []

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    calendarData.push({
      date: dateStr,
      count: activityMap.get(dateStr) || 0,
    })
  }

  return calendarData
}

/**
 * Obtem estatisticas de atividade
 */
export async function getActivityStats(userId: string): Promise<{
  totalDaysActive: number
  totalTasks: number
  totalGoals: number
  totalEvents: number
  totalXP: number
  totalCoins: number
  averagePerDay: number
}> {
  try {
    const activities = await getUserActivity(userId, 365)

    const stats = {
      totalDaysActive: activities.length,
      totalTasks: 0,
      totalGoals: 0,
      totalEvents: 0,
      totalXP: 0,
      totalCoins: 0,
      averagePerDay: 0,
    }

    activities.forEach((activity) => {
      stats.totalTasks += activity.tasksCompleted
      stats.totalGoals += activity.goalsCompleted
      stats.totalEvents += activity.eventsCreated
      stats.totalXP += activity.xpEarned
      stats.totalCoins += activity.coinsEarned
    })

    stats.averagePerDay =
      activities.length > 0
        ? (stats.totalTasks + stats.totalGoals + stats.totalEvents) / activities.length
        : 0

    return stats
  } catch (error) {
    reportError('Erro ao calcular estatisticas:', error)
    return {
      totalDaysActive: 0,
      totalTasks: 0,
      totalGoals: 0,
      totalEvents: 0,
      totalXP: 0,
      totalCoins: 0,
      averagePerDay: 0,
    }
  }
}
