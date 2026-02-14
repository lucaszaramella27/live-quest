import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { GradientCard, Button, Toast, Modal, Input } from '@/shared/ui'
import { 
  Twitch, 
  Link2, 
  Unlink, 
  Users, 
  Radio, 
  Target,
  Gift,
  Zap,
  Settings,
  RefreshCw,
  TrendingUp,
  Crown,
  Check,
  Plus
} from 'lucide-react'
import {
  getTwitchAuthUrl,
  subscribeToTwitchIntegration,
  disconnectTwitch,
  checkLiveStatusAndReward,
  getTwitchGoals,
  createTwitchGoal,
  getSuggestedTwitchGoals,
  saveTwitchIntegration,
  type TwitchIntegration,
  type TwitchGoal,
} from '@/services/twitch.service'

export function TwitchPage() {
  const { user } = useAuth()
  const [integration, setIntegration] = useState<TwitchIntegration | null>(null)
  const [goals, setGoals] = useState<TwitchGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'streak' | 'goal' | 'task' | 'achievement'>('success')
  const [showToast, setShowToast] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  
  // Settings form
  const [autoXpOnLive, setAutoXpOnLive] = useState(true)
  const [xpPerHourLive, setXpPerHourLive] = useState(50)

  // New goal form
  const [newGoalType, setNewGoalType] = useState<TwitchGoal['type']>('followers')
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState('')

  useEffect(() => {
    if (!user) return

    // Listener em tempo real para integração
    const unsubscribe = subscribeToTwitchIntegration(user.id, (data) => {
      setIntegration(data)
      if (data) {
        setAutoXpOnLive(data.autoXpOnLive)
        setXpPerHourLive(data.xpPerHourLive)
      }
      setLoading(false)
    })

    loadGoals()

    return () => unsubscribe()
  }, [user])

  async function loadGoals() {
    if (!user) return
    try {
      const goalsData = await getTwitchGoals(user.id)
      setGoals(goalsData)
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    }
  }

  function handleConnect() {
    // Gera state aleatório para segurança
    const state = Math.random().toString(36).substring(7)
    localStorage.setItem('twitch_auth_state', state)
    localStorage.setItem('twitch_auth_user', user?.id || '')
    
    // Redireciona para a Twitch
    window.location.href = getTwitchAuthUrl(state)
  }

  async function handleDisconnect() {
    if (!user) return
    
    try {
      await disconnectTwitch(user.id)
      setToastMessage('Twitch desconectada com sucesso!')
      setToastType('success')
      setShowToast(true)
    } catch (error) {
      console.error('Erro ao desconectar:', error)
      setToastMessage('Erro ao desconectar da Twitch')
      setToastType('task')
      setShowToast(true)
    }
  }

  async function handleCheckLive() {
    if (!user) return
    
    setChecking(true)
    try {
      const result = await checkLiveStatusAndReward(user.id)
      
      if (result.isLive) {
        if (result.xpAwarded > 0) {
          setToastMessage(`🎮 Você está AO VIVO! +${result.xpAwarded} XP`)
        } else {
          setToastMessage('🎮 Você está AO VIVO!')
        }
        setToastType('achievement')
      } else {
        setToastMessage('📺 Você não está ao vivo no momento')
        setToastType('success')
      }
      setShowToast(true)
      
      // Recarrega metas
      await loadGoals()
    } catch (error) {
      console.error('Erro ao verificar live:', error)
      setToastMessage('Erro ao verificar status')
      setToastType('task')
      setShowToast(true)
    } finally {
      setChecking(false)
    }
  }

  async function handleSaveSettings() {
    if (!user) return
    
    try {
      await saveTwitchIntegration(user.id, {
        autoXpOnLive,
        xpPerHourLive,
      })
      setShowSettingsModal(false)
      setToastMessage('Configurações salvas!')
      setToastType('success')
      setShowToast(true)
    } catch (error) {
      console.error('Erro ao salvar:', error)
    }
  }

  async function handleCreateGoal() {
    if (!user || !newGoalTitle || !newGoalTarget) return
    
    const target = parseInt(newGoalTarget)
    if (isNaN(target) || target <= 0) return
    
    try {
      await createTwitchGoal(user.id, {
        type: newGoalType,
        title: newGoalTitle,
        targetValue: target,
        currentValue: newGoalType === 'followers' ? integration?.totalFollowers || 0 : 0,
        xpReward: Math.floor(target / 10) * 10,
        coinsReward: Math.floor(target / 50) * 5,
      })
      
      setShowGoalModal(false)
      setNewGoalTitle('')
      setNewGoalTarget('')
      setToastMessage('Meta criada! 🎯')
      setToastType('goal')
      setShowToast(true)
      
      await loadGoals()
    } catch (error) {
      console.error('Erro ao criar meta:', error)
    }
  }

  function handleAddSuggestedGoal(suggestion: ReturnType<typeof getSuggestedTwitchGoals>[0]) {
    setNewGoalType(suggestion.type)
    setNewGoalTitle(suggestion.title)
    setNewGoalTarget(suggestion.targetValue.toString())
    setShowGoalModal(true)
  }

  const suggestedGoals = integration 
    ? getSuggestedTwitchGoals(
        integration.totalFollowers,
        0, // TODO: get real subs count
        integration.broadcasterType
      )
    : []

  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando integração...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Twitch className="w-8 h-8 text-[#9146FF]" />
          <h1 className="text-3xl font-bold">Integração Twitch</h1>
        </div>
        <p className="text-gray-400 mt-2">
          Conecte sua conta da Twitch para metas automáticas e recompensas
        </p>
      </div>

      {/* Connection Status Card */}
      <GradientCard className="mb-8">
        {integration?.accessToken ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={integration.twitchProfileImage}
                  alt={integration.twitchDisplayName}
                  className="w-20 h-20 rounded-full border-4 border-[#9146FF]"
                />
                {integration.isLive && (
                  <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    LIVE
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{integration.twitchDisplayName}</h2>
                  {integration.broadcasterType === 'partner' && (
                    <span title="Partner">
                      <Crown className="w-5 h-5 text-[#9146FF]" />
                    </span>
                  )}
                  {integration.broadcasterType === 'affiliate' && (
                    <span title="Afiliado">
                      <Check className="w-5 h-5 text-[#9146FF]" />
                    </span>
                  )}
                </div>
                <p className="text-gray-400">@{integration.twitchLogin}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Conectado em {new Date(integration.connectedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />}
                onClick={handleCheckLive}
                disabled={checking}
              >
                {checking ? 'Verificando...' : 'Verificar Live'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Settings className="w-4 h-4" />}
                onClick={() => setShowSettingsModal(true)}
              >
                Configurações
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Unlink className="w-4 h-4" />}
                onClick={handleDisconnect}
                className="text-red-400 hover:text-red-300"
              >
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#9146FF]/20 flex items-center justify-center">
              <Twitch className="w-10 h-10 text-[#9146FF]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Conecte sua Twitch</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Vincule sua conta da Twitch para ganhar XP automaticamente quando estiver ao vivo,
              criar metas baseadas no seu canal e muito mais!
            </p>
            <Button
              variant="primary"
              size="lg"
              icon={<Link2 className="w-5 h-5" />}
              onClick={handleConnect}
              className="bg-[#9146FF] hover:bg-[#7c3aed]"
            >
              Conectar com Twitch
            </Button>
          </div>
        )}
      </GradientCard>

      {/* Stats Grid - Only show when connected */}
      {integration?.accessToken && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <GradientCard className="text-center py-6">
              <Users className="w-8 h-8 mx-auto mb-2 text-[#9146FF]" />
              <p className="text-3xl font-bold">{integration.totalFollowers.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Seguidores</p>
            </GradientCard>
            
            <GradientCard className="text-center py-6">
              <Radio className={`w-8 h-8 mx-auto mb-2 ${integration.isLive ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
              <p className="text-3xl font-bold">{integration.isLive ? 'AO VIVO' : 'Offline'}</p>
              <p className="text-sm text-gray-400">Status</p>
            </GradientCard>
            
            <GradientCard className="text-center py-6">
              <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-3xl font-bold">{xpPerHourLive}</p>
              <p className="text-sm text-gray-400">XP/hora ao vivo</p>
            </GradientCard>
            
            <GradientCard className="text-center py-6">
              <Target className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
              <p className="text-3xl font-bold">{activeGoals.length}</p>
              <p className="text-sm text-gray-400">Metas ativas</p>
            </GradientCard>
          </div>

          {/* Twitch Goals Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Goals */}
            <GradientCard>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#9146FF]/20">
                    <Target className="w-6 h-6 text-[#9146FF]" />
                  </div>
                  <h3 className="text-xl font-bold">Metas da Twitch</h3>
                </div>
                <Button
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowGoalModal(true)}
                >
                  Nova Meta
                </Button>
              </div>

              {activeGoals.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Nenhuma meta ativa. Crie sua primeira meta!
                </p>
              ) : (
                <div className="space-y-4">
                  {activeGoals.map(goal => (
                    <div key={goal.id} className="p-4 rounded-xl" style={{ background: 'var(--color-background-secondary)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{goal.title}</span>
                        <span className="text-sm text-[#9146FF]">
                          +{goal.xpReward} XP
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--color-background)' }}>
                          <div
                            className="h-full rounded-full bg-[#9146FF] transition-all duration-500"
                            style={{ width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">
                          {goal.currentValue.toLocaleString()}/{goal.targetValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {completedGoals.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-3">✅ {completedGoals.length} meta(s) concluída(s)</p>
                </div>
              )}
            </GradientCard>

            {/* Suggested Goals */}
            <GradientCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-yellow-500/20">
                  <TrendingUp className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold">Metas Sugeridas</h3>
              </div>

              <div className="space-y-4">
                {suggestedGoals.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-dashed border-white/20 hover:border-[#9146FF]/50 transition-colors cursor-pointer group"
                    onClick={() => handleAddSuggestedGoal(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold group-hover:text-[#9146FF] transition-colors">
                          {suggestion.title}
                        </p>
                        <p className="text-sm text-gray-400">
                          +{suggestion.xpReward} XP • +{suggestion.coinsReward} coins
                        </p>
                      </div>
                      <Plus className="w-5 h-5 text-gray-500 group-hover:text-[#9146FF] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </GradientCard>
          </div>

          {/* XP Rewards Info */}
          <GradientCard className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-6 h-6 text-[#9146FF]" />
              <h3 className="text-lg font-bold">Recompensas Automáticas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg" style={{ background: 'var(--color-background-secondary)' }}>
                <p className="font-semibold text-[#9146FF]">🎮 Ao Vivo</p>
                <p className="text-gray-400">{xpPerHourLive} XP por hora streamando</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--color-background-secondary)' }}>
                <p className="font-semibold text-[#9146FF]">⭐ Novo Sub</p>
                <p className="text-gray-400">100 XP + 25 coins</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'var(--color-background-secondary)' }}>
                <p className="font-semibold text-[#9146FF]">🎁 Gift Sub</p>
                <p className="text-gray-400">50 XP + 10 coins por gift</p>
              </div>
            </div>
          </GradientCard>
        </>
      )}

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Configurações da Twitch"
      >
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoXpOnLive}
                onChange={(e) => setAutoXpOnLive(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-[#9146FF] focus:ring-[#9146FF]"
              />
              <div>
                <p className="font-semibold">XP Automático ao Vivo</p>
                <p className="text-sm text-gray-400">Ganhe XP automaticamente enquanto estiver streamando</p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">XP por hora ao vivo</label>
            <Input
              type="number"
              value={xpPerHourLive}
              onChange={(e) => setXpPerHourLive(Number(e.target.value))}
              min={10}
              max={200}
            />
            <p className="text-xs text-gray-400 mt-1">Entre 10 e 200 XP por hora</p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowSettingsModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveSettings} className="flex-1">
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Goal Modal */}
      <Modal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Nova Meta da Twitch"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Meta</label>
            <select
              value={newGoalType}
              onChange={(e) => setNewGoalType(e.target.value as TwitchGoal['type'])}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-brand-dark-secondary text-white focus:border-[#9146FF] focus:outline-none"
            >
              <option value="followers">Seguidores</option>
              <option value="subscribers">Inscritos</option>
              <option value="hours_streamed">Horas Streamadas</option>
            </select>
          </div>

          <Input
            label="Título da Meta"
            placeholder="Ex: Atingir 1.000 seguidores"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
          />

          <Input
            label="Valor Alvo"
            type="number"
            placeholder="Ex: 1000"
            value={newGoalTarget}
            onChange={(e) => setNewGoalTarget(e.target.value)}
          />

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowGoalModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleCreateGoal} className="flex-1 bg-[#9146FF] hover:bg-[#7c3aed]">
              Criar Meta
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
