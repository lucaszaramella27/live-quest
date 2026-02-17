import { useEffect, type ElementType } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  CircleDot,
  Crown,
  Flame,
  Gauge,
  Play,
  Rocket,
  ShieldCheck,
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
  delayClass: string
}

const heroStats = [
  { label: 'Tasks executadas', value: '2.4M+' },
  { label: 'Streak medio', value: '17 dias' },
  { label: 'Metas fechadas', value: '86k+' },
  { label: 'Creators ativos', value: '12k+' },
]

const operationsPillars = [
  {
    icon: Target,
    title: 'Objetivo claro por ciclo',
    description: 'Cada semana vira um sprint com metas que realmente impactam o crescimento do canal.',
  },
  {
    icon: Gauge,
    title: 'Ritmo que nao quebra',
    description: 'Checklist diario, streak e energia de execucao para manter consistencia sem burnout.',
  },
  {
    icon: BarChart3,
    title: 'Decisao guiada por dados',
    description: 'Veja o que funciona no seu processo e ajuste antes da semana acabar.',
  },
]

const features: FeatureCard[] = [
  {
    icon: CalendarRange,
    title: 'Roadmap semanal vivo',
    description: 'Planeje streams, cortes, distribuicao e operacao em um board unico e atualizado.',
    delayClass: 'delay-100',
  },
  {
    icon: CheckCircle2,
    title: 'Checklist com recompensa real',
    description: 'Cada entrega concluida retroalimenta XP, moedas e progresso visivel no dashboard.',
    delayClass: 'delay-200',
  },
  {
    icon: Flame,
    title: 'Engine de consistencia',
    description: 'Streak contextual e metas de ritmo para transformar disciplina em resultado previsivel.',
    delayClass: 'delay-300',
  },
  {
    icon: ShieldCheck,
    title: 'Sistema anti-caos',
    description: 'Bloqueie a semana por prioridade e pare de decidir no impulso durante a execucao.',
    delayClass: 'delay-400',
  },
  {
    icon: Trophy,
    title: 'Progresso gamificado com criterio',
    description: 'Conquistas e titulos para manter motivacao alta sem virar distraicao.',
    delayClass: 'delay-500',
  },
  {
    icon: Crown,
    title: 'Camada premium de escala',
    description: 'Recursos avancados para criadores que ja operam como negocio e querem subir de nivel.',
    delayClass: 'delay-100',
  },
]

