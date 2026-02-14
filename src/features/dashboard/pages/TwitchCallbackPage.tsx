import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  exchangeCodeForToken, 
  getTwitchUser, 
  saveTwitchIntegration,
  getTwitchFollowers
} from '@/services/twitch.service'
import { Twitch, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function TwitchCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Verifica se houve erro na autorização
    if (error) {
      setStatus('error')
      setErrorMessage(errorDescription || 'Autorização negada')
      return
    }

    // Verifica se temos o código
    if (!code) {
      setStatus('error')
      setErrorMessage('Código de autorização não encontrado')
      return
    }

    // Verifica o state para segurança
    const savedState = localStorage.getItem('twitch_auth_state')
    const userId = localStorage.getItem('twitch_auth_user')

    if (state !== savedState) {
      setStatus('error')
      setErrorMessage('Estado de autenticação inválido')
      return
    }

    if (!userId) {
      setStatus('error')
      setErrorMessage('Usuário não identificado')
      return
    }

    try {
      // Troca o código por tokens
      const tokens = await exchangeCodeForToken(code)
      
      // Busca informações do usuário da Twitch
      const twitchUser = await getTwitchUser(tokens.accessToken)
      
      // Busca número de seguidores
      const followers = await getTwitchFollowers(tokens.accessToken, twitchUser.id)
      
      // Salva a integração no Firestore
      await saveTwitchIntegration(userId, {
        twitchUserId: twitchUser.id,
        twitchLogin: twitchUser.login,
        twitchDisplayName: twitchUser.displayName,
        twitchProfileImage: twitchUser.profileImageUrl,
        broadcasterType: twitchUser.broadcasterType,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        totalFollowers: followers.total,
        isLive: false,
      })
      
      // Limpa dados temporários
      localStorage.removeItem('twitch_auth_state')
      localStorage.removeItem('twitch_auth_user')
      
      setStatus('success')
      
      // Redireciona após 2 segundos
      setTimeout(() => {
        navigate('/twitch')
      }, 2000)
      
    } catch (error) {
      console.error('Erro no callback:', error)
      setStatus('error')
      setErrorMessage('Erro ao conectar com a Twitch. Tente novamente.')
    }
  }

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
            <p className="text-gray-400">Aguarde enquanto configuramos sua integração</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-green-500">Conectado com sucesso!</h1>
            <p className="text-gray-400">Sua conta da Twitch foi vinculada. Redirecionando...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-red-500">Erro na conexão</h1>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <button
              onClick={() => navigate('/twitch')}
              className="px-6 py-3 bg-[#9146FF] hover:bg-[#7c3aed] rounded-xl font-semibold transition-colors"
            >
              Voltar e Tentar Novamente
            </button>
          </>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Twitch className="w-4 h-4" />
          <span>Integração oficial com Twitch</span>
        </div>
      </div>
    </div>
  )
}
