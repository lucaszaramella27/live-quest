import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button, Modal, Input, Confetti, Toast, XPBar } from '@/shared/ui'
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow'
import { 
  Target, 
  Flame, 
  CheckSquare, 
  Plus,
  Zap,
  Award,
  Coins,
  Crown,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { getUserGoals, createGoal, updateGoal, type Goal } from '@/services/goals.service'
import { getUserChecklists, createChecklistItem, updateChecklistItem, type ChecklistItem } from '@/services/checklists.service'
import { getUserStreak, type Streak } from '@/services/streaks.service'
import { getUserProgress, createUserProgress, subscribeToUserProgress, type UserProgress, type Achievement } from '@/services/progress.service'

const motivationalMessages = {
  taskCompleted: [
    'Boa! +10 XP',
    'Mandou bem!',
    'Isso aí!',
    'Continua assim!',
  ],
  goalCompleted: [
    'META CONCLUÍDA! 🎉',
    'ARRASOU!',
    'COMPLETOU!',
  ],
}

const getRandomMessage = (type: keyof typeof motivationalMessages) => {
  const messages = motivationalMessages[type]
  return messages[Math.floor(Math.random() * messages.length)]
}

export function DashboardPage() {
  const { user } = useAuth()
  
  const [goals, setGoals] = useState<Goal[]>([])
  const [checklists, setChecklists] = useState<ChecklistItem[]>([])
  const [streak, setStreak] = useState<Streak | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Modal states
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showChecklistModal, setShowChecklistModal] = useState(false)

  // Form states
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // Fun states
  const [showConfetti, setShowConfetti] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'streak' | 'goal' | 'task' | 'achievement'
  }>({ show: false, message: '', type: 'success' })

  useEffect(() => {
    if (user) {
      loadDashboardData()
      
      // Check if first time user
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
      if (!hasSeenOnboarding) {
        setTimeout(() => setShowOnboarding(true), 1000) // Delay 1s para loading acabar
      }
      
      const unsubscribe = subscribeToUserProgress(user.id, (updatedProgress) => {
        if (updatedProgress) {
          setProgress(updatedProgress)
        }
      })
      
      return () => unsubscribe()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      const today = new Date().toISOString().split('T')[0]
      const [goalsData, checklistsData, streakData, progressData] = await Promise.all([
        getUserGoals(user.id),
        getUserChecklists(user.id, today),
        getUserStreak(user.id),
        getUserProgress(user.id),
      ])
      
      setGoals(goalsData)
      setChecklists(checklistsData)
      setStreak(streakData)
      
      if (progressData) {
        setProgress(progressData)
      } else {
        const newProgress = await createUserProgress(user.id)
        setProgress(newProgress)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: typeof toast.type = 'success') => {
    setToast({ show: true, message, type })
  }

  const showAchievementToast = (achievement: Achievement) => {
    setShowConfetti(true)
    showToast(`🏆 CONQUISTA DESBLOQUEADA: ${achievement.name}! +${achievement.xpReward} XP`, 'achievement')
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const handleCompleteOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setShowOnboarding(false)
    showToast('Bem-vindo ao LiveQuest! 🎉', 'success')
  }

  const handleCreateGoal = async () => {
    if (!user || !newGoalTitle.trim()) return
    
    try {
      await createGoal(user.id, newGoalTitle.trim())
      setNewGoalTitle('')
      setShowGoalModal(false)
      showToast('Meta criada!', 'goal')
      await loadDashboardData()
    } catch (error) {
      console.error('Erro ao criar meta:', error)
    }
  }

  const handleCreateTask = async () => {
    if (!user || !newTaskTitle.trim()) return
    
    try {
      const today = new Date().toISOString().split('T')[0]
      await createChecklistItem(user.id, newTaskTitle.trim(), '', today)
      setNewTaskTitle('')
      setShowChecklistModal(false)
      showToast('Tarefa adicionada!', 'task')
      await loadDashboardData()
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
    }
  }

  const handleToggleChecklist = async (item: ChecklistItem) => {
    if (!user) return
    
    try {
      const completed = !item.completed
      const achievements = await updateChecklistItem(item.id, { completed })
      
      if (completed) {
        showToast(getRandomMessage('taskCompleted'), 'task')
        
        // Mostrar toasts de achievements desbloqueados
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
      console.error('Erro ao atualizar checklist:', error)
    }
  }

  const handleUpdateGoalProgress = async (goal: Goal, increment: number) => {
    if (!user) return
    
    try {
      const newProgress = Math.max(0, Math.min(100, (goal.progress || 0) + increment))
      const completed = newProgress >= 100
      
      const achievements = await updateGoal(goal.id, { 
        progress: newProgress,
        completed 
      })
      
      if (completed) {
        setShowConfetti(true)
        showToast(getRandomMessage('goalCompleted'), 'achievement')
        
        // Mostrar toasts de achievements desbloqueados
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
      console.error('Erro ao atualizar meta:', error)
    }
  }

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const completedTasks = checklists.filter(c => c.completed).length
  const totalTasks = checklists.length
  const activeGoals = goals.filter(g => !g.completed)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Clean Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'var(--color-background-secondary)', borderColor: 'var(--color-background-tertiary)' }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="transition-all duration-300 hover:scale-110 hover:animate-pulse cursor-pointer">
              <img src="/logo.png" alt="LiveQuest Logo" className="w-12 h-12" />
            </div>
            <span className="font-bold text-lg hidden sm:block">LiveQuest</span>
          </div>

          <div className="flex items-center gap-4">
            {progress && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-background-tertiary)' }}>
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-sm">{progress.coins || 0}</span>
                </div>
                
                <XPBar xp={progress.xp} level={progress.level} compact />
              </>
            )}
            
            {user?.photoURL && (
              <img 
                src={user.photoURL} 
                alt=""
                className="w-9 h-9 rounded-full border-2 transition-all"
                style={{ borderColor: 'var(--color-primary)' }}
              />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome - Simple */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">
            {getGreeting()}, {user?.displayName?.split(' ')[0]}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {totalTasks > 0 
              ? `${completedTasks}/${totalTasks} tarefas concluídas hoje`
              : 'Pronto para um dia produtivo?'
            }
          </p>
        </div>

        {/* Premium Offer Banner - Only show if not premium */}
        {!progress?.isPremium && (
          <div 
            className="relative overflow-hidden rounded-2xl p-6 mb-8 border cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group"
            onClick={() => window.location.href = '/plans'}
            style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }}
          >
            {/* Animated background gradient */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)'
              }}
            />
            
            {/* Sparkle decorations */}
            <div className="absolute top-4 right-4 opacity-20">
              <Sparkles className="w-16 h-16" style={{ color: '#fbbf24' }} />
            </div>
            <div className="absolute bottom-4 left-4 opacity-10">
              <Sparkles className="w-12 h-12" style={{ color: '#8b5cf6' }} />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Crown icon */}
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                  style={{ 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    boxShadow: '0 4px 20px rgba(251, 191, 36, 0.3)'
                  }}
                >
                  <Crown className="w-7 h-7 text-white" />
                </div>

                {/* Text content */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                      Desbloqueie o Premium
                    </h3>
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ 
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white'
                      }}
                    >
                      🔥 OFERTA
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Recursos exclusivos, temas ilimitados, prioridade no suporte e muito mais!
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                variant="primary"
                className="flex-shrink-0 group-hover:scale-110 transition-all duration-300 shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  color: 'white'
                }}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Ver Planos
              </Button>
            </div>
          </div>
        )}

        {/* Stats Row - Compact */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Streak</span>
            </div>
            <p className="text-2xl font-bold">{streak?.currentStreak || 0}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>dias</p>
          </div>

          <div className="p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Metas</span>
            </div>
            <p className="text-2xl font-bold">{activeGoals.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>ativas</p>
          </div>

          <div className="p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Nível</span>
            </div>
            <p className="text-2xl font-bold">{progress?.level || 1}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>atual</p>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Today's Tasks */}
          <section className="rounded-xl p-5" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <h2 className="font-semibold">Tarefas de Hoje</h2>
              </div>
              <button 
                onClick={() => setShowChecklistModal(true)}
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ background: 'var(--color-background-tertiary)' }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {checklists.length === 0 ? (
              <div className="py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma tarefa para hoje</p>
                <button 
                  onClick={() => setShowChecklistModal(true)}
                  className="text-sm mt-2 hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Adicionar tarefa
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {checklists.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                    style={{ background: item.completed ? 'transparent' : 'var(--color-background-tertiary)' }}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklist(item)}
                      className="w-5 h-5 rounded-md border-2 cursor-pointer accent-current"
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span className={`flex-1 ${item.completed ? 'line-through opacity-50' : ''}`}>
                      {item.task}
                    </span>
                    {item.completed && <Zap className="w-4 h-4 text-amber-500" />}
                  </label>
                ))}
              </div>
            )}

            {totalTasks > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-background-tertiary)' }}>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Progresso</span>
                  <span className="font-semibold">{Math.round((completedTasks / totalTasks) * 100)}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-background-tertiary)' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(completedTasks / totalTasks) * 100}%`,
                      background: 'var(--gradient-primary)'
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Goals */}
          <section className="rounded-xl p-5" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" style={{ color: 'var(--color-secondary)' }} />
                <h2 className="font-semibold">Minhas Metas</h2>
              </div>
              <button 
                onClick={() => setShowGoalModal(true)}
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ background: 'var(--color-background-tertiary)' }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma meta definida</p>
                <button 
                  onClick={() => setShowGoalModal(true)}
                  className="text-sm mt-2 hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Criar primeira meta
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 4).map((goal) => (
                  <div 
                    key={goal.id}
                    className="p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:translate-x-1 hover:shadow-lg cursor-pointer"
                    style={{ background: 'var(--color-background-tertiary)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${goal.completed ? 'line-through opacity-50' : ''}`}>
                        {goal.title}
                      </span>
                      {goal.completed ? (
                        <Award className="w-5 h-5 text-amber-500" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUpdateGoalProgress(goal, -10)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold transition-colors hover:bg-white/5"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            −
                          </button>
                          <button
                            onClick={() => handleUpdateGoalProgress(goal, 10)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold transition-colors"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-background)' }}>
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${goal.progress || 0}%`,
                          background: goal.completed ? '#f59e0b' : 'var(--gradient-primary)'
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {goal.progress || 0}%
                    </p>
                  </div>
                ))}
                
                {goals.length > 4 && (
                  <p className="text-center text-sm py-2" style={{ color: 'var(--color-text-secondary)' }}>
                    +{goals.length - 4} metas
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Quick Stats Footer */}
        {progress && (
          <div className="mt-8 p-4 rounded-xl flex items-center justify-between flex-wrap gap-4" style={{ background: 'var(--color-background-secondary)' }}>
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>XP Total</p>
                <p className="font-bold">{(progress.xp + (progress.level - 1) * 100).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Metas Completas</p>
                <p className="font-bold">{goals.filter(g => g.completed).length}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Maior Streak</p>
                <p className="font-bold">{streak?.longestStreak || 0} dias</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <Modal
        isOpen={showGoalModal}
        onClose={() => {
          setShowGoalModal(false)
          setNewGoalTitle('')
        }}
        title="Nova Meta"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          handleCreateGoal()
        }} className="space-y-4">
          <Input
            label="O que você quer alcançar?"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
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
            <Button type="submit" variant="primary">
              Criar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showChecklistModal}
        onClose={() => {
          setShowChecklistModal(false)
          setNewTaskTitle('')
        }}
        title="Nova Tarefa"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          handleCreateTask()
        }} className="space-y-4">
          <Input
            label="O que precisa fazer?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
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
            <Button type="submit" variant="primary">
              Adicionar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Onboarding */}
      {showOnboarding && (
        <OnboardingFlow onComplete={handleCompleteOnboarding} />
      )}

      {/* Effects */}
      <Confetti 
        active={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}
