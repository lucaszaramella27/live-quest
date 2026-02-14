import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/shared/ui'
import { useScrollAnimation } from '@/shared/hooks/useScrollAnimation'
import { 
  Target, CheckSquare, Flame, Trophy, TrendingUp, Calendar, Zap, Users, 
  Github, Twitter, Mail, Sparkles, Rocket, BarChart3
} from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Scroll animations
  const featuresAnim = useScrollAnimation(0.1)
  const stepsAnim = useScrollAnimation(0.1)
  const ctaAnim = useScrollAnimation(0.1)

  // Redireciona usuários logados para o dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const features = [
    {
      icon: Target,
      title: 'Metas Personalizadas',
      description: 'Defina objetivos claros como "10 lives essa semana" e acompanhe seu progresso em tempo real.'
    },
    {
      icon: CheckSquare,
      title: 'Checklist Diário',
      description: 'Organize suas tarefas diárias e ganhe XP e moedas a cada conclusão.'
    },
    {
      icon: Flame,
      title: 'Sistema de Streaks',
      description: 'Mantenha consistência e ganhe recompensas especiais ao fazer lives todos os dias.',
      badge: 'POPULAR'
    },
    {
      icon: Trophy,
      title: 'Conquistas & Títulos',
      description: 'Desbloqueie títulos raros, conquistas épicas e mostre seu progresso no ranking.',
      badge: 'NOVO'
    },
    {
      icon: Calendar,
      title: 'Calendário de Lives',
      description: 'Visualize sua atividade com um calendário interativo de streaks e lives.'
    },
    {
      icon: TrendingUp,
      title: 'Sistema de XP',
      description: 'Evolua de nível completando tarefas e alcançando suas metas de crescimento.'
    }
  ]

  const steps = [
    {
      number: '01',
      icon: Rocket,
      title: 'Cadastre-se',
      description: 'Crie sua conta em segundos com Google ou email'
    },
    {
      number: '02',
      icon: Target,
      title: 'Defina Metas',
      description: 'Configure seus objetivos de streaming e crescimento'
    },
    {
      number: '03',
      icon: Zap,
      title: 'Complete Tarefas',
      description: 'Ganhe XP, moedas e suba de nível'
    },
    {
      number: '04',
      icon: BarChart3,
      title: 'Acompanhe Progresso',
      description: 'Veja sua evolução e compare-se no ranking'
    }
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-12">
            <div className="transition-all duration-300 hover:scale-110 hover:animate-pulse cursor-pointer mb-4">
              <img src="/logo.png" alt="LiveQuest Logo" className="w-32 h-32" />
            </div>
            <span className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
              LiveQuest
            </span>
          </div>

          {/* Hero Content */}
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border" style={{ 
              background: 'var(--color-background-secondary)',
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }}>
              <Zap className="w-4 h-4" style={{ color: '#3b82f6' }} />
              <span className="text-sm font-medium" style={{ color: '#3b82f6' }}>
                Gamifique sua jornada de streaming
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight" style={{ color: 'var(--color-text)' }}>
              Transforme suas{' '}
              <span style={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                metas
              </span>
              {' '}em conquistas
            </h1>

            <p className="text-xl mb-10 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              O LiveQuest ajuda você a organizar sua rotina de streaming, 
              manter consistência e crescer como criador de conteúdo. 
              Sistema completo de gamificação com XP, moedas, conquistas e ranking.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <div className="relative inline-block">
                {/* Animated ping effect */}
                <div className="absolute inset-0 rounded-xl animate-ping opacity-20" style={{ background: '#3b82f6' }} />
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  size="lg"
                  style={{ background: '#3b82f6', color: '#ffffff' }}
                  icon={<Zap className="w-5 h-5" />}
                  className="relative"
                >
                  Começar Agora
                </Button>
              </div>
              <Button
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }}
                variant="ghost"
                size="lg"
                className="border-2"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                Saber Mais
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12 pt-12 border-t justify-center" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <Users className="w-6 h-6" style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#3b82f6' }}>100+</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Streamers Ativos</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <CheckSquare className="w-6 h-6" style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#3b82f6' }}>50k+</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Tarefas Completadas</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <Trophy className="w-6 h-6" style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#3b82f6' }}>1000+</div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Conquistas Desbloqueadas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div 
        ref={featuresAnim.ref}
        className={`py-20 border-t fade-in-up ${featuresAnim.isVisible ? 'visible' : ''}`}
        id="features" 
        style={{ 
          background: 'var(--color-background-secondary)',
          borderColor: 'rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 border" style={{ 
              background: 'var(--color-background)',
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }}>
              <Sparkles className="w-4 h-4" style={{ color: '#3b82f6' }} />
              <span className="text-sm font-medium" style={{ color: '#3b82f6' }}>
                Recursos
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Tudo que você precisa para crescer
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Ferramentas completas para organizar, gamificar e acompanhar sua evolução
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl border transition-all duration-300 hover:scale-105 hover:shadow-lg group cursor-pointer relative overflow-hidden"
                  style={{ 
                    background: 'var(--color-background)',
                    borderColor: 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  {/* Badge */}
                  {feature.badge && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-bold" style={{
                      background: feature.badge === 'NOVO' ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' : 'rgba(59, 130, 246, 0.2)',
                      color: '#ffffff',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      {feature.badge}
                    </div>
                  )}
                  
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
                  }} />
                  
                  <div className="relative z-10">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                      style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                    >
                      <Icon className="w-7 h-7" style={{ color: '#3b82f6' }} />
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                      {feature.title}
                    </h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div 
        ref={stepsAnim.ref}
        className={`py-20 fade-in-up ${stepsAnim.isVisible ? 'visible' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 border" style={{ 
              background: 'var(--color-background-secondary)',
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }}>
              <Rocket className="w-4 h-4" style={{ color: '#3b82f6' }} />
              <span className="text-sm font-medium" style={{ color: '#3b82f6' }}>
                Passo a passo
              </span>
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Como funciona
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Simples, rápido e efetivo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="text-center relative">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 relative overflow-hidden group"
                    style={{ 
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '2px solid rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <Icon className="w-8 h-8" style={{ color: '#3b82f6' }} />
                    <div className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{
                      background: '#3b82f6',
                      color: 'white'
                    }}>
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    {step.description}
                  </p>
                  
                  {/* Connecting arrow */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-8 -right-4 w-8 h-8">
                      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14m-6-6l6 6-6 6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div 
        ref={ctaAnim.ref}
        className={`py-20 border-t fade-in-up ${ctaAnim.isVisible ? 'visible' : ''}`}
        style={{ 
          background: 'var(--color-background-secondary)',
          borderColor: 'rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Users className="w-5 h-5" style={{ color: '#3b82f6' }} />
            <span style={{ color: '#3b82f6' }}>
              Junte-se a centenas de streamers
            </span>
          </div>
          
          <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            Pronto para evoluir?
          </h2>
          <p className="text-xl mb-10" style={{ color: 'var(--color-text-secondary)' }}>
            Comece gratuitamente e transforme sua jornada de streaming hoje mesmo
          </p>

          <Button
            onClick={() => navigate('/login')}
            variant="primary"
            size="lg"
            style={{ background: '#3b82f6', color: '#ffffff' }}
            icon={<Zap className="w-5 h-5" />}
          >
            Criar Conta Grátis
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t" style={{ 
        background: 'var(--color-background)',
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="transition-all duration-300 hover:scale-110 hover:animate-pulse cursor-pointer mb-3">
                  <img src="/logo.png" alt="LiveQuest Logo" className="w-20 h-20" />
                </div>
                <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  LiveQuest
                </span>
              </div>
              <p className="mb-4 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Plataforma completa de gamificação para streamers. Organize suas metas, 
                mantenha consistência e acompanhe seu crescimento de forma divertida e eficiente.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-10 h-10 rounded-lg flex items-center justify-center border transition-all hover:scale-110 hover:border-blue-500"
                  style={{ 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    background: 'var(--color-background-secondary)'
                  }}
                >
                  <Github className="w-5 h-5 group-hover:text-blue-500 transition-colors" style={{ color: 'var(--color-text-secondary)' }} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-10 h-10 rounded-lg flex items-center justify-center border transition-all hover:scale-110 hover:border-blue-500"
                  style={{ 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    background: 'var(--color-background-secondary)'
                  }}
                >
                  <Twitter className="w-5 h-5 group-hover:text-blue-500 transition-colors" style={{ color: 'var(--color-text-secondary)' }} />
                </a>
                <a
                  href="mailto:contato@livequest.com"
                  className="group w-10 h-10 rounded-lg flex items-center justify-center border transition-all hover:scale-110 hover:border-blue-500"
                  style={{ 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    background: 'var(--color-background-secondary)'
                  }}
                >
                  <Mail className="w-5 h-5 group-hover:text-blue-500 transition-colors" style={{ color: 'var(--color-text-secondary)' }} />
                </a>
              </div>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>
                Recursos
              </h3>
              <ul className="space-y-2">
                {[
                  { label: 'Metas', onClick: () => navigate('/login') },
                  { label: 'Checklist', onClick: () => navigate('/login') },
                  { label: 'Conquistas', onClick: () => navigate('/login') },
                  { label: 'Ranking', onClick: () => navigate('/login') },
                  { label: 'Loja', onClick: () => navigate('/login') }
                ].map((item, index) => (
                  <li key={index}>
                    <button
                      onClick={item.onClick}
                      className="hover:underline transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>
                Empresa
              </h3>
              <ul className="space-y-2">
                {[
                  { label: 'Sobre', onClick: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) },
                  { label: 'Blog', onClick: () => {} },
                  { label: 'Suporte', onClick: () => {} },
                  { label: 'Termos de Uso', onClick: () => {} },
                  { label: 'Privacidade', onClick: () => {} }
                ].map((item, index) => (
                  <li key={index}>
                    <button
                      onClick={item.onClick}
                      className="hover:underline transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ 
            borderColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              © 2026 LiveQuest. Feito com 💜 para streamers que querem crescer.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="text-sm hover:underline transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Status
              </button>
              <button
                onClick={() => navigate('/login')}
                className="text-sm hover:underline transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Changelog
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
