import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/shared/ui'
import { useScrollAnimation } from '@/shared/hooks/useScrollAnimation'
import { 
  Target, CheckSquare, Flame, Trophy, TrendingUp, Calendar, Zap, Users, 
  Github, Twitter, Mail, Sparkles, Rocket, BarChart3, Star, Crown, Award,
  Activity, Gift, Heart, Lightbulb, ArrowRight, Play, ChevronDown
} from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isHovering, setIsHovering] = useState(false)
  
  // Typing effect states
  const [typedText1, setTypedText1] = useState('')
  const [typedText2, setTypedText2] = useState('')
  const [showCursor1, setShowCursor1] = useState(true)
  const [showCursor2, setShowCursor2] = useState(false)
  
  const fullText1 = 'Transforme suas metas'
  const fullText2 = 'em conquistas épicas'
  
  // Scroll animations
  const featuresAnim = useScrollAnimation(0.1)
  const stepsAnim = useScrollAnimation(0.1)
  const ctaAnim = useScrollAnimation(0.1)

  // Typing effect
  useEffect(() => {
    let timeout1: NodeJS.Timeout
    let timeout2: NodeJS.Timeout
    
    // Type first line
    if (typedText1.length < fullText1.length) {
      timeout1 = setTimeout(() => {
        setTypedText1(fullText1.slice(0, typedText1.length + 1))
      }, 80)
    } else {
      // Hide first cursor and start second line
      setShowCursor1(false)
      setShowCursor2(true)
      
      if (typedText2.length < fullText2.length) {
        timeout2 = setTimeout(() => {
          setTypedText2(fullText2.slice(0, typedText2.length + 1))
        }, 80)
      } else {
        // Hide second cursor when done
        setTimeout(() => setShowCursor2(false), 500)
      }
    }
    
    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
    }
  }, [typedText1, typedText2])

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
      description: 'Defina objetivos claros como "10 lives essa semana" e acompanhe seu progresso em tempo real.',
      color: '#3b82f6',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: CheckSquare,
      title: 'Checklist Diário',
      description: 'Organize suas tarefas diárias e ganhe XP e moedas a cada conclusão.',
      color: '#8b5cf6',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      icon: Flame,
      title: 'Sistema de Streaks',
      description: 'Mantenha consistência e ganhe recompensas especiais ao fazer lives todos os dias.',
      badge: 'POPULAR',
      color: '#f59e0b',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      icon: Trophy,
      title: 'Conquistas & Títulos',
      description: 'Desbloqueie títulos raros, conquistas épicas e mostre seu progresso no ranking.',
      badge: 'NOVO',
      color: '#eab308',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: Calendar,
      title: 'Calendário de Lives',
      description: 'Visualize sua atividade com um calendário interativo de streaks e lives.',
      color: '#10b981',
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: TrendingUp,
      title: 'Sistema de XP',
      description: 'Evolua de nível completando tarefas e alcançando suas metas de crescimento.',
      color: '#06b6d4',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: Crown,
      title: 'Ranking Global',
      description: 'Compare-se com outros streamers e dispute o topo da classificação.',
      color: '#ec4899',
      gradient: 'from-pink-500 to-pink-600'
    },
    {
      icon: Gift,
      title: 'Loja de Recompensas',
      description: 'Troque suas moedas por temas exclusivos, avatares e benefícios premium.',
      color: '#f43f5e',
      gradient: 'from-rose-500 to-rose-600'
    },
    {
      icon: Activity,
      title: 'Dashboard Analítico',
      description: 'Visualize todas as suas métricas, progresso e estatísticas em um só lugar.',
      color: '#6366f1',
      gradient: 'from-indigo-500 to-indigo-600'
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
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--color-background)' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden min-h-screen flex items-center">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated gradient orbs */}
          <div 
            className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
            style={{ 
              top: '10%',
              left: '10%',
              background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)'
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
            style={{ 
              top: '40%',
              right: '10%',
              background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)'
            }}
          />
          <div 
            className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-20"
            style={{ 
              bottom: '10%',
              left: '50%',
              background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)'
            }}
          />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 py-20">
          {/* Logo com animação */}
          <div className="flex flex-col items-center text-center mb-8">
            <div 
              className="relative group cursor-pointer mb-4"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <img 
                src="/logo.png" 
                alt="LiveQuest Logo" 
                className="w-32 h-32 relative z-10 transition-all duration-500"
                style={{
                  transform: isHovering ? 'scale(1.1)' : 'scale(1)',
                  filter: isHovering ? 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.2))'
                }}
              />
            </div>
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500">
              LiveQuest
            </span>
          </div>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge animado */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border backdrop-blur-sm" style={{ 
              background: 'rgba(59, 130, 246, 0.1)',
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }}>
              <Sparkles className="w-4 h-4" style={{ color: '#3b82f6' }} />
              <span className="text-sm font-medium relative z-10" style={{ color: '#3b82f6' }}>
                ✨ Gamifique sua jornada de streaming
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-6xl sm:text-7xl font-bold mb-8 leading-tight min-h-[220px] sm:min-h-[280px]">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                {typedText1}
                {showCursor1 && (
                  <span className="animate-pulse" style={{ color: '#8b5cf6' }}>|</span>
                )}
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500">
                {typedText2}
                {showCursor2 && (
                  <span className="animate-pulse" style={{ color: '#f59e0b' }}>|</span>
                )}
              </span>
            </h1>

            <p className="text-xl mb-12 leading-relaxed max-w-3xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              O LiveQuest ajuda você a <strong style={{ color: 'var(--color-text)' }}>organizar sua rotina de streaming</strong>, 
              manter <strong style={{ color: 'var(--color-text)' }}>consistência</strong> e 
              crescer como criador de conteúdo. Sistema completo de gamificação com <strong style={{ color: '#3b82f6' }}>XP</strong>, 
              <strong style={{ color: '#f59e0b' }}> moedas</strong>, <strong style={{ color: '#eab308' }}>conquistas</strong> e 
              <strong style={{ color: '#ec4899' }}> ranking</strong>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center mb-16">
              <div className="relative group">
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  size="lg"
                  className="relative hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                  style={{ 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    padding: '1rem 2.5rem',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}
                  icon={<Zap className="w-5 h-5" />}
                >
                  Começar Agora - Grátis
                </Button>
              </div>
              
              <Button
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }}
                variant="ghost"
                size="lg"
                className="border-2 hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                style={{ 
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  background: 'rgba(59, 130, 246, 0.05)',
                  padding: '1rem 2.5rem',
                  fontSize: '1.125rem'
                }}
                icon={<Play className="w-5 h-5" />}
              >
                Ver Demo
              </Button>
            </div>

            {/* Animated scroll indicator */}
            <div className="flex flex-col items-center gap-2 animate-bounce">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Role para descobrir mais
              </span>
              <ChevronDown className="w-6 h-6" style={{ color: '#3b82f6' }} />
            </div>

            {/* Stats - redesenhadas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {[
                { icon: Users, value: '500+', label: 'Streamers Ativos', color: '#3b82f6' },
                { icon: CheckSquare, value: '100k+', label: 'Tarefas Completadas', color: '#8b5cf6' },
                { icon: Trophy, value: '5000+', label: 'Conquistas Desbloqueadas', color: '#f59e0b' }
              ].map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div
                    key={index}
                    className="group p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:-translate-y-2 cursor-pointer relative overflow-hidden"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {/* Hover gradient */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{
                      background: `linear-gradient(135deg, ${stat.color} 0%, transparent 100%)`
                    }} />
                    
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300"
                        style={{ 
                          background: `${stat.color}20`,
                          boxShadow: `0 0 20px ${stat.color}40`
                        }}
                      >
                        <Icon className="w-8 h-8" style={{ color: stat.color }} />
                      </div>
                      <div className="text-4xl font-bold" style={{ color: stat.color }}>
                        {stat.value}
                      </div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        {stat.label}
                      </div>
                    </div>
                  </div>
                )
              })}
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
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border backdrop-blur-sm" style={{ 
              background: 'rgba(139, 92, 246, 0.1)',
              borderColor: 'rgba(139, 92, 246, 0.3)'
            }}>
              <Star className="w-4 h-4" style={{ color: '#8b5cf6' }} />
              <span className="text-sm font-medium" style={{ color: '#8b5cf6' }}>
                Recursos Completos
              </span>
            </div>
            
            <h2 className="text-5xl font-bold mb-6">
              <span style={{ color: 'var(--color-text)' }}>Tudo que você </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                precisa
              </span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Sistema completo de gamificação para transformar sua rotina de streaming em uma jornada épica
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group p-6 rounded-2xl border backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer relative overflow-hidden"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Badge */}
                  {feature.badge && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-bold z-20" style={{
                      background: feature.badge === 'NOVO' ? feature.gradient : `${feature.color}40`,
                      color: '#ffffff',
                      border: `1px solid ${feature.color}60`
                    }}>
                      {feature.badge}
                    </div>
                  )}
                  
                  {/* Animated gradient background on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                    style={{
                      background: feature.gradient
                    }}
                  />
                  
                  {/* Glow effect on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"
                    style={{
                      background: feature.color,
                      transform: 'scale(0.8)'
                    }}
                  />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 group-hover:rotate-3"
                      style={{ 
                        background: `${feature.color}20`,
                        boxShadow: `0 0 20px ${feature.color}30`
                      }}
                    >
                      <Icon className="w-7 h-7" style={{ color: feature.color }} />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-white transition-colors duration-300" style={{ color: 'var(--color-text)' }}>
                      {feature.title}
                    </h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {feature.description}
                    </p>
                  </div>

                  {/* Corner accent */}
                  <div 
                    className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at top right, ${feature.color} 0%, transparent 70%)`
                    }}
                  />
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border backdrop-blur-sm" style={{ 
              background: 'rgba(245, 158, 11, 0.1)',
              borderColor: 'rgba(245, 158, 11, 0.3)'
            }}>
              <Rocket className="w-4 h-4" style={{ color: '#f59e0b' }} />
              <span className="text-sm font-medium" style={{ color: '#f59e0b' }}>
                Passo a Passo
              </span>
            </div>
            <h2 className="text-5xl font-bold mb-6">
              <span style={{ color: 'var(--color-text)' }}>Como </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-500">
                funciona
              </span>
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Simples, rápido e efetivo - comece sua jornada em minutos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981']
              const gradients = [
                'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
              ]
              return (
                <div 
                  key={index} 
                  className="text-center relative group"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Number badge */}
                  <div 
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg z-10 shadow-lg"
                    style={{
                      background: gradients[index],
                      color: 'white'
                    }}
                  >
                    {step.number}
                  </div>

                  {/* Icon container */}
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-8 relative overflow-hidden group-hover:scale-110 transition-all duration-500 group-hover:rotate-3"
                    style={{ 
                      background: `${colors[index]}15`,
                      border: `2px solid ${colors[index]}40`,
                      boxShadow: `0 0 30px ${colors[index]}20`
                    }}
                  >
                    {/* Glow effect */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500"
                      style={{ background: colors[index] }}
                    />
                    <Icon className="w-9 h-9 relative z-10" style={{ color: colors[index] }} />
                  </div>

                  <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors duration-300" style={{ color: 'var(--color-text)' }}>
                    {step.title}
                  </h3>
                  <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {step.description}
                  </p>
                  
                  {/* Connecting arrow - redesigned */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-16 -right-4 w-8 h-8 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                      <ArrowRight className="w-full h-full" style={{ color: colors[index] }} />
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
        className={`py-24 border-t fade-in-up ${ctaAnim.isVisible ? 'visible' : ''} relative overflow-hidden`}
        style={{ 
          background: 'var(--color-background-secondary)',
          borderColor: 'rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
            style={{ 
              top: '50%',
              left: '20%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)'
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
            style={{ 
              top: '50%',
              right: '20%',
              transform: 'translate(50%, -50%)',
              background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)'
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          {/* Social proof badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 border backdrop-blur-sm" style={{
            background: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.3)'
          }}>
            <Users className="w-4 h-4" style={{ color: '#3b82f6' }} />
            <span className="text-sm font-medium" style={{ color: '#3b82f6' }}>
              500+ streamers já estão crescendo com LiveQuest
            </span>
            <Heart className="w-4 h-4" style={{ color: '#ec4899' }} />
          </div>
          
          <h2 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            <span style={{ color: 'var(--color-text)' }}>Pronto para </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              evoluir
            </span>
            <span style={{ color: 'var(--color-text)' }}>?</span>
          </h2>
          
          <p className="text-xl mb-12 max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Comece <strong style={{ color: 'var(--color-text)' }}>gratuitamente</strong> e transforme sua jornada de streaming hoje mesmo. 
            Sem cartão de crédito. Sem compromisso. Apenas resultados.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <div className="relative group">
              <Button
                onClick={() => navigate('/login')}
                variant="primary"
                size="lg"
                className="relative hover:scale-110 transition-all duration-300 shadow-2xl"
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  color: '#ffffff',
                  padding: '1.25rem 3rem',
                  fontSize: '1.125rem',
                  fontWeight: '600'
                }}
                icon={<Zap className="w-5 h-5" />}
              >
                Começar Agora - É Grátis
              </Button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
            {[
              { icon: Trophy, text: '100% Grátis', color: '#f59e0b' },
              { icon: Lightbulb, text: 'Sem Cartão', color: '#3b82f6' },
              { icon: Heart, text: 'Suporte Dedicado', color: '#ec4899' }
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="flex items-center gap-2 group cursor-pointer">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    style={{ 
                      background: `${item.color}20`,
                      boxShadow: `0 0 15px ${item.color}20`
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.text}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t relative overflow-hidden" style={{ 
        background: 'var(--color-background)',
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }}>
        {/* Subtle background gradient */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute w-96 h-96 rounded-full blur-3xl"
            style={{ 
              top: '50%',
              left: '10%',
              background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)'
            }}
          />
          <div 
            className="absolute w-96 h-96 rounded-full blur-3xl"
            style={{ 
              bottom: '0',
              right: '10%',
              background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)'
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="group cursor-pointer">
                  <img 
                    src="/logo.png" 
                    alt="LiveQuest Logo" 
                    className="w-16 h-16 group-hover:scale-110 transition-transform duration-300"
                    style={{
                      filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))'
                    }}
                  />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                  LiveQuest
                </span>
              </div>
              
              <p className="mb-6 max-w-md leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Plataforma completa de gamificação para streamers. Organize suas metas, 
                mantenha consistência e acompanhe seu crescimento de forma divertida e eficiente.
              </p>
              
              <div className="flex gap-3">
                {[
                  { icon: Github, href: 'https://github.com', color: '#ffffff' },
                  { icon: Twitter, href: 'https://twitter.com', color: '#1da1f2' },
                  { icon: Mail, href: 'mailto:contato@livequest.com', color: '#ea4335' }
                ].map((social, index) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                      style={{ 
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      <Icon 
                        className="w-5 h-5 transition-colors duration-300" 
                        style={{ color: 'var(--color-text-secondary)' }}
                      />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="font-bold mb-5 text-lg flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Target className="w-5 h-5" style={{ color: '#3b82f6' }} />
                Recursos
              </h3>
              <ul className="space-y-3">
                {[
                  { label: 'Metas & Planos', icon: Target },
                  { label: 'Checklist Diário', icon: CheckSquare },
                  { label: 'Conquistas', icon: Award },
                  { label: 'Ranking Global', icon: Trophy },
                  { label: 'Loja de Items', icon: Sparkles }
                ].map((item, index) => {
                  const Icon = item.icon
                  return (
                    <li key={index}>
                      <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 hover:gap-3 transition-all duration-300 group"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <Icon className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                        <span className="group-hover:text-white">{item.label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="font-bold mb-5 text-lg flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Lightbulb className="w-5 h-5" style={{ color: '#f59e0b' }} />
                Empresa
              </h3>
              <ul className="space-y-3">
                {[
                  'Sobre Nós',
                  'Blog & Novidades',
                  'Suporte & FAQ',
                  'Termos de Uso',
                  'Privacidade'
                ].map((item, index) => (
                  <li key={index}>
                    <button
                      onClick={() => {
                        if (index === 0) {
                          document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                        }
                      }}
                      className="hover:text-white hover:translate-x-1 transition-all duration-300"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {item}
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
            <p className="text-sm flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
              © 2026 LiveQuest. Feito com <Heart className="w-4 h-4" style={{ color: '#ec4899' }} /> para streamers que querem crescer.
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/login')}
                className="text-sm hover:text-white transition-colors flex items-center gap-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
                Status: Online
              </button>
              <button
                onClick={() => navigate('/login')}
                className="text-sm hover:text-white transition-colors"
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
