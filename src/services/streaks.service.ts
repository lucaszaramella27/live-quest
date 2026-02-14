import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface Streak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastCheckin: Date | null
}

export async function getUserStreak(userId: string): Promise<Streak> {
  const streakRef = doc(db, 'streaks', userId)
  const streakDoc = await getDoc(streakRef)
  
  if (!streakDoc.exists()) {
    // Criar streak inicial
    const newStreak: Streak = {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastCheckin: null,
    }
    await setDoc(streakRef, newStreak)
    return newStreak
  }
  
  const data = streakDoc.data()
  return {
    userId: data.userId,
    currentStreak: data.currentStreak,
    longestStreak: data.longestStreak,
    lastCheckin: data.lastCheckin?.toDate() || null,
  }
}

export async function updateStreak(userId: string, currentStreak: number, longestStreak: number): Promise<void> {
  const streakRef = doc(db, 'streaks', userId)
  await updateDoc(streakRef, {
    currentStreak,
    longestStreak,
    lastCheckin: new Date(),
  })
}
