import { Link } from 'react-router-dom'
import { Compass, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6" style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="pointer-events-none absolute inset-0 ambient-grid opacity-[0.04]" />
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(14, 165, 233, 0.2)' }} />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(249, 115, 22, 0.18)' }} />

      <div className="surface-card relative w-full max-w-lg rounded-3xl border p-8 text-center md:p-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border" style={{ borderColor: 'rgba(125, 211, 252, 0.3)', background: 'rgba(8, 47, 73, 0.24)' }}>
          <Compass className="h-7 w-7" style={{ color: 'var(--color-primary)' }} />
        </div>

        <p className="mb-2 text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-secondary)' }}>
          Erro 404
        </p>
        <h1 className="mb-3 text-3xl font-bold">Pagina nao encontrada</h1>
        <p className="mx-auto mb-7 max-w-md" style={{ color: 'var(--color-text-secondary)' }}>
          O link acessado nao existe ou foi movido. Volte para o inicio e continue sua jornada.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold"
            style={{ background: 'var(--gradient-primary)', color: '#04111f' }}
          >
            Voltar para inicio
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold"
            style={{ borderColor: 'rgba(148, 163, 184, 0.3)', color: 'var(--color-text)' }}
          >
            <ArrowLeft className="h-4 w-4" /> Entrar
          </Link>
        </div>
      </div>
    </div>
  )
}
