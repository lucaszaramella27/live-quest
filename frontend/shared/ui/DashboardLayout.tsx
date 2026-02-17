import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { getUserInventory, subscribeToUserInventory, type EquippedItems } from '@/services/inventory.service'
import { getUserProgress, createUserProgress, subscribeToUserProgress, type UserProgress } from '@/services/progress.service'
import { reportError } from '@/services/logger.service'
import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth()
  const location = useLocation()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [equippedItems, setEquippedItems] = useState<EquippedItems | null>(null)
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

    const loadInitialInventory = async () => {
      try {
        const inventory = await getUserInventory()
        if (isMounted) {
          setEquippedItems(inventory.equippedItems)
        }
      } catch (error) {
        reportError('dashboard_layout_load_inventory', error, { userId: user.id })
      }
    }

    void loadInitialInventory()

    const unsubscribeProgress = subscribeToUserProgress(user.id, (updatedProgress) => {
      if (updatedProgress && isMounted) {
        setProgress(updatedProgress)
      }
    })

    const unsubscribeInventory = subscribeToUserInventory(user.id, (updatedInventory) => {
      if (isMounted) {
        setEquippedItems(updatedInventory.equippedItems)
      }
    })

    return () => {
      isMounted = false
      unsubscribeProgress()
      unsubscribeInventory()
    }
  }, [user])

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--color-background)' }}>
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-[0.045]" />
      <div
        className="motion-orb motion-orb-cyan pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'rgba(94, 247, 226, 0.2)' }}
      />
      <div
        className="motion-orb motion-orb-orange pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'rgba(143, 161, 255, 0.18)' }}
      />

      <div className="hidden lg:block">
        <Sidebar progress={progress} equippedItems={equippedItems} />
      </div>

      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
          />

          <div className="relative">
            <Sidebar
              progress={progress}
              equippedItems={equippedItems}
              onClose={() => setShowMobileSidebar(false)}
            />
          </div>
        </div>
      )}

      <button
        onClick={() => setShowMobileSidebar(true)}
        className="fixed left-4 top-4 z-30 rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 lg:hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(11, 22, 41, 0.9), rgba(8, 17, 33, 0.92))',
          borderColor: 'rgba(139, 161, 203, 0.32)',
          color: 'var(--color-text)',
          boxShadow: '0 12px 30px -18px rgba(2, 8, 20, 0.92)',
        }}
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>

      <div className="relative min-h-screen lg:pl-80">
        <div key={location.pathname} className="page-shell animate-fade-in-up p-4 sm:p-6 lg:p-10">
          {children}
        </div>
      </div>
    </div>
  )
}
