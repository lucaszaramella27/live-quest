import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Trophy, Lock } from 'lucide-react'
import { ACHIEVEMENTS, getUserProgress, type UserProgress, type Achievement } from '@/services/progress.service'

export function AchievementsPage() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgress()
  }, [user])

  async function loadProgress() {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const data = await getUserProgress(user.id)
      setProgress(data)
    } catch (error) {
      console.error('Erro ao carregar progresso:', error)
    } finally {
      setLoading(false)
    }
  }

  const unlockedAchievements = ACHIEVEMENTS.filter(a => 
    progress?.achievements.includes(a.id)
  )
  
  const lockedAchievements = ACHIEVEMENTS.filter(a => 
    !progress?.achievements.includes(a.id)
  )

  const totalXPFromAchievements = unlockedAchievements.reduce((sum, a) => sum + a.xpReward, 0)

  const rarityColors = {
    bronze: 'from-orange-700 to-orange-500',
    silver: 'from-gray-500 to-gray-300',
    gold: 'from-yellow-600 to-yellow-400',
    diamond: 'from-cyan-500 to-blue-500'
  }

  const rarityGlow = {
    bronze: 'shadow-orange-500/20',
    silver: 'shadow-gray-400/20',
    gold: 'shadow-yellow-500/30',
    diamond: 'shadow-cyan-500/40'
  }

  function AchievementCard({ achievement, unlocked }: { achievement: Achievement; unlocked: boolean }) {
    return (
      <div 
        className={`relative p-6 rounded-2xl border transition-all duration-300 ${
          unlocked 
            ? `bg-gradient-to-br ${rarityColors[achievement.rarity]} shadow-lg ${rarityGlow[achievement.rarity]}`
            : 'bg-brand-dark-secondary/50 border-white/5 opacity-60'
        }`}
      >
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl backdrop-blur-sm">
            <Lock className="w-8 h-8 text-gray-500" />
          </div>
        )}
        
        <div className="text-center">
          <div className="text-5xl mb-3">{achievement.icon}</div>
          <h3 className="font-bold text-lg mb-1">{achievement.name}</h3>
          <p className="text-sm text-gray-300 mb-3">{achievement.description}</p>
          
          <div className="flex items-center justify-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              unlocked ? 'bg-black/30' : 'bg-white/10'
            }`}>
              {achievement.rarity.toUpperCase()}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              unlocked ? 'bg-black/30' : 'bg-white/10'
            }`}>
              +{achievement.xpReward} XP
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">Conquistas</h1>
        </div>
        <p className="text-gray-400 mt-2">Desbloqueie conquistas e ganhe XP</p>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Carregando conquistas...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-brand-dark-secondary/50 border border-white/5 rounded-xl p-6 text-center">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-3xl font-bold">{unlockedAchievements.length}</p>
                <p className="text-sm text-gray-400">Desbloqueadas</p>
              </div>
              
              <div className="bg-brand-dark-secondary/50 border border-white/5 rounded-xl p-6 text-center">
                <Lock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-3xl font-bold">{lockedAchievements.length}</p>
                <p className="text-sm text-gray-400">Bloqueadas</p>
              </div>
              
              <div className="bg-brand-dark-secondary/50 border border-white/5 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-3xl font-bold">{Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100)}%</p>
                <p className="text-sm text-gray-400">Completude</p>
              </div>
              
              <div className="bg-brand-dark-secondary/50 border border-white/5 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">⭐</div>
                <p className="text-3xl font-bold">{totalXPFromAchievements.toLocaleString()}</p>
                <p className="text-sm text-gray-400">XP Total</p>
              </div>
            </div>

            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Desbloqueadas ({unlockedAchievements.length})
                </h2>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {unlockedAchievements.map(achievement => (
                    <AchievementCard 
                      key={achievement.id} 
                      achievement={achievement} 
                      unlocked={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-gray-500" />
                  Bloqueadas ({lockedAchievements.length})
                </h2>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {lockedAchievements.map(achievement => (
                    <AchievementCard 
                      key={achievement.id} 
                      achievement={achievement} 
                      unlocked={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
