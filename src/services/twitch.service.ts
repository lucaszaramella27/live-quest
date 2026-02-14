import { doc, getDoc, setDoc, updateDoc, onSnapshot, Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import { addXP, addCoins } from './progress.service'

// Twitch API Configuration
const TWITCH_CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID || ''
const TWITCH_REDIRECT_URI = import.meta.env.VITE_TWITCH_REDIRECT_URI || `${window.location.origin}/twitch/callback`

// Scopes necessários para a integração
const TWITCH_SCOPES = [
  'user:read:email',
  'channel:read:subscriptions',
  'channel:read:goals',
  'moderator:read:followers',
  'channel:read:hype_train',
  'bits:read',
  'channel:read:redemptions',
].join(' ')

export interface TwitchUser {
  id: string
  login: string
  displayName: string
  email?: string
  profileImageUrl: string
  broadcasterType: 'partner' | 'affiliate' | ''
  createdAt: string
}

export interface TwitchChannelInfo {
  broadcasterId: string
  broadcasterName: string
  broadcasterLanguage: string
  gameName: string
  gameId: string
  title: string
  delay: number
  tags: string[]
}

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

export interface TwitchFollowers {
  total: number
  data: {
    userId: string
    userName: string
    followedAt: string
  }[]
}

export interface TwitchIntegration {
  userId: string
  twitchUserId: string
  twitchLogin: string
  twitchDisplayName: string
  twitchProfileImage: string
  broadcasterType: 'partner' | 'affiliate' | ''
  accessToken: string
  refreshToken: string
  tokenExpiresAt: Date
  connectedAt: Date
  lastStreamCheck?: Date
  isLive: boolean
  totalFollowers: number
  totalViews: number
  // Configurações
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

// ============ OAUTH FLOW ============

/**
 * Gera a URL de autorização OAuth da Twitch
 */
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

/**
 * Troca o código de autorização por tokens de acesso
 * NOTA: Isso deveria ser feito no backend por segurança
 */
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  // Em produção, isso deve ser feito via Cloud Function para não expor o client secret
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: import.meta.env.VITE_TWITCH_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: TWITCH_REDIRECT_URI,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Falha ao obter token da Twitch')
  }
  
  const data = await response.json()
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}

/**
 * Atualiza o token de acesso usando o refresh token
 */
export async function refreshTwitchToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      client_secret: import.meta.env.VITE_TWITCH_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Falha ao renovar token da Twitch')
  }
  
  const data = await response.json()
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}

// ============ API CALLS ============

