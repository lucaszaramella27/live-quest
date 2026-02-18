type GenericError = {
  message: string
  code?: string
}

type QueryOperation = 'select' | 'insert' | 'update' | 'delete' | 'upsert'

type QueryFilterType = 'eq' | 'gte' | 'lte'

interface QueryFilter {
  type: QueryFilterType
  field: string
  value: unknown
}

interface QueryOrder {
  column: string
  ascending?: boolean
}

interface QueryPayload {
  table: string
  operation: QueryOperation
  select?: string
  filters?: QueryFilter[]
  order?: QueryOrder
  limit?: number
  payload?: unknown
  options?: {
    onConflict?: string
  }
  returning?: string
}

interface QueryResponse<T> {
  data: T
  error: GenericError | null
}

export interface AuthProviderUser {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}

export interface AuthSession {
  access_token: string
  user: AuthProviderUser
}

type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED'

type AuthStateListener = (event: AuthChangeEvent, session: AuthSession | null) => void

type ChannelCallback = (payload: any) => void

type ChannelSubscribeCallback = (status: 'SUBSCRIBED' | 'CLOSED') => void

type ChannelFilter = Record<string, unknown>

export interface RealtimeChannel {
  on: (event: string, filter: ChannelFilter, callback: ChannelCallback) => RealtimeChannel
  subscribe: (callback?: ChannelSubscribeCallback) => RealtimeChannel
  unsubscribe: () => void
}

const STORAGE_KEY = 'livequest_backend_session'
const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001').replace(/\/+$/, '')
const GOOGLE_GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
const GOOGLE_OAUTH_SCOPE = 'openid email profile'

let googleScriptLoader: Promise<void> | null = null
let memorySession: AuthSession | null = null
let cachedSessionStorages: Storage[] | null = null

function createError(message: string, code?: string): GenericError {
  return { message, code }
}

function getSessionStorages(): Storage[] {
  if (cachedSessionStorages) {
    return cachedSessionStorages
  }

  if (typeof window === 'undefined') {
    cachedSessionStorages = []
    return cachedSessionStorages
  }

  const storages: Storage[] = []
  const candidates: Storage[] = [window.localStorage, window.sessionStorage]

  for (const storage of candidates) {
    try {
      const probeKey = `${STORAGE_KEY}:probe`
      storage.setItem(probeKey, '1')
      storage.removeItem(probeKey)
      storages.push(storage)
    } catch {
      // Ignore storage engines that are blocked/unavailable.
    }
  }

  cachedSessionStorages = storages
  return cachedSessionStorages
}

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return memorySession

  for (const storage of getSessionStorages()) {
    let raw: string | null = null

    try {
      raw = storage.getItem(STORAGE_KEY)
    } catch {
      continue
    }

    if (!raw) continue

    try {
      const parsed = JSON.parse(raw) as AuthSession
      if (!parsed || !parsed.access_token || !parsed.user?.id) {
        continue
      }
      memorySession = parsed
      return parsed
    } catch {
      continue
    }
  }

  return memorySession
}

function writeStoredSession(session: AuthSession | null): void {
  if (!session) {
    clearStoredSession()
    return
  }

  memorySession = session

  if (typeof window === 'undefined') return

  for (const storage of getSessionStorages()) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      // Ignore storage write failures.
    }
  }
}

function clearStoredSession(): void {
  memorySession = null

  if (typeof window === 'undefined') {
    return
  }

  for (const storage of getSessionStorages()) {
    try {
      storage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage removal failures.
    }
  }
}

const authListeners = new Set<AuthStateListener>()

function notifyAuthListeners(event: AuthChangeEvent, session: AuthSession | null): void {
  for (const listener of authListeners) {
    listener(event, session)
  }
}

async function safeJsonParse(response: Response): Promise<any> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function requestWithAuth(path: string, init: RequestInit = {}): Promise<Response> {
  const session = readStoredSession()
  const headers = new Headers(init.headers)

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })
}

function getGoogleClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
}

function readGoogleOAuthApi() {
  return window.google?.accounts?.oauth2
}

