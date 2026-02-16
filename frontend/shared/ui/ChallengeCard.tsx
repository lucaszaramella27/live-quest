import { Challenge, getDifficultyColor, getDifficultyGradient } from '@/services/challenges.service'
import { CheckCircle2, Circle, Coins, Zap } from 'lucide-react'
import { IconMapper } from './IconMapper'
import { Button } from './Button'

interface ChallengeCardProps {
  challenge: Challenge
  compact?: boolean
  onClaim?: (challengeId: string) => void
  claiming?: boolean
}

export function ChallengeCard({ challenge, compact = false, onClaim, claiming = false }: ChallengeCardProps) {
  const progress = (challenge.current / challenge.target) * 100
  const clampedProgress = Math.min(progress, 100)
  const isCompleted = challenge.completed
  const isClaimed = Boolean(challenge.claimedAt)
  const difficultyColor = getDifficultyColor(challenge.difficulty)

  if (compact) {
    return (
      <div className="surface-card rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg bg-gradient-to-br p-1 ${getDifficultyGradient(challenge.difficulty)}`}>
            <IconMapper icon={challenge.icon} size={28} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {challenge.title}
              </p>
              {isCompleted && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />}
            </div>

            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-950/70">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${clampedProgress}%`, background: 'var(--gradient-primary)' }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {challenge.current}/{challenge.target}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="surface-card relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: 'var(--gradient-primary)' }} />

      <div className="absolute right-3 top-3">
        <span
          className="rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wider"
          style={{
            backgroundColor: `${difficultyColor}20`,
            color: difficultyColor,
            border: `1px solid ${difficultyColor}4D`,
          }}
        >
          {challenge.difficulty}
        </span>
      </div>

      <div className="mb-4 flex items-start gap-4 pr-20">
        <div className={`rounded-xl bg-gradient-to-br p-2 ${getDifficultyGradient(challenge.difficulty)}`}>
          <IconMapper icon={challenge.icon} size={40} />
        </div>
        <div className="flex-1">
          <h4 className="mb-1 text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {challenge.title}
          </h4>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {challenge.description}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Progresso
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {challenge.current}/{challenge.target}
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-950/70">
          <div className="relative h-full rounded-full transition-all duration-500" style={{ width: `${clampedProgress}%`, background: 'var(--gradient-primary)' }}>
            <div className="absolute inset-0 animate-shimmer bg-white/15" style={{ backgroundSize: '200% 100%' }} />
          </div>
        </div>

        <div className="mt-1 text-right">
          <span className="text-xs font-semibold" style={{ color: difficultyColor }}>
            {clampedProgress.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'rgba(139, 161, 203, 0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-amber-400">+{challenge.reward.xp} XP</span>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <Coins className="h-4 w-4 text-orange-400" />
            <span className="font-semibold text-orange-400">+{challenge.reward.coins}</span>
          </div>
        </div>

        {isCompleted ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-bold">{isClaimed ? 'Resgatado' : 'Completo'}</span>
          </div>
        ) : (
          <Circle className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
        )}
      </div>

      {isCompleted && !isClaimed && onClaim && (
        <div className="mt-3">
          <Button onClick={() => onClaim(challenge.id)} disabled={claiming} size="sm" className="w-full">
            {claiming ? 'Resgatando...' : 'Resgatar recompensa'}
          </Button>
        </div>
      )}
    </div>
  )
}
