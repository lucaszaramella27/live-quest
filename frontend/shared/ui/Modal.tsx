import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      data-no-reveal
    >
      <div 
        className="absolute inset-0 bg-[#040913]/82"
        onClick={onClose}
      />
      
      <div className="surface-card relative w-full max-w-md overflow-hidden rounded-2xl border p-6 animate-scale-in" data-no-reveal>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: 'var(--gradient-primary)' }} />

        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--color-text)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg border p-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-900/60"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {children}
      </div>
    </div>
  )
}
