import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button, Toast } from '@/shared/ui'
import { activatePremium, getUserProgress, isPremiumActive, type UserProgress } from '@/services/progress.service'
import { createCheckoutSession, createPortalSession, type BillingCycle } from '@/services/billing.service'
import { reportError } from '@/services/logger.service'
import {
  Crown,
  Check,
  Target,
  Calendar,
  TrendingUp,
  Users,
  BarChart3,
  Sparkles,
  Zap,
} from 'lucide-react'

interface PlanFeature {
  text: string
  included: boolean
}

interface PlanItem {
  name: string
  description: string
  badge?: string
  highlighted: boolean
  cta: string
  price: { monthly: number; yearly: number }
  features: PlanFeature[]
}

export function PlansPage() {
  const { user, isAdmin } = useAuth()
  const [searchParams] = useSearchParams()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [processingCheckout, setProcessingCheckout] = useState(false)
  const [activating, setActivating] = useState(false)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  })

  useEffect(() => {
    void loadProgress()
  }, [user])

  useEffect(() => {
    const checkoutState = searchParams.get('checkout')

    if (checkoutState === 'success') {
      setToast({ show: true, message: 'Pagamento confirmado. Plano sera atualizado em instantes.', type: 'success' })
      void loadProgress()
    }

    if (checkoutState === 'cancel') {
      setToast({ show: true, message: 'Checkout cancelado. Voce pode tentar novamente.', type: 'error' })
    }
  }, [searchParams])

  async function loadProgress() {
    if (!user) return
    const progressData = await getUserProgress(user.id)
    setProgress(progressData)
  }

  const premiumActive = useMemo(() => isPremiumActive(progress), [progress])

  async function handleCheckout() {
    if (!user) return

    try {
      setProcessingCheckout(true)
      const session = await createCheckoutSession(billingCycle)
      window.location.href = session.url
    } catch (error) {
      reportError('Erro ao criar checkout:', error)
      setToast({ show: true, message: 'Erro ao iniciar checkout. Tente novamente.', type: 'error' })
    } finally {
      setProcessingCheckout(false)
    }
  }

  async function handleManageSubscription() {
    try {
      setProcessingCheckout(true)
      const portal = await createPortalSession()
      window.location.href = portal.url
    } catch (error) {
      reportError('Erro ao abrir portal de assinatura:', error)
      setToast({ show: true, message: 'Erro ao abrir gerenciamento da assinatura.', type: 'error' })
    } finally {
      setProcessingCheckout(false)
    }
  }

  async function handleAdminActivatePremium() {
    if (!user) return

    setActivating(true)
    try {
      const success = await activatePremium(user.id, 'lifetime')
      if (!success) throw new Error('activate_premium_failed')
      await loadProgress()
      setToast({ show: true, message: 'Premium ativado para ambiente interno.', type: 'success' })
    } catch (error) {
      reportError('Erro ao ativar premium:', error)
      setToast({ show: true, message: 'Erro ao ativar premium interno.', type: 'error' })
    } finally {
      setActivating(false)
    }
  }

  const plans: PlanItem[] = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Para comecar sua jornada',
      features: [
        { text: 'Ate 5 metas ativas', included: true },
        { text: 'Checklist diario', included: true },
        { text: 'Calendario de lives', included: true },
        { text: 'Streak tracking basico', included: true },
        { text: 'Analises avancadas', included: false },
        { text: 'Metas ilimitadas', included: false },
        { text: 'Suporte prioritario', included: false },
        { text: 'Temas personalizados', included: false },
      ],
      cta: 'Plano atual',
      highlighted: false,
    },
    {
      name: 'Premium',
      price: { monthly: 19.9, yearly: 199.0 },
      description: 'Para streamers que tratam crescimento como negocio',
      badge: 'Mais popular',
      features: [
        { text: 'Metas ilimitadas', included: true },
        { text: 'Checklist diario avancado', included: true },
        { text: 'Calendario inteligente', included: true },
        { text: 'Streak tracking premium', included: true },
        { text: 'Analises e relatorios', included: true },
        { text: 'Graficos de crescimento', included: true },
        { text: 'Suporte prioritario', included: true },
        { text: 'Temas premium', included: true },
      ],
      cta: premiumActive ? 'Gerenciar assinatura' : 'Fazer upgrade',
      highlighted: true,
    },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {isAdmin && (
        <div
          className="surface-card rounded-2xl border p-5"
          style={{
            background: 'linear-gradient(130deg, rgba(251, 191, 36, 0.14), rgba(249, 115, 22, 0.12))',
            borderColor: 'rgba(251, 191, 36, 0.36)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <h3 className="text-lg font-bold">Acao admin</h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Ative Premium para testes internos e validacao rapida de features.
              </p>
            </div>

            <Button
              onClick={() => void handleAdminActivatePremium()}
              disabled={activating}
              variant="primary"
              icon={<Crown className="h-4 w-4" />}
              className="flex-shrink-0"
            >
              {activating ? 'Ativando...' : 'Ativar premium'}
            </Button>
          </div>
        </div>
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, show: false }))}
      />

      <section className="surface-card relative overflow-hidden rounded-3xl p-6 text-center sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-90" style={{ background: 'var(--gradient-overlay)' }} />
        <div className="relative">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl border" style={{ borderColor: 'rgba(250, 204, 21, 0.35)', background: 'linear-gradient(130deg, rgba(250, 204, 21, 0.3), rgba(249, 115, 22, 0.22))' }}>
            <Crown className="h-7 w-7 text-yellow-300" />
          </div>

          <h1 className="mb-2 text-4xl font-bold sm:text-5xl">
            Escolha seu <span className="text-gradient">plano</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Construa consistencia com sistema de produtividade e desbloqueie camadas premium para acelerar resultados.
          </p>
        </div>
      </section>

      <div className="mx-auto inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border p-1" style={{ borderColor: 'rgba(148, 163, 184, 0.28)', background: 'rgba(15, 23, 42, 0.55)' }}>
        <CycleButton active={billingCycle === 'monthly'} onClick={() => setBillingCycle('monthly')} label="Mensal" />
        <CycleButton active={billingCycle === 'yearly'} onClick={() => setBillingCycle('yearly')} label="Anual" badge="-17%" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className="surface-card relative rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            style={{
              borderColor: plan.highlighted ? 'rgba(125, 211, 252, 0.42)' : 'rgba(148, 163, 184, 0.18)',
              boxShadow: plan.highlighted ? '0 30px 56px -40px rgba(14, 165, 233, 0.8)' : undefined,
            }}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1 text-xs font-bold" style={{ borderColor: 'rgba(125, 211, 252, 0.42)', background: 'rgba(8, 47, 73, 0.82)', color: 'var(--color-primary)' }}>
                {plan.badge}
              </div>
            )}

            <div className="mb-6 text-center">
              <h2 className="mb-1 text-2xl font-bold">{plan.name}</h2>
              <p className="mb-5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{plan.description}</p>

              <div className="mb-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold">R$ {billingCycle === 'monthly' ? plan.price.monthly : Math.round(plan.price.yearly / 12)}</span>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>/mes</span>
                </div>

                {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    R$ {plan.price.yearly}/ano
                  </p>
                )}
              </div>

              {plan.name === 'Premium' ? (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={processingCheckout}
                  onClick={() => {
                    if (premiumActive) {
                      void handleManageSubscription()
                    } else {
                      void handleCheckout()
                    }
                  }}
                >
                  {processingCheckout ? 'Processando...' : plan.cta}
                </Button>
              ) : (
                <Button variant="secondary" size="lg" className="w-full" disabled>
                  {plan.cta}
                </Button>
              )}
            </div>

            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature.text} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: feature.included ? 'rgba(52, 211, 153, 0.18)' : 'rgba(100, 116, 139, 0.2)',
                      color: feature.included ? '#34d399' : '#64748b',
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                  <span style={{ color: feature.included ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="surface-card rounded-2xl border p-6">
        <h2 className="mb-6 text-center text-2xl font-bold">Por que fazer upgrade?</h2>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Target,
              title: 'Metas ilimitadas',
              description: 'Crie quantas metas quiser sem travas artificiais.',
            },
            {
              icon: BarChart3,
              title: 'Analises avancadas',
              description: 'Acompanhe crescimento com dados acionaveis.',
            },
            {
              icon: Calendar,
              title: 'Calendario inteligente',
              description: 'Planeje lives com contexto do seu historico.',
            },
            {
              icon: Users,
              title: 'Suporte prioritario',
              description: 'Resolva bloqueios com atendimento preferencial.',
            },
            {
              icon: Sparkles,
              title: 'Temas premium',
              description: 'Deixe o produto com identidade visual propria.',
            },
            {
              icon: TrendingUp,
              title: 'Insights de crescimento',
              description: 'Receba direcoes praticas para escalar resultado.',
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-xl border p-4" style={{ borderColor: 'rgba(148, 163, 184, 0.18)', background: 'rgba(15, 23, 42, 0.45)' }}>
              <div className="mb-3 inline-flex rounded-lg border p-2" style={{ borderColor: 'rgba(125, 211, 252, 0.35)', color: 'var(--color-primary)' }}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 font-semibold">{feature.title}</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

interface CycleButtonProps {
  active: boolean
  onClick: () => void
  label: string
  badge?: string
}

function CycleButton({ active, onClick, label, badge }: CycleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-300"
      style={
        active
          ? {
              background: 'var(--gradient-primary)',
              color: '#04111f',
              boxShadow: '0 12px 24px -18px rgba(34, 211, 238, 0.85)',
            }
          : {
              color: 'var(--color-text-secondary)',
            }
      }
    >
      {label}
      {badge && (
        <span className="absolute -right-2 -top-2 rounded-full border px-1.5 py-0.5 text-[10px] font-bold" style={{ borderColor: 'rgba(34, 197, 94, 0.4)', background: 'rgba(6, 95, 70, 0.9)', color: '#34d399' }}>
          {badge}
        </span>
      )}
    </button>
  )
}
