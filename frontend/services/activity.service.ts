import { backendClient } from './backend-client'
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

function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0]
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

async function getTodayActivity(userId: string, date: string): Promise<DailyActivityRow | null> {
  const id = `${userId}_${date}`
  const { data, error } = await backendClient
    .from('daily_activity')
    .select('*')
    .eq('id', id)
    .maybeSingle<DailyActivityRow>()

  if (error) throw error
  return data
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
  const today = getTodayIsoDate()
  const id = `${userId}_${today}`
  const nowIso = new Date().toISOString()

  try {
    const current = await getTodayActivity(userId, today)

    if (!current) {
      const row: Record<string, unknown> = {
        id,
        user_id: userId,
        date: today,
        tasks_completed: type === 'task' ? 1 : 0,
        goals_completed: type === 'goal' ? 1 : 0,
        events_created: type === 'event' ? 1 : 0,
        xp_earned: xpEarned,
        coins_earned: coinsEarned,
        created_at: nowIso,
        updated_at: nowIso,
      }

      const { error } = await backendClient.from('daily_activity').insert(row)
      if (error) throw error
      return
    }

    const updates: Record<string, unknown> = {
      updated_at: nowIso,
      xp_earned: Number(current.xp_earned ?? 0) + xpEarned,
      coins_earned: Number(current.coins_earned ?? 0) + coinsEarned,
      tasks_completed: Number(current.tasks_completed ?? 0),
      goals_completed: Number(current.goals_completed ?? 0),
      events_created: Number(current.events_created ?? 0),
    }

    if (type === 'task') {
      updates.tasks_completed = Number(current.tasks_completed ?? 0) + 1
    } else if (type === 'goal') {
      updates.goals_completed = Number(current.goals_completed ?? 0) + 1
    } else {
      updates.events_created = Number(current.events_created ?? 0) + 1
    }

    const { error } = await backendClient.from('daily_activity').update(updates).eq('id', id)
    if (error) throw error
  } catch (error) {
    reportError('Erro ao registrar atividade:', error)
  }
}

export async function addDailyActivityRewards(
  userId: string,
  xpEarned: number = 0,
  coinsEarned: number = 0
): Promise<void> {
  const today = getTodayIsoDate()
  const id = `${userId}_${today}`
  const nowIso = new Date().toISOString()

  try {
    const current = await getTodayActivity(userId, today)

    if (!current) {
      const { error } = await backendClient.from('daily_activity').insert({
        id,
        user_id: userId,
        date: today,
        tasks_completed: 0,
        goals_completed: 0,
        events_created: 0,
        xp_earned: xpEarned,
        coins_earned: coinsEarned,
        created_at: nowIso,
        updated_at: nowIso,
      })
      if (error) throw error
      return
    }

    const { error } = await backendClient
      .from('daily_activity')
      .update({
        xp_earned: Number(current.xp_earned ?? 0) + xpEarned,
        coins_earned: Number(current.coins_earned ?? 0) + coinsEarned,
        updated_at: nowIso,
      })
      .eq('id', id)

    if (error) throw error
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
