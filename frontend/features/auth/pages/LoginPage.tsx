import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Lock, Mail, Sparkles, User, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/services/auth.service'
import { reportError } from '@/services/logger.service'
import { Button, Toast } from '@/shared/ui'

type AuthMode = 'login' | 'register'

interface LocationState {
  mode?: AuthMode
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const initialMode = (location.state as LocationState | null)?.mode === 'register' ? 'register' : 'login'

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  })

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    const requestedMode = (location.state as LocationState | null)?.mode
    if (requestedMode === 'login' || requestedMode === 'register') {
      setMode(requestedMode)
    }
  }, [location.state])

  const heading = useMemo(
    () => (mode === 'login' ? 'Volte para sua rotina de crescimento' : 'Crie sua conta e comece com ritmo'),
    [mode]
  )

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ show: true, message, type })
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true)
      await signInWithGoogle()
    } catch (error: any) {
      reportError('login_google_sign_in', error)
      showToast(error.message || 'Erro ao entrar com Google.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailAuth(event: React.FormEvent) {
    event.preventDefault()

    if (mode === 'register' && displayName.trim().length < 3) {
      showToast('Seu nome precisa ter pelo menos 3 caracteres.', 'error')
      return
    }

    if (password.length < 6) {
      showToast('A senha precisa ter pelo menos 6 caracteres.', 'error')
      return
    }

    try {
      setLoading(true)
      if (mode === 'login') {
        await signInWithEmail(email, password)
        showToast('Login realizado com sucesso.')
      } else {
        await signUpWithEmail(email, password, displayName.trim())
        showToast('Conta criada com sucesso.')
      }

      navigate('/dashboard')
    } catch (error: any) {
      reportError('login_email_auth', error)
      const errorCode = String(error?.code || error?.name || '')
      const errorMessage = errorCode === 'auth/email-already-in-use' || errorCode === 'user_already_exists'
        ? 'Este e-mail ja esta em uso.'
        : errorCode === 'auth/invalid-email' || errorCode === 'email_address_invalid'
          ? 'E-mail invalido.'
          : errorCode === 'auth/user-not-found'
            ? 'Usuario nao encontrado.'
            : errorCode === 'auth/wrong-password' || errorCode === 'invalid_credentials'
              ? 'Senha incorreta.'
              : 'Nao foi possivel concluir a autenticacao.'

      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-[0.06]" />
      <div
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'rgba(94, 247, 226, 0.24)' }}
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'rgba(143, 161, 255, 0.2)' }}
      />

      <div className="relative z-10 min-h-screen">
        <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 px-4 py-6 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <section className="hidden py-8 lg:flex lg:flex-col lg:justify-between">
            <button
              onClick={() => navigate('/')}
              className="inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-900/55"
              style={{ borderColor: 'rgba(139, 161, 203, 0.3)', color: 'var(--color-text-secondary)' }}
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar para home
            </button>

            <div className="max-w-xl">
              <div className="mb-7 flex items-center gap-3">
                <img src="/logo.png" alt="LiveQuest Logo" className="h-14 w-14 rounded-xl" />
                <div>
                  <p className="text-2xl font-bold text-gradient">LiveQuest</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Organize. Execute. Cresca.
                  </p>
                </div>
              </div>

              <h1 className="mb-4 text-4xl font-bold leading-tight">
                Produto para transformar rotina de criador em sistema de crescimento.
              </h1>
              <p className="mb-8 text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Planeje com clareza, execute com foco e acompanhe sua evolucao diaria em um dashboard unico.
              </p>

              <div className="space-y-3">
                {[
                  'Dashboard com progresso real em tempo real',
                  'Missao diaria com checklists e recompensas',
                  'Gamificacao orientada a consistencia, nao a ruido',
                ].map((item) => (
                  <div key={item} className="glass flex items-center gap-3 rounded-xl px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                    <Sparkles className="h-4 w-4 text-cyan-200" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              (c) 2026 LiveQuest. Built for creators.
            </p>
          </section>

          <section className="flex items-center justify-center py-6 lg:py-10">
            <div className="surface-card w-full max-w-md rounded-2xl border p-6 sm:p-8">
              <button
                onClick={() => navigate('/')}
                className="mb-5 inline-flex items-center gap-1 text-sm lg:hidden"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>

              <h2 className="mb-2 text-2xl font-bold">{heading}</h2>
              <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {mode === 'login' ? 'Acesse sua conta para continuar.' : 'Crie sua conta em menos de 1 minuto.'}
              </p>

              <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl p-1.5" style={{ background: 'rgba(7, 16, 30, 0.78)' }}>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200"
                  style={{
                    background: mode === 'login' ? 'var(--gradient-primary)' : 'transparent',
                    color: mode === 'login' ? '#031320' : 'var(--color-text-secondary)',
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200"
                  style={{
                    background: mode === 'register' ? 'var(--gradient-primary)' : 'transparent',
                    color: mode === 'register' ? '#031320' : 'var(--color-text-secondary)',
                  }}
                >
                  Cadastro
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleEmailAuth}>
                {mode === 'register' && (
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
                      Nome
                    </span>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        required
                        className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm focus:border-cyan-200/75 focus:outline-none focus:ring-4 focus:ring-cyan-300/15"
                        style={{
                          background: 'linear-gradient(145deg, rgba(11, 22, 41, 0.78), rgba(8, 17, 33, 0.82))',
                          borderColor: 'rgba(139, 161, 203, 0.28)',
                        }}
                        placeholder="Seu nome"
                      />
                    </div>
                  </label>
                )}

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
                    E-mail
                  </span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm focus:border-cyan-200/75 focus:outline-none focus:ring-4 focus:ring-cyan-300/15"
                      style={{
                        background: 'linear-gradient(145deg, rgba(11, 22, 41, 0.78), rgba(8, 17, 33, 0.82))',
                        borderColor: 'rgba(139, 161, 203, 0.28)',
                      }}
                      placeholder="voce@email.com"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
                    Senha
                  </span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm focus:border-cyan-200/75 focus:outline-none focus:ring-4 focus:ring-cyan-300/15"
                      style={{
                        background: 'linear-gradient(145deg, rgba(11, 22, 41, 0.78), rgba(8, 17, 33, 0.82))',
                        borderColor: 'rgba(139, 161, 203, 0.28)',
                      }}
                      placeholder="Minimo 6 caracteres"
                    />
                  </div>
                </label>

                <Button
                  type="submit"
                  loading={loading}
                  size="lg"
                  className="mt-2 w-full"
                  icon={<Zap className="h-4 w-4" />}
                >
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-700/65" />
                <span className="text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-secondary)' }}>
                  ou
                </span>
                <div className="h-px flex-1 bg-slate-700/65" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: '#f8fafc',
                  borderColor: '#d1d5db',
                  color: '#0f172a',
                }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar com Google
              </button>

              <p className="mt-5 text-center text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Ao continuar, voce concorda com nossos <Link to="/terms" className="underline">termos</Link> e <Link to="/privacy" className="underline">politica de privacidade</Link>.
              </p>
            </div>
          </section>
        </div>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, show: false }))}
      />
    </div>
  )
}
