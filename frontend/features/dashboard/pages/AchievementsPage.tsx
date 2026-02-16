import { useEffect, useState } from 'react'
import type { ComponentType, CSSProperties } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Trophy, Lock, BarChart3, Star } from 'lucide-react'
import { reportError } from '@/services/logger.service'
import { ACHIEVEMENTS, getUserProgress, type UserProgress, type Achievement } from '@/services/progress.service'
import { IconMapper } from '@/shared/ui'

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
      reportError('Erro ao carregar progresso:', error)
    } finally {
      setLoading(false)
    }
  }

  const unlockedAchievements = ACHIEVEMENTS.filter((achievement) => progress?.achievements.includes(achievement.id))
  const lockedAchievements = ACHIEVEMENTS.filter((achievement) => !progress?.achievements.includes(achievement.id))

  const totalXPFromAchievements = unlockedAchievements.reduce((sum, achievement) => sum + achievement.xpReward, 0)

  const rarityGradient: Record<Achievement['rarity'], string> = {
    bronze: 'linear-gradient(130deg, rgba(194, 65, 12, 0.2), rgba(249, 115, 22, 0.16))',
    silver: 'linear-gradient(130deg, rgba(148, 163, 184, 0.2), rgba(100, 116, 139, 0.16))',
    gold: 'linear-gradient(130deg, rgba(250, 204, 21, 0.2), rgba(249, 115, 22, 0.16))',
    diamond: 'linear-gradient(130deg, rgba(34, 211, 238, 0.2), rgba(59, 130, 246, 0.16))',
  }

  function AchievementCard({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
    return (
      <article
        className="surface-card relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
        style={{
          background: unlocked ? rarityGradient[achievement.rarity] : 'var(--gradient-surface)',
          borderColor: unlocked ? 'rgba(148, 163, 184, 0.28)' : 'rgba(148, 163, 184, 0.16)',
          opacity: unlocked ? 1 : 0.8,
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
            <span className="rounded-full border px-2 py-1 text-[11px] font-semibold uppercase" style={{ borderColor: 'rgba(148, 163, 184, 0.35)' }}>
              {achievement.rarity}
            </span>
            <span className="rounded-full border px-2 py-1 text-[11px] font-semibold" style={{ borderColor: 'rgba(125, 211, 252, 0.35)', color: 'var(--color-primary)' }}>
              +{achievement.xpReward} XP
            </span>
          </div>
        </div>
      </article>
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="mb-2 flex items-center gap-3">
          <Trophy className="h-7 w-7 text-yellow-400" />
          <h1 className="text-3xl font-bold">Conquistas</h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)' }}>Desbloqueie conquistas e acumule XP extra.</p>
      </header>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="text-center">
            <div
              className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
            />
            <p style={{ color: 'var(--color-text-secondary)' }}>Carregando conquistas...</p>
          </div>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <StatCard icon={Trophy} iconColor="#facc15" label="Desbloqueadas" value={unlockedAchievements.length} />
            <StatCard icon={Lock} iconColor="#94a3b8" label="Bloqueadas" value={lockedAchievements.length} />
            <StatCard
              icon={BarChart3}
              iconColor="var(--color-primary)"
              label="Completude"
              value={`${Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)}%`}
            />
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
        </>
      )}
    </div>
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
    <div className="surface-card rounded-xl border p-4">
      <Icon className="mb-2 h-5 w-5" style={{ color: iconColor }} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
    </div>
  )
}
