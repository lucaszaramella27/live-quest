import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import { recordDailyActivity } from './activity.service'
import { checkAchievements, getUserStats, addXP, addCoins, type Achievement } from './progress.service'

export interface ChecklistItem {
  id: string
  userId: string
  task: string
  completed: boolean
  time: string
  date: string
  createdAt: Date
}

export async function getUserChecklists(userId: string, date: string): Promise<ChecklistItem[]> {
  const checklistsRef = collection(db, 'checklists')
  const q = query(
    checklistsRef, 
    where('userId', '==', userId),
    where('date', '==', date)
  )
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as ChecklistItem[]
}

export async function createChecklistItem(userId: string, task: string, time: string, date: string): Promise<ChecklistItem> {
  const checklistsRef = collection(db, 'checklists')
  const newItem = {
    userId,
    task,
    completed: false,
    time,
    date,
    createdAt: new Date(),
  }
  
  const docRef = await addDoc(checklistsRef, newItem)
  
  return {
    id: docRef.id,
    ...newItem,
  }
}

export async function updateChecklistItem(itemId: string, data: Partial<ChecklistItem>): Promise<Achievement[]> {
  const itemRef = doc(db, 'checklists', itemId)
  
  let unlockedAchievements: Achievement[] = []
  
  // Se a tarefa está sendo completada, registrar atividade e verificar conquistas
  if (data.completed === true) {
    const itemDoc = await getDoc(itemRef)
    if (itemDoc.exists()) {
      const itemData = itemDoc.data()
      const userId = itemData.userId
      
      // Registrar atividade (10 XP e 2 coins por tarefa completada)
      await recordDailyActivity(userId, 'task', 10, 2)
      
      // Adicionar XP e coins
      await addXP(userId, 10)
      await addCoins(userId, 2)
      
      // Verificar conquistas desbloqueadas
      const stats = await getUserStats(userId)
      unlockedAchievements = await checkAchievements(userId, stats)
    }
  }
  
  await updateDoc(itemRef, data)
  
  return unlockedAchievements
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  const itemRef = doc(db, 'checklists', itemId)
  await deleteDoc(itemRef)
}
