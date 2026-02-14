import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { GradientCard, Toast } from '@/shared/ui'
import { Trophy, Medal, Award, Users, Crown } from 'lucide-react'
import { TitleBadge } from '@/shared/ui/TitleBadge'
import { getTitleById } from '@/services/titles.service'
import { subscribeToLeaderboard, type LeaderboardUser } from '@/services/leaderboard.service'

export function LeaderboardPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('weekly')
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<number>(-1)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  // Listener em tempo real para o leaderboard
  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToLeaderboard(period, (data) => {
      setLeaderboard(data)
      setLoading(false)
      
      // Atualizar rank do usuário quando leaderboard mudar
      if (user) {
        const userIndex = data.findIndex(u => u.id === user.id)
        setUserRank(userIndex >= 0 ? userIndex + 1 : -1)
      }
    })
    
    return () => unsubscribe()
  }, [period, user])

  function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />
    return <span className="text-lg font-bold text-gray-500">#{rank}</span>
  }

  function getRankBg(rank: number) {
    if (rank === 1) return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/40'
    if (rank === 2) return 'from-gray-400/20 to-gray-500/20 border-gray-400/40'
    if (rank === 3) return 'from-amber-600/20 to-amber-700/20 border-amber-600/40'
    return 'from-white/5 to-white/10 border-white/10'
  }

  function getXPForPeriod(user: LeaderboardUser) {
    if (period === 'weekly') return user.weeklyXP
    if (period === 'monthly') return user.monthlyXP
    return user.xp
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-brand-purple" />
              <h1 className="text-3xl font-bold">Ranking</h1>
            </div>
            <p className="text-gray-400 mt-2">Veja como você se compara com outros streamers</p>
          </div>
          {userRank > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-400">Sua posição</p>
              <p className="text-3xl font-bold text-gradient-animated">#{userRank}</p>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando ranking...</p>
          </div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg mb-2">Nenhum usuário no ranking ainda</p>
          <p className="text-gray-500 text-sm">Seja o primeiro a ganhar XP e aparecer aqui!</p>
        </div>
      ) : (
      <div className="space-y-8">
        {/* Period Selector */}
        <div className="flex gap-2 mb-8 justify-center">
          <button
            onClick={() => setPeriod('weekly')}
            className={`
              px-6 py-3 rounded-xl font-semibold transition-all duration-300
              ${period === 'weekly'
                ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white scale-105'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }
            `}
          >
            Semanal
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`
              px-6 py-3 rounded-xl font-semibold transition-all duration-300
              ${period === 'monthly'
                ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white scale-105'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }
            `}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriod('alltime')}
            className={`
              px-6 py-3 rounded-xl font-semibold transition-all duration-300
              ${period === 'alltime'
                ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white scale-105'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }
            `}
          >
            Geral
          </button>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto">
          {/* 2nd Place */}
          {leaderboard[1] && (
            <GradientCard className="order-1 mt-8 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl">
              <div className="text-center p-6">
                <Medal className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-400/20 to-gray-500/20 mx-auto mb-3 flex items-center justify-center text-3xl">
                  {leaderboard[1].name[0]}
                </div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="font-bold">{leaderboard[1].name}</h3>
                  {leaderboard[1].isPremium && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-2">Nível {leaderboard[1].level}</p>
                {leaderboard[1].activeTitle && getTitleById(leaderboard[1].activeTitle) && (
                  <TitleBadge title={getTitleById(leaderboard[1].activeTitle)!} size="sm" className="mb-2" />
                )}
                <p className="text-2xl font-bold text-gray-400">{getXPForPeriod(leaderboard[1])} XP</p>
              </div>
            </GradientCard>
          )}

          {/* 1st Place */}
          {leaderboard[0] && (
            <GradientCard className="order-2 transition-all duration-300 hover:scale-110 hover:-translate-y-3 hover:shadow-[0_0_50px_rgba(234,179,8,0.4)]">
              <div className="text-center p-6">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3 animate-bounce" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 mx-auto mb-3 flex items-center justify-center text-4xl border-4 border-yellow-500/40">
                  {leaderboard[0].name[0]}
                </div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="font-bold text-xl">{leaderboard[0].name}</h3>
                  {leaderboard[0].isPremium && (
                    <Crown className="w-5 h-5 text-yellow-500 animate-pulse" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-2">Nível {leaderboard[0].level}</p>
                {leaderboard[0].activeTitle && getTitleById(leaderboard[0].activeTitle) && (
                  <TitleBadge title={getTitleById(leaderboard[0].activeTitle)!} size="md" className="mb-2" />
                )}
                <p className="text-3xl font-bold text-yellow-500">{getXPForPeriod(leaderboard[0])} XP</p>
              </div>
            </GradientCard>
          )}

          {/* 3rd Place */}
          {leaderboard[2] && (
            <GradientCard className="order-3 mt-8 transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-xl">
              <div className="text-center p-6">
                <Award className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600/20 to-amber-700/20 mx-auto mb-3 flex items-center justify-center text-3xl">
                  {leaderboard[2].name[0]}
                </div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="font-bold">{leaderboard[2].name}</h3>
                  {leaderboard[2].isPremium && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-2">Nível {leaderboard[2].level}</p>
                {leaderboard[2].activeTitle && getTitleById(leaderboard[2].activeTitle) && (
                  <TitleBadge title={getTitleById(leaderboard[2].activeTitle)!} size="sm" className="mb-2" />
                )}
                <p className="text-2xl font-bold text-amber-600">{getXPForPeriod(leaderboard[2])} XP</p>
              </div>
            </GradientCard>
          )}
        </div>

        {/* Full Leaderboard */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Ranking Completo</h2>
          <div className="space-y-3">
            {leaderboard.map((user, index) => (
              <div
                key={user.id}
                className={`
                  p-4 rounded-xl bg-gradient-to-br ${getRankBg(index + 1)} border
                  hover:scale-[1.02] hover:shadow-xl transition-all duration-300
                  ${index < 3 ? 'hover:shadow-purple-500/30' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 flex items-center justify-center text-xl font-bold">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{user.name}</h3>
                        {user.isPremium && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        {user.activeTitle && getTitleById(user.activeTitle) && (
                          <TitleBadge title={getTitleById(user.activeTitle)!} size="sm" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400">Nível {user.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gradient-animated">{getXPForPeriod(user)} XP</p>
                    <p className="text-xs text-gray-400">Total: {user.xp} XP</p>
                  </div>
                </div>
              </div>
            ))}          </div>
        </div>

        {/* CTA */}

      </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type="achievement"
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
