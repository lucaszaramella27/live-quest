import { Link } from 'react-router-dom'
import { ArrowLeft, Database, Shield } from 'lucide-react'

export function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-10" style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-[0.05]" />
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full blur-3xl" style={{ background: 'rgba(94, 247, 226, 0.2)' }} />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full blur-3xl" style={{ background: 'rgba(143, 161, 255, 0.18)' }} />

      <div className="relative mx-auto max-w-4xl space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <header className="surface-card rounded-2xl border p-6 md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs" style={{ borderColor: 'rgba(94, 247, 226, 0.35)', color: 'var(--color-primary)' }}>
            <Shield className="h-3.5 w-3.5" /> Privacidade
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">Politica de privacidade</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Ultima atualizacao: 15 de fevereiro de 2026
          </p>
        </header>

        <article className="surface-card rounded-2xl border p-6 md:p-8">
          <div className="space-y-6 text-sm leading-7" style={{ color: 'var(--color-text-secondary)' }}>
            <section>
              <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                1. Dados coletados
              </h2>
              <p>Coletamos dados de conta, progresso, desafios, compras e integracoes necessarias para operar o produto.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                2. Finalidade
              </h2>
              <p>Usamos os dados para autenticacao, personalizacao, antifraude, processamento de assinatura e suporte.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                3. Compartilhamento
              </h2>
              <p>Compartilhamos somente com provedores essenciais de infraestrutura e pagamento, com protecoes contratuais.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                4. Seguranca
              </h2>
              <p>Aplicamos controles de acesso, trilhas de auditoria e monitoramento para reduzir risco de uso indevido.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                5. Direitos do usuario
              </h2>
              <p>Voce pode solicitar acesso, correcao ou exclusao dos dados pelos canais oficiais de suporte.</p>
            </section>
          </div>
        </article>

        <div className="glass rounded-xl border p-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
            <Database className="h-4 w-4" />
            <span className="font-semibold">Tratamento responsavel de dados</span>
          </div>
          <p className="mt-1">Retemos apenas o necessario para operacao do produto e melhoria da experiencia, respeitando principios de minimizacao.</p>
        </div>
      </div>
    </div>
  )
}
