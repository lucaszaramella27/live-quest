import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader2, Twitch, XCircle } from 'lucide-react'
import { connectTwitchWithCode } from '@/services/twitch.service'
import { reportError } from '@/services/logger.service'

export function TwitchCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error) {
        setStatus('error')
        setErrorMessage(errorDescription || 'Autorizacao negada.')
        return
      }

      if (!code) {
        setStatus('error')
        setErrorMessage('Codigo de autorizacao nao encontrado.')
        return
      }

      const savedState = localStorage.getItem('twitch_auth_state')
      if (state !== savedState) {
        setStatus('error')
        setErrorMessage('Estado de autenticacao invalido.')
        return
      }

      try {
        await connectTwitchWithCode(code)
        localStorage.removeItem('twitch_auth_state')
        localStorage.removeItem('twitch_auth_user')

        setStatus('success')
        setTimeout(() => navigate('/twitch'), 1800)
      } catch (err) {
        reportError('twitch_callback_connect', err)
        setStatus('error')
        setErrorMessage('Erro ao conectar com a Twitch. Tente novamente.')
      }
    }

    void handleCallback()
  }, [navigate, searchParams])

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4" style={{ background: 'var(--color-background)' }}>
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-[0.05]" />

      <div className="surface-card relative w-full max-w-md rounded-3xl border p-8 text-center">
        <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-80" style={{ background: 'var(--gradient-overlay)' }} />

        <div className="relative">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border" style={{ borderColor: 'rgba(145, 70, 255, 0.35)', background: 'rgba(145, 70, 255, 0.2)' }}>
            {status === 'loading' && <Loader2 className="h-10 w-10 animate-spin text-[#9146FF]" />}
            {status === 'success' && <CheckCircle className="h-10 w-10 text-emerald-400" />}
            {status === 'error' && <XCircle className="h-10 w-10 text-rose-400" />}
          </div>

          {status === 'loading' && (
            <>
              <h1 className="mb-2 text-2xl font-bold">Conectando com a Twitch...</h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>Aguarde enquanto finalizamos a integracao.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1 className="mb-2 text-2xl font-bold text-emerald-400">Conexao concluida</h1>
              <p style={{ color: 'var(--color-text-secondary)' }}>Sua conta foi vinculada. Redirecionando...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="mb-2 text-2xl font-bold text-rose-400">Erro de conexao</h1>
              <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                {errorMessage}
              </p>
              <button
                onClick={() => navigate('/twitch')}
                className="rounded-xl border px-6 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: '#9146FF', borderColor: '#7c3aed', color: '#ffffff' }}
              >
                Voltar e tentar novamente
              </button>
            </>
          )}

          <div className="mt-8 flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <Twitch className="h-4 w-4" />
            <span>Integracao oficial Twitch OAuth</span>
          </div>
        </div>
      </div>
    </div>
  )
}
