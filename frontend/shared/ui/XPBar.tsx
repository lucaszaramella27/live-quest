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
      <div className="inline-flex items-center gap-2">
        <div
          className="flex items-center gap-1 rounded-lg border px-2 py-1"
          style={{
            background: 'rgba(10, 21, 40, 0.78)',
            borderColor: 'rgba(94, 247, 226, 0.26)',
          }}
        >
          <TrendingUp className="h-3 w-3" style={{ color: 'var(--color-primary)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
            Lvl {level}
          </span>
        </div>
        <div
          className="h-2 w-20 overflow-hidden rounded-full"
          style={{ background: 'rgba(5, 12, 23, 0.92)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%`, background: 'var(--gradient-primary)' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="surface-card rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(94, 247, 226, 0.2), rgba(143, 161, 255, 0.18))',
              borderColor: 'rgba(94, 247, 226, 0.28)',
              color: 'var(--color-text)',
            }}
          >
            {level}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Nivel {level}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {current} / {needed} XP
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Total
          </p>
          <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
            {xp.toLocaleString()} XP
          </p>
        </div>
      </div>

      <div
        className="relative h-3 w-full overflow-hidden rounded-full"
        style={{ background: 'rgba(5, 12, 23, 0.9)' }}
      >
        <div
          className="relative h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, background: 'var(--gradient-primary)', backgroundSize: '200% 100%' }}
        >
          <div className="absolute inset-0 animate-shimmer bg-white/15" style={{ backgroundSize: '200% 100%' }} />
        </div>
      </div>
    </div>
  )
}
