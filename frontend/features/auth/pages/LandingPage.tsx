import { useEffect, type ElementType } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  Crown,
  Flame,
  Play,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/shared/ui'

interface FeatureCard {
  icon: ElementType
  title: string
  description: string
}

const features: FeatureCard[] = [
  {
    icon: Target,
    title: 'Metas que viram rotina',
    description: 'Transforme objetivos grandes em missões semanais fáceis de executar.',
  },
  {
    icon: CalendarCheck2,
    title: 'Calendário inteligente',
    description: 'Organize sua agenda de lives com foco em consistência e previsibilidade.',
  },
  {
    icon: Zap,
    title: 'Gamificação real',
    description: 'XP, níveis e recompensas para manter disciplina diária sem perder diversão.',
  },
  {
    icon: BarChart3,
    title: 'Painel de performance',
    description: 'Entenda o que está funcionando com métricas claras em tempo real.',
  },
  {
    icon: Trophy,
    title: 'Conquistas e títulos',
    description: 'Desbloqueie progresso visível e aumente motivação a cada etapa.',
  },
  {
    icon: Crown,
    title: 'Modo premium',
    description: 'Recursos avançados para quem quer acelerar crescimento de verdade.',
  },
]

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-[0.06]" />
      <div className="pointer-events-none absolute -top-32 left-8 h-80 w-80 rounded-full blur-3xl" style={{ background: 'rgba(14, 165, 233, 0.24)' }} />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(249, 115, 22, 0.22)' }} />

      <header className="relative z-20">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 md:px-8">
          <button className="flex items-center gap-3" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="LiveQuest Logo" className="h-12 w-12 rounded-xl" />
            <div className="text-left">
              <p className="text-xl font-bold text-gradient">LiveQuest</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Build consistency. Grow faster.
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate('/login')}>
              Entrar
            </Button>
            <Button onClick={() => navigate('/login')} icon={<ArrowRight className="h-4 w-4" />}>
              Começar
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 pb-20">
        <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-16 pt-6 md:px-8 lg:grid-cols-[1.15fr_1fr] lg:pt-10">
          <div>
            <div
              className="mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{
                background: 'rgba(14, 165, 233, 0.12)',
                borderColor: 'rgba(125, 211, 252, 0.32)',
                color: '#bae6fd',
              }}
            >
              <Sparkles className="h-4 w-4" />
              Plataforma para streamers disciplinados
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Sua rotina de live, agora com
              <span className="block text-gradient">estética de jogo e cérebro de produto.</span>
            </h1>

            <p className="mb-10 max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Planeje, execute e acompanhe seu progresso diário com metas claras, streaks, recompensas e painel de evolução.
              Tudo em um só lugar para gerar consistência e crescimento real.
            </p>

            <div className="mb-10 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/login')} icon={<Zap className="h-5 w-5" />}>
                Criar conta grátis
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                icon={<Play className="h-4 w-4" />}
              >
                Ver recursos
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: 'Foco diário', value: 'Checklists vivos', icon: CheckCircle2 },
                { label: 'Consistência', value: 'Streaks reais', icon: Flame },
                { label: 'Competição', value: 'Ranking social', icon: Users },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="surface-card rounded-xl px-4 py-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: '#bae6fd' }}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {item.value}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="surface-card relative overflow-hidden rounded-2xl p-6 lg:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#bae6fd' }}>
                  Live Control
                </p>
                <h3 className="text-2xl font-bold">Painel de produtividade</h3>
              </div>
              <img src="/logo.png" alt="" className="h-12 w-12 rounded-xl opacity-85" />
            </div>

            <div className="space-y-4">
              {[
                { title: 'Metas semanais', progress: 72 },
                { title: 'Checklist diário', progress: 85 },
                { title: 'Streak atual', progress: 64 },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border p-4" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold">{item.title}</span>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {item.progress}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-900/80">
                    <div className="h-full rounded-full" style={{ width: `${item.progress}%`, background: 'var(--gradient-primary)' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'rgba(56, 189, 248, 0.36)', color: '#bae6fd' }}>
              Resultado: mais organização, menos ruído e mais energia para criar conteúdo.
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: '#67e8f9' }}>
              Core Features
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl">Tudo que você precisa para crescer com consistência</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article key={feature.title} className="surface-card glass-hover rounded-2xl p-6">
                  <div className="mb-5 inline-flex rounded-xl border p-3" style={{ borderColor: 'rgba(56, 189, 248, 0.34)', color: '#67e8f9' }}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {feature.description}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
          <div className="surface-card rounded-3xl p-8 md:p-12">
            <div className="mb-8 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: '#fdba74' }}>
                Fluxo simples
              </p>
              <h2 className="text-3xl font-bold sm:text-4xl">Três passos para destravar seu ritmo</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { step: '01', title: 'Configura seu plano', text: 'Defina metas e tarefas com clareza.' },
                { step: '02', title: 'Executa com foco', text: 'Cumpre checklists e mantém seu streak.' },
                { step: '03', title: 'Evolui com dados', text: 'Analisa progresso e ajusta estratégia.' },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl border p-5" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                  <p className="mb-3 text-sm font-semibold tracking-widest" style={{ color: '#67e8f9' }}>
                    {item.step}
                  </p>
                  <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-8">
          <div
            className="rounded-3xl border px-6 py-10 text-center sm:px-10"
            style={{
              background: 'linear-gradient(125deg, rgba(14, 165, 233, 0.2) 0%, rgba(15, 23, 42, 0.8) 45%, rgba(249, 115, 22, 0.22) 100%)',
              borderColor: 'rgba(148, 163, 184, 0.24)',
            }}
          >
            <h2 className="mb-3 text-3xl font-bold sm:text-4xl">Comece hoje e torne sua evolução visível</h2>
            <p className="mx-auto mb-8 max-w-2xl text-base sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              O melhor momento para criar consistência era ontem. O segundo melhor é agora.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate('/login')} icon={<ArrowRight className="h-4 w-4" />}>
                Entrar no LiveQuest
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/terms')}>
                Ver termos
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
