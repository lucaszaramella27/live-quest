import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from './firebase'

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

export async function updateGoal(goalId: string, data: Partial<Goal>): Promise<void> {
  const goalRef = doc(db, 'goals', goalId)
  await updateDoc(goalRef, data)
}

export async function deleteGoal(goalId: string): Promise<void> {
  const goalRef = doc(db, 'goals', goalId)
  await deleteDoc(goalRef)
}
