import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore'
import { db } from './firebase'
import { recordDailyActivity } from './activity.service'
import { checkAchievements, getUserStats, addXP, addCoins, type Achievement } from './progress.service'

export interface CalendarEvent {
  id: string
  userId: string
  date: string
  day: string
  time: string
  game: string
  createdAt: Date
}

export async function getUserEvents(userId: string): Promise<CalendarEvent[]> {
  const eventsRef = collection(db, 'calendar')
  const q = query(
    eventsRef, 
    where('userId', '==', userId),
    orderBy('date', 'asc')
  )
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as CalendarEvent[]
}

export async function createEvent(userId: string, event: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt'>): Promise<{ event: CalendarEvent; achievements: Achievement[] }> {
  const eventsRef = collection(db, 'calendar')
  const newEvent = {
    userId,
    ...event,
    createdAt: new Date(),
  }
  
  const docRef = await addDoc(eventsRef, newEvent)
  
  // Registrar atividade (5 XP e 1 coin por evento criado)
  await recordDailyActivity(userId, 'event', 5, 1)
  
  // Adicionar XP e coins
  await addXP(userId, 5)
  await addCoins(userId, 1)
  
  // Verificar conquistas desbloqueadas
  const stats = await getUserStats(userId)
  const unlockedAchievements = await checkAchievements(userId, stats)
  
  return {
    event: {
      id: docRef.id,
      ...newEvent,
    },
    achievements: unlockedAchievements
  }
}

export async function updateEvent(eventId: string, data: Partial<CalendarEvent>): Promise<void> {
  const eventRef = doc(db, 'calendar', eventId)
  await updateDoc(eventRef, data)
}

export async function deleteEvent(eventId: string): Promise<void> {
  const eventRef = doc(db, 'calendar', eventId)
  await deleteDoc(eventRef)
}
