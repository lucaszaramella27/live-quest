import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from './firebase'

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

export async function updateChecklistItem(itemId: string, data: Partial<ChecklistItem>): Promise<void> {
  const itemRef = doc(db, 'checklists', itemId)
  await updateDoc(itemRef, data)
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  const itemRef = doc(db, 'checklists', itemId)
  await deleteDoc(itemRef)
}
