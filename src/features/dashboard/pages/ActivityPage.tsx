import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { StreakCalendar } from '@/shared/ui'
import { Calendar, Flame, TrendingUp, Award } from 'lucide-react'
import { getUserStreak, type Streak } from '@/services/streaks.service'
import { getUserProgress, type UserProgress } from '@/services/progress.service'
import { getUserActivity, formatActivityForCalendar } from '@/services/activity.service'
import { applyTheme, loadSavedTheme } from '@/services/themes.service'

export function ActivityPage() {
  const { user } = useAuth()
  const [streak, setStreak] = useState<Streak | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [activityData, setActivityData] = useState<Array<{ date: string; count: number }>>([])
  const [loading, setLoading] = useState(true)

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
      const [streakData, progressData, activities] = await Promise.all([
        getUserStreak(user.id),
        getUserProgress(user.id),
        getUserActivity(user.id, 84) // Últimos 84 dias (12 semanas)
      ])
      setStreak(streakData)
      setProgress(progressData)
      setActivityData(formatActivityForCalendar(activities, 84))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

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
            <Calendar className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
            <h1 className="text-2xl font-bold">Atividade</h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Acompanhe sua consistência e histórico de produtividade
          </p>
        </div>

        {/* Streak Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Streak Atual</span>
            </div>
            <p className="text-3xl font-bold">{streak?.currentStreak || 0}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>dias consecutivos</p>
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Maior Streak</span>
            </div>
            <p className="text-3xl font-bold">{streak?.longestStreak || 0}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>seu recorde</p>
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Nível</span>
            </div>
            <p className="text-3xl font-bold">{progress?.level || 1}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>atual</p>
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Dias Ativos</span>
            </div>
            <p className="text-3xl font-bold">{activityData.filter(d => d.count > 0).length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>últimos 84 dias</p>
          </div>
        </div>

        {/* Activity Calendar */}
        <section className="rounded-xl p-6" style={{ background: 'var(--color-background-secondary)' }}>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-semibold">Histórico de Atividade</h2>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-background-tertiary)', color: 'var(--color-text-secondary)' }}>
              Últimas 12 semanas
            </span>
          </div>
          
          <StreakCalendar data={activityData} />
          
          <div className="flex items-center justify-end gap-2 mt-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span>Menos</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div key={level} className={`w-3 h-3 rounded-sm activity-${level}`} />
              ))}
            </div>
            <span>Mais</span>
          </div>
        </section>

        {/* Motivational Message */}
        {streak && streak.currentStreak > 0 && (
          <div className="mt-6 p-4 rounded-xl text-center" style={{ background: 'var(--color-background-secondary)' }}>
            <p className="text-lg">
              {streak.currentStreak >= 30 
                ? '🔥 Incrível! 30+ dias de streak! Você é imparável!'
                : streak.currentStreak >= 7
                ? '💪 Uma semana de streak! Continue assim!'
                : `🎯 ${7 - streak.currentStreak} dias para completar sua primeira semana!`
              }
            </p>
          </div>
        )}
    </div>
  )
}
