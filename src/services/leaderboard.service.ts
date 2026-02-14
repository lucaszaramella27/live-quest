import { collection, query, orderBy, limit, getDocs, onSnapshot, Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'

export interface LeaderboardUser {
  id: string
  name: string
  level: number
  xp: number
  photoURL?: string
  activeTitle?: string
  weeklyXP: number
  monthlyXP: number
}

export async function getLeaderboard(
  period: 'weekly' | 'monthly' | 'alltime' = 'weekly',
  limitCount: number = 100
): Promise<LeaderboardUser[]> {
  try {
    const progressRef = collection(db, 'userProgress')
    
    // Determinar campo de ordenação baseado no período
    const orderField = period === 'weekly' 
      ? 'weeklyXP' 
      : period === 'monthly' 
      ? 'monthlyXP' 
      : 'xp'
    
    const q = query(
      progressRef,
      orderBy(orderField, 'desc'),
      limit(limitCount)
    )
    
    const snapshot = await getDocs(q)
    
    const leaderboard: LeaderboardUser[] = []
    
    for (const doc of snapshot.docs) {
      const data = doc.data()
      leaderboard.push({
        id: doc.id,
        name: data.userName || 'Usuário',
        level: data.level || 1,
        xp: data.xp || 0,
        photoURL: data.userPhotoURL,
        activeTitle: data.activeTitle,
        weeklyXP: data.weeklyXP || 0,
        monthlyXP: data.monthlyXP || 0,
      })
    }
    
    return leaderboard
  } catch (error) {
    console.error('Erro ao buscar leaderboard:', error)
    return []
  }
}

export async function getUserRank(
  userId: string,
  period: 'weekly' | 'monthly' | 'alltime' = 'weekly'
): Promise<number> {
  try {
    const leaderboard = await getLeaderboard(period, 1000)
    const userIndex = leaderboard.findIndex(u => u.id === userId)
    return userIndex >= 0 ? userIndex + 1 : -1
  } catch (error) {
    console.error('Erro ao buscar rank do usuário:', error)
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
): Unsubscribe {
  const progressRef = collection(db, 'userProgress')
  
  const orderField = period === 'weekly' 
    ? 'weeklyXP' 
    : period === 'monthly' 
    ? 'monthlyXP' 
    : 'xp'
  
  const q = query(
    progressRef,
    orderBy(orderField, 'desc'),
    limit(limitCount)
  )
  
  return onSnapshot(q, (snapshot) => {
    const leaderboard: LeaderboardUser[] = []
    
    snapshot.forEach((doc) => {
      const data = doc.data()
      leaderboard.push({
        id: doc.id,
        name: data.userName || 'Usuário',
        level: data.level || 1,
        xp: data.xp || 0,
        photoURL: data.userPhotoURL,
        activeTitle: data.activeTitle,
        weeklyXP: data.weeklyXP || 0,
        monthlyXP: data.monthlyXP || 0,
      })
    })
    
    callback(leaderboard)
  }, (error) => {
    console.error('Erro no listener do leaderboard:', error)
    callback([])
  })
}
