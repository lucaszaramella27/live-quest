import { backendClient } from './backend-client'
import { applyDocumentReward } from './rewards.service'
import type { Achievement } from './progress.service'
import { toDateOrNow, toDateOrNull } from './date-utils.service'

export interface ChecklistItem {
  id: string
  userId: string
  task: string
  completed: boolean
  completedAt?: Date | null
  rewardedAt?: Date | null
  time: string
  date: string
  createdAt: Date
}

interface ChecklistRow {
  id: string
  user_id: string
  task: string
  completed: boolean | null
  completed_at: string | null
  rewarded_at: string | null
  time: string | null
  date: string
  created_at: string | null
}

function mapChecklistRow(row: ChecklistRow): ChecklistItem {
  return {
    id: row.id,
    userId: row.user_id,
    task: row.task,
    completed: Boolean(row.completed),
    completedAt: toDateOrNull(row.completed_at),
    rewardedAt: toDateOrNull(row.rewarded_at),
    time: row.time || '',
    date: row.date,
    createdAt: toDateOrNow(row.created_at),
  }
}

export async function getUserChecklists(userId: string, date: string): Promise<ChecklistItem[]> {
  const { data, error } = await backendClient
    .from('checklists')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true })
    .returns<ChecklistRow[]>()

  if (error) {
    throw error
  }

  return (data || []).map(mapChecklistRow)
}

export async function createChecklistItem(
  userId: string,
  task: string,
  time: string,
  date: string
): Promise<ChecklistItem> {
  const { data, error } = await backendClient
    .from('checklists')
    .insert({
      user_id: userId,
      task,
      completed: false,
      time,
      date,
    })
    .select('*')
    .single<ChecklistRow>()

  if (error) {
    throw error
  }

  return mapChecklistRow(data)
}

export async function updateChecklistItem(itemId: string, data: Partial<ChecklistItem>): Promise<Achievement[]> {
  const { data: itemRow, error: itemError } = await backendClient
    .from('checklists')
    .select('*')
    .eq('id', itemId)
    .maybeSingle<ChecklistRow>()

  if (itemError) {
    throw itemError
  }

  if (!itemRow) {
    return []
  }

  const wasCompleted = Boolean(itemRow.completed)
  const completingNow = data.completed === true && !wasCompleted

  const updates: Record<string, unknown> = {}
  if (typeof data.task === 'string') updates.task = data.task
  if (typeof data.completed === 'boolean') updates.completed = data.completed
  if (typeof data.time === 'string') updates.time = data.time
  if (typeof data.date === 'string') updates.date = data.date

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await backendClient.from('checklists').update(updates).eq('id', itemId)
    if (updateError) {
      throw updateError
    }
  }

  if (!completingNow) {
    return []
  }

  const rewardResult = await applyDocumentReward({
    sourceType: 'task',
    sourceId: itemId,
  })

  return rewardResult.achievements
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  const { error } = await backendClient.from('checklists').delete().eq('id', itemId)
  if (error) {
    throw error
  }
}
