import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6" style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-[0.05]" />
      <div
        className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'rgba(94, 247, 226, 0.2)' }}
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'rgba(143, 161, 255, 0.18)' }}
      />

      <div className="surface-card relative w-full max-w-xl rounded-3xl border p-8 text-center md:p-10">
        <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-80" style={{ background: 'var(--gradient-overlay)' }} />

        <div className="relative">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border" style={{ borderColor: 'rgba(94, 247, 226, 0.35)', background: 'rgba(6, 26, 42, 0.56)' }}>
            <Compass className="h-7 w-7" style={{ color: 'var(--color-primary)' }} />
          </div>

          <p className="mb-2 text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-secondary)' }}>
            Erro 404
          </p>
          <h1 className="mb-3 text-3xl font-bold">Pagina nao encontrada</h1>
          <p className="mx-auto mb-8 max-w-md text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            O link que voce acessou nao existe ou foi movido. Volte para um ponto conhecido e continue sua jornada.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center rounded-xl border px-5 py-2.5 text-sm font-semibold"
              style={{ background: 'var(--gradient-primary)', borderColor: 'rgba(94, 247, 226, 0.35)', color: '#04131f' }}
            >
              Voltar para inicio
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold"
              style={{ borderColor: 'rgba(139, 161, 203, 0.3)', color: 'var(--color-text)' }}
            >
              <ArrowLeft className="h-4 w-4" /> Ir para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