async function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Google login is only available in a browser environment.')
  }

  if (readGoogleOAuthApi()?.initTokenClient) {
    return
  }

  if (!googleScriptLoader) {
    googleScriptLoader = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_GSI_SCRIPT_URL}"]`)
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true })
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity SDK.')), { once: true })
        return
      }

      const script = document.createElement('script')
      script.src = GOOGLE_GSI_SCRIPT_URL
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google Identity SDK.'))
      document.head.appendChild(script)
    })
  }

  await googleScriptLoader

  if (!readGoogleOAuthApi()?.initTokenClient) {
    throw new Error('Google Identity SDK loaded, but OAuth API is unavailable.')
  }
}

async function requestGoogleAccessToken(clientId: string): Promise<string> {
  await loadGoogleIdentityScript()

  const googleOAuthApi = readGoogleOAuthApi()
  if (!googleOAuthApi?.initTokenClient) {
    throw new Error('Google OAuth API is unavailable in this browser.')
  }

  return new Promise((resolve, reject) => {
    let settled = false

    const tokenClient = googleOAuthApi.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_OAUTH_SCOPE,
      callback: (response) => {
        if (settled) return
        settled = true

        if (response.error) {
          reject(new Error(response.error_description || response.error || 'Google authentication failed.'))
          return
        }

        if (!response.access_token) {
          reject(new Error('Google did not return an access token.'))
          return
        }

        resolve(response.access_token)
      },
      error_callback: (error) => {
        if (settled) return
        settled = true
        reject(new Error(error.message || error.type || 'Google authentication popup failed.'))
      },
    })

    tokenClient.requestAccessToken({ prompt: 'select_account' })
  })
}

class BackendQueryBuilder<TData = unknown> {
  private table: string
  private operation: QueryOperation = 'select'
  private selectColumns: string | undefined
  private returningColumns: string | undefined
  private filters: QueryFilter[] = []
  private orderBy: QueryOrder | undefined
  private rowLimit: number | undefined
  private payloadData: unknown
  private upsertOptions: { onConflict?: string } | undefined

  constructor(table: string) {
    this.table = table
  }

  select(columns = '*'): BackendQueryBuilder<TData> {
    if (this.operation === 'select') {
      this.selectColumns = columns
    } else {
      this.returningColumns = columns
    }
    return this
  }

  insert(payload: unknown): BackendQueryBuilder<TData> {
    this.operation = 'insert'
    this.payloadData = payload
    return this
  }

  update(payload: unknown): BackendQueryBuilder<TData> {
    this.operation = 'update'
    this.payloadData = payload
    return this
  }

  delete(): BackendQueryBuilder<TData> {
    this.operation = 'delete'
    return this
  }

  upsert(payload: unknown, options?: { onConflict?: string }): BackendQueryBuilder<TData> {
    this.operation = 'upsert'
    this.payloadData = payload
    this.upsertOptions = options
    return this
  }

  eq(field: string, value: unknown): BackendQueryBuilder<TData> {
    this.filters.push({ type: 'eq', field, value })
    return this
  }

  gte(field: string, value: unknown): BackendQueryBuilder<TData> {
    this.filters.push({ type: 'gte', field, value })
    return this
  }

  lte(field: string, value: unknown): BackendQueryBuilder<TData> {
    this.filters.push({ type: 'lte', field, value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }): BackendQueryBuilder<TData> {
    this.orderBy = {
      column,
      ascending: options?.ascending !== false,
    }
    return this
  }

  limit(value: number): BackendQueryBuilder<TData> {
    this.rowLimit = value
    return this
  }

  async returns<TReturn = TData>(): Promise<QueryResponse<TReturn>> {
    return this.execute<TReturn>()
  }

  async maybeSingle<TReturn = TData>(): Promise<QueryResponse<TReturn | null>> {
    const result = await this.execute<TReturn[]>()
    if (result.error) {
      return { data: null, error: result.error }
    }
    const rows = Array.isArray(result.data) ? result.data : []
    return { data: rows[0] || null, error: null }
  }

  async single<TReturn = TData>(): Promise<QueryResponse<TReturn>> {
    const result = await this.execute<TReturn[]>()
    if (result.error) {
      return { data: null as unknown as TReturn, error: result.error }
    }
    const rows = Array.isArray(result.data) ? result.data : []
    if (!rows[0]) {
      return { data: null as unknown as TReturn, error: createError('No rows returned for single().', 'not_found') }
    }
    return { data: rows[0], error: null }
  }

  then<TResult1 = QueryResponse<TData>, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse<TData>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute<TData>().then(onfulfilled, onrejected)
  }