async function twitchApiCall<T>(
  endpoint: string,
  accessToken: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`https://api.twitch.tv/helix${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': TWITCH_CLIENT_ID,
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED')
    }
    throw new Error(`Twitch API error: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Busca informações do usuário autenticado
 */
export async function getTwitchUser(accessToken: string): Promise<TwitchUser> {
  const data = await twitchApiCall<{ data: any[] }>('/users', accessToken)
  
  if (!data.data || data.data.length === 0) {
    throw new Error('Usuário não encontrado')
  }
  
  const user = data.data[0]
  
  return {
    id: user.id,
    login: user.login,
    displayName: user.display_name,
    email: user.email,
    profileImageUrl: user.profile_image_url,
    broadcasterType: user.broadcaster_type,
    createdAt: user.created_at,
  }
}

/**
 * Busca informações do canal
 */
export async function getTwitchChannelInfo(
  accessToken: string,
  broadcasterId: string
): Promise<TwitchChannelInfo> {
  const data = await twitchApiCall<{ data: any[] }>(
    `/channels?broadcaster_id=${broadcasterId}`,
    accessToken
  )
  
  if (!data.data || data.data.length === 0) {
    throw new Error('Canal não encontrado')
  }
  
  const channel = data.data[0]
  
  return {
    broadcasterId: channel.broadcaster_id,
    broadcasterName: channel.broadcaster_name,
    broadcasterLanguage: channel.broadcaster_language,
    gameName: channel.game_name,
    gameId: channel.game_id,
    title: channel.title,
    delay: channel.delay,
    tags: channel.tags || [],
  }
}

/**
 * Verifica se o usuário está ao vivo
 */
export async function getTwitchStreamInfo(
  accessToken: string,
  userId: string
): Promise<TwitchStreamInfo | null> {
  const data = await twitchApiCall<{ data: any[] }>(
    `/streams?user_id=${userId}`,
    accessToken
  )
  
  if (!data.data || data.data.length === 0) {
    return null
  }
  
  const stream = data.data[0]
  
  return {
    id: stream.id,
    userId: stream.user_id,
    userName: stream.user_name,
    gameId: stream.game_id,
    gameName: stream.game_name,
    type: stream.type,
    title: stream.title,
    viewerCount: stream.viewer_count,
    startedAt: stream.started_at,
    thumbnailUrl: stream.thumbnail_url,
    tags: stream.tags || [],
  }
}

/**
 * Busca número de seguidores
 */
export async function getTwitchFollowers(
  accessToken: string,
  broadcasterId: string
): Promise<TwitchFollowers> {
  const data = await twitchApiCall<{ total: number; data: any[] }>(
    `/channels/followers?broadcaster_id=${broadcasterId}&first=1`,
    accessToken
  )
  
  return {
    total: data.total,
    data: data.data.map(f => ({
      userId: f.user_id,
      userName: f.user_name,
      followedAt: f.followed_at,
    })),
  }
}

/**
 * Busca subscribers do canal (requer afiliado/partner)
 */
export async function getTwitchSubscribers(
  accessToken: string,
  broadcasterId: string
): Promise<{ total: number }> {
  try {
    const data = await twitchApiCall<{ total: number; data: any[] }>(
      `/subscriptions?broadcaster_id=${broadcasterId}&first=1`,
      accessToken
    )
    
    return { total: data.total }
  } catch {
    return { total: 0 }
  }
}

// ============ FIRESTORE INTEGRATION ============

/**
 * Salva/atualiza integração Twitch do usuário
 */
export async function saveTwitchIntegration(
  userId: string,
  integration: Partial<TwitchIntegration>
): Promise<void> {
  const integrationRef = doc(db, 'twitchIntegrations', userId)
  const existing = await getDoc(integrationRef)
  
  if (existing.exists()) {
    await updateDoc(integrationRef, {
      ...integration,
      updatedAt: new Date(),
    })
  } else {
    await setDoc(integrationRef, {
      userId,
      autoXpOnLive: true,
      xpPerHourLive: 50,
      autoGoalsFromTwitch: true,
      isLive: false,
      totalFollowers: 0,
      totalViews: 0,
      connectedAt: new Date(),
      ...integration,
    })
  }
}

/**
 * Busca integração Twitch do usuário
 */
export async function getTwitchIntegration(userId: string): Promise<TwitchIntegration | null> {
  const integrationRef = doc(db, 'twitchIntegrations', userId)
  const integrationDoc = await getDoc(integrationRef)
  
  if (!integrationDoc.exists()) {
    return null
  }
  
  const data = integrationDoc.data()
  
  return {
    ...data,
    connectedAt: data.connectedAt?.toDate(),
    tokenExpiresAt: data.tokenExpiresAt?.toDate(),
    lastStreamCheck: data.lastStreamCheck?.toDate(),
  } as TwitchIntegration
}

/**
 * Listener em tempo real para integração Twitch
 */
export function subscribeToTwitchIntegration(
  userId: string,
  callback: (integration: TwitchIntegration | null) => void
): Unsubscribe {
  const integrationRef = doc(db, 'twitchIntegrations', userId)
  
  return onSnapshot(integrationRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }
    
    const data = snapshot.data()
    callback({
      ...data,
      connectedAt: data.connectedAt?.toDate(),
      tokenExpiresAt: data.tokenExpiresAt?.toDate(),
      lastStreamCheck: data.lastStreamCheck?.toDate(),
    } as TwitchIntegration)
  })
}

/**
 * Remove integração Twitch
 */
export async function disconnectTwitch(userId: string): Promise<void> {
  const integrationRef = doc(db, 'twitchIntegrations', userId)
  const integration = await getTwitchIntegration(userId)
  
  if (integration) {
    // Revoga o token na Twitch
    try {
      await fetch(`https://id.twitch.tv/oauth2/revoke?client_id=${TWITCH_CLIENT_ID}&token=${integration.accessToken}`, {
        method: 'POST',
      })
    } catch (e) {
      console.warn('Falha ao revogar token:', e)
    }
  }
  
  // Soft delete - marca como desconectado mas mantém histórico
  await updateDoc(integrationRef, {
    accessToken: '',
    refreshToken: '',
    disconnectedAt: new Date(),
  })
}

// ============ TWITCH GOALS ============

/**
 * Cria meta baseada em métrica da Twitch
 */
