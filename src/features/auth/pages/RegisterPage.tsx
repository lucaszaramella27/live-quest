import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    } else {
      // Redireciona para login (que tem tabs de login/cadastro)
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  return null
}
