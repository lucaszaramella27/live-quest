import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthProviderUser } from '@/services/backend-client'
import { backendClient } from '@/services/backend-client'
import { getCurrentUser } from '@/services/auth.service'
import { reportError } from '@/services/logger.service'
import type { User } from '@/shared/types'

const FALLBACK_ADMIN_UIDS = (import.meta.env.VITE_ADMIN_UIDS || '')
  .split(',')
  .map((uid) => uid.trim())
  .filter(Boolean)

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  refreshClaims: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  refreshClaims: async () => {},
})

function hasAdminMetadata(authUser: AuthProviderUser): boolean {
  const appMetadata = authUser.app_metadata as Record<string, unknown> | undefined
  if (!appMetadata) return false

  if (appMetadata.admin === true) return true
  if (appMetadata.role === 'admin') return true

  if (Array.isArray(appMetadata.roles)) {
    return appMetadata.roles.some((role) => role === 'admin')
  }

  return false
}

async function resolveAdminStatus(authUser: AuthProviderUser): Promise<boolean> {
  if (hasAdminMetadata(authUser)) return true
  if (import.meta.env.DEV && FALLBACK_ADMIN_UIDS.includes(authUser.id)) return true

  const { data, error } = await backendClient
    .from('users')
    .select('is_admin')
    .eq('id', authUser.id)
    .maybeSingle<{ is_admin: boolean | null }>()

  if (error) {
    return false
  }

  return Boolean(data?.is_admin)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  async function loadAuthState(authUser: AuthProviderUser | null): Promise<void> {
    if (!authUser) {
      setUser(null)
      setIsAdmin(false)
      setLoading(false)
      return
    }

    const [userData, adminStatus] = await Promise.all([
      getCurrentUser(authUser),
      resolveAdminStatus(authUser),
    ])

    setUser(userData)
    setIsAdmin(adminStatus)
    setLoading(false)
  }

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await backendClient.auth.getSession()

        if (isMounted) {
          await loadAuthState(session?.user ?? null)
        }
      } catch (error) {
        reportError('Erro ao iniciar contexto de autenticacao:', error)
        if (isMounted) {
          setUser(null)
          setIsAdmin(false)
          setLoading(false)
        }
      }
    }

    void initialize()

    const {
      data: { subscription },
    } = backendClient.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        try {
          if (isMounted) {
            await loadAuthState(session?.user ?? null)
          }
        } catch (error) {
          reportError('Erro ao carregar contexto de autenticacao:', error)
          if (isMounted) {
            setUser(null)
            setIsAdmin(false)
            setLoading(false)
          }
        }
      })()
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const refreshClaims = async () => {
    await backendClient.auth.refreshSession()
    const {
      data: { session },
    } = await backendClient.auth.getSession()
    await loadAuthState(session?.user ?? null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, refreshClaims }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
