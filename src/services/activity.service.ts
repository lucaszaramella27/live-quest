import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'

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

/**
 * Registra ou atualiza a atividade do dia
 */
export async function recordDailyActivity(
  userId: string,
  type: 'task' | 'goal' | 'event',
  xpEarned: number = 0,
  coinsEarned: number = 0
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const activityId = `${userId}_${today}`
  const activityRef = doc(db, 'dailyActivity', activityId)
  
  try {
    const activityDoc = await getDoc(activityRef)
    
    if (!activityDoc.exists()) {
      // Criar nova atividade do dia
      const newActivity: DailyActivity = {
        userId,
        date: today,
        tasksCompleted: type === 'task' ? 1 : 0,
        goalsCompleted: type === 'goal' ? 1 : 0,
        eventsCreated: type === 'event' ? 1 : 0,
        xpEarned,
        coinsEarned,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await setDoc(activityRef, newActivity)
    } else {
      // Atualizar atividade existente
      const currentData = activityDoc.data()
      const updates: any = {
        updatedAt: new Date(),
        xpEarned: currentData.xpEarned + xpEarned,
        coinsEarned: currentData.coinsEarned + coinsEarned
      }
      
      if (type === 'task') {
        updates.tasksCompleted = currentData.tasksCompleted + 1
      } else if (type === 'goal') {
        updates.goalsCompleted = currentData.goalsCompleted + 1
      } else if (type === 'event') {
        updates.eventsCreated = currentData.eventsCreated + 1
      }
      
      await updateDoc(activityRef, updates)
    }
  } catch (error) {
    console.error('Erro ao registrar atividade:', error)
  }
}

/**
 * Busca atividades dos últimos N dias
 */
export async function getUserActivity(userId: string, days: number = 84): Promise<DailyActivity[]> {
  try {
    const activitiesRef = collection(db, 'dailyActivity')
    const q = query(
      activitiesRef,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(days)
    )
    
    const snapshot = await getDocs(q)
    const activities: DailyActivity[] = []
    
    snapshot.forEach(doc => {
      const data = doc.data()
      activities.push({
        userId: data.userId,
        date: data.date,
        tasksCompleted: data.tasksCompleted || 0,
        goalsCompleted: data.goalsCompleted || 0,
        eventsCreated: data.eventsCreated || 0,
        xpEarned: data.xpEarned || 0,
        coinsEarned: data.coinsEarned || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      })
    })
    
    return activities
  } catch (error) {
    console.error('Erro ao buscar atividades:', error)
    return []
  }
}

/**
 * Formata atividades para o formato do StreakCalendar
 */
export function formatActivityForCalendar(activities: DailyActivity[], days: number = 84): Array<{ date: string; count: number }> {
  // Criar um mapa de atividades por data
  const activityMap = new Map<string, number>()
  
  activities.forEach(activity => {
    const totalActivity = activity.tasksCompleted + activity.goalsCompleted + activity.eventsCreated
    activityMap.set(activity.date, totalActivity)
  })
  
  // Gerar array dos últimos N dias
  const calendarData: Array<{ date: string; count: number }> = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    calendarData.push({
      date: dateStr,
      count: activityMap.get(dateStr) || 0
    })
  }
  
  return calendarData
}

/**
 * Obtém estatísticas de atividade
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
    const activities = await getUserActivity(userId, 365) // Último ano
    
    const stats = {
      totalDaysActive: activities.length,
      totalTasks: 0,
      totalGoals: 0,
      totalEvents: 0,
      totalXP: 0,
      totalCoins: 0,
      averagePerDay: 0
    }
    
    activities.forEach(activity => {
      stats.totalTasks += activity.tasksCompleted
      stats.totalGoals += activity.goalsCompleted
      stats.totalEvents += activity.eventsCreated
      stats.totalXP += activity.xpEarned
      stats.totalCoins += activity.coinsEarned
    })
    
    stats.averagePerDay = activities.length > 0 
      ? (stats.totalTasks + stats.totalGoals + stats.totalEvents) / activities.length 
      : 0
    
    return stats
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error)
    return {
      totalDaysActive: 0,
      totalTasks: 0,
      totalGoals: 0,
      totalEvents: 0,
      totalXP: 0,
      totalCoins: 0,
      averagePerDay: 0
    }
  }
}
