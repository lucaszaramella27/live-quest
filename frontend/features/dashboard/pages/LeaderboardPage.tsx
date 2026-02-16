import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { GradientCard } from '@/shared/ui'
import { Trophy, Medal, Award, Users, Crown } from 'lucide-react'
import { TitleBadge } from '@/shared/ui/TitleBadge'
import { getTitleById } from '@/services/titles.service'
import { subscribeToLeaderboard, type LeaderboardUser } from '@/services/leaderboard.service'

type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime'

export function LeaderboardPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly')
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<number>(-1)

  useEffect(() => {
    setLoading(true)

    const unsubscribe = subscribeToLeaderboard(period, (data) => {
      setLeaderboard(data)
      setLoading(false)

      if (user) {
        const userIndex = data.findIndex((entry) => entry.id === user.id)
        setUserRank(userIndex >= 0 ? userIndex + 1 : -1)
      }
    })

    return () => unsubscribe()
  }, [period, user])

  function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-400" />
    if (rank === 2) return <Medal className="h-6 w-6 text-slate-300" />
    if (rank === 3) return <Award className="h-6 w-6 text-orange-400" />
    return <span className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>#{rank}</span>
  }

  function getPeriodXP(entry: LeaderboardUser) {
    if (period === 'weekly') return entry.weeklyXP
    if (period === 'monthly') return entry.monthlyXP
    return entry.xp
  }

  function getRankSurface(rank: number): string {
    if (rank === 1) return 'linear-gradient(130deg, rgba(250, 204, 21, 0.18), rgba(249, 115, 22, 0.14))'
    if (rank === 2) return 'linear-gradient(130deg, rgba(148, 163, 184, 0.2), rgba(100, 116, 139, 0.16))'
    if (rank === 3) return 'linear-gradient(130deg, rgba(251, 146, 60, 0.18), rgba(245, 158, 11, 0.14))'
    return 'var(--gradient-surface)'
  }

  function getPeriodLabel() {
    if (period === 'weekly') return 'semanal'
    if (period === 'monthly') return 'mensal'
    return 'geral'
  }

  const topThree = leaderboard.slice(0, 3)

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Users className="h-7 w-7" style={{ color: 'var(--color-primary)' }} />
            <h1 className="text-3xl font-bold">Ranking</h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Veja sua posicao entre os streamers mais consistentes da plataforma.
          </p>
        </div>

        {userRank > 0 && (
          <div className="surface-card rounded-xl px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              Sua posicao
            </p>
            <p className="text-3xl font-bold text-gradient">#{userRank}</p>
          </div>
        )}
      </header>

      <div className="inline-flex gap-2 rounded-xl border p-1" style={{ background: 'rgba(15, 23, 42, 0.6)', borderColor: 'rgba(148, 163, 184, 0.25)' }}>
        {(
          [
            { id: 'weekly', label: 'Semanal' },
            { id: 'monthly', label: 'Mensal' },
            { id: 'alltime', label: 'Geral' },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setPeriod(option.id)}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300"
            style={
              period === option.id
                ? {
                    background: 'var(--gradient-primary)',
                    color: '#04111f',
                    boxShadow: '0 12px 24px -18px rgba(34, 211, 238, 0.85)',
                  }
                : {
                    color: 'var(--color-text-secondary)',
                  }
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <div className="text-center">
            <div
              className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
            />
            <p style={{ color: 'var(--color-text-secondary)' }}>Carregando ranking...</p>
          </div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="surface-card rounded-2xl p-10 text-center">
          <Trophy className="mx-auto mb-3 h-12 w-12" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-lg font-semibold">Ranking ainda sem dados</p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Comece a ganhar XP para aparecer no topo.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {topThree.map((entry, index) => {
              const rank = index + 1
              const title = entry.activeTitle ? getTitleById(entry.activeTitle) : null

              return (
                <GradientCard
                  key={entry.id}
                  className={`relative overflow-hidden border p-5 ${rank === 1 ? 'md:-mt-2 md:scale-[1.02]' : ''}`}
                  style={{
                    background: getRankSurface(rank),
                    borderColor: rank === 1 ? 'rgba(250, 204, 21, 0.35)' : 'rgba(148, 163, 184, 0.2)',
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    {getRankIcon(rank)}
                    {entry.isPremium && <Crown className="h-4 w-4 text-yellow-400" />}
                  </div>

                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border text-lg font-bold" style={{ borderColor: 'rgba(148, 163, 184, 0.35)' }}>
                      {entry.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold" style={{ color: 'var(--color-text)' }}>{entry.name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Nivel {entry.level}</p>
                    </div>
                  </div>

                  {title && <TitleBadge title={title} size="sm" className="mb-3" />}

                  <p className="text-2xl font-bold text-gradient">{getPeriodXP(entry)} XP</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Periodo {getPeriodLabel()}
                  </p>
                </GradientCard>
              )
            })}
          </section>

          <section className="surface-card rounded-2xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Ranking completo</h2>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                Ordenado por XP {getPeriodLabel()}
              </p>
            </div>

            <div className="space-y-3">
              {leaderboard.map((entry, index) => {
                const rank = index + 1
                const title = entry.activeTitle ? getTitleById(entry.activeTitle) : null

                return (
                  <div
                    key={entry.id}
                    className="rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                    style={{
                      background: rank <= 3 ? getRankSurface(rank) : 'rgba(15, 23, 42, 0.52)',
                      borderColor: rank <= 3 ? 'rgba(148, 163, 184, 0.26)' : 'rgba(148, 163, 184, 0.14)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center">{getRankIcon(rank)}</div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold" style={{ borderColor: 'rgba(148, 163, 184, 0.32)' }}>
                          {entry.name[0]}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold" style={{ color: 'var(--color-text)' }}>{entry.name}</p>
                            {entry.isPremium && <Crown className="h-4 w-4 text-yellow-400" />}
                            {title && <TitleBadge title={title} size="sm" />}
                          </div>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Nivel {entry.level}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-gradient">{getPeriodXP(entry)} XP</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Total {entry.xp} XP</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
