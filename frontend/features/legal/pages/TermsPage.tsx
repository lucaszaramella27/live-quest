import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react'

export function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-10" style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-[0.04]" />
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(14, 165, 233, 0.2)' }} />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(249, 115, 22, 0.18)' }} />

      <div className="relative mx-auto max-w-4xl space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <header className="surface-card rounded-2xl border p-6 md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs" style={{ borderColor: 'rgba(125, 211, 252, 0.35)', color: 'var(--color-primary)' }}>
            <FileText className="h-3.5 w-3.5" /> Termos
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">Termos de uso</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Ultima atualizacao: 15 de fevereiro de 2026
          </p>
        </header>

        <article className="surface-card rounded-2xl border p-6 md:p-8">
          <div className="space-y-6 text-sm leading-7" style={{ color: 'var(--color-text-secondary)' }}>
            <section>
              <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                1. Aceite
              </h2>
              <p>Ao usar o LiveQuest, voce concorda com estes termos e com a nossa politica de privacidade.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                2. Conta e responsabilidades
              </h2>
              <p>Voce e responsavel pelas acoes da sua conta e por manter credenciais seguras.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                3. Assinaturas
              </h2>
              <p>Planos pagos podem ser recorrentes. Cancelamentos e alteracoes seguem as regras do provedor de pagamento.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                4. Uso aceitavel
              </h2>
              <p>E proibido tentar fraudar recompensas, automatizar abuso de XP ou comprometer a seguranca do sistema.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                5. Suspensao
              </h2>
              <p>Podemos limitar ou suspender contas que violem estes termos ou apresentem comportamento malicioso.</p>
            </section>
          </div>
        </article>

        <div className="surface-card rounded-xl border p-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
            <ShieldCheck className="h-4 w-4" />
            <span className="font-semibold">Compromisso com seguranca</span>
          </div>
          <p className="mt-1">Mantemos controles antifraude e validacoes server-side para proteger usuarios e o ecossistema da plataforma.</p>
        </div>
      </div>
    </div>
  )
}