  private async execute<TReturn = TData>(): Promise<QueryResponse<TReturn>> {
    const response = await backendClient.executeQuery<TReturn>({
      table: this.table,
      operation: this.operation,
      select: this.selectColumns,
      filters: this.filters,
      order: this.orderBy,
      limit: this.rowLimit,
      payload: this.payloadData,
      options: this.upsertOptions,
      returning: this.returningColumns,
    })

    return response
  }
}

function createNoopChannel(): RealtimeChannel {
  return {
    on(_event: string, _filter: ChannelFilter, _callback: ChannelCallback) {
      return this
    },
    subscribe(callback?: ChannelSubscribeCallback) {
      if (callback) {
        setTimeout(() => callback('SUBSCRIBED'), 0)
      }
      return this
    },
    unsubscribe() {
      return
    },
  }
}

async function callAuthEndpoint(path: string, payload: unknown): Promise<QueryResponse<{ accessToken: string; user: AuthProviderUser } | null>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const body = await safeJsonParse(response)

    if (!response.ok) {
      const message = body?.error || `Auth request failed (${response.status}).`
      return { data: null, error: createError(message) }
    }

    if (!body?.accessToken || !body?.user) {
      return { data: null, error: createError('Invalid auth response payload.') }
    }

    return { data: { accessToken: body.accessToken, user: body.user }, error: null }
  } catch (error: any) {
    return { data: null, error: createError(error?.message || 'Auth request failed.') }
  }
}