export async function createTwitchGoal(
  userId: string,
  goal: Omit<TwitchGoal, 'id' | 'userId' | 'completed' | 'createdAt'>
): Promise<TwitchGoal> {
  const goalRef = doc(db, 'twitchGoals', `${userId}_${goal.type}_${Date.now()}`)
  
  const newGoal: TwitchGoal = {
    ...goal,
    id: goalRef.id,
    userId,
    completed: false,
    createdAt: new Date(),
  }
  
  await setDoc(goalRef, newGoal)
  
  return newGoal
}

/**
 * Atualiza progresso das metas Twitch
 */
export async function updateTwitchGoalProgress(
  userId: string,
  type: TwitchGoal['type'],
  currentValue: number
): Promise<TwitchGoal[]> {
  const { collection, query, where, getDocs } = await import('firebase/firestore')
  
  const goalsRef = collection(db, 'twitchGoals')
  const q = query(
    goalsRef,
    where('userId', '==', userId),
    where('type', '==', type),
    where('completed', '==', false)
  )
  
  const snapshot = await getDocs(q)
  const completedGoals: TwitchGoal[] = []
  
  for (const doc of snapshot.docs) {
    const goal = doc.data() as TwitchGoal
    const shouldComplete = currentValue >= goal.targetValue
    
    await updateDoc(doc.ref, {
      currentValue,
      completed: shouldComplete,
      completedAt: shouldComplete ? new Date() : null,
    })
    
    if (shouldComplete) {
      // Dar recompensas
      await addXP(userId, goal.xpReward)
      await addCoins(userId, goal.coinsReward)
      completedGoals.push({ ...goal, completed: true, currentValue })
    }
  }
  
  return completedGoals
}

/**
 * Busca metas Twitch do usuário
 */
export async function getTwitchGoals(userId: string): Promise<TwitchGoal[]> {
  const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore')
  
  const goalsRef = collection(db, 'twitchGoals')
  const q = query(
    goalsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    completedAt: doc.data().completedAt?.toDate(),
  })) as TwitchGoal[]
}

// ============ LIVE DETECTION & XP ============

/**
 * Verifica status de live e dá XP se configurado
 */
export async function checkLiveStatusAndReward(userId: string): Promise<{
  isLive: boolean
  xpAwarded: number
  streamInfo: TwitchStreamInfo | null
}> {
  const integration = await getTwitchIntegration(userId)
  
  if (!integration || !integration.accessToken) {
    return { isLive: false, xpAwarded: 0, streamInfo: null }
  }
  
  try {
    // Verifica se token precisa ser renovado
    if (new Date() >= integration.tokenExpiresAt) {
      const newTokens = await refreshTwitchToken(integration.refreshToken)
      await saveTwitchIntegration(userId, {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        tokenExpiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
      })
      integration.accessToken = newTokens.accessToken
    }
    
    const streamInfo = await getTwitchStreamInfo(integration.accessToken, integration.twitchUserId)
    const isLive = streamInfo !== null
    let xpAwarded = 0
    
    // Atualiza status de live
    await saveTwitchIntegration(userId, {
      isLive,
      lastStreamCheck: new Date(),
    })
    
    // Se está ao vivo e XP automático está habilitado
    if (isLive && integration.autoXpOnLive) {
      const lastCheck = integration.lastStreamCheck
      const now = new Date()
      
      // Dá XP proporcional ao tempo desde a última verificação (máximo 1 hora)
      if (lastCheck) {
        const hoursSinceLastCheck = Math.min(
          (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60),
          1
        )
        xpAwarded = Math.floor(integration.xpPerHourLive * hoursSinceLastCheck)
        
        if (xpAwarded > 0) {
          await addXP(userId, xpAwarded)
        }
      }
    }
    
    // Atualiza métricas
    const followers = await getTwitchFollowers(integration.accessToken, integration.twitchUserId)
    await saveTwitchIntegration(userId, {
      totalFollowers: followers.total,
    })
    
    // Atualiza progresso de metas de followers
    await updateTwitchGoalProgress(userId, 'followers', followers.total)
    
    return { isLive, xpAwarded, streamInfo }
  } catch (error) {
    console.error('Erro ao verificar status de live:', error)
    return { isLive: false, xpAwarded: 0, streamInfo: null }
  }
}

// ============ EVENTSUB (Webhooks) ============

/**
 * Tipos de eventos EventSub suportados
 */
