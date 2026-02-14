import { useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button, Toast } from '@/shared/ui'
import { activatePremium, getUserProgress, isPremiumActive } from '@/services/progress.service'
import { 
  Crown, 
  Check,
  Target,
  Calendar,
  TrendingUp,
  Users,
  BarChart3,
  Sparkles,
  Zap
} from 'lucide-react'

export function PlansPage() {
  const { user } = useAuth()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [activating, setActivating] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  })

  const handleActivatePremium = async () => {
    if (!user) return
    
    setActivating(true)
    try {
      await activatePremium(user.id, 'lifetime')
      
      // Verify activation
      const progress = await getUserProgress(user.id)
      const isActive = isPremiumActive(progress)
      
      if (isActive) {
        setToast({
          show: true,
          message: '🎉 Premium ativado com sucesso! Aproveite todos os recursos!',
          type: 'success'
        })
        
        // Reload page after 2 seconds to update UI
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setToast({
          show: true,
          message: '⚠️ Erro ao verificar ativação. Tente novamente.',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Erro ao ativar premium:', error)
      setToast({
        show: true,
        message: '❌ Erro ao ativar premium. Tente novamente.',
        type: 'error'
      })
    } finally {
      setActivating(false)
    }
  }

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Para começar sua jornada',
      features: [
        { text: 'Até 5 metas ativas', included: true },
        { text: 'Checklist diário', included: true },
        { text: 'Calendário de lives', included: true },
        { text: 'Streak tracking básico', included: true },
        { text: 'Análises avançadas', included: false },
        { text: 'Metas ilimitadas', included: false },
        { text: 'Suporte prioritário', included: false },
        { text: 'Temas personalizados', included: false },
      ],
      cta: 'Plano Atual',
      highlighted: false,
    },
    {
      name: 'Premium',
      price: { monthly: 19.90, yearly: 199.00 },
      description: 'Para streamers sérios',
      badge: 'Mais Popular',
      features: [
        { text: 'Metas ilimitadas', included: true },
        { text: 'Checklist diário avançado', included: true },
        { text: 'Calendário inteligente', included: true },
        { text: 'Streak tracking premium', included: true },
        { text: 'Análises e relatórios', included: true },
        { text: 'Gráficos de crescimento', included: true },
        { text: 'Suporte prioritário', included: true },
        { text: 'Temas personalizados', included: true },
      ],
      cta: 'Fazer Upgrade',
      highlighted: true,
    },
  ]

  return (
    <div>
      {/* Dev Mode: Activate Premium Banner */}
      <div className="mb-8 p-6 rounded-2xl border relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
        borderColor: 'rgba(251, 191, 36, 0.3)'
      }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5" style={{ color: '#f59e0b' }} />
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                Modo Desenvolvimento
              </h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Ative o Premium gratuitamente para testar todos os recursos da plataforma
            </p>
          </div>
          <Button
            onClick={handleActivatePremium}
            disabled={activating}
            variant="primary"
            className="flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: 'white'
            }}
            icon={<Crown className="w-4 h-4" />}
          >
            {activating ? 'Ativando...' : 'Ativar Premium'}
          </Button>
        </div>
      </div>

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Page Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Crown className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Escolha seu <span className="bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">plano</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Desbloqueie todo o potencial da plataforma e acelere seu crescimento como streamer
        </p>
      </div>

      <div className="space-y-8">
        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
              billingCycle === 'monthly'
                ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 relative ${
              billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Anual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              -17%
            </span>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] ${
                plan.highlighted
                  ? 'bg-brand-dark-secondary border-2 border-brand-purple/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.3)] hover:border-brand-purple/70'
                  : 'bg-brand-dark-secondary/50 border border-white/5 hover:border-white/20 hover:shadow-xl'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-brand-purple to-brand-pink px-4 py-1 rounded-full text-sm font-semibold">
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold">
                      R$ {billingCycle === 'monthly' ? plan.price.monthly : Math.round(plan.price.yearly / 12)}
                    </span>
                    <span className="text-gray-400">/mês</span>
                  </div>
                  {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      R$ {plan.price.yearly}/ano - economize R$ {(plan.price.monthly * 12 - plan.price.yearly).toFixed(2)}
                    </p>
                  )}
                </div>

                <Button
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  size="lg"
                  className={`w-full ${
                    plan.highlighted && plan.name !== 'Free'
                      ? 'hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50'
                      : ''
                  }`}
                  disabled={plan.name === 'Free'}
                >
                  {plan.cta}
                </Button>
              </div>

              <div className="space-y-4">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      feature.included
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-gray-700/50 text-gray-600'
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className={feature.included ? 'text-gray-300' : 'text-gray-600 line-through'}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Por que fazer upgrade?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: 'Metas Ilimitadas',
                description: 'Crie quantas metas quiser sem restrições e acompanhe seu progresso em detalhes'
              },
              {
                icon: BarChart3,
                title: 'Análises Avançadas',
                description: 'Visualize seu crescimento com gráficos e relatórios personalizados'
              },
              {
                icon: Calendar,
                title: 'Calendário Inteligente',
                description: 'Planeje suas lives com sugestões baseadas no seu histórico'
              },
              {
                icon: Users,
                title: 'Suporte Prioritário',
                description: 'Atendimento preferencial para resolver qualquer dúvida'
              },
              {
                icon: Sparkles,
                title: 'Temas Personalizados',
                description: 'Customize a aparência da plataforma do seu jeito'
              },
              {
                icon: TrendingUp,
                title: 'Insights de Crescimento',
                description: 'Receba dicas personalizadas para acelerar seus resultados'
              },
            ].map((feature, index) => (
              <div key={index} className="text-center p-6 bg-brand-dark-secondary/50 rounded-xl border border-white/5">
                <div className="w-14 h-14 bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-brand-purple" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Perguntas Frequentes
          </h2>
          
          <div className="space-y-4">
            {[
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim! Você pode cancelar seu plano quando quiser sem custos adicionais.'
              },
              {
                q: 'Como funciona o pagamento anual?',
                a: 'Ao escolher o plano anual, você economiza 17% e paga apenas uma vez por ano.'
              },
              {
                q: 'Há garantia de reembolso?',
                a: 'Oferecemos 7 dias de garantia. Se não ficar satisfeito, devolvemos seu dinheiro.'
              },
              {
                q: 'Posso mudar de plano depois?',
                a: 'Claro! Você pode fazer upgrade ou downgrade a qualquer momento.'
              },
            ].map((faq, index) => (
              <div key={index} className="bg-brand-dark-secondary/50 border border-white/5 rounded-xl p-6">
                <h3 className="font-semibold mb-2 text-lg">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
