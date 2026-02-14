import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/services/firebase'
import { getCurrentUser } from '@/services/auth.service'
import { User } from '@/shared/types'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userData = await getCurrentUser(firebaseUser)
        setUser(userData)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
