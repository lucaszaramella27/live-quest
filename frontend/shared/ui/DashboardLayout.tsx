import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { getUserProgress, createUserProgress, subscribeToUserProgress, type UserProgress } from '@/services/progress.service'
import { reportError } from '@/services/logger.service'
import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth()
  const location = useLocation()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  useEffect(() => {
    if (!user) return

    let isMounted = true

    const loadInitialProgress = async () => {
      try {
        let progressData = await getUserProgress(user.id)
        if (!progressData) {
          progressData = await createUserProgress(
            user.id,
            user.displayName || user.email || 'Usuario',
            user.photoURL || ''
          )
        }

        if (isMounted) {
          setProgress(progressData)
        }
      } catch (error) {
        reportError('dashboard_layout_load_progress', error, { userId: user.id })
      }
    }

    void loadInitialProgress()

    const unsubscribe = subscribeToUserProgress(user.id, (updatedProgress) => {
      if (updatedProgress && isMounted) {
        setProgress(updatedProgress)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [user])

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--color-background)' }}>
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-[0.04]" />
      <div className="motion-orb motion-orb-cyan pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(14, 165, 233, 0.22)' }} />
      <div className="motion-orb motion-orb-orange pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(249, 115, 22, 0.18)' }} />

      <div className="hidden lg:block">
        <Sidebar progress={progress} />
      </div>

      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
          />

          <div className="relative">
            <Sidebar progress={progress} onClose={() => setShowMobileSidebar(false)} />
          </div>
        </div>
      )}

      <button
        onClick={() => setShowMobileSidebar(true)}
        className="fixed left-5 top-5 z-30 rounded-xl border p-3 transition-colors lg:hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          borderColor: 'rgba(148, 163, 184, 0.32)',
          color: 'var(--color-text)',
        }}
      >
        <Menu size={24} />
      </button>

      <div className="relative min-h-screen lg:pl-80">
        <div key={location.pathname} className="page-shell animate-fade-in-up p-6 lg:p-10">
          {children}
        </div>
      </div>
    </div>
  )
}
