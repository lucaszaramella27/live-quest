import { backendClient } from './backend-client'
import { applyDocumentReward, GOAL_REWARD_RULE } from './rewards.service'
import type { Achievement } from './progress.service'
import { toDateOrNow, toDateOrNull } from './date-utils.service'

export interface Goal {
  id: string
  userId: string
  title: string
  progress: number
  completed: boolean
  completedAt?: Date | null
  rewardedAt?: Date | null
  createdAt: Date
}

interface GoalRow {
  id: string
  user_id: string
  title: string
  progress: number | null
  completed: boolean | null
  completed_at: string | null
  rewarded_at: string | null
  created_at: string | null
}

function mapGoalRow(row: GoalRow): Goal {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    progress: Number(row.progress ?? 0),
    completed: Boolean(row.completed),
    completedAt: toDateOrNull(row.completed_at),
    rewardedAt: toDateOrNull(row.rewarded_at),
    createdAt: toDateOrNow(row.created_at),
  }
}

export async function getUserGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await backendClient
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<GoalRow[]>()

  if (error) {
    throw error
  }

  return (data || []).map(mapGoalRow)
}

export async function createGoal(userId: string, title: string): Promise<Goal> {
  const nowIso = new Date().toISOString()
  const { data, error } = await backendClient
    .from('goals')
    .insert({
      user_id: userId,
      title,
      progress: 0,
      completed: false,
      completed_at: null,
      rewarded_at: null,
      created_at: nowIso,
    })
    .select('*')
    .single<GoalRow>()

  if (error) {
    throw error
  }

  return mapGoalRow(data)
}

export async function updateGoal(goalId: string, data: Partial<Goal>): Promise<Achievement[]> {
  const { data: goalRow, error: goalError } = await backendClient
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .maybeSingle<GoalRow>()

  if (goalError) {
    throw goalError
  }

  if (!goalRow) {
    return []
  }

  const wasCompleted = Boolean(goalRow.completed)
  const completingNow = data.completed === true && !wasCompleted

  const updates: Record<string, unknown> = {}
  if (typeof data.title === 'string') updates.title = data.title
  if (typeof data.progress === 'number') updates.progress = data.progress
  if (typeof data.completed === 'boolean') updates.completed = data.completed

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await backendClient.from('goals').update(updates).eq('id', goalId)
    if (updateError) {
      throw updateError
    }
  }

  if (!completingNow) {
    return []
  }

  const rewardResult = await applyDocumentReward({
    userId: goalRow.user_id,
    sourceType: 'goal',
    sourceId: goalId,
    createdAt: toDateOrNow(goalRow.created_at),
    alreadyRewarded: Boolean(goalRow.rewarded_at),
    rule: GOAL_REWARD_RULE,
    markRewarded: async () => {
      const nowIso = new Date().toISOString()
      const { error } = await backendClient
        .from('goals')
        .update({
          rewarded_at: nowIso,
          completed_at: goalRow.completed_at || nowIso,
        })
        .eq('id', goalId)

      if (error) {
        throw error
      }
    },
  })

  return rewardResult.achievements
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await backendClient.from('goals').delete().eq('id', goalId)
  if (error) {
    throw error
  }
}
