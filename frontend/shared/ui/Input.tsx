import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-xl border px-4 py-3 text-[15px] transition-all duration-200 focus:border-sky-300/70 focus:outline-none focus:ring-2 focus:ring-sky-400/35 ${className}`}
        style={{
          background: 'rgba(15, 23, 42, 0.72)',
          borderColor: 'rgba(148, 163, 184, 0.25)',
          color: 'var(--color-text)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
        {...props}
      />
    </div>
  )
}
