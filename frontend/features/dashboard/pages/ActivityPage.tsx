import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { GradientCard, StreakCalendar } from '@/shared/ui'
import { Award, Calendar, Flame, TrendingUp } from 'lucide-react'
import { reportError } from '@/services/logger.service'
import { getUserStreak, type Streak } from '@/services/streaks.service'
import { getUserProgress, type UserProgress } from '@/services/progress.service'
import { formatActivityForCalendar, getUserActivity } from '@/services/activity.service'

export function ActivityPage() {
  const { user } = useAuth()
  const [streak, setStreak] = useState<Streak | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [activityData, setActivityData] = useState<Array<{ date: string; count: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      void loadData()
    }
  }, [user])

  async function loadData() {
    if (!user) return

    try {
      setLoading(true)
      const [streakData, progressData, activities] = await Promise.all([
        getUserStreak(user.id),
        getUserProgress(user.id),
        getUserActivity(user.id, 84),
      ])
      setStreak(streakData)
      setProgress(progressData)
      setActivityData(formatActivityForCalendar(activities, 84))
    } catch (error) {
      reportError('activity_page_load_data', error)
    } finally {
      setLoading(false)
    }
  }

  const activeDays = activityData.filter((day) => day.count > 0).length

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
            <Calendar className="h-4 w-4" />
            Consistencia
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">Atividade</h1>
          <p className="mt-3 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Acompanhe seu historico de execucao diaria e mantenha o ritmo nas proximas semanas.
          </p>
        </div>
      </GradientCard>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Flame className="h-4 w-4 text-amber-300" />}
          label="Streak atual"
          value={streak?.currentStreak || 0}
          helper="dias consecutivos"
        />
        <StatCard
          icon={<Award className="h-4 w-4 text-yellow-300" />}
          label="Maior streak"
          value={streak?.longestStreak || 0}
          helper="seu recorde"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-cyan-200" />}
          label="Nivel"
          value={progress?.level || 1}
          helper="atual"
        />
        <StatCard
          icon={<Calendar className="h-4 w-4 text-indigo-200" />}
          label="Dias ativos"
          value={activeDays}
          helper="ultimos 84 dias"
        />
      </section>

      <GradientCard hover={false} className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Historico de atividade</h2>
          <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: 'rgba(139, 161, 203, 0.3)', color: 'var(--color-text-secondary)' }}>
            12 semanas
          </span>
        </div>

        <StreakCalendar data={activityData} />
      </GradientCard>

      {streak && streak.currentStreak > 0 && (
        <div className="glass rounded-2xl border p-5 text-center">
          <p className="text-base font-semibold sm:text-lg">
            {streak.currentStreak >= 30
              ? 'Excelente ritmo. Voce passou de 30 dias de consistencia.'
              : streak.currentStreak >= 7
                ? 'Boa sequencia. Voce concluiu sua primeira semana consistente.'
                : `${7 - streak.currentStreak} dias para fechar sua primeira semana de streak.`}
          </p>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  icon: ReactNode
  label: string
  value: number
  helper: string
}

function StatCard({ icon, label, value, helper }: StatCardProps) {
  return (
    <div className="glass rounded-2xl border p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
        {icon}
        {label}
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {helper}
      </p>
    </div>
  )
}
