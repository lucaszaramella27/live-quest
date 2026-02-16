import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button, GradientCard, Input, Modal, Toast } from '@/shared/ui'
import {
  Check,
  Crown,
  Gift,
  Link2,
  Plus,
  Radio,
  RefreshCw,
  Settings,
  Target,
  TrendingUp,
  Twitch,
  Unlink,
  Users,
  Zap,
} from 'lucide-react'
import {
  checkLiveStatusAndReward,
  createTwitchGoal,
  disconnectTwitch,
  getSuggestedTwitchGoals,
  getTwitchAuthUrl,
  getTwitchGoals,
  saveTwitchIntegration,
  subscribeToTwitchIntegration,
  type TwitchGoal,
  type TwitchIntegration,
} from '@/services/twitch.service'
import { reportError } from '@/services/logger.service'

export function TwitchPage() {
  const { user } = useAuth()
  const [integration, setIntegration] = useState<TwitchIntegration | null>(null)
  const [goals, setGoals] = useState<TwitchGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'streak' | 'goal' | 'task' | 'achievement' | 'error'>('success')
  const [showToast, setShowToast] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)

  const [autoXpOnLive, setAutoXpOnLive] = useState(true)
  const [xpPerHourLive, setXpPerHourLive] = useState(50)

  const [newGoalType, setNewGoalType] = useState<TwitchGoal['type']>('followers')
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState('')

  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToTwitchIntegration(user.id, (data) => {
      setIntegration(data)
      if (data) {
        setAutoXpOnLive(data.autoXpOnLive)
        setXpPerHourLive(data.xpPerHourLive)
      }
      setLoading(false)
    })

    void loadGoals()

    return () => unsubscribe()
  }, [user])

  async function loadGoals() {
    if (!user) return
    try {
      const goalsData = await getTwitchGoals(user.id)
      setGoals(goalsData)
    } catch (error) {
      reportError('twitch_page_load_goals', error)
    }
  }

  function handleConnect() {
    if (!user) return

    const state = Math.random().toString(36).substring(7)
    localStorage.setItem('twitch_auth_state', state)
    localStorage.setItem('twitch_auth_user', user.id || '')
    window.location.href = getTwitchAuthUrl(state)
  }

  async function handleDisconnect() {
    if (!user) return

    try {
      await disconnectTwitch()
      setToastMessage('Conta Twitch desconectada com sucesso.')
      setToastType('success')
      setShowToast(true)
    } catch (error) {
      reportError('twitch_page_disconnect', error)
      setToastMessage('Erro ao desconectar da Twitch.')
      setToastType('error')
      setShowToast(true)
    }
  }

  async function handleCheckLive() {
    if (!user) return

    setChecking(true)
    try {
      const result = await checkLiveStatusAndReward()

      if (result.isLive) {
        if (result.xpAwarded > 0) {
          setToastMessage(`Live detectada. +${result.xpAwarded} XP`)
        } else {
          setToastMessage('Live detectada com sucesso.')
        }
        setToastType('achievement')
      } else {
        setToastMessage('Seu canal esta offline no momento.')
        setToastType('success')
      }
      setShowToast(true)

      await loadGoals()
    } catch (error) {
      reportError('twitch_page_check_live', error)
      setToastMessage('Erro ao verificar status da live.')
      setToastType('error')
      setShowToast(true)
    } finally {
      setChecking(false)
    }
  }

  async function handleSaveSettings() {
    if (!user || !integration) return

    try {
      await saveTwitchIntegration(user.id, {
        autoXpOnLive,
        xpPerHourLive,
        autoGoalsFromTwitch: integration.autoGoalsFromTwitch ?? true,
      })
      setShowSettingsModal(false)
      setToastMessage('Configuracoes salvas com sucesso.')
      setToastType('success')
      setShowToast(true)
    } catch (error) {
      reportError('twitch_page_save_settings', error)
      setToastMessage('Erro ao salvar configuracoes.')
      setToastType('error')
      setShowToast(true)
    }
  }

  async function handleCreateGoal() {
    if (!user || !integration || !newGoalTitle || !newGoalTarget) return

    const target = parseInt(newGoalTarget, 10)
    if (Number.isNaN(target) || target <= 0) return

    try {
      await createTwitchGoal(user.id, {
        type: newGoalType,
        title: newGoalTitle,
        targetValue: target,
        currentValue: newGoalType === 'followers' ? integration.totalFollowers || 0 : 0,
        xpReward: Math.floor(target / 10) * 10,
        coinsReward: Math.floor(target / 50) * 5,
      })

      setShowGoalModal(false)
      setNewGoalTitle('')
      setNewGoalTarget('')
      setToastMessage('Meta criada com sucesso.')
      setToastType('goal')
      setShowToast(true)

      await loadGoals()
    } catch (error) {
      reportError('twitch_page_create_goal', error)
      setToastMessage('Erro ao criar meta.')
      setToastType('error')
      setShowToast(true)
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
        integration.totalSubscribers,
        integration.broadcasterType
      )
    : []

  const activeGoals = goals.filter((goal) => !goal.completed)
  const completedGoals = goals.filter((goal) => goal.completed)
  const isConnected = !!integration?.twitchUserId

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
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(145, 70, 255, 0.35)', color: '#d5beff' }}>
            <Twitch className="h-4 w-4" />
            Channel sync
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">Integracao Twitch</h1>
          <p className="mt-3 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Conecte sua conta para metas automaticas, status de live e recompensas em tempo real.
          </p>
        </div>
      </GradientCard>

      <GradientCard hover={false} className="p-6">
        {integration && isConnected ? (
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={integration.twitchProfileImage}
                  alt={integration.twitchDisplayName}
                  className="h-20 w-20 rounded-full border-4 object-cover"
                  style={{ borderColor: '#9146FF' }}
                />
                {integration.isLive && (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    LIVE
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{integration.twitchDisplayName}</h2>
                  {integration.broadcasterType === 'partner' && <Crown className="h-5 w-5 text-[#9146FF]" />}
                  {integration.broadcasterType === 'affiliate' && <Check className="h-5 w-5 text-[#9146FF]" />}
                </div>
                <p style={{ color: 'var(--color-text-secondary)' }}>@{integration.twitchLogin}</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Conectado em {new Date(integration.connectedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />}
                onClick={handleCheckLive}
                disabled={checking}
              >
                {checking ? 'Verificando...' : 'Verificar live'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Settings className="h-4 w-4" />}
                onClick={() => setShowSettingsModal(true)}
              >
                Configuracoes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Unlink className="h-4 w-4" />}
                onClick={handleDisconnect}
                className="text-red-300 hover:text-red-200"
              >
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'rgba(145, 70, 255, 0.18)' }}>
              <Twitch className="h-10 w-10 text-[#9146FF]" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Conecte sua Twitch</h2>
            <p className="mx-auto mb-6 max-w-md text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
              Vincule seu canal para receber metas inteligentes, checagem automatica de live e recompensas.
            </p>
            <Button
              variant="primary"
              size="lg"
              icon={<Link2 className="h-5 w-5" />}
              onClick={handleConnect}
              style={{ background: '#9146FF', borderColor: '#7c3aed', color: '#ffffff' }}
            >
              Conectar com Twitch
            </Button>
          </div>
        )}
      </GradientCard>

      {integration && isConnected && (
        <>
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MiniStat
              icon={<Users className="h-8 w-8 text-[#9146FF]" />}
              value={integration.totalFollowers.toLocaleString()}
              label="Seguidores"
            />
            <MiniStat
              icon={<Radio className={`h-8 w-8 ${integration.isLive ? 'animate-pulse text-red-500' : 'text-zinc-500'}`} />}
              value={integration.isLive ? 'AO VIVO' : 'Offline'}
              label="Status"
            />
            <MiniStat icon={<Zap className="h-8 w-8 text-amber-300" />} value={xpPerHourLive} label="XP/hora" />
            <MiniStat icon={<Target className="h-8 w-8 text-cyan-200" />} value={activeGoals.length} label="Metas ativas" />
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GradientCard>
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#9146FF]/20 p-3">
                    <Target className="h-6 w-6 text-[#9146FF]" />
                  </div>
                  <h3 className="text-xl font-bold">Metas da Twitch</h3>
                </div>
                <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowGoalModal(true)}>
                  Nova meta
                </Button>
              </div>

              {activeGoals.length === 0 ? (
                <p className="py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  Nenhuma meta ativa. Crie sua primeira meta.
                </p>
              ) : (
                <div className="space-y-4">
                  {activeGoals.map((goal) => (
                    <div key={goal.id} className="glass rounded-xl border p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-semibold">{goal.title}</span>
                        <span className="text-sm font-semibold text-[#9146FF]">+{goal.xpReward} XP</span>
                      </div>
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-slate-950/70">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%`, background: '#9146FF' }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {goal.currentValue.toLocaleString()}/{goal.targetValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {completedGoals.length > 0 && (
                <div className="mt-6 border-t pt-5" style={{ borderColor: 'rgba(139, 161, 203, 0.2)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {completedGoals.length} meta(s) concluida(s) nesta fase.
                  </p>
                </div>
              )}
            </GradientCard>

            <GradientCard>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-amber-400/15 p-3">
                  <TrendingUp className="h-6 w-6 text-amber-300" />
                </div>
                <h3 className="text-xl font-bold">Metas sugeridas</h3>
              </div>

              <div className="space-y-4">
                {suggestedGoals.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full rounded-xl border border-dashed p-4 text-left transition-colors hover:border-[#9146FF]/45"
                    style={{ borderColor: 'rgba(139, 161, 203, 0.24)' }}
                    onClick={() => handleAddSuggestedGoal(suggestion)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold transition-colors">{suggestion.title}</p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          +{suggestion.xpReward} XP and +{suggestion.coinsReward} coins
                        </p>
                      </div>
                      <Plus className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
                    </div>
                  </button>
                ))}
              </div>
            </GradientCard>
          </section>

          <GradientCard>
            <div className="mb-4 flex items-center gap-3">
              <Gift className="h-6 w-6 text-[#9146FF]" />
              <h3 className="text-lg font-bold">Recompensas automaticas</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <RewardTile title="Ao vivo" text={`${xpPerHourLive} XP por hora streamando`} />
              <RewardTile title="Novo sub" text="100 XP + 25 coins" />
              <RewardTile title="Gift sub" text="50 XP + 10 coins por gift" />
            </div>
          </GradientCard>
        </>
      )}

      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Configuracoes da Twitch">
        <div className="space-y-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={autoXpOnLive}
              onChange={(event) => setAutoXpOnLive(event.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-gray-600"
              style={{ accentColor: '#9146FF' }}
            />
            <div>
              <p className="font-semibold">XP automatico ao vivo</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Ganhe XP automaticamente enquanto estiver streamando.
              </p>
            </div>
          </label>

          <div>
            <Input
              label="XP por hora ao vivo"
              type="number"
              value={xpPerHourLive}
              onChange={(event) => setXpPerHourLive(Number(event.target.value))}
              min={10}
              max={200}
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Valor permitido: entre 10 e 200 XP por hora.
            </p>
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

      <Modal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} title="Nova meta da Twitch">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
              Tipo da meta
            </label>
            <select
              value={newGoalType}
              onChange={(event) => setNewGoalType(event.target.value as TwitchGoal['type'])}
              className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-4"
              style={{
                background: 'linear-gradient(145deg, rgba(11, 22, 41, 0.78), rgba(8, 17, 33, 0.82))',
                borderColor: 'rgba(139, 161, 203, 0.28)',
                color: 'var(--color-text)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              }}
            >
              <option value="followers">Seguidores</option>
              <option value="subscribers">Inscritos</option>
              <option value="hours_streamed">Horas streamadas</option>
            </select>
          </div>

          <Input
            label="Titulo da meta"
            placeholder="Ex: Atingir 1.000 seguidores"
            value={newGoalTitle}
            onChange={(event) => setNewGoalTitle(event.target.value)}
          />

          <Input
            label="Valor alvo"
            type="number"
            placeholder="Ex: 1000"
            value={newGoalTarget}
            onChange={(event) => setNewGoalTarget(event.target.value)}
          />

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowGoalModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleCreateGoal} className="flex-1" style={{ background: '#9146FF', borderColor: '#7c3aed', color: '#ffffff' }}>
              Criar meta
            </Button>
          </div>
        </div>
      </Modal>

      <Toast message={toastMessage} type={toastType} show={showToast} onClose={() => setShowToast(false)} />
    </div>
  )
}

interface MiniStatProps {
  icon: ReactNode
  value: string | number
  label: string
}

function MiniStat({ icon, value, label }: MiniStatProps) {
  return (
    <GradientCard className="py-6 text-center">
      <div className="mb-2 flex justify-center">{icon}</div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
    </GradientCard>
  )
}

interface RewardTileProps {
  title: string
  text: string
}

function RewardTile({ title, text }: RewardTileProps) {
  return (
    <div className="glass rounded-lg border p-3">
      <p className="font-semibold text-[#9146FF]">{title}</p>
      <p style={{ color: 'var(--color-text-secondary)' }}>{text}</p>
    </div>
  )
}