export const backendClient = {
  auth: {
    async signInWithOAuth(params: { provider: string; options?: Record<string, unknown> }) {
      if (params.provider !== 'google') {
        return {
          data: { user: null },
          error: createError('Unsupported OAuth provider for this backend.', 'oauth_provider_unsupported'),
        }
      }

      const googleClientId = getGoogleClientId()
      if (!googleClientId) {
        return {
          data: { user: null },
          error: createError('Google login is not configured. Missing VITE_GOOGLE_CLIENT_ID.', 'google_client_id_missing'),
        }
      }

      try {
        const googleAccessToken = await requestGoogleAccessToken(googleClientId)
        const result = await callAuthEndpoint('/api/auth/google', { accessToken: googleAccessToken })

        if (result.error || !result.data) {
          return { data: { user: null }, error: result.error || createError('Google login failed.') }
        }

        const session: AuthSession = {
          access_token: result.data.accessToken,
          user: result.data.user,
        }
        writeStoredSession(session)
        notifyAuthListeners('SIGNED_IN', session)

        return {
          data: { user: result.data.user },
          error: null,
        }
      } catch (error: any) {
        return {
          data: { user: null },
          error: createError(error?.message || 'Google login failed.'),
        }
      }
    },

    async signUp(payload: { email: string; password: string; options?: Record<string, unknown> }) {
      const result = await callAuthEndpoint('/api/auth/signup', payload)
      if (result.error || !result.data) {
        return { data: { user: null }, error: result.error || createError('Signup failed.') }
      }

      const session: AuthSession = {
        access_token: result.data.accessToken,
        user: result.data.user,
      }
      writeStoredSession(session)
      notifyAuthListeners('SIGNED_IN', session)

      return {
        data: { user: result.data.user },
        error: null,
      }
    },

    async signInWithPassword(payload: { email: string; password: string }) {
      const result = await callAuthEndpoint('/api/auth/login', payload)
      if (result.error || !result.data) {
        return { data: { user: null }, error: result.error || createError('Login failed.') }
      }

      const session: AuthSession = {
        access_token: result.data.accessToken,
        user: result.data.user,
      }
      writeStoredSession(session)
      notifyAuthListeners('SIGNED_IN', session)

      return {
        data: { user: result.data.user },
        error: null,
      }
    },

    async signOut() {
      writeStoredSession(null)
      notifyAuthListeners('SIGNED_OUT', null)
      return { error: null }
    },

    async getSession() {
      return {
        data: {
          session: readStoredSession(),
        },
        error: null,
      }
    },

    async getUser() {
      const session = readStoredSession()
      if (!session?.access_token) {
        return { data: { user: null }, error: null }
      }

      try {
        const response = await requestWithAuth('/api/auth/me', { method: 'GET' })
        const body = await safeJsonParse(response)

        if (!response.ok) {
          return { data: { user: session.user }, error: null }
        }

        if (body?.user) {
          const nextSession: AuthSession = {
            ...session,
            user: body.user,
          }
          writeStoredSession(nextSession)
          return { data: { user: nextSession.user }, error: null }
        }

        return { data: { user: session.user }, error: null }
      } catch {
        return { data: { user: session.user }, error: null }
      }
    },

    async refreshSession() {
      const session = readStoredSession()
      if (!session?.access_token) {
        return { data: { session: null }, error: null }
      }

      const userResult = await this.getUser()
      if (!userResult.data.user) {
        writeStoredSession(null)
        notifyAuthListeners('SIGNED_OUT', null)
        return { data: { session: null }, error: null }
      }

      const nextSession: AuthSession = {
        ...session,
        user: userResult.data.user,
      }
      writeStoredSession(nextSession)
      notifyAuthListeners('TOKEN_REFRESHED', nextSession)

      return {
        data: { session: nextSession },
        error: null,
      }
    },

    onAuthStateChange(listener: AuthStateListener) {
      authListeners.add(listener)
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(listener)
            },
          },
        },
      }
    },
  },

  from<TData = unknown>(table: string) {
    return new BackendQueryBuilder<TData>(table)
  },

  functions: {
    async invoke<TData = unknown>(endpoint: string, options?: { body?: unknown }) {
      try {
        const response = await requestWithAuth(`/api/functions/${endpoint}`, {
          method: 'POST',
          body: JSON.stringify(options?.body ?? {}),
        })

        const body = await safeJsonParse(response)
        if (!response.ok) {
          return {
            data: null,
            error: createError(body?.error || `Function call failed (${response.status}).`),
          }
        }

        return {
          data: (body as TData) ?? null,
          error: null,
        }
      } catch (error: any) {
        return {
          data: null,
          error: createError(error?.message || 'Function call failed.'),
        }
      }
    },
  },

  channel(_name: string): RealtimeChannel {
    return createNoopChannel()
  },

  async removeChannel(_channel: RealtimeChannel): Promise<void> {
    return
  },

  async executeQuery<TData = unknown>(payload: QueryPayload): Promise<QueryResponse<TData>> {
    const session = readStoredSession()
    if (!session?.access_token) {
      return { data: null as unknown as TData, error: createError('Usuario nao autenticado.') }
    }

    try {
      const response = await requestWithAuth('/api/db/query', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const body = await safeJsonParse(response)

      if (!response.ok) {
        const errorMessage = body?.error?.message || body?.error || `Backend query failed (${response.status}).`
        const errorCode = body?.error?.code
        return {
          data: null as unknown as TData,
          error: createError(errorMessage, errorCode),
        }
      }

      if (body?.error) {
        return {
          data: null as unknown as TData,
          error: createError(body.error.message || 'Backend query failed.', body.error.code),
        }
      }

      return {
        data: (body?.data as TData) ?? (null as unknown as TData),
        error: null,
      }
    } catch (error: any) {
      return {
        data: null as unknown as TData,
        error: createError(error?.message || 'Backend query failed.'),
      }
    }
  },
}

export async function getAccessToken(): Promise<string | null> {
  const session = readStoredSession()
  return session?.access_token || null
}
