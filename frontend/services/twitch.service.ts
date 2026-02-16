import type { RealtimeChannel } from './backend-client'
import { backendClient } from './backend-client'
import { callBackendFunction } from './functions-api.service'
import { reportError } from './logger.service'
import { toDateOrNow, toDateOrNull } from './date-utils.service'

const TWITCH_CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID || ''
const TWITCH_REDIRECT_URI =
  import.meta.env.VITE_TWITCH_REDIRECT_URI || `${window.location.origin}/twitch/callback`

const TWITCH_SCOPES = [
  'user:read:email',
  'channel:read:subscriptions',
  'channel:read:goals',
  'moderator:read:followers',
  'channel:read:hype_train',
  'bits:read',
  'channel:read:redemptions',
].join(' ')

export interface TwitchStreamInfo {
  id: string
  userId: string
  userName: string
  gameId: string
  gameName: string
  type: 'live' | ''
  title: string
  viewerCount: number
  startedAt: string
  thumbnailUrl: string
  tags: string[]
}

export interface TwitchIntegration {
  userId: string
  twitchUserId: string
  twitchLogin: string
  twitchDisplayName: string
  twitchProfileImage: string
  broadcasterType: 'partner' | 'affiliate' | ''
  connectedAt: Date
  lastStreamCheck: Date
  isLive: boolean
  totalFollowers: number
  totalSubscribers: number
  totalViews: number
  autoXpOnLive: boolean
  xpPerHourLive: number
  autoGoalsFromTwitch: boolean
}

export interface TwitchGoal {
  id: string
  userId: string
  type: 'followers' | 'subscribers' | 'views' | 'hours_streamed'
  title: string
  targetValue: number
  currentValue: number
  completed: boolean
  xpReward: number
  coinsReward: number
  createdAt: Date
  completedAt?: Date
}

export interface TwitchConnectResponse {
  success: boolean
}

interface TwitchIntegrationRow {
  user_id: string
  twitch_user_id: string | null
  twitch_login: string | null
  twitch_display_name: string | null
  twitch_profile_image: string | null
  broadcaster_type: 'partner' | 'affiliate' | '' | null
  connected_at: string | null
  last_stream_check: string | null
  is_live: boolean | null
  total_followers: number | null
  total_subscribers: number | null
  total_views: number | null
  auto_xp_on_live: boolean | null
  xp_per_hour_live: number | null
  auto_goals_from_twitch: boolean | null
}

interface TwitchGoalRow {
  id: string
  user_id: string
  type: 'followers' | 'subscribers' | 'views' | 'hours_streamed'
  title: string
  target_value: number
  current_value: number
  completed: boolean | null
  xp_reward: number
  coins_reward: number
  created_at: string | null
  completed_at: string | null
}

function mapIntegrationRow(row: TwitchIntegrationRow): TwitchIntegration {
  return {
    userId: row.user_id,
    twitchUserId: row.twitch_user_id || '',
    twitchLogin: row.twitch_login || '',
    twitchDisplayName: row.twitch_display_name || '',
    twitchProfileImage: row.twitch_profile_image || '',
    broadcasterType: row.broadcaster_type || '',
    connectedAt: toDateOrNow(row.connected_at),
    lastStreamCheck: toDateOrNow(row.last_stream_check),
    isLive: Boolean(row.is_live),
    totalFollowers: Number(row.total_followers ?? 0),
    totalSubscribers: Number(row.total_subscribers ?? 0),
    totalViews: Number(row.total_views ?? 0),
    autoXpOnLive: row.auto_xp_on_live ?? true,
    xpPerHourLive: Number(row.xp_per_hour_live ?? 50),
    autoGoalsFromTwitch: row.auto_goals_from_twitch ?? true,
  }
}

function mapGoalRow(row: TwitchGoalRow): TwitchGoal {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    targetValue: Number(row.target_value),
    currentValue: Number(row.current_value),
    completed: Boolean(row.completed),
    xpReward: Number(row.xp_reward),
    coinsReward: Number(row.coins_reward),
    createdAt: toDateOrNow(row.created_at),
    completedAt: toDateOrNull(row.completed_at) ?? undefined,
  }
}

