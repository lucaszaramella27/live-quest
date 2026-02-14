import { TrendingUp } from 'lucide-react'
import { getXPProgress } from '@/services/progress.service'

interface XPBarProps {
  xp: number
  level: number
  compact?: boolean
}

export function XPBar({ xp, level, compact = false }: XPBarProps) {
  const { current, needed, percentage } = getXPProgress(xp, level)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-brand-dark-secondary px-2 py-1 rounded-lg">
          <TrendingUp className="w-3 h-3 text-brand-purple" />
          <span className="text-xs font-bold">Lvl {level}</span>
        </div>
        <div className="w-20 h-2 bg-brand-dark rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand-purple to-brand-pink transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-pink rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold">{level}</span>
          </div>
          <div>
            <p className="text-sm font-semibold">Nível {level}</p>
            <p className="text-xs text-gray-500">{current} / {needed} XP</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-semibold text-brand-purple">{xp.toLocaleString()} XP</p>
        </div>
      </div>
      
      <div className="relative w-full h-3 bg-brand-dark rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple transition-all duration-500 relative"
          style={{ width: `${percentage}%`, backgroundSize: '200% 100%' }}
        >
          <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        </div>
      </div>
    </div>
  )
}
