import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { ChallengeCard, GradientCard, Toast } from '@/shared/ui'
import { CheckCircle, Clock, Star, Trophy } from 'lucide-react'
import {
  claimWeeklyChallengeReward,
  getTimeUntilWeekEnd,
  getWeeklyChallenges,
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
      reportError('challenges_page_load_data', error)
      setToast({ show: true, message: 'Erro ao carregar desafios semanais.', type: 'error' })
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
        setToast({ show: true, message: 'Nao foi possivel resgatar esse desafio agora.', type: 'error' })
        return
      }

      if (result.challenge) {
        setChallenges((current) => current.map((challenge) => (challenge.id === result.challenge!.id ? result.challenge! : challenge)))
      }

      if (result.achievements.length > 0) {
        setToast({
          show: true,
          message: `Desafio resgatado e ${result.achievements.length} conquista(s) desbloqueada(s).`,
          type: 'achievement',
        })
      } else {
        setToast({ show: true, message: 'Recompensa do desafio resgatada com sucesso.', type: 'success' })
      }
    } catch (error) {
      reportError('challenges_page_claim_reward', error)
      setToast({ show: true, message: 'Erro ao resgatar recompensa do desafio.', type: 'error' })
    } finally {
      setClaimingId(null)
    }
  }

  const completedCount = challenges.filter((challenge) => challenge.completed).length
  const claimedCount = challenges.filter((challenge) => challenge.claimedAt).length
  const totalXP = challenges.reduce((acc, challenge) => acc + (challenge.claimedAt ? challenge.reward.xp : 0), 0)

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <GradientCard hover={false} className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-90" style={{ background: 'var(--gradient-overlay)' }} />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(94, 247, 226, 0.3)', color: '#b9fff9' }}>
            <Trophy className="h-4 w-4" />
            Weekly rewards
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">Desafios semanais</h1>
          <p className="mt-3 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Complete desafios, resgate XP e aumente a velocidade do seu progresso.
          </p>
        </div>
      </GradientCard>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={<CheckCircle className="h-4 w-4 text-cyan-200" />} label="Concluidos" value={`${completedCount}/${challenges.length}`} />
        <StatCard icon={<Star className="h-4 w-4 text-amber-300" />} label="XP resgatado" value={totalXP.toLocaleString()} />
        <StatCard icon={<Trophy className="h-4 w-4 text-indigo-200" />} label="Resgatados" value={claimedCount} />
        <StatCard icon={<Clock className="h-4 w-4 text-emerald-300" />} label="Tempo restante" value={getTimeUntilWeekEnd()} />
      </section>

      {challenges.length === 0 ? (
        <GradientCard hover={false} className="p-12 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 opacity-40" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="font-semibold">Nenhum desafio disponivel para esta semana.</p>
        </GradientCard>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onClaim={handleClaimChallenge}
              claiming={claimingId === challenge.id}
            />
          ))}
        </section>
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

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="glass rounded-2xl border p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
