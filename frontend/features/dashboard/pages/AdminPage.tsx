import { useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button, GradientCard, Input, Toast } from '@/shared/ui'
import {
  AlertTriangle,
  CheckCircle,
  Coins,
  Copy,
  Crown,
  RefreshCw,
  Shield,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import {
  activatePremium,
  deactivatePremium,
  getUserProgress,
  resetUserProgress,
  setUserCoins,
  setUserLevel,
  setUserXP,
  type UserProgress,
} from '@/services/progress.service'
import { reportError } from '@/services/logger.service'

export function AdminPage() {
  const { user } = useAuth()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<UserProgress | null>(null)

  const [xpAmount, setXpAmount] = useState('')
  const [coinsAmount, setCoinsAmount] = useState('')
  const [levelAmount, setLevelAmount] = useState('')

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  })

  if (!user) return null

  async function fetchUserData(targetUserId: string): Promise<UserProgress | null> {
    return getUserProgress(targetUserId)
  }

  async function handleSearchUser() {
    if (!userId.trim()) {
      setToast({ show: true, message: 'Digite um User ID valido.', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const progress = await fetchUserData(userId.trim())

      if (!progress) {
        setUserInfo(null)
        setToast({ show: true, message: 'Usuario nao encontrado.', type: 'error' })
      } else {
        setUserInfo(progress)
        setToast({ show: true, message: 'Usuario encontrado.', type: 'success' })
      }
    } catch (error) {
      reportError('admin_page_search_user', error)
      setUserInfo(null)
      setToast({ show: true, message: 'Erro ao buscar usuario.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function refreshUserInfo() {
    if (!userId.trim()) return

    setLoading(true)
    try {
      const progress = await fetchUserData(userId.trim())
      setUserInfo(progress)
      setToast({ show: true, message: 'Dados atualizados.', type: 'success' })
    } catch (error) {
      reportError('admin_page_refresh_user', error)
      setToast({ show: true, message: 'Erro ao atualizar dados do usuario.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function runWithRefresh(action: () => Promise<void>, successMessage: string, errorMessage: string) {
    setLoading(true)
    try {
      await action()
      const updatedProgress = await fetchUserData(userId.trim())
      setUserInfo(updatedProgress)
      setToast({ show: true, message: successMessage, type: 'success' })
    } catch (error) {
      reportError('admin_page_action', error)
      setToast({ show: true, message: errorMessage, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleActivatePremium() {
    if (!userId.trim()) return
    await runWithRefresh(
      async () => {
        await activatePremium(userId.trim(), 'lifetime')
      },
      'Premium ativado com sucesso.',
      'Erro ao ativar premium.'
    )
  }

  async function handleDeactivatePremium() {
    if (!userId.trim()) return
    await runWithRefresh(
      async () => {
        await deactivatePremium(userId.trim())
      },
      'Premium removido com sucesso.',
      'Erro ao remover premium.'
    )
  }

  async function handleSetXP() {
    if (!userId.trim() || !xpAmount) return
    await runWithRefresh(
      async () => {
        const success = await setUserXP(userId.trim(), parseInt(xpAmount, 10))
        if (!success) throw new Error('set_user_xp_failed')
        setXpAmount('')
      },
      `XP definido para ${xpAmount}.`,
      'Erro ao definir XP.'
    )
  }

  async function handleSetCoins() {
    if (!userId.trim() || !coinsAmount) return
    await runWithRefresh(
      async () => {
        const success = await setUserCoins(userId.trim(), parseInt(coinsAmount, 10))
        if (!success) throw new Error('set_user_coins_failed')
        setCoinsAmount('')
      },
      `Moedas definidas para ${coinsAmount}.`,
      'Erro ao definir moedas.'
    )
  }

  async function handleSetLevel() {
    if (!userId.trim() || !levelAmount) return
    await runWithRefresh(
      async () => {
        const success = await setUserLevel(userId.trim(), parseInt(levelAmount, 10))
        if (!success) throw new Error('set_user_level_failed')
        setLevelAmount('')
      },
      `Nivel definido para ${levelAmount}.`,
      'Erro ao definir nivel.'
    )
  }

  async function handleResetProgress() {
    if (!userId.trim()) return

    const confirmed = window.confirm(
      `ATENCAO\n\nTem certeza que deseja resetar todo o progresso de ${userInfo?.userName || 'este usuario'}?\n\nIsso vai zerar XP, nivel, moedas, conquistas e titulos.\nO status Premium sera mantido.\n\nEsta acao nao pode ser desfeita.`
    )
    if (!confirmed) return

    await runWithRefresh(
      async () => {
        const success = await resetUserProgress(userId.trim())
        if (!success) throw new Error('reset_user_progress_failed')
      },
      'Progresso resetado com sucesso.',
      'Erro ao resetar progresso.'
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, show: false }))}
      />

      <GradientCard hover={false} className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-90" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14), rgba(248, 113, 113, 0.08))' }} />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(248, 113, 113, 0.3)', color: '#fecaca' }}>
              <Shield className="h-4 w-4" />
              Admin control
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">Painel administrativo</h1>
            <p className="mt-3 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
              Gerencie premium, XP, moedas, niveis e reset de progresso dos usuarios.
            </p>
          </div>

          {userInfo && (
            <Button onClick={() => void refreshUserInfo()} disabled={loading} variant="ghost" icon={<RefreshCw className="h-4 w-4" />}>
              Atualizar
            </Button>
          )}
        </div>
      </GradientCard>

      <div className="glass rounded-2xl border p-5">
        <div className="mb-3 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-300" />
          <div>
            <p className="font-semibold text-rose-300">Area administrativa restrita</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Acoes desta tela possuem impacto direto no ambiente e devem ser executadas com cuidado.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <GradientCard hover={false}>
            <h2 className="mb-4 text-xl font-bold">Buscar usuario</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input
                  label="User ID"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="Cole o user id aqui"
                  disabled={loading}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={() => void handleSearchUser()} disabled={loading || !userId.trim()} className="w-full sm:w-auto">
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </GradientCard>

          {userInfo && (
            <GradientCard hover={false}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">Informacoes do usuario</h2>
                {userInfo.isPremium && <Crown className="h-6 w-6 text-amber-300" />}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoTile label="Nome" value={userInfo.userName || 'Nao informado'} />
                <InfoTile label="Nivel" value={userInfo.level} valueColor="#60a5fa" />
                <InfoTile label="XP total" value={userInfo.xp} valueColor="#f472b6" icon={<Zap className="h-4 w-4 text-pink-300" />} />
                <InfoTile label="Moedas" value={userInfo.coins} valueColor="#facc15" icon={<Coins className="h-4 w-4 text-amber-300" />} />
                <InfoTile
                  label="XP semanal / mensal"
                  value={`${userInfo.weeklyXP} / ${userInfo.monthlyXP}`}
                  helper="acumulado"
                  className="sm:col-span-2"
                />
              </div>
            </GradientCard>
          )}

          {userInfo && (
            <GradientCard hover={false}>
              <h2 className="mb-5 text-xl font-bold">Gerenciar recursos</h2>

              <div className="space-y-5">
                <ActionField
                  label="Definir XP"
                  icon={<Zap className="h-4 w-4 text-pink-300" />}
                  value={xpAmount}
                  onChange={setXpAmount}
                  placeholder="Ex: 5000"
                  onApply={() => void handleSetXP()}
                  buttonText="Definir"
                  loading={loading}
                />
                <ActionField
                  label="Definir moedas"
                  icon={<Coins className="h-4 w-4 text-amber-300" />}
                  value={coinsAmount}
                  onChange={setCoinsAmount}
                  placeholder="Ex: 1000"
                  onApply={() => void handleSetCoins()}
                  buttonText="Definir"
                  loading={loading}
                />
                <ActionField
                  label="Definir nivel"
                  icon={<TrendingUp className="h-4 w-4 text-cyan-200" />}
                  value={levelAmount}
                  onChange={setLevelAmount}
                  placeholder="Ex: 50"
                  onApply={() => void handleSetLevel()}
                  buttonText="Definir"
                  loading={loading}
                />
              </div>
            </GradientCard>
          )}
        </div>

        <div className="space-y-6">
          <GradientCard hover={false}>
            <h3 className="mb-3 flex items-center gap-2 font-bold text-cyan-200">
              <CheckCircle className="h-5 w-5" />
              Seu Admin ID
            </h3>
            <code className="block rounded-lg border p-3 text-xs" style={{ borderColor: 'rgba(139, 161, 203, 0.24)', background: 'rgba(8, 17, 33, 0.66)', color: 'var(--color-text)' }}>
              {user.id}
            </code>
            <Button
              onClick={() => {
                if (user.id) {
                  void navigator.clipboard.writeText(user.id)
                  setToast({ show: true, message: 'ID copiado.', type: 'success' })
                }
              }}
              variant="ghost"
              icon={<Copy className="h-4 w-4" />}
              className="mt-3 w-full"
            >
              Copiar ID
            </Button>
          </GradientCard>

          {userInfo && (
            <GradientCard hover={false}>
              <h3 className="mb-4 flex items-center gap-2 font-bold text-amber-300">
                <Crown className="h-5 w-5" />
                Premium
              </h3>

              {!userInfo.isPremium ? (
                <Button
                  onClick={() => void handleActivatePremium()}
                  disabled={loading}
                  className="w-full"
                  style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', borderColor: '#f59e0b', color: '#ffffff' }}
                  icon={<Crown className="h-4 w-4" />}
                >
                  Ativar premium
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border p-3 text-center" style={{ borderColor: 'rgba(245, 158, 11, 0.35)', background: 'rgba(120, 53, 15, 0.25)' }}>
                    <Crown className="mx-auto mb-1 h-7 w-7 text-amber-300" />
                    <p className="font-bold text-amber-200">Premium ativo</p>
                  </div>
                  <Button
                    onClick={() => void handleDeactivatePremium()}
                    disabled={loading}
                    variant="ghost"
                    className="w-full border"
                    style={{ borderColor: 'rgba(248, 113, 113, 0.5)', color: '#fca5a5' }}
                    icon={<X className="h-4 w-4" />}
                  >
                    Remover premium
                  </Button>
                </div>
              )}
            </GradientCard>
          )}

          {userInfo && (
            <GradientCard hover={false}>
              <h3 className="mb-2 flex items-center gap-2 font-bold text-rose-300">
                <AlertTriangle className="h-5 w-5" />
                Zona de risco
              </h3>
              <p className="mb-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Acao irreversivel.
              </p>
              <Button
                onClick={() => void handleResetProgress()}
                disabled={loading}
                variant="ghost"
                className="w-full border"
                style={{ borderColor: 'rgba(248, 113, 113, 0.5)', color: '#fca5a5' }}
                icon={<RefreshCw className="h-4 w-4" />}
              >
                Resetar progresso
              </Button>
            </GradientCard>
          )}
        </div>
      </div>
    </div>
  )
}

interface InfoTileProps {
  label: string
  value: string | number
  helper?: string
  icon?: ReactNode
  valueColor?: string
  className?: string
}

function InfoTile({ label, value, helper, icon, valueColor, className = '' }: InfoTileProps) {
  return (
    <div className={`glass rounded-lg border p-4 ${className}`}>
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold" style={{ color: valueColor || 'var(--color-text)' }}>
        {value}
      </p>
      {helper && (
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {helper}
        </p>
      )}
    </div>
  )
}

interface ActionFieldProps {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder: string
  onApply: () => void
  buttonText: string
  loading: boolean
}

function ActionField({ label, icon, value, onChange, placeholder, onApply, buttonText, loading }: ActionFieldProps) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
        {icon}
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="number"
          disabled={loading}
        />
        <Button onClick={onApply} disabled={loading || !value} size="sm" className="min-w-[92px]">
          {buttonText}
        </Button>
      </div>
    </div>
  )
}
