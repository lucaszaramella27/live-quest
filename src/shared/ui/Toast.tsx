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

const colors = {
  success: 'from-green-500 to-emerald-500',
  streak: 'from-orange-500 to-red-500',
  goal: 'from-pink-500 to-purple-500',
  task: 'from-purple-500 to-pink-500',
  achievement: 'from-yellow-500 to-orange-500',
  error: 'from-red-500 to-rose-500',
}

export function Toast({ message, type = 'success', show, onClose }: ToastProps) {
  const Icon = icons[type]

  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed top-24 right-4 z-50 animate-slide-in-right">
      <div className="glass rounded-2xl p-4 shadow-2xl border border-white/10 min-w-[300px] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[type]} flex items-center justify-center shadow-lg animate-bounce-subtle`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <p className="font-medium text-white flex-1">{message}</p>
        </div>
      </div>
    </div>
  )
}
