import { backendClient } from './backend-client'
import { applyDocumentReward } from './rewards.service'
import type { Achievement } from './progress.service'
import { toDateOrNow, toDateOrNull } from './date-utils.service'

export interface CalendarEvent {
  id: string
  userId: string
  date: string
  day: string
  time: string
  game: string
  rewardedAt?: Date | null
  createdAt: Date
}

interface CalendarEventRow {
  id: string
  user_id: string
  date: string
  day: string
  time: string
  game: string
  rewarded_at: string | null
  created_at: string | null
}

function mapCalendarRow(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    day: row.day,
    time: row.time,
    game: row.game,
    rewardedAt: toDateOrNull(row.rewarded_at),
    createdAt: toDateOrNow(row.created_at),
  }
}

export async function getUserEvents(userId: string): Promise<CalendarEvent[]> {
  const { data, error } = await backendClient
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('time', { ascending: true })
    .returns<CalendarEventRow[]>()

  if (error) {
    throw error
  }

  return (data || []).map(mapCalendarRow)
}

export async function createEvent(
  userId: string,
  event: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt' | 'rewardedAt'>
): Promise<{ event: CalendarEvent; achievements: Achievement[] }> {
  const { data: createdRow, error: createError } = await backendClient
    .from('calendar_events')
    .insert({
      user_id: userId,
      date: event.date,
      day: event.day,
      time: event.time,
      game: event.game,
    })
    .select('*')
    .single<CalendarEventRow>()

  if (createError) {
    throw createError
  }

  const rewardResult = await applyDocumentReward({
    sourceType: 'event',
    sourceId: createdRow.id,
  })

  const { data: refreshedRow, error: refreshError } = await backendClient
    .from('calendar_events')
    .select('*')
    .eq('id', createdRow.id)
    .single<CalendarEventRow>()

  if (refreshError) {
    throw refreshError
  }

  return {
    event: mapCalendarRow(refreshedRow),
    achievements: rewardResult.achievements,
  }
}

export async function updateEvent(eventId: string, data: Partial<CalendarEvent>): Promise<void> {
  const updates: Record<string, unknown> = {}
  if (typeof data.date === 'string') updates.date = data.date
  if (typeof data.day === 'string') updates.day = data.day
  if (typeof data.time === 'string') updates.time = data.time
  if (typeof data.game === 'string') updates.game = data.game

  if (Object.keys(updates).length === 0) return

  const { error } = await backendClient.from('calendar_events').update(updates).eq('id', eventId)
  if (error) {
    throw error
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await backendClient.from('calendar_events').delete().eq('id', eventId)
  if (error) {
    throw error
  }
}
