import { getAccessToken, backendClient } from './backend-client'

const RAW_FUNCTIONS_BASE_URL = (
  import.meta.env.VITE_BACKEND_FUNCTIONS_BASE_URL ||
  import.meta.env.VITE_FUNCTIONS_BASE_URL ||
  import.meta.env.VITE_TWITCH_BACKEND_BASE_URL ||
  ''
).replace(/\/+$/, '')

const USE_BACKEND_FUNCTIONS = (import.meta.env.VITE_USE_BACKEND_FUNCTIONS || 'true') !== 'false'

const USE_DEV_PROXY = Boolean(
  import.meta.env.DEV &&
    RAW_FUNCTIONS_BASE_URL &&
    (import.meta.env.VITE_FUNCTIONS_USE_PROXY || 'true') !== 'false'
)

const FUNCTIONS_BASE_URL = USE_DEV_PROXY ? '/api/functions' : RAW_FUNCTIONS_BASE_URL
const USE_DEV_BACKEND_FALLBACK =
  import.meta.env.DEV && (import.meta.env.VITE_FUNCTIONS_DEV_FALLBACK || 'true') !== 'false'
const FORCE_DEV_BACKEND_FALLBACK =
  import.meta.env.DEV && (import.meta.env.VITE_FUNCTIONS_FORCE_FALLBACK || 'false') === 'true'
const PREFER_DEV_BACKEND_FALLBACK =
  import.meta.env.DEV && (import.meta.env.VITE_FUNCTIONS_PREFER_FALLBACK || 'false') === 'true'
const DEBUG_DEV_BACKEND_FALLBACK =
  import.meta.env.DEV && (import.meta.env.VITE_FUNCTIONS_DEBUG_FALLBACK || 'false') === 'true'

const warnedFallbackEndpoints = new Set<string>()
const unavailableEndpoints = new Set<string>()

const DEV_FALLBACK_ENDPOINTS = new Set<string>([
  'healthz',
  'getUserInventory',
  'purchaseShopItem',
  'getWeeklyChallenges',
  'claimWeeklyChallengeReward',
])

interface BackendErrorPayload {
  error?: string
}

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function getWeekRangeIso(): { startDate: string; endDate: string; weekKey: string } {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay())

  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const startIso = start.toISOString().slice(0, 10)
  const endIso = end.toISOString().slice(0, 10)
  return {
    startDate: startIso,
    endDate: endIso,
    weekKey: startIso,
  }
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/^\/+/, '').replace(/\/+$/, '')
}

function getDevFallbackResponse<T>(endpoint: string): T | null {
  const weekRange = getWeekRangeIso()
  const defaultEquippedItems = { avatar: null, badge: null, theme: null }
  const fallbacks: Record<string, unknown> = {
    getUserInventory: { purchasedItemIds: [], activePowerups: [], equippedItems: defaultEquippedItems },
    purchaseShopItem: {
      success: false,
      reason: 'backend_unavailable',
      newBalance: 0,
      newXP: 0,
      newLevel: 1,
      purchasedItemIds: [],
      activePowerups: [],
      equippedItems: defaultEquippedItems,
    },
    getWeeklyChallenges: {
      weekKey: weekRange.weekKey,
      startDate: weekRange.startDate,
      endDate: weekRange.endDate,
      challenges: [],
    },
    claimWeeklyChallengeReward: {
      success: false,
      reason: 'backend_unavailable',
      achievements: [],
    },
    healthz: {
      status: 'dev-fallback',
      timestamp: `${getTodayIsoDate()}T00:00:00.000Z`,
    },
  }

  return (fallbacks[endpoint] ?? null) as T | null
}

function maybeReturnDevFallback<T>(endpoint: string): T | null {
  if (!USE_DEV_BACKEND_FALLBACK) return null

  const fallback = getDevFallbackResponse<T>(endpoint)
  if (!fallback) return null

  if (DEBUG_DEV_BACKEND_FALLBACK && !warnedFallbackEndpoints.has(endpoint)) {
    warnedFallbackEndpoints.add(endpoint)
    console.warn(`[functions-api] using dev fallback for ${endpoint}`)
  }

  return fallback
}

async function callViaBackendInvoke<T>(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<T> {
  const { data, error } = await backendClient.functions.invoke(endpoint, {
    body: payload,
  })

  if (error) {
    throw error
  }

  return data as T
}

async function callViaFetch<T>(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<T> {
  if (!FUNCTIONS_BASE_URL) {
    throw new Error(
      'Funcoes nao configuradas. Defina VITE_BACKEND_FUNCTIONS_BASE_URL ou use chamadas via backendClient.functions.'
    )
  }

  const token = await getAccessToken()
  if (!token) {
    throw new Error('Usuario nao autenticado.')
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => ({}))) as T & BackendErrorPayload

  if (!response.ok) {
    throw new Error(data.error || `Erro ao chamar backend (${response.status}).`)
  }

  return data as T
}

export async function callBackendFunction<T>(
  endpoint: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const normalizedEndpoint = normalizeEndpoint(endpoint)

  if (PREFER_DEV_BACKEND_FALLBACK && DEV_FALLBACK_ENDPOINTS.has(normalizedEndpoint)) {
    const fallback = maybeReturnDevFallback<T>(normalizedEndpoint)
    if (fallback) return fallback
  }

  if (FORCE_DEV_BACKEND_FALLBACK || unavailableEndpoints.has(normalizedEndpoint)) {
    const fallback = maybeReturnDevFallback<T>(normalizedEndpoint)
    if (fallback) return fallback
  }

  try {
    const result = USE_BACKEND_FUNCTIONS
      ? await callViaBackendInvoke<T>(normalizedEndpoint, payload)
      : await callViaFetch<T>(normalizedEndpoint, payload)

    unavailableEndpoints.delete(normalizedEndpoint)
    return result
  } catch (error) {
    unavailableEndpoints.add(normalizedEndpoint)

    const fallback = maybeReturnDevFallback<T>(normalizedEndpoint)
    if (fallback) return fallback

    throw error
  }
}