export function getTwitchAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: TWITCH_REDIRECT_URI,
    response_type: 'code',
    scope: TWITCH_SCOPES,
    state,
  })

  return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`
}

export async function connectTwitchWithCode(code: string): Promise<TwitchConnectResponse> {
  return callBackendFunction<TwitchConnectResponse>('twitchConnect', {
    code,
    redirectUri: TWITCH_REDIRECT_URI,
  })
}

export async function saveTwitchIntegration(
  userId: string,
  integration: Pick<TwitchIntegration, 'autoXpOnLive' | 'xpPerHourLive' | 'autoGoalsFromTwitch'>
): Promise<void> {
  const { data: existing, error: existingError } = await backendClient
    .from('twitch_integrations')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle<{ user_id: string }>()

  if (existingError) {
    throw existingError
  }

  if (!existing) {
    throw new Error('Conecte sua conta Twitch antes de alterar configuracoes.')
  }

  const { error } = await backendClient
    .from('twitch_integrations')
    .update({
      auto_xp_on_live: integration.autoXpOnLive,
      auto_goals_from_twitch: integration.autoGoalsFromTwitch,
      xp_per_hour_live: integration.xpPerHourLive,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

export function subscribeToTwitchIntegration(
  userId: string,
  callback: (integration: TwitchIntegration | null) => void
): () => void {
  const channelName = `twitch_integration:${userId}:${Math.random().toString(36).slice(2)}`
  const channel: RealtimeChannel = backendClient
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'twitch_integrations',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          callback(null)
          return
        }

        const row = payload.new as TwitchIntegrationRow | undefined
        if (!row) {
          callback(null)
          return
        }

        callback(mapIntegrationRow(row))
      }
    )
    .subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return

      try {
        const { data, error } = await backendClient
          .from('twitch_integrations')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle<TwitchIntegrationRow>()

        if (error) throw error
        callback(data ? mapIntegrationRow(data) : null)
      } catch (error) {
        reportError('Erro ao observar integracao Twitch:', error)
        callback(null)
      }
    })

  return () => {
    void backendClient.removeChannel(channel)
  }
}

export async function disconnectTwitch(): Promise<void> {
  await callBackendFunction<{ success: boolean }>('twitchDisconnect')
}

export async function createTwitchGoal(
  userId: string,
  goal: Omit<TwitchGoal, 'id' | 'userId' | 'completed' | 'createdAt'>
): Promise<TwitchGoal> {
  const nowIso = new Date().toISOString()
  const { data, error } = await backendClient
    .from('twitch_goals')
    .insert({
      user_id: userId,
      type: goal.type,
      title: goal.title,
      target_value: goal.targetValue,
      current_value: goal.currentValue,
      completed: false,
      xp_reward: goal.xpReward,
      coins_reward: goal.coinsReward,
      created_at: nowIso,
      completed_at: null,
    })
    .select('*')
    .single<TwitchGoalRow>()

  if (error) {
    throw error
  }

  return mapGoalRow(data)
}

export async function getTwitchGoals(userId: string): Promise<TwitchGoal[]> {
  const { data, error } = await backendClient
    .from('twitch_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<TwitchGoalRow[]>()

  if (error) {
    throw error
  }

  return (data || []).map(mapGoalRow)
}

export async function checkLiveStatusAndReward(): Promise<{
  isLive: boolean
  xpAwarded: number
  streamInfo: TwitchStreamInfo | null
}> {
  return callBackendFunction<{
    isLive: boolean
    xpAwarded: number
    streamInfo: TwitchStreamInfo | null
  }>('twitchCheckLiveStatusAndReward')
}

export function getSuggestedTwitchGoals(
  currentFollowers: number,
  currentSubs: number,
  broadcasterType: TwitchIntegration['broadcasterType']
): Omit<TwitchGoal, 'id' | 'userId' | 'completed' | 'createdAt'>[] {
  const suggestions: Omit<TwitchGoal, 'id' | 'userId' | 'completed' | 'createdAt'>[] = []

  const followerMilestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]
  const nextFollowerMilestone = followerMilestones.find((milestone) => milestone > currentFollowers)

  if (nextFollowerMilestone) {
    suggestions.push({
      type: 'followers',
      title: `Atingir ${nextFollowerMilestone.toLocaleString()} seguidores`,
      targetValue: nextFollowerMilestone,
      currentValue: currentFollowers,
      xpReward: Math.floor(nextFollowerMilestone / 10),
      coinsReward: Math.floor(nextFollowerMilestone / 50),
      completedAt: undefined,
    })
  }

  if (broadcasterType === 'affiliate' || broadcasterType === 'partner') {
    const subMilestones = [10, 25, 50, 100, 250, 500, 1000]
    const nextSubMilestone = subMilestones.find((milestone) => milestone > currentSubs)

    if (nextSubMilestone) {
      suggestions.push({
        type: 'subscribers',
        title: `Atingir ${nextSubMilestone} inscritos`,
        targetValue: nextSubMilestone,
        currentValue: currentSubs,
        xpReward: nextSubMilestone * 10,
        coinsReward: nextSubMilestone * 5,
        completedAt: undefined,
      })
    }
  }

  suggestions.push({
    type: 'hours_streamed',
    title: 'Streamar 10 horas esta semana',
    targetValue: 10,
    currentValue: 0,
    xpReward: 200,
    coinsReward: 50,
    completedAt: undefined,
  })

  return suggestions
}
