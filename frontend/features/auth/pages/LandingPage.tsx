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
    title: 'Plano semanal claro',
    description: 'Quebre objetivos grandes em entregas pequenas que cabem na sua rotina de live.',
  },
  {
    icon: CalendarCheck2,
    title: 'Calendario de execucao',
    description: 'Organize stream, criacao de conteudo e tarefas de bastidor em um fluxo unico.',
  },
  {
    icon: Zap,
    title: 'Gamificacao util',
    description: 'XP, streaks e recompensas para manter constancia sem virar distração.',
  },
  {
    icon: BarChart3,
    title: 'Painel de progresso',
    description: 'Visualize o que esta funcionando e ajuste sua estrategia com dados simples.',
  },
  {
    icon: Trophy,
    title: 'Conquistas e titulos',
    description: 'Transforme consistencia em marcos visiveis para manter ritmo de crescimento.',
  },
  {
    icon: Crown,
    title: 'Camada premium',
    description: 'Recursos avancados para criadores que querem escalar com previsibilidade.',
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
      <div
        className="pointer-events-none absolute -top-36 left-0 h-[420px] w-[420px] rounded-full blur-3xl"
        style={{ background: 'rgba(94, 247, 226, 0.2)' }}
      />
      <div
        className="pointer-events-none absolute right-0 top-24 h-[360px] w-[360px] rounded-full blur-3xl"
        style={{ background: 'rgba(143, 161, 255, 0.18)' }}
      />

      <header className="relative z-20 border-b border-white/10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-8">
          <button className="flex items-center gap-3" onClick={() => navigate('/')} aria-label="Ir para inicio">
            <img src="/logo.png" alt="LiveQuest Logo" className="h-11 w-11 rounded-xl" />
            <div className="text-left">
              <p className="text-lg font-bold text-gradient sm:text-xl">LiveQuest</p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Build consistency. Ship growth.
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate('/login')}>
              Entrar
            </Button>
            <Button onClick={() => navigate('/login')} icon={<ArrowRight className="h-4 w-4" />}>
              Comecar
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 pb-20">
        <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-14 pt-10 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:pt-14">
          <div className="reveal">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{
                background: 'rgba(87, 215, 255, 0.12)',
                borderColor: 'rgba(87, 215, 255, 0.3)',
                color: '#b7fff7',
              }}
            >
              <Sparkles className="h-4 w-4" />
              SaaS de produtividade para streamer
            </div>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Transforme disciplina em
              <span className="block text-gradient">crescimento previsivel</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              O LiveQuest junta planejamento, execucao e feedback em um produto unico. Menos caos no dia a dia, mais
              consistencia para crescer com conteudo.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/login')} icon={<Zap className="h-4 w-4" />}>
                Criar conta gratis
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

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Foco diario', value: 'Checklist e rotina', icon: CheckCircle2 },
                { label: 'Consistencia', value: 'Streak com contexto', icon: Flame },
                { label: 'Competicao', value: 'Ranking social', icon: Users },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="glass rounded-xl px-4 py-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: '#c9fff9' }}>
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

          <div className="reveal surface-card relative overflow-hidden rounded-3xl p-6 lg:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: 'var(--gradient-overlay)' }} />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: '#a9fff5' }}>
                    Live Control
                  </p>
                  <h3 className="mt-1 text-2xl font-bold">Painel de operacao</h3>
                </div>
                <img src="/logo.png" alt="" className="h-11 w-11 rounded-xl opacity-90" />
              </div>

              <div className="space-y-4">
                {[
                  { title: 'Metas da semana', progress: 78 },
                  { title: 'Checklist diario', progress: 84 },
                  { title: 'Ciclo de conteudo', progress: 66 },
                ].map((item) => (
                  <div key={item.title} className="glass rounded-xl border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold">{item.title}</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.progress}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-950/70">
                      <div className="h-full rounded-full" style={{ width: `${item.progress}%`, background: 'var(--gradient-primary)' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="glass rounded-xl p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-secondary)' }}>
                    XP
                  </p>
                  <p className="mt-1 text-lg font-bold">24.8k</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-secondary)' }}>
                    Streak
                  </p>
                  <p className="mt-1 text-lg font-bold">19d</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-secondary)' }}>
                    Rank
                  </p>
                  <p className="mt-1 text-lg font-bold">#12</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
          <div className="mb-10 text-center reveal">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#89f8ff' }}>
              Product stack
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl">Arquitetura de rotina para criador serio</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <article key={feature.title} className={`reveal surface-card glass-hover rounded-2xl p-6 delay-${(index % 5) + 1}00`}>
                  <div className="mb-5 inline-flex rounded-xl border p-3" style={{ borderColor: 'rgba(87, 215, 255, 0.34)', color: '#95ffff' }}>
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

        <section className="mx-auto w-full max-w-7xl px-4 pb-8 md:px-8">
          <div className="reveal surface-card rounded-3xl p-8 md:p-12">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#89f8ff' }}>
                Fluxo objetivo
              </p>
              <h2 className="text-3xl font-bold sm:text-4xl">Tres etapas para evoluir toda semana</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { step: '01', title: 'Planeja com contexto', text: 'Define metas e tarefas alinhadas com seus objetivos de criador.' },
                { step: '02', title: 'Executa com foco', text: 'Marca progresso diario com sinais claros de evolucao real.' },
                { step: '03', title: 'Ajusta com dados', text: 'Usa metricas simples para remover ruido e manter consistencia.' },
              ].map((item) => (
                <div key={item.step} className="glass rounded-2xl border p-5">
                  <p className="mb-3 text-sm font-semibold tracking-[0.16em]" style={{ color: '#8ffef3' }}>
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

        <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-8">
          <div
            className="reveal rounded-3xl border px-6 py-10 text-center sm:px-10"
            style={{
              background: 'linear-gradient(125deg, rgba(94, 247, 226, 0.18) 0%, rgba(8, 19, 36, 0.78) 45%, rgba(143, 161, 255, 0.22) 100%)',
              borderColor: 'rgba(139, 161, 203, 0.24)',
            }}
          >
            <h2 className="mb-3 text-3xl font-bold sm:text-4xl">Comece hoje e torne sua evolucao visivel</h2>
            <p className="mx-auto mb-8 max-w-2xl text-base sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Menos improviso. Mais ritmo. Uma rotina que vira vantagem competitiva.
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
