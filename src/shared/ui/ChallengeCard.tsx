import { Challenge, getDifficultyColor, getDifficultyGradient } from '@/services/challenges.service'
import { CheckCircle2, Circle, Coins, Zap } from 'lucide-react'
import { IconMapper } from './IconMapper'

interface ChallengeCardProps {
  challenge: Challenge
  compact?: boolean
}

export function ChallengeCard({ challenge, compact = false }: ChallengeCardProps) {
  const progress = (challenge.current / challenge.target) * 100
  const isCompleted = challenge.completed

  if (compact) {
    return (
      <div className={`p-3 rounded-xl bg-gradient-to-br ${getDifficultyGradient(challenge.difficulty)} border border-white/5 hover:border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
        <div className="flex items-center gap-3">
          <IconMapper icon={challenge.icon} size={32} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold truncate">{challenge.title}</p>
              {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-purple to-brand-pink transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {challenge.current}/{challenge.target}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${getDifficultyGradient(challenge.difficulty)} border border-white/10 hover:border-white/20 transition-all duration-300 group relative overflow-hidden hover:scale-[1.02] hover:shadow-xl`}>
      {/* Difficulty badge */}
      <div className="absolute top-3 right-3">
        <span 
          className="px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
          style={{ 
            backgroundColor: `${getDifficultyColor(challenge.difficulty)}20`,
            color: getDifficultyColor(challenge.difficulty)
          }}
        >
          {challenge.difficulty}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <IconMapper icon={challenge.icon} size={48} />
        <div className="flex-1">
          <h4 className="text-lg font-bold mb-1">{challenge.title}</h4>
          <p className="text-sm text-gray-400">{challenge.description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Progresso</span>
          <span className="text-sm font-semibold">
            {challenge.current}/{challenge.target}
          </span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand-purple to-brand-pink transition-all duration-500 relative"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
        <div className="mt-1 text-right">
          <span className="text-xs font-semibold" style={{ color: getDifficultyColor(challenge.difficulty) }}>
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Rewards */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-yellow-500">+{challenge.reward.xp} XP</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-amber-500">+{challenge.reward.coins}</span>
          </div>
        </div>
        {isCompleted ? (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-bold">Completo!</span>
          </div>
        ) : (
          <Circle className="w-5 h-5 text-gray-600" />
        )}
      </div>
    </div>
  )
}
