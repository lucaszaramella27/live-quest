import { useEffect, useState, type CSSProperties, type ComponentType } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { GradientCard, IconMapper } from '@/shared/ui'
import { BarChart3, Lock, Star, Trophy } from 'lucide-react'
import { ACHIEVEMENTS, getUserProgress, type Achievement, type UserProgress } from '@/services/progress.service'
import { reportError } from '@/services/logger.service'

export function AchievementsPage() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadProgress()
  }, [user])

  async function loadProgress() {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await getUserProgress(user.id)
      setProgress(data)
    } catch (error) {
      reportError('achievements_page_load_progress', error)
    } finally {
      setLoading(false)
    }
  }

  const unlockedAchievements = ACHIEVEMENTS.filter((achievement) => progress?.achievements.includes(achievement.id))
  const lockedAchievements = ACHIEVEMENTS.filter((achievement) => !progress?.achievements.includes(achievement.id))
  const completion = Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)
  const totalXPFromAchievements = unlockedAchievements.reduce((sum, achievement) => sum + achievement.xpReward, 0)

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
            Progress system
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">Conquistas</h1>
          <p className="mt-3 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Desbloqueie marcos do produto e converta consistencia em XP extra.
          </p>
        </div>
      </GradientCard>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Trophy} iconColor="#facc15" label="Desbloqueadas" value={unlockedAchievements.length} />
        <StatCard icon={Lock} iconColor="#94a3b8" label="Bloqueadas" value={lockedAchievements.length} />
        <StatCard icon={BarChart3} iconColor="var(--color-primary)" label="Completude" value={`${completion}%`} />
        <StatCard icon={Star} iconColor="#fb923c" label="XP ganho" value={totalXPFromAchievements.toLocaleString()} />
      </section>

      {unlockedAchievements.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold">Desbloqueadas ({unlockedAchievements.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {unlockedAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} unlocked />
            ))}
          </div>
        </section>
      )}

      {lockedAchievements.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold">Bloqueadas ({lockedAchievements.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {lockedAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} unlocked={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function AchievementCard({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
  const rarityGradient: Record<Achievement['rarity'], string> = {
    bronze: 'linear-gradient(130deg, rgba(194, 65, 12, 0.2), rgba(249, 115, 22, 0.16))',
    silver: 'linear-gradient(130deg, rgba(148, 163, 184, 0.2), rgba(100, 116, 139, 0.16))',
    gold: 'linear-gradient(130deg, rgba(250, 204, 21, 0.2), rgba(249, 115, 22, 0.16))',
    diamond: 'linear-gradient(130deg, rgba(94, 247, 226, 0.2), rgba(143, 161, 255, 0.16))',
  }

  return (
    <article
      className="surface-card relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
      style={{
        background: unlocked ? rarityGradient[achievement.rarity] : 'var(--gradient-surface)',
        borderColor: unlocked ? 'rgba(139, 161, 203, 0.28)' : 'rgba(139, 161, 203, 0.18)',
        opacity: unlocked ? 1 : 0.84,
      }}
    >
      {!unlocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/45 backdrop-blur-[1px]">
          <Lock className="h-7 w-7" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      )}

      <div className="text-center">
        <div className="mb-3 flex justify-center">
          <IconMapper icon={achievement.icon} size={54} />
        </div>
        <h3 className="mb-1 text-lg font-bold">{achievement.name}</h3>
        <p className="mb-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {achievement.description}
        </p>

        <div className="flex items-center justify-center gap-2">
          <span className="rounded-full border px-2 py-1 text-[11px] font-semibold uppercase" style={{ borderColor: 'rgba(139, 161, 203, 0.35)' }}>
            {achievement.rarity}
          </span>
          <span className="rounded-full border px-2 py-1 text-[11px] font-semibold" style={{ borderColor: 'rgba(94, 247, 226, 0.35)', color: 'var(--color-primary)' }}>
            +{achievement.xpReward} XP
          </span>
        </div>
      </div>
    </article>
  )
}

interface StatCardProps {
  icon: ComponentType<{ className?: string; style?: CSSProperties }>
  iconColor: string
  label: string
  value: string | number
}

function StatCard({ icon: Icon, iconColor, label, value }: StatCardProps) {
  return (
    <div className="glass rounded-xl border p-4">
      <Icon className="mb-2 h-5 w-5" style={{ color: iconColor }} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
    </div>
  )
}
