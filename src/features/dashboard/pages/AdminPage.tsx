import { useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button, Toast, Input } from '@/shared/ui'
import { activatePremium, deactivatePremium, getUserProgress } from '@/services/progress.service'
import { Shield, Crown, X, CheckCircle, Copy } from 'lucide-react'

export function AdminPage() {
  const { user } = useAuth()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
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
              Painel Admin
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Gerencie premium de usuários
            </p>
          </div>
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
              🔒 Área Administrativa
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Esta página permite ativar/desativar premium para qualquer usuário. Use com responsabilidade.
            </p>
          </div>
        </div>
      </div>

      {/* Your User ID */}
      <div 
        className="mb-8 p-6 rounded-xl border"
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          borderColor: 'rgba(59, 130, 246, 0.2)'
        }}
      >
        <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#3b82f6' }}>
          <CheckCircle className="w-5 h-5" />
          Seu User ID (Admin)
        </h3>
        <div className="flex items-center gap-3">
          <code 
            className="flex-1 p-3 rounded-lg font-mono text-sm"
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
                  message: '✅ User ID copiado!',
                  type: 'success'
                })
              }
            }}
            variant="ghost"
            icon={<Copy className="w-4 h-4" />}
            style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}
          >
            Copiar
          </Button>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--color-text-secondary)' }}>
          💡 Use este ID para se adicionar como admin em <code style={{ color: '#3b82f6' }}>src/services/admin.service.ts</code>
        </p>
      </div>

      {/* Search User */}
      <div 
        className="p-6 rounded-xl border mb-6"
        style={{ 
          background: 'var(--color-background-secondary)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
          1. Buscar Usuário
        </h2>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="User ID (Firebase Auth UID)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Ex: abc123xyz789..."
              disabled={loading}
            />
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              💡 Dica: Você pode encontrar o User ID no Firestore Console, na collection "userProgress"
            </p>
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleSearchUser}
              disabled={loading || !userId.trim()}
              variant="primary"
              style={{ 
                background: 'var(--color-primary)',
                minWidth: '120px'
              }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>
      </div>

      {/* User Info */}
      {userInfo && (
        <div 
          className="p-6 rounded-xl border mb-6"
          style={{ 
            background: 'var(--color-background-secondary)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            2. Informações do Usuário
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Nome:
              </span>
              <span style={{ color: 'var(--color-text)' }}>
                {userInfo.userName || 'Não informado'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Nível:
              </span>
              <span style={{ color: 'var(--color-text)' }}>
                {userInfo.level}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                XP:
              </span>
              <span style={{ color: 'var(--color-text)' }}>
                {userInfo.xp}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Moedas:
              </span>
              <span style={{ color: 'var(--color-text)' }}>
                {userInfo.coins}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Status Premium:
              </span>
              {userInfo.isPremium ? (
                <span 
                  className="flex items-center gap-1 px-3 py-1 rounded-full font-bold"
                  style={{ 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: 'white'
                  }}
                >
                  <Crown className="w-4 h-4" />
                  Premium Ativo
                </span>
              ) : (
                <span 
                  className="flex items-center gap-1 px-3 py-1 rounded-full font-bold"
                  style={{ 
                    background: 'rgba(156, 163, 175, 0.2)',
                    color: '#9ca3af'
                  }}
                >
                  Free
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {userInfo && (
        <div 
          className="p-6 rounded-xl border"
          style={{ 
            background: 'var(--color-background-secondary)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            3. Ações
          </h2>

          <div className="flex flex-wrap gap-4">
            {!userInfo.isPremium ? (
              <Button
                onClick={handleActivatePremium}
                disabled={loading}
                variant="primary"
                className="flex-1"
                style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: 'white'
                }}
                icon={<Crown className="w-4 h-4" />}
              >
                {loading ? 'Ativando...' : 'Ativar Premium Vitalício'}
              </Button>
            ) : (
              <Button
                onClick={handleDeactivatePremium}
                disabled={loading}
                variant="ghost"
                className="flex-1 border-2"
                style={{ 
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  color: '#ef4444'
                }}
                icon={<X className="w-4 h-4" />}
              >
                {loading ? 'Removendo...' : 'Remover Premium'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div 
        className="mt-8 p-6 rounded-xl border"
        style={{ 
          background: 'rgba(59, 130, 246, 0.05)',
          borderColor: 'rgba(59, 130, 246, 0.2)'
        }}
      >
        <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#3b82f6' }}>
          <CheckCircle className="w-5 h-5" />
          Como usar:
        </h3>
        <ol className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <li>
            <strong>1.</strong> Acesse o Firebase Console → Firestore Database
          </li>
          <li>
            <strong>2.</strong> Abra a collection "userProgress"
          </li>
          <li>
            <strong>3.</strong> Copie o "Document ID" do usuário que você quer dar premium
          </li>
          <li>
            <strong>4.</strong> Cole o ID no campo acima e clique em "Buscar"
          </li>
          <li>
            <strong>5.</strong> Clique em "Ativar Premium Vitalício"
          </li>
        </ol>
      </div>
    </div>
  )
}
