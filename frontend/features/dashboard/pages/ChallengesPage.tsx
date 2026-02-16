import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { ChallengeCard, Toast } from '@/shared/ui'
import { Trophy, Clock, CheckCircle, Star } from 'lucide-react'
import {
  getWeeklyChallenges,
  claimWeeklyChallengeReward,
  getTimeUntilWeekEnd,
  type Challenge,
} from '@/services/challenges.service'
import { reportError } from '@/services/logger.service'

export function ChallengesPage() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'streak' | 'goal' | 'task' | 'achievement' | 'error'
  }>({ show: false, message: '', type: 'success' })

  useEffect(() => {
    if (user) {
      void loadData()
    }
  }, [user])

  async function loadData() {
    if (!user) return

    try {
      setLoading(true)
      const weekly = await getWeeklyChallenges()
      setChallenges(weekly.challenges)
    } catch (error) {
      reportError('Erro ao carregar desafios:', error)
      setToast({
        show: true,
        message: 'Erro ao carregar desafios semanais',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleClaimChallenge(challengeId: string) {
    if (!user) return

    try {
      setClaimingId(challengeId)
      const result = await claimWeeklyChallengeReward(challengeId)

      if (!result.success) {
        setToast({
          show: true,
          message: 'Nao foi possivel resgatar esse desafio agora.',
          type: 'error',
        })
        return
      }

      if (result.challenge) {
        setChallenges((current) =>
          current.map((challenge) =>
            challenge.id === result.challenge!.id ? result.challenge! : challenge
          )
        )
      }

      if (result.achievements.length > 0) {
        setToast({
          show: true,
          message: `Desafio resgatado + ${result.achievements.length} conquista(s) desbloqueada(s)!`,
          type: 'achievement',
        })
      } else {
        setToast({
          show: true,
          message: 'Recompensa do desafio resgatada com sucesso!',
          type: 'success',
        })
      }
    } catch (error) {
      reportError('Erro ao resgatar desafio:', error)
      setToast({
        show: true,
        message: 'Erro ao resgatar recompensa do desafio',
        type: 'error',
      })
    } finally {
      setClaimingId(null)
    }
  }

  const completedCount = challenges.filter((challenge) => challenge.completed).length
  const claimedCount = challenges.filter((challenge) => challenge.claimedAt).length
  const totalXP = challenges.reduce((acc, challenge) => acc + (challenge.claimedAt ? challenge.reward.xp : 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-bold">Desafios Semanais</h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Complete e resgate recompensas semanais para acelerar seu progresso.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Concluidos</span>
          </div>
          <p className="text-3xl font-bold">{completedCount}/{challenges.length}</p>
        </div>

        <div className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>XP Resgatado</span>
          </div>
          <p className="text-3xl font-bold">{totalXP}</p>
        </div>

        <div className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Resgatados</span>
          </div>
          <p className="text-3xl font-bold">{claimedCount}</p>
        </div>

        <div className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Tempo</span>
          </div>
          <p className="text-lg font-bold">{getTimeUntilWeekEnd()}</p>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p style={{ color: 'var(--color-text-secondary)' }}>Nenhum desafio disponivel para esta semana</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onClaim={handleClaimChallenge}
              claiming={claimingId === challenge.id}
            />
          ))}
        </div>
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, show: false }))}
      />
    </div>
  )
}



