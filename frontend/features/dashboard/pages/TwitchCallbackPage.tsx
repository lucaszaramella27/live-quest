import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { connectTwitchWithCode } from '@/services/twitch.service'
import { reportError } from '@/services/logger.service'
import { Twitch, CheckCircle, XCircle, Loader2 } from 'lucide-react'

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
        setErrorMessage(errorDescription || 'Autorizacao negada')
        return
      }

      if (!code) {
        setStatus('error')
        setErrorMessage('Codigo de autorizacao nao encontrado')
        return
      }

      const savedState = localStorage.getItem('twitch_auth_state')
      if (state !== savedState) {
        setStatus('error')
        setErrorMessage('Estado de autenticacao invalido')
        return
      }

      try {
        await connectTwitchWithCode(code)
        localStorage.removeItem('twitch_auth_state')
        localStorage.removeItem('twitch_auth_user')

        setStatus('success')
        setTimeout(() => navigate('/twitch'), 1800)
      } catch (err) {
        reportError('Erro no callback Twitch:', err)
        setStatus('error')
        setErrorMessage('Erro ao conectar com a Twitch. Tente novamente.')
      }
    }

    void handleCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
      <div className="text-center p-8 max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#9146FF]/20 flex items-center justify-center">
          {status === 'loading' && <Loader2 className="w-10 h-10 text-[#9146FF] animate-spin" />}
          {status === 'success' && <CheckCircle className="w-10 h-10 text-green-500" />}
          {status === 'error' && <XCircle className="w-10 h-10 text-red-500" />}
        </div>

        {status === 'loading' && (
          <>
            <h1 className="text-2xl font-bold mb-2">Conectando com a Twitch...</h1>
            <p className="text-gray-400">Aguarde enquanto configuramos sua integracao</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-green-500">Conectado com sucesso!</h1>
            <p className="text-gray-400">Sua conta foi vinculada. Redirecionando...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-red-500">Erro na conexao</h1>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <button
              onClick={() => navigate('/twitch')}
              className="px-6 py-3 bg-[#9146FF] hover:bg-[#7c3aed] rounded-xl font-semibold transition-colors"
            >
              Voltar e tentar novamente
            </button>
          </>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Twitch className="w-4 h-4" />
          <span>Integracao oficial com Twitch</span>
        </div>
      </div>
    </div>
  )
}