export type TwitchEventType = 
  | 'channel.follow'
  | 'channel.subscribe'
  | 'channel.subscription.gift'
  | 'channel.cheer'
  | 'channel.raid'
  | 'stream.online'
  | 'stream.offline'

export interface TwitchEvent {
  id: string
  type: TwitchEventType
  userId: string
  data: any
  timestamp: Date
  processed: boolean
}

/**
 * Processa eventos da Twitch e dá recompensas
 * Isso seria chamado por um Cloud Function que recebe webhooks
 */
export async function processTwitchEvent(event: TwitchEvent): Promise<void> {
  const { type, userId, data } = event
  
  switch (type) {
    case 'channel.follow':
      // Novo seguidor - atualiza contagem
      const integration = await getTwitchIntegration(userId)
      if (integration) {
        await saveTwitchIntegration(userId, {
          totalFollowers: integration.totalFollowers + 1,
        })
        await updateTwitchGoalProgress(userId, 'followers', integration.totalFollowers + 1)
      }
      break
      
    case 'channel.subscribe':
      // Novo sub - dá XP extra
      await addXP(userId, 100)
      await addCoins(userId, 25)
      await updateTwitchGoalProgress(userId, 'subscribers', data.total || 1)
      break
      
    case 'channel.subscription.gift':
      // Sub gifted - dá XP por cada gift
      const giftCount = data.total || 1
      await addXP(userId, 50 * giftCount)
      await addCoins(userId, 10 * giftCount)
      break
      
    case 'channel.cheer':
      // Bits - dá XP proporcional
      const bits = data.bits || 0
      await addXP(userId, Math.floor(bits / 10))
      break
      
    case 'channel.raid':
      // Raid recebida - dá XP por viewer
      const viewers = data.viewers || 0
      await addXP(userId, Math.floor(viewers / 2))
      await addCoins(userId, Math.floor(viewers / 10))
      break
      
    case 'stream.online':
      // Começou live
      await saveTwitchIntegration(userId, {
        isLive: true,
        lastStreamCheck: new Date(),
      })
      break
      
    case 'stream.offline':
      // Terminou live
      await saveTwitchIntegration(userId, {
        isLive: false,
      })
      // Atualiza horas streamadas se tinha meta
      if (data.duration) {
        const hours = data.duration / 3600
        await updateTwitchGoalProgress(userId, 'hours_streamed', hours)
      }
      break
  }
  
  // Marca evento como processado
  const eventRef = doc(db, 'twitchEvents', event.id)
  await updateDoc(eventRef, { processed: true })
}

// ============ METAS SUGERIDAS ============

/**
 * Gera metas automáticas baseadas nas métricas atuais
 */
export function getSuggestedTwitchGoals(
  currentFollowers: number,
  currentSubs: number,
  broadcasterType: TwitchIntegration['broadcasterType']
): Omit<TwitchGoal, 'id' | 'userId' | 'completed' | 'createdAt'>[] {
  const suggestions: Omit<TwitchGoal, 'id' | 'userId' | 'completed' | 'createdAt'>[] = []
  
  // Metas de followers
  const followerMilestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]
  const nextFollowerMilestone = followerMilestones.find(m => m > currentFollowers)
  
  if (nextFollowerMilestone) {
    suggestions.push({
      type: 'followers',
      title: `Atingir ${nextFollowerMilestone.toLocaleString()} seguidores`,
      targetValue: nextFollowerMilestone,
      currentValue: currentFollowers,
      xpReward: Math.floor(nextFollowerMilestone / 10),
      coinsReward: Math.floor(nextFollowerMilestone / 50),
    })
  }
  
  // Metas de subs (apenas para afiliados/partners)
  if (broadcasterType === 'affiliate' || broadcasterType === 'partner') {
    const subMilestones = [10, 25, 50, 100, 250, 500, 1000]
    const nextSubMilestone = subMilestones.find(m => m > currentSubs)
    
    if (nextSubMilestone) {
      suggestions.push({
        type: 'subscribers',
        title: `Atingir ${nextSubMilestone} inscritos`,
        targetValue: nextSubMilestone,
        currentValue: currentSubs,
        xpReward: nextSubMilestone * 10,
        coinsReward: nextSubMilestone * 5,
      })
    }
  }
  
  // Metas de horas streamadas
  suggestions.push({
    type: 'hours_streamed',
    title: 'Streamar 10 horas esta semana',
    targetValue: 10,
    currentValue: 0,
    xpReward: 200,
    coinsReward: 50,
  })
  
  return suggestions
}
