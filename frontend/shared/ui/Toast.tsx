import { useEffect } from 'react'
import { CheckCircle, Flame, Target, Zap, Trophy, XCircle } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'streak' | 'goal' | 'task' | 'achievement' | 'error'
  show: boolean
  onClose: () => void
}

const icons = {
  success: CheckCircle,
  streak: Flame,
  goal: Target,
  task: Zap,
  achievement: Trophy,
  error: XCircle,
}

const styles = {
  success: {
    gradient: 'linear-gradient(135deg, rgba(34, 211, 238, 0.22), rgba(14, 165, 233, 0.2))',
    icon: '#22d3ee',
    border: 'rgba(34, 211, 238, 0.36)',
  },
  streak: {
    gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.24), rgba(245, 158, 11, 0.2))',
    icon: '#f97316',
    border: 'rgba(249, 115, 22, 0.36)',
  },
  goal: {
    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(14, 165, 233, 0.2))',
    icon: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.35)',
  },
  task: {
    gradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(34, 211, 238, 0.2))',
    icon: '#0ea5e9',
    border: 'rgba(14, 165, 233, 0.34)',
  },
  achievement: {
    gradient: 'linear-gradient(135deg, rgba(251, 146, 60, 0.24), rgba(245, 158, 11, 0.2))',
    icon: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.35)',
  },
  error: {
    gradient: 'linear-gradient(135deg, rgba(248, 113, 113, 0.24), rgba(239, 68, 68, 0.2))',
    icon: '#ef4444',
    border: 'rgba(239, 68, 68, 0.36)',
  },
}

export function Toast({ message, type = 'success', show, onClose }: ToastProps) {
  const Icon = icons[type]
  const tone = styles[type]

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed right-4 top-24 z-50 w-[min(92vw,380px)] animate-slide-in-right">
      <div
        className="surface-card relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl"
        style={{ borderColor: tone.border }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: 'var(--gradient-primary)' }} />
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{
              background: tone.gradient,
              borderColor: tone.border,
              boxShadow: `0 14px 28px -22px ${tone.icon}`,
            }}
          >
            <Icon className="h-5 w-5" style={{ color: tone.icon }} />
          </div>
          <p className="flex-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
