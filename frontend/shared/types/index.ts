export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  isPremium: boolean
  createdAt: Date
}

export interface Goal {
  id: string
  userId: string
  title: string
  description?: string
  targetDate?: Date
  completed: boolean
  createdAt: Date
}

export interface Streak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastLiveDate?: Date
}

export interface ChecklistItem {
  id: string
  userId: string
  date: Date
  liveCompleted: boolean
  clipPosted: boolean
  livePromoted: boolean
}

export interface CalendarEvent {
  id: string
  userId: string
  title: string
  date: Date
  completed: boolean
  createdAt: Date
}
