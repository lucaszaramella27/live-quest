import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { ChallengeCard, Toast } from '@/shared/ui'
import { Trophy, Clock, CheckCircle, Star } from 'lucide-react'
import { generateWeeklyChallenges, getTimeUntilWeekEnd, type Challenge } from '@/services/challenges.service'
import { getUserProgress, type UserProgress } from '@/services/progress.service'
import { applyTheme, loadSavedTheme } from '@/services/themes.service'

export function ChallengesPage() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' })

  useEffect(() => {
    const savedTheme = loadSavedTheme()
    applyTheme(savedTheme)
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const [challengesData, progressData] = await Promise.all([
        Promise.resolve(generateWeeklyChallenges()),
        getUserProgress(user.id),
      ])
      setChallenges(challengesData)
      setProgress(progressData)
    } catch (error) {
      console.error('Erro ao carregar desafios:', error)
    } finally {
      setLoading(false)
    }
  }

  const completedCount = challenges.filter(c => c.completed).length
  const totalXP = challenges.reduce((acc, c) => acc + (c.completed ? c.reward.xp : 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
            <h1 className="text-2xl font-bold">Desafios Semanais</h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Complete desafios para ganhar XP e recompensas especiais
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Completos</span>
            </div>
            <p className="text-3xl font-bold">{completedCount}/{challenges.length}</p>
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>XP Ganho</span>
            </div>
            <p className="text-3xl font-bold">{totalXP}</p>
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Nível</span>
            </div>
            <p className="text-3xl font-bold">{progress?.level || 1}</p>
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Tempo</span>
            </div>
            <p className="text-lg font-bold">{getTimeUntilWeekEnd()}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {challenges.length > 0 && (
          <div className="mb-8 p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Progresso da Semana</span>
              <span className="text-sm font-semibold">{Math.round((completedCount / challenges.length) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-background-tertiary)' }}>
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${(completedCount / challenges.length) * 100}%`,
                  background: 'var(--gradient-primary)'
                }}
              />
            </div>
          </div>
        )}

        {/* Challenges Grid */}
        {challenges.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p style={{ color: 'var(--color-text-secondary)' }}>Nenhum desafio disponível</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        )}

        {/* Bonus Message */}
        {completedCount === challenges.length && challenges.length > 0 && (
          <div className="mt-8 p-6 rounded-xl text-center" style={{ background: 'var(--gradient-primary)' }}>
            <Trophy className="w-12 h-12 mx-auto mb-3 text-white" />
            <h3 className="text-xl font-bold text-white mb-2">Parabéns! 🎉</h3>
            <p className="text-white/80">Você completou todos os desafios da semana!</p>
          </div>
        )}

      <Toast
        show={toast.show}
        message={toast.message}
        type="achievement"
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}
