import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { GradientCard, Button, IconMapper } from '@/shared/ui'
import { Lock, Check, Medal } from 'lucide-react'
import { reportError } from '@/services/logger.service'
import { getUserProgress, setActiveTitle, type UserProgress } from '@/services/progress.service'
import { TITLES, type Title, getRarityGradient } from '@/services/titles.service'

export function TitlesPage() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlockedTitles, setUnlockedTitles] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      void loadProgress()
    }
  }, [user])

  async function loadProgress() {
    if (!user) return

    try {
      setLoading(true)
      const progressData = await getUserProgress(user.id)
      setProgress(progressData)

      if (progressData) {
        setUnlockedTitles(progressData.unlockedTitles || [])
      }
    } catch (error) {
      reportError('Erro ao carregar progresso:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSetTitle(titleId: string) {
    if (!user || !progress) return

    const isActive = progress.activeTitle === titleId
    const nextActiveTitle = isActive ? null : titleId

    const success = await setActiveTitle(user.id, nextActiveTitle)
    if (success) {
      setProgress({ ...progress, activeTitle: nextActiveTitle })
    }
  }

  const groupedTitles = {
    common: TITLES.filter((title) => title.rarity === 'common'),
    rare: TITLES.filter((title) => title.rarity === 'rare'),
    epic: TITLES.filter((title) => title.rarity === 'epic'),
    legendary: TITLES.filter((title) => title.rarity === 'legendary'),
    mythic: TITLES.filter((title) => title.rarity === 'mythic'),
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--color-text-secondary)' }}>Carregando titulos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="mb-2 flex items-center gap-3">
          <Medal className="h-7 w-7" style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-3xl font-bold">Meus titulos</h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Desbloqueie e equipe titulos especiais para destacar sua identidade.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Desbloqueados" value={unlockedTitles.length} />
        <MetricCard label="Bloqueados" value={TITLES.length - unlockedTitles.length} />
        <MetricCard label="Completude" value={`${Math.round((unlockedTitles.length / TITLES.length) * 100)}%`} />
        <MetricCard label="Nivel atual" value={progress?.level || 1} />
      </section>

      {Object.entries(groupedTitles).map(([rarity, titles]) => (
        <section key={rarity} className="space-y-4">
          <h2 className="text-2xl font-bold capitalize">{rarity} titles</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {titles.map((title) => {
              const isUnlocked = unlockedTitles.includes(title.id)
              const isActive = progress?.activeTitle === title.id

              return (
                <article
                  key={title.id}
                  className={`relative rounded-2xl border p-5 transition-all duration-300 ${
                    isUnlocked ? 'hover:-translate-y-1 hover:shadow-2xl' : 'opacity-80'
                  }`}
                  style={{
                    background: getRarityGradient(title.rarity as Title['rarity']),
                    borderColor: isActive ? `${title.color}8C` : `${title.color}4D`,
                  }}
                >
                  {isActive && (
                    <div className="absolute right-3 top-3 rounded-lg border px-2 py-1 text-xs font-bold" style={{ borderColor: 'rgba(52, 211, 153, 0.5)', color: '#34d399', background: 'rgba(6, 95, 70, 0.35)' }}>
                      Ativo
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-3">
                      <IconMapper icon={title.icon} size={46} />
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: title.color }}>
                          {title.name}
                        </h3>
                        <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                          {title.rarity}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {title.description}
                    </p>
                  </div>

                  <div className="mb-4 rounded-xl border p-3" style={{ borderColor: `${title.color}4D`, background: 'rgba(2, 6, 23, 0.35)' }}>
                    <p className="mb-1 text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                      Requisito
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                      {title.requirement.description}
                    </p>
                  </div>

                  {isUnlocked ? (
                    <Button
                      onClick={() => void handleSetTitle(title.id)}
                      variant={isActive ? 'secondary' : 'primary'}
                      size="sm"
                      className="w-full"
                      icon={isActive ? <Check className="h-4 w-4" /> : undefined}
                    >
                      {isActive ? 'Remover titulo' : 'Equipar titulo'}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-lg border py-2" style={{ borderColor: 'rgba(148, 163, 184, 0.3)', color: 'var(--color-text-secondary)' }}>
                      <Lock className="h-4 w-4" />
                      <span className="text-sm font-semibold">Bloqueado</span>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string | number
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <GradientCard hover className="rounded-xl border p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
    </GradientCard>
  )
}
