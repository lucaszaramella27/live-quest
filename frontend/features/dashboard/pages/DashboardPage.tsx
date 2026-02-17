import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button, Confetti, GradientCard, IconMapper, Input, Modal, PremiumBadge, Toast, XPBar } from '@/shared/ui'
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow'
import { ArrowRight, Award, CheckSquare, Coins, Crown, Flame, Plus, Sparkles, Target, Zap } from 'lucide-react'
import { createGoal, getUserGoals, updateGoal, type Goal } from '@/services/goals.service'
import { createChecklistItem, getUserChecklists, updateChecklistItem, type ChecklistItem } from '@/services/checklists.service'
import { getUserInventory, subscribeToUserInventory, type EquippedItems } from '@/services/inventory.service'
import { getUserStreak, type Streak } from '@/services/streaks.service'
import {
  createUserProgress,
  getUserProgress,
  subscribeToUserProgress,
  type Achievement,
  type UserProgress,
} from '@/services/progress.service'
import { reportError } from '@/services/logger.service'
import { getItemById } from '@/services/shop.service'

type ToastKind = 'success' | 'streak' | 'goal' | 'task' | 'achievement'

const motivationalMessages = {
  taskCompleted: ['Boa! +10 XP', 'Mandou bem!', 'Isso aí!', 'Continua assim!'],
  goalCompleted: ['Meta concluída! 🎉', 'Arrasou!', 'Completou!'],
}

function getRandomMessage(type: keyof typeof motivationalMessages) {
  const messages = motivationalMessages[type]
  return messages[Math.floor(Math.random() * messages.length)]
}

function getDashboardAvatarFrameStyle(equippedAvatarItemId: string | null | undefined): Record<string, string> {
  if (equippedAvatarItemId === 'fire_aura') {
    return {
      borderColor: 'rgba(251, 146, 60, 0.55)',
      boxShadow: '0 0 24px -10px rgba(249, 115, 22, 0.75)',
    }
  }

  if (equippedAvatarItemId === 'rainbow_trail') {
    return {
      borderColor: 'rgba(125, 211, 252, 0.55)',
      boxShadow: '0 0 24px -10px rgba(96, 165, 250, 0.74)',
    }
  }

  if (equippedAvatarItemId === 'galaxy_aura') {
    return {
      borderColor: 'rgba(167, 139, 250, 0.58)',
      boxShadow: '0 0 24px -10px rgba(139, 92, 246, 0.78)',
    }
  }

  if (equippedAvatarItemId === 'sparkle_effect') {
    return {
      borderColor: 'rgba(94, 247, 226, 0.58)',
      boxShadow: '0 0 22px -10px rgba(94, 247, 226, 0.72)',
    }
  }

  return {
    borderColor: 'rgba(125, 211, 252, 0.45)',
  }
}

function StatTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  detail: ReactNode
}) {
  return (
    <div className="glass glass-hover rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </p>
        {icon}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="text-3xl font-bold leading-none" style={{ color: 'var(--color-text)' }}>
          {value}
        </p>
        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          {detail}
        </p>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="glass rounded-2xl px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
      <p className="mt-1 text-lg font-bold" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [goals, setGoals] = useState<Goal[]>([])
  const [checklists, setChecklists] = useState<ChecklistItem[]>([])
  const [streak, setStreak] = useState<Streak | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [equippedItems, setEquippedItems] = useState<EquippedItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showChecklistModal, setShowChecklistModal] = useState(false)

  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const [showConfetti, setShowConfetti] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: ToastKind
  }>({ show: false, message: '', type: 'success' })

  useEffect(() => {
    if (!user) return

    void loadDashboardData()

    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 1000)
    }

    const unsubscribe = subscribeToUserProgress(user.id, (updatedProgress) => {
      if (updatedProgress) {
        setProgress(updatedProgress)
      }
    })

    const unsubscribeInventory = subscribeToUserInventory(user.id, (updatedInventory) => {
      setEquippedItems(updatedInventory.equippedItems)
    })

    return () => {
      unsubscribe()
      unsubscribeInventory()
    }
  }, [user])

  async function loadDashboardData() {
    if (!user) return

    try {
      setLoading(true)

      const today = new Date().toISOString().split('T')[0]
      const [goalsData, checklistsData, streakData, progressData, inventoryData] = await Promise.all([
        getUserGoals(user.id),
        getUserChecklists(user.id, today),
        getUserStreak(user.id),
        getUserProgress(user.id),
        getUserInventory(),
      ])

      setGoals(goalsData)
      setChecklists(checklistsData)
      setStreak(streakData)
      setEquippedItems(inventoryData.equippedItems)

      if (progressData) {
        setProgress(progressData)
      } else {
        const newProgress = await createUserProgress(
          user.id,
          user.displayName || user.email || 'Usuario',
          user.photoURL || ''
        )
        setProgress(newProgress)
      }
    } catch (error) {
      reportError('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  function showToast(message: string, type: ToastKind = 'success') {
    setToast({ show: true, message, type })
  }

  function showAchievementToast(achievement: Achievement) {
    setShowConfetti(true)
    showToast(`🏆 Conquista desbloqueada: ${achievement.name} (+${achievement.xpReward} XP)`, 'achievement')
    setTimeout(() => setShowConfetti(false), 3000)
  }

  function handleCompleteOnboarding() {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setShowOnboarding(false)
    showToast('Bem-vindo ao LiveQuest! 🎉', 'success')
  }

  async function handleCreateGoal() {
    if (!user || !newGoalTitle.trim()) return

    try {
      await createGoal(user.id, newGoalTitle.trim())
      setNewGoalTitle('')
      setShowGoalModal(false)
      showToast('Meta criada!', 'goal')
      await loadDashboardData()
    } catch (error) {
      reportError('Erro ao criar meta:', error)
    }
  }

  async function handleCreateTask() {
    if (!user || !newTaskTitle.trim()) return

    try {
      const today = new Date().toISOString().split('T')[0]
      await createChecklistItem(user.id, newTaskTitle.trim(), '', today)
      setNewTaskTitle('')
      setShowChecklistModal(false)
      showToast('Tarefa adicionada!', 'task')
      await loadDashboardData()
    } catch (error) {
      reportError('Erro ao criar tarefa:', error)
    }
  }

  async function handleToggleChecklist(item: ChecklistItem) {
    if (!user) return

    try {
      const completed = !item.completed
      const achievements = await updateChecklistItem(item.id, { completed })

      if (completed) {
        showToast(getRandomMessage('taskCompleted'), 'task')

        if (achievements && achievements.length > 0) {
          setTimeout(() => {
            achievements.forEach((achievement, index) => {
              setTimeout(() => showAchievementToast(achievement), index * 3500)
            })
          }, 1000)
        }
      }

      await loadDashboardData()
    } catch (error) {
      reportError('Erro ao atualizar checklist:', error)
    }
  }

  async function handleUpdateGoalProgress(goal: Goal, increment: number) {
    if (!user) return

    try {
      const nextProgress = Math.max(0, Math.min(100, (goal.progress || 0) + increment))
      const completed = nextProgress >= 100

      const achievements = await updateGoal(goal.id, {
        progress: nextProgress,
        completed,
      })

      if (completed) {
        setShowConfetti(true)
        showToast(getRandomMessage('goalCompleted'), 'achievement')

        if (achievements && achievements.length > 0) {
          setTimeout(() => {
            achievements.forEach((achievement, index) => {
              setTimeout(() => showAchievementToast(achievement), index * 3500)
            })
          }, 2000)
        }
      }

      await loadDashboardData()
    } catch (error) {
      reportError('Erro ao atualizar meta:', error)
    }
  }

  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const completedTasks = checklists.filter((entry) => entry.completed).length
  const totalTasks = checklists.length
  const tasksPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const completedGoalsCount = goals.filter((goal) => goal.completed).length
  const activeGoalsCount = goals.filter((goal) => !goal.completed).length
  const firstName = (user?.displayName || user?.email || 'Streamer').split(' ')[0]
  const equippedBadge = equippedItems?.badge ? getItemById(equippedItems.badge) : null
  const avatarFrameStyle = getDashboardAvatarFrameStyle(equippedItems?.avatar)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <GradientCard hover={false} className="relative overflow-hidden p-8">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'rgba(34, 211, 238, 0.16)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'rgba(249, 115, 22, 0.14)' }}
        />
        <div className="relative space-y-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  {getGreeting()},
                </p>
                {progress?.isPremium && (
                  <PremiumBadge size="sm" glow>
                    <Crown className="h-3.5 w-3.5" />
                    Premium
                  </PremiumBadge>
                )}
                {equippedBadge && (
                  <span
                    className="inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold"
                    style={{
                      borderColor: 'rgba(94, 247, 226, 0.32)',
                      background: 'rgba(8, 17, 33, 0.7)',
                      color: '#b9fff9',
                    }}
                    title={equippedBadge.name}
                  >
                    <IconMapper icon={equippedBadge.icon} size={12} />
                    <span className="truncate">{equippedBadge.name}</span>
                  </span>
                )}
              </div>

              <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">
                <span className="text-gradient-animated">{firstName}</span>
              </h1>

              <p className="mt-3 text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
                {totalTasks > 0
                  ? `${completedTasks}/${totalTasks} tarefas concluídas hoje (${tasksPercentage}%).`
                  : 'Pronto para um dia produtivo? Comece criando sua primeira tarefa.'}
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center lg:items-start lg:justify-end">
              <div className="flex flex-wrap items-center gap-3">
                {progress && (
                  <>
                    <div
                      className="glass flex items-center gap-2 rounded-xl px-3 py-2"
                      style={{ borderColor: 'rgba(245, 158, 11, 0.25)' }}
                    >
                      <Coins className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        {progress.coins.toLocaleString()}
                      </span>
                    </div>
                    <XPBar xp={progress.xp} level={progress.level} compact />
                  </>
                )}

                <div
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border"
                  style={avatarFrameStyle}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                      {firstName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowChecklistModal(true)}
                >
                  Nova tarefa
                </Button>
                <Button icon={<Target className="h-4 w-4" />} onClick={() => setShowGoalModal(true)}>
                  Nova meta
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Streak"
              value={streak?.currentStreak || 0}
              detail="dias"
              icon={<Flame className="h-5 w-5" style={{ color: 'var(--color-secondary)' }} />}
            />
            <StatTile
              label="Tarefas"
              value={totalTasks > 0 ? `${completedTasks}/${totalTasks}` : 0}
              detail={totalTasks > 0 ? 'concluídas' : 'hoje'}
              icon={<CheckSquare className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />}
            />
            <StatTile
              label="Metas"
              value={activeGoalsCount}
              detail="ativas"
              icon={<Target className="h-5 w-5" style={{ color: 'var(--color-secondary)' }} />}
            />
            <StatTile
              label="Nível"
              value={progress?.level || 1}
              detail="atual"
              icon={<Zap className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />}
            />
          </div>

          {totalTasks > 0 && (
            <div className="glass rounded-2xl px-5 py-4">
              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <span>Progresso de hoje</span>
                <span className="font-bold" style={{ color: 'var(--color-text)' }}>
                  {tasksPercentage}%
                </span>
              </div>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full"
                style={{ background: 'rgba(8, 15, 28, 0.88)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${tasksPercentage}%`, background: 'var(--gradient-primary)' }}
                />
              </div>
            </div>
          )}
        </div>
      </GradientCard>

      {!progress?.isPremium && (
        <div
          className="surface-card gradient-border relative overflow-hidden border p-6"
          style={{ borderColor: 'rgba(56, 189, 248, 0.18)' }}
        >
          <div className="pointer-events-none absolute -right-8 -top-10 opacity-15">
            <Sparkles className="h-20 w-20" style={{ color: '#f59e0b' }} />
          </div>
          <div className="pointer-events-none absolute -left-10 -bottom-10 opacity-10">
            <Sparkles className="h-20 w-20" style={{ color: 'var(--color-primary)' }} />
          </div>

          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.28), rgba(249, 115, 22, 0.18))',
                  borderColor: 'rgba(245, 158, 11, 0.28)',
                }}
              >
                <Crown className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                  Upgrade
                </p>
                <h2 className="mt-1 text-xl font-bold">Desbloqueie o Premium</h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Metas ilimitadas, temas premium, relatórios e integrações avançadas.
                </p>
              </div>
            </div>

            <Button icon={<ArrowRight className="h-4 w-4" />} onClick={() => navigate('/plans')}>
              Ver planos
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <GradientCard hover={false} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.18), rgba(14, 165, 233, 0.12))',
                  borderColor: 'rgba(34, 211, 238, 0.22)',
                }}
              >
                <CheckSquare className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Tarefas de hoje</h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {totalTasks > 0 ? `${completedTasks} concluídas • ${tasksPercentage}%` : 'Organize seu dia em pequenos passos.'}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowChecklistModal(true)}
            >
              Adicionar
            </Button>
          </div>

          <div className="mt-6">
            {checklists.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center">
                <CheckSquare className="mx-auto h-10 w-10 opacity-40" style={{ color: 'var(--color-text-secondary)' }} />
                <p className="mt-3 font-semibold">Nenhuma tarefa ainda</p>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Crie uma tarefa simples e ganhe XP ao completar.
                </p>
                <div className="mt-5 flex justify-center">
                  <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowChecklistModal(true)}>
                    Criar tarefa
                  </Button>
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {checklists.map((item) => (
                  <li key={item.id}>
                    <label
                      className="glass glass-hover flex cursor-pointer items-start gap-3 rounded-2xl px-4 py-3"
                      style={{ background: item.completed ? 'rgba(12, 21, 37, 0.42)' : 'rgba(12, 21, 37, 0.62)' }}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(item)}
                        className="mt-0.5 h-5 w-5 cursor-pointer rounded-md border-2"
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold leading-snug ${item.completed ? 'line-through opacity-60' : ''}`}>
                          {item.task}
                        </p>
                        {item.time && (
                          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {item.time}
                          </p>
                        )}
                      </div>
                      {item.completed && (
                        <div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#f59e0b' }}>
                          <Zap className="h-4 w-4" />
                          Feito
                        </div>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </GradientCard>

        <GradientCard hover={false} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                style={{
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.16), rgba(245, 158, 11, 0.08))',
                  borderColor: 'rgba(249, 115, 22, 0.2)',
                }}
              >
                <Target className="h-5 w-5" style={{ color: 'var(--color-secondary)' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Minhas metas</h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {goals.length > 0 ? `${activeGoalsCount} ativas • ${completedGoalsCount} concluídas` : 'Defina um alvo e acompanhe a evolução.'}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowGoalModal(true)}
            >
              Criar
            </Button>
          </div>

          <div className="mt-6">
            {goals.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center">
                <Target className="mx-auto h-10 w-10 opacity-40" style={{ color: 'var(--color-text-secondary)' }} />
                <p className="mt-3 font-semibold">Nenhuma meta por aqui</p>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Comece com algo simples, tipo “Atingir 1.000 seguidores”.
                </p>
                <div className="mt-5 flex justify-center">
                  <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowGoalModal(true)}>
                    Criar meta
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 5).map((goal) => {
                  const isCompleted = goal.completed
                  const goalProgress = goal.progress || 0
                  const canDecrement = !isCompleted && goalProgress > 0
                  const canIncrement = !isCompleted && goalProgress < 100

                  return (
                    <div
                      key={goal.id}
                      className="glass glass-hover rounded-2xl px-4 py-3"
                      style={{ background: isCompleted ? 'rgba(12, 21, 37, 0.42)' : 'rgba(12, 21, 37, 0.62)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold leading-snug ${isCompleted ? 'line-through opacity-60' : ''}`}>
                            {goal.title}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {goalProgress}% concluído
                          </p>
                        </div>

                        {isCompleted ? (
                          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: '#f59e0b' }}>
                            <Award className="h-4 w-4" />
                            Concluída
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!canDecrement}
                              onClick={() => handleUpdateGoalProgress(goal, -10)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                              style={{
                                background: 'rgba(15, 23, 42, 0.72)',
                                borderColor: 'rgba(148, 163, 184, 0.22)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              −
                            </button>
                            <button
                              type="button"
                              disabled={!canIncrement}
                              onClick={() => handleUpdateGoalProgress(goal, 10)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                              style={{
                                background: 'rgba(15, 23, 42, 0.72)',
                                borderColor: 'rgba(125, 211, 252, 0.38)',
                                color: 'var(--color-primary)',
                              }}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: 'rgba(8, 15, 28, 0.88)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${goalProgress}%`,
                            background: isCompleted ? 'linear-gradient(135deg, #f59e0b, #fb923c)' : 'var(--gradient-primary)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}

                {goals.length > 5 && (
                  <p className="pt-1 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    +{goals.length - 5} metas
                  </p>
                )}
              </div>
            )}
          </div>
        </GradientCard>
      </div>

      {progress && (
        <GradientCard hover={false} className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.16), rgba(249, 115, 22, 0.1))',
                  borderColor: 'rgba(125, 211, 252, 0.24)',
                }}
              >
                <Sparkles className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Resumo rápido</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Alguns números para manter o ritmo.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="XP total" value={progress.xp.toLocaleString()} />
              <Metric label="Coins" value={progress.coins.toLocaleString()} />
              <Metric label="Metas concluídas" value={completedGoalsCount} />
              <Metric label="Maior streak" value={`${streak?.longestStreak || 0} dias`} />
            </div>
          </div>
        </GradientCard>
      )}

      <Modal
        isOpen={showGoalModal}
        onClose={() => {
          setShowGoalModal(false)
          setNewGoalTitle('')
        }}
        title="Nova meta"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleCreateGoal()
          }}
          className="space-y-4"
        >
          <Input
            label="O que você quer alcançar"
            value={newGoalTitle}
            onChange={(event) => setNewGoalTitle(event.target.value)}
            placeholder="Ex: Alcançar 1000 seguidores"
            autoFocus
            required
          />
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowGoalModal(false)
                setNewGoalTitle('')
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showChecklistModal}
        onClose={() => {
          setShowChecklistModal(false)
          setNewTaskTitle('')
        }}
        title="Nova tarefa"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleCreateTask()
          }}
          className="space-y-4"
        >
          <Input
            label="O que precisa fazer"
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            placeholder="Ex: Editar vídeo"
            autoFocus
            required
          />
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowChecklistModal(false)
                setNewTaskTitle('')
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
      </Modal>

      {showOnboarding && <OnboardingFlow onComplete={handleCompleteOnboarding} />}

      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}
