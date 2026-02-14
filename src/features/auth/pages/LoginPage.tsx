import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/services/auth.service'
import { Button, Toast } from '@/shared/ui'
import { Mail, Lock, User, Sparkles } from 'lucide-react'

type AuthMode = 'login' | 'register'

export function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' })
  const navigate = useNavigate()
  const { user } = useAuth()

  if (user) {
    navigate('/dashboard')
    return null
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ show: true, message, type })
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true)
      await signInWithGoogle()
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Erro ao fazer login:', error)
      showToast(error.message || 'Erro ao fazer login com Google', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    
    if (mode === 'register' && displayName.length < 3) {
      showToast('Nome deve ter no mínimo 3 caracteres', 'error')
      return
    }

    if (password.length < 6) {
      showToast('Senha deve ter no mínimo 6 caracteres', 'error')
      return
    }

    try {
      setLoading(true)
      
      if (mode === 'login') {
        await signInWithEmail(email, password)
        showToast('Login realizado com sucesso!', 'success')
      } else {
        await signUpWithEmail(email, password, displayName)
        showToast('Conta criada com sucesso!', 'success')
      }
      
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Erro na autenticação:', error)
      const errorMessage = error.code === 'auth/email-already-in-use' 
        ? 'Este email já está em uso'
        : error.code === 'auth/invalid-email'
        ? 'Email inválido'
        : error.code === 'auth/user-not-found'
        ? 'Usuário não encontrado'
        : error.code === 'auth/wrong-password'
        ? 'Senha incorreta'
        : error.message || 'Erro ao processar autenticação'
      
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="flex flex-col items-center mb-6">
              <div className="transition-all duration-300 hover:scale-110 hover:animate-pulse cursor-pointer mb-3">
                <img src="/logo.png" alt="LiveQuest Logo" className="w-32 h-32" />
              </div>
              <span className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                LiveQuest
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h1>
            <p className="flex items-center gap-2 justify-center" style={{ color: 'var(--color-text-secondary)' }}>
              <Sparkles className="w-4 h-4" />
              {mode === 'login' ? 'Continue sua jornada épica' : 'Comece sua jornada épica'}
            </p>
          </div>

          {/* Auth Card */}
          <div 
            className="backdrop-blur-xl rounded-3xl p-8 shadow-2xl animate-scale-in border"
            style={{ 
              background: 'var(--color-background-secondary)',
              borderColor: 'rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Tabs */}
            <div className="flex gap-2 mb-8 p-1.5 rounded-2xl" style={{ background: 'var(--color-background-tertiary)' }}>
              <button
                onClick={() => setMode('login')}
                className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300"
                style={{
                  background: mode === 'login' ? '#3b82f6' : 'transparent',
                  color: mode === 'login' ? '#ffffff' : 'var(--color-text-secondary)'
                }}
              >
                Login
              </button>
              <button
                onClick={() => setMode('register')}
                className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300"
                style={{
                  background: mode === 'register' ? '#3b82f6' : 'transparent',
                  color: mode === 'register' ? '#ffffff' : 'var(--color-text-secondary)'
                }}
              >
                Cadastro
              </button>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'register' && (
                <div className="relative animate-fade-in-up">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl transition-all outline-none border"
                    style={{
                      background: 'var(--color-background-tertiary)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'var(--color-text)'
                    }}
                  />
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl transition-all outline-none border"
                  style={{
                    background: 'var(--color-background-tertiary)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl transition-all outline-none border"
                  style={{
                    background: 'var(--color-background-tertiary)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                variant="primary"
                size="lg"
                className="w-full mt-6"
                style={{ background: '#3b82f6', color: '#ffffff' }}
              >
                {mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4" style={{ background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' }}>ou</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 border hover:shadow-md disabled:opacity-50"
              style={{
                background: '#ffffff',
                color: '#3c4043',
                borderColor: '#dadce0'
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>

            {/* Extra Info */}
            {mode === 'register' && (
              <p className="text-xs text-center mt-4" style={{ color: 'var(--color-text-secondary)' }}>
                Ao criar uma conta, você concorda com nossos termos de uso
              </p>
            )}
          </div>

          {/* Footer Text */}
          <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Feito com 💜 para streamers que querem crescer
          </p>
        </div>
      </div>

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}
