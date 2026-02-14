import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { getUserProgress, createUserProgress, type UserProgress } from '@/services/progress.service'
import { Menu } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth()
  const location = useLocation()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  useEffect(() => {
    if (user) {
      loadProgress()
    }
  }, [user])

  async function loadProgress() {
    if (!user) return

    try {
      let progressData = await getUserProgress(user.id)
      if (!progressData) {
        progressData = await createUserProgress(user.id, user.displayName || user.email, user.photoURL || undefined)
      }
      setProgress(progressData)
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar progress={progress} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
          />
          
          {/* Sidebar */}
          <div className="relative">
            <Sidebar progress={progress} onClose={() => setShowMobileSidebar(false)} />
          </div>
        </div>
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowMobileSidebar(true)}
        className="lg:hidden fixed top-6 left-6 z-30 p-3 rounded-lg backdrop-blur-md border transition-colors"
        style={{
          background: 'var(--color-primary)',
          borderColor: 'var(--color-primary)',
          opacity: 0.8
        }}
      >
        <Menu size={24} className="text-white" />
      </button>

      {/* Main Content */}
      <div className="lg:pl-72 min-h-screen">
        <div key={location.pathname} className="p-6 lg:p-8 animate-fade-in-up">
          {children}
        </div>
      </div>
    </div>
  )
}
