import { useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button, Toast, Input } from '@/shared/ui'
import { 
  activatePremium, 
  deactivatePremium, 
  getUserProgress,
  setUserXP,
  setUserCoins,
  setUserLevel,
  resetUserProgress
} from '@/services/progress.service'
import { Shield, Crown, X, CheckCircle, Copy, Coins, Zap, TrendingUp, RefreshCw, AlertTriangle } from 'lucide-react'

export function AdminPage() {
  const { user } = useAuth()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  
  // Input states for admin actions
  const [xpAmount, setXpAmount] = useState('')
  const [coinsAmount, setCoinsAmount] = useState('')
  const [levelAmount, setLevelAmount] = useState('')
  
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  })

  const handleSearchUser = async () => {
    if (!userId.trim()) {
      setToast({
        show: true,
        message: '⚠️ Digite um User ID válido',
        type: 'error'
      })
      return
    }

    setLoading(true)
    try {
      const progress = await getUserProgress(userId.trim())
      
      if (!progress) {
        setToast({
          show: true,
          message: '❌ Usuário não encontrado',
          type: 'error'
        })
        setUserInfo(null)
      } else {
        setUserInfo(progress)
        setToast({
          show: true,
          message: '✅ Usuário encontrado!',
          type: 'success'
        })
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      setToast({
        show: true,
        message: '❌ Erro ao buscar usuário',
        type: 'error'
      })
      setUserInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const handleActivatePremium = async () => {
    if (!userId.trim()) return

    setLoading(true)
    try {
      await activatePremium(userId.trim(), 'lifetime')
      
      // Re-fetch user info
      const updatedProgress = await getUserProgress(userId.trim())
      setUserInfo(updatedProgress)
      
      setToast({
        show: true,
        message: '🎉 Premium ativado com sucesso!',
        type: 'success'
      })
    } catch (error) {
      console.error('Erro ao ativar premium:', error)
      setToast({
        show: true,
        message: '❌ Erro ao ativar premium',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivatePremium = async () => {
    if (!userId.trim()) return

    setLoading(true)
    try {
      await deactivatePremium(userId.trim())
      
      // Re-fetch user info
      const updatedProgress = await getUserProgress(userId.trim())
      setUserInfo(updatedProgress)
      
      setToast({
        show: true,
        message: '✅ Premium removido',
        type: 'success'
      })
    } catch (error) {
      console.error('Erro ao remover premium:', error)
      setToast({
        show: true,
        message: '❌ Erro ao remover premium',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetXP = async () => {
    if (!userId.trim() || !xpAmount) return

    setLoading(true)
    try {
      const success = await setUserXP(userId.trim(), parseInt(xpAmount))
      
      if (success) {
        const updatedProgress = await getUserProgress(userId.trim())
        setUserInfo(updatedProgress)
        setXpAmount('')
        
        setToast({
          show: true,
          message: `✅ XP definido para ${xpAmount}`,
          type: 'success'
        })
      } else {
        throw new Error('Falha ao definir XP')
      }
    } catch (error) {
      console.error('Erro ao definir XP:', error)
      setToast({
        show: true,
        message: '❌ Erro ao definir XP',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetCoins = async () => {
    if (!userId.trim() || !coinsAmount) return

    setLoading(true)
    try {
      const success = await setUserCoins(userId.trim(), parseInt(coinsAmount))
      
      if (success) {
        const updatedProgress = await getUserProgress(userId.trim())
        setUserInfo(updatedProgress)
        setCoinsAmount('')
        
        setToast({
          show: true,
          message: `✅ Moedas definidas para ${coinsAmount}`,
          type: 'success'
        })
      } else {
        throw new Error('Falha ao definir moedas')
      }
    } catch (error) {
      console.error('Erro ao definir moedas:', error)
      setToast({
        show: true,
        message: '❌ Erro ao definir moedas',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetLevel = async () => {
    if (!userId.trim() || !levelAmount) return

    setLoading(true)
    try {
      const success = await setUserLevel(userId.trim(), parseInt(levelAmount))
      
      if (success) {
        const updatedProgress = await getUserProgress(userId.trim())
        setUserInfo(updatedProgress)
        setLevelAmount('')
        
        setToast({
          show: true,
          message: `✅ Nível definido para ${levelAmount}`,
          type: 'success'
        })
      } else {
        throw new Error('Falha ao definir nível')
      }
    } catch (error) {
      console.error('Erro ao definir nível:', error)
      setToast({
        show: true,
        message: '❌ Erro ao definir nível',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetProgress = async () => {
    if (!userId.trim()) return
    
    const confirmed = window.confirm(
      `⚠️ ATENÇÃO!\n\nTem certeza que deseja RESETAR TODO O PROGRESSO de ${userInfo?.userName || 'este usuário'}?\n\nIsso vai:\n- Zerar XP e Nível\n- Remover todas as moedas\n- Apagar conquistas e títulos\n- Resetar XP semanal/mensal\n\nO status Premium será mantido.\n\nEsta ação NÃO PODE SER DESFEITA!`
    )
    
    if (!confirmed) return

    setLoading(true)
    try {
      const success = await resetUserProgress(userId.trim())
      
      if (success) {
        const updatedProgress = await getUserProgress(userId.trim())
        setUserInfo(updatedProgress)
        
        setToast({
          show: true,
          message: '✅ Progresso resetado com sucesso',
          type: 'success'
        })
      } else {
        throw new Error('Falha ao resetar progresso')
      }
    } catch (error) {
      console.error('Erro ao resetar progresso:', error)
      setToast({
        show: true,
        message: '❌ Erro ao resetar progresso',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshUserInfo = async () => {
    if (!userId.trim()) return
    
    setLoading(true)
    try {
      const progress = await getUserProgress(userId.trim())
      setUserInfo(progress)
      setToast({
        show: true,
        message: '✅ Dados atualizados!',
        type: 'success'
      })
    } catch (error) {
      console.error('Erro ao atualizar:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
              }}
            >
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                Painel Admin Completo
              </h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Gerencie usuários, XP, moedas, níveis e premium
              </p>
            </div>
          </div>
          {userInfo && (
            <Button
              onClick={refreshUserInfo}
              disabled={loading}
              variant="ghost"
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Atualizar
            </Button>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      <div 
        className="mb-8 p-6 rounded-xl border"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)'
        }}
      >
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 mt-0.5" style={{ color: '#ef4444' }} />
          <div>
            <h3 className="font-bold mb-1" style={{ color: '#ef4444' }}>
              🔒 Área Administrativa - Acesso Restrito
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Esta página permite controle total sobre usuários. Use com extrema responsabilidade e cuidado.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Search & User Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search User */}
          <div 
            className="p-6 rounded-xl border"
            style={{ 
              background: 'var(--color-background-secondary)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              🔍 Buscar Usuário
            </h2>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="User ID (Firebase Auth UID)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Cole o User ID aqui..."
                  disabled={loading}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSearchUser}
                  disabled={loading || !userId.trim()}
                  variant="primary"
                  style={{ minWidth: '120px' }}
                >
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          {userInfo && (
            <div 
              className="p-6 rounded-xl border"
              style={{ 
                background: 'var(--color-background-secondary)',
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  📊 Informações do Usuário
                </h2>
                {userInfo.isPremium && (
                  <Crown className="w-6 h-6 text-yellow-500 animate-pulse" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nome</p>
                  <p className="font-bold" style={{ color: 'var(--color-text)' }}>
                    {userInfo.userName || 'Não informado'}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nível</p>
                  <p className="font-bold text-2xl" style={{ color: '#3b82f6' }}>
                    {userInfo.level}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" style={{ color: '#ec4899' }} />
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>XP Total</p>
                  </div>
                  <p className="font-bold text-2xl" style={{ color: '#ec4899' }}>
                    {userInfo.xp}
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ background: 'rgba(251, 191, 36, 0.1)' }}>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Moedas</p>
                  </div>
                  <p className="font-bold text-2xl text-amber-500">
                    {userInfo.coins}
                  </p>
                </div>

                <div className="p-4 rounded-lg col-span-2" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>XP Semanal / Mensal</p>
                  <div className="flex gap-4">
                    <p className="font-bold" style={{ color: '#22c55e' }}>
                      📅 {userInfo.weeklyXP} XP
                    </p>
                    <p className="font-bold" style={{ color: '#22c55e' }}>
                      📆 {userInfo.monthlyXP} XP
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {userInfo && (
            <div 
              className="p-6 rounded-xl border"
              style={{ 
                background: 'var(--color-background-secondary)',
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
                ⚙️ Gerenciar Recursos
              </h2>

              <div className="space-y-4">
                {/* XP Management */}
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                    <Zap className="w-4 h-4 inline mr-1" style={{ color: '#ec4899' }} />
                    Definir XP
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={xpAmount}
                      onChange={(e) => setXpAmount(e.target.value)}
                      placeholder="Ex: 5000"
                      type="number"
                      disabled={loading}
                    />
                    <Button
                      onClick={handleSetXP}
                      disabled={loading || !xpAmount}
                      variant="primary"
                      style={{ background: '#ec4899', minWidth: '100px' }}
                    >
                      Definir
                    </Button>
                  </div>
                </div>

                {/* Coins Management */}
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                    <Coins className="w-4 h-4 inline mr-1 text-amber-500" />
                    Definir Moedas
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={coinsAmount}
                      onChange={(e) => setCoinsAmount(e.target.value)}
                      placeholder="Ex: 1000"
                      type="number"
                      disabled={loading}
                    />
                    <Button
                      onClick={handleSetCoins}
                      disabled={loading || !coinsAmount}
                      variant="primary"
                      style={{ background: '#f59e0b', minWidth: '100px' }}
                    >
                      Definir
                    </Button>
                  </div>
                </div>

                {/* Level Management */}
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                    <TrendingUp className="w-4 h-4 inline mr-1" style={{ color: '#3b82f6' }} />
                    Definir Nível
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={levelAmount}
                      onChange={(e) => setLevelAmount(e.target.value)}
                      placeholder="Ex: 50"
                      type="number"
                      disabled={loading}
                    />
                    <Button
                      onClick={handleSetLevel}
                      disabled={loading || !levelAmount}
                      variant="primary"
                      style={{ background: '#3b82f6', minWidth: '100px' }}
                    >
                      Definir
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          {/* Your Admin ID */}
          <div 
            className="p-6 rounded-xl border"
            style={{
              background: 'rgba(59, 130, 246, 0.05)',
              borderColor: 'rgba(59, 130, 246, 0.2)'
            }}
          >
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#3b82f6' }}>
              <CheckCircle className="w-5 h-5" />
              Seu Admin ID
            </h3>
            <code 
              className="block p-3 rounded-lg font-mono text-xs break-all"
              style={{ 
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {user?.id}
            </code>
            <Button
              onClick={() => {
                if (user?.id) {
                  navigator.clipboard.writeText(user.id)
                  setToast({
                    show: true,
                    message: '✅ ID copiado!',
                    type: 'success'
                  })
                }
              }}
              variant="ghost"
              icon={<Copy className="w-4 h-4" />}
              className="w-full mt-3"
              style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}
            >
              Copiar ID
            </Button>
          </div>

          {/* Premium Actions */}
          {userInfo && (
            <div 
              className="p-6 rounded-xl border"
              style={{
                background: 'rgba(251, 191, 36, 0.05)',
                borderColor: 'rgba(251, 191, 36, 0.2)'
              }}
            >
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#fbbf24' }}>
                <Crown className="w-5 h-5" />
                Premium
              </h3>
              
              {!userInfo.isPremium ? (
                <Button
                  onClick={handleActivatePremium}
                  disabled={loading}
                  variant="primary"
                  className="w-full"
                  style={{ 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: 'white'
                  }}
                  icon={<Crown className="w-4 h-4" />}
                >
                  Ativar Premium
                </Button>
              ) : (
                <div>
                  <div className="p-3 rounded-lg mb-3 text-center" style={{ background: 'rgba(251, 191, 36, 0.2)' }}>
                    <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                    <p className="font-bold text-yellow-500">Premium Ativo</p>
                  </div>
                  <Button
                    onClick={handleDeactivatePremium}
                    disabled={loading}
                    variant="ghost"
                    className="w-full border-2"
                    style={{ 
                      borderColor: 'rgba(239, 68, 68, 0.5)',
                      color: '#ef4444'
                    }}
                    icon={<X className="w-4 h-4" />}
                  >
                    Remover Premium
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Danger Zone */}
          {userInfo && (
            <div 
              className="p-6 rounded-xl border"
              style={{
                background: 'rgba(239, 68, 68, 0.05)',
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}
            >
              <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#ef4444' }}>
                <AlertTriangle className="w-5 h-5" />
                Zona de Perigo
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Ações irreversíveis
              </p>
              
              <Button
                onClick={handleResetProgress}
                disabled={loading}
                variant="ghost"
                className="w-full border-2"
                style={{ 
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  color: '#ef4444'
                }}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Resetar Progresso
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

