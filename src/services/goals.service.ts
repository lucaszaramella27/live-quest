import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import { recordDailyActivity } from './activity.service'
import { checkAchievements, getUserStats, addXP, addCoins, type Achievement } from './progress.service'

export interface Goal {
  id: string
  userId: string
  title: string
  progress: number
  completed: boolean
  createdAt: Date
}

export async function getUserGoals(userId: string): Promise<Goal[]> {
  const goalsRef = collection(db, 'goals')
  const q = query(goalsRef, where('userId', '==', userId))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Goal[]
}

export async function createGoal(userId: string, title: string): Promise<Goal> {
  const goalsRef = collection(db, 'goals')
  const newGoal = {
    userId,
    title,
    progress: 0,
    completed: false,
    createdAt: new Date(),
  }
  
  const docRef = await addDoc(goalsRef, newGoal)
  
  return {
    id: docRef.id,
    ...newGoal,
  }
}

export async function updateGoal(goalId: string, data: Partial<Goal>): Promise<Achievement[]> {
  const goalRef = doc(db, 'goals', goalId)
  
  let unlockedAchievements: Achievement[] = []
  
  // Se a meta está sendo completada, registrar atividade e verificar conquistas
  if (data.completed === true) {
    const goalDoc = await getDoc(goalRef)
    if (goalDoc.exists()) {
      const goalData = goalDoc.data()
      const userId = goalData.userId
      
      // Registrar atividade (100 XP e 20 coins por meta completada)
      await recordDailyActivity(userId, 'goal', 100, 20)
      
      // Adicionar XP e coins
      await addXP(userId, 100)
      await addCoins(userId, 20)
      
      // Verificar conquistas desbloqueadas
      const stats = await getUserStats(userId)
      unlockedAchievements = await checkAchievements(userId, stats)
    }
  }
  
  await updateDoc(goalRef, data)
  
  return unlockedAchievements
}

export async function deleteGoal(goalId: string): Promise<void> {
  const goalRef = doc(db, 'goals', goalId)
  await deleteDoc(goalRef)
}