const executionSteps = [
  {
    step: '01',
    title: 'Defina o alvo da semana',
    text: 'Escolha uma meta principal e quebre em entregas curtas que cabem no seu tempo real.',
  },
  {
    step: '02',
    title: 'Execute com sistema',
    text: 'Marque tarefas, acompanhe progresso e mantenha o ritmo diario com feedback imediato.',
  },
  {
    step: '03',
    title: 'Ajuste com inteligencia',
    text: 'Use sinais de performance para decidir o proximo ciclo sem depender de achismo.',
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
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-[0.05]" />
      <div
        className="pointer-events-none absolute -left-24 top-[-120px] h-[460px] w-[460px] rounded-full blur-3xl"
        style={{ background: 'rgba(94, 247, 226, 0.2)' }}
      />
      <div
        className="pointer-events-none absolute right-[-120px] top-[60px] h-[500px] w-[500px] rounded-full blur-3xl"
        style={{ background: 'rgba(143, 161, 255, 0.2)' }}
      />
      <div
        className="pointer-events-none absolute bottom-[-200px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'rgba(87, 215, 255, 0.14)' }}
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
              Comecar agora
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 pb-20">
        <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-10 pt-10 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:pt-14">
          <div className="reveal reveal-on-scroll">
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{
                background: 'rgba(87, 215, 255, 0.12)',
                borderColor: 'rgba(87, 215, 255, 0.3)',
                color: '#b7fff7',
              }}
            >
              <Sparkles className="h-4 w-4" />
              Sistema de operacao para creator
            </div>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Pare de improvisar.
              <span className="block text-gradient">Comece a operar como marca.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              O LiveQuest transforma a rotina do criador em um ciclo claro de planejamento, execucao e analise. Menos
              desgaste mental. Mais output com qualidade.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/login')} icon={<Rocket className="h-4 w-4" />}>
                Criar conta gratis
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                icon={<Play className="h-4 w-4" />}
              >
                Ver stack do produto
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="glass rounded-xl border px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: '#9afef6' }}>
                  O que voce ganha
                </p>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Clareza de prioridade, rotina de entrega e leitura objetiva do que realmente acelera crescimento.
                </p>
              </div>
              <div className="glass rounded-xl border px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: '#9afef6' }}>
                  Perfil ideal
                </p>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Streamers e criadores que querem consistencia semanal sem depender de motivacao aleatoria.
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="glass rounded-xl border p-3">
                  <p className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
                    {stat.label}
                  </p>
                  <p className="mt-1 text-lg font-bold" style={{ color: '#d7fffb' }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal reveal-on-scroll surface-card relative overflow-hidden rounded-3xl p-6 lg:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: 'var(--gradient-overlay)' }} />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: '#a9fff5' }}>
                    Weekly Command Center
                  </p>
                  <h3 className="mt-1 text-2xl font-bold">Painel de operacao</h3>
                </div>
                <img src="/logo.png" alt="" className="h-11 w-11 rounded-xl opacity-90" />
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Sprint de conteudo', value: 82 },
                  { label: 'Execucao diaria', value: 76 },
                  { label: 'Qualidade de rotina', value: 91 },
                ].map((item) => (
                  <div key={item.label} className="glass rounded-xl border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.value}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-950/70">
                      <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: 'var(--gradient-primary)' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="glass rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
                    Proximo bloco
                  </p>
                  <p className="mt-2 text-sm font-semibold">Batch de cortes para reels</p>
                  <div className="mt-3 inline-flex items-center gap-2 text-xs" style={{ color: '#9dfcf3' }}>
                    <CircleDot className="h-3.5 w-3.5" />
                    Janela de foco: 14:00 - 16:00
                  </div>
                </div>

                <div className="glass rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
                    Momentum score
                  </p>
                  <p className="mt-2 text-2xl font-bold">9.1 / 10</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    +18% vs semana anterior
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border p-4" style={{ borderColor: 'rgba(145, 171, 224, 0.24)', background: 'rgba(7, 16, 30, 0.62)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: '#8afef3' }}>
                  Pipeline da semana
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  {['Planejamento de lives', 'Producao de clips', 'Distribuicao multicanal'].map((entry) => (
                    <div key={entry} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      <span>{entry}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
          <div className="reveal reveal-on-scroll grid gap-4 md:grid-cols-3">
            {operationsPillars.map((pillar) => {
              const Icon = pillar.icon
              return (
                <article key={pillar.title} className="surface-card glass-hover rounded-2xl p-6">
                  <div className="mb-4 inline-flex rounded-xl border p-3" style={{ borderColor: 'rgba(94, 247, 226, 0.3)', color: '#98fff8' }}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{pillar.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {pillar.description}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
          <div className="mb-10 text-center reveal reveal-on-scroll">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#89f8ff' }}>
              Product stack
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl">Ferramentas para rodar sua semana sem ruido</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article key={feature.title} className={`reveal reveal-on-scroll surface-card glass-hover rounded-2xl p-6 ${feature.delayClass}`}>
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

        <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-8">
          <div className="reveal reveal-on-scroll surface-card rounded-3xl p-8 md:p-12">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#89f8ff' }}>
                Metodo LiveQuest
              </p>
              <h2 className="text-3xl font-bold sm:text-4xl">Tres etapas para crescer com previsibilidade</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {executionSteps.map((item) => (
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
            className="reveal reveal-on-scroll rounded-3xl border px-6 py-10 text-center sm:px-10"
            style={{
              background: 'linear-gradient(125deg, rgba(94, 247, 226, 0.2) 0%, rgba(8, 19, 36, 0.8) 45%, rgba(143, 161, 255, 0.24) 100%)',
              borderColor: 'rgba(139, 161, 203, 0.24)',
            }}
          >
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(94, 247, 226, 0.34)', color: '#b8fff8' }}>
              <Zap className="h-4 w-4" />
              Pronto para proximo nivel
            </div>

            <h2 className="mb-3 text-3xl font-bold sm:text-4xl">Seu crescimento merece um sistema melhor que forca de vontade</h2>
            <p className="mx-auto mb-8 max-w-2xl text-base sm:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Entre no LiveQuest e transforme sua rotina de creator em uma operacao que gera resultado toda semana.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate('/login')} icon={<ArrowRight className="h-4 w-4" />}>
                Entrar no LiveQuest
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/terms')}>
                Ver termos
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Sem cartao para iniciar
              </span>
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-200" />
                Comunidade ativa
              </span>
              <span className="inline-flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-300" />
                Onboarding rapido
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
