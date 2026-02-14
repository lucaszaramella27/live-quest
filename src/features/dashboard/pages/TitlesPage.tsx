import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { GradientCard, Button, IconMapper } from '@/shared/ui'
import { Lock, Check, Medal } from 'lucide-react'
import { getUserProgress, setActiveTitle, type UserProgress } from '@/services/progress.service'
import { TITLES, Title, getRarityGradient } from '@/services/titles.service'

export function TitlesPage() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlockedTitles, setUnlockedTitles] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadProgress()
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
      console.error('Erro ao carregar progresso:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSetTitle(titleId: string) {
    if (!user || !progress) return
    
    const isActive = progress.activeTitle === titleId
    const newActiveTitle = isActive ? null : titleId
    
    const success = await setActiveTitle(user.id, newActiveTitle)
    if (success) {
      setProgress({ ...progress, activeTitle: newActiveTitle })
    }
  }

  const groupedTitles = {
    common: TITLES.filter(t => t.rarity === 'common'),
    rare: TITLES.filter(t => t.rarity === 'rare'),
    epic: TITLES.filter(t => t.rarity === 'epic'),
    legendary: TITLES.filter(t => t.rarity === 'legendary'),
    mythic: TITLES.filter(t => t.rarity === 'mythic')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando títulos...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Medal className="w-8 h-8 text-brand-purple" />
          <h1 className="text-3xl font-bold">Meus Títulos</h1>
        </div>
        <p className="text-gray-400 mt-2">Desbloqueie e equipe títulos especiais</p>
      </div>

      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GradientCard hover>
            <div className="text-center">
              <p className="text-3xl font-bold">{unlockedTitles.length}</p>
              <p className="text-sm text-gray-400">Desbloqueados</p>
            </div>
          </GradientCard>
          <GradientCard hover>
            <div className="text-center">
              <p className="text-3xl font-bold">{TITLES.length - unlockedTitles.length}</p>
              <p className="text-sm text-gray-400">Bloqueados</p>
            </div>
          </GradientCard>
          <GradientCard hover>
            <div className="text-center">
              <p className="text-3xl font-bold">{Math.round((unlockedTitles.length / TITLES.length) * 100)}%</p>
              <p className="text-sm text-gray-400">Completado</p>
            </div>
          </GradientCard>
          <GradientCard hover>
            <div className="text-center">
              <p className="text-3xl font-bold">{progress?.level || 1}</p>
              <p className="text-sm text-gray-400">Nível Atual</p>
            </div>
          </GradientCard>
        </div>

        {/* Title Groups */}
        {Object.entries(groupedTitles).map(([rarity, titles]) => (
          <div key={rarity} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 capitalize">{rarity} Titles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {titles.map((title) => {
                const isUnlocked = unlockedTitles.includes(title.id)
                const isActive = progress?.activeTitle === title.id

                return (
                  <div 
                    key={title.id}
                    className={`relative rounded-xl p-5 transition-all duration-300 bg-gradient-to-br ${getRarityGradient(title.rarity as Title['rarity'])} ${!isUnlocked ? 'opacity-60' : 'hover:scale-105 hover:rotate-1 hover:shadow-[0_0_25px_currentColor]'}`}
                    style={{ color: title.color }}
                  >
                    {/* Active Badge */}
                    {isActive && (
                      <div className="absolute top-3 right-3">
                        <div className="px-2 py-1 bg-green-500/20 border border-green-500/40 rounded-lg flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-bold text-green-500">ATIVO</span>
                        </div>
                      </div>
                    )}

                    {/* Title Info */}
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <IconMapper icon={title.icon} size={48} />
                        <div>
                          <h3 className="text-xl font-bold" style={{ color: title.color }}>
                            {title.name}
                          </h3>
                          <p className="text-xs text-gray-400 uppercase tracking-wider">{title.rarity}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{title.description}</p>
                    </div>

                    {/* Requirement */}
                    <div className="mb-4 p-3 bg-black/20 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Requisito:</p>
                      <p className="text-sm">{title.requirement.description}</p>
                    </div>

                    {/* Action Button */}
                    {isUnlocked ? (
                      <Button
                        onClick={() => handleSetTitle(title.id)}
                        variant={isActive ? 'secondary' : 'primary'}
                        size="sm"
                        className="w-full"
                      >
                        {isActive ? 'Remover' : 'Equipar'}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-2 text-gray-500">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm font-semibold">Bloqueado</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
