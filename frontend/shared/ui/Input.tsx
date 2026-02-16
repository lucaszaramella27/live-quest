import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 focus:border-cyan-200/75 focus:outline-none focus:ring-4 focus:ring-cyan-300/15 ${className}`}
        style={{
          background: 'linear-gradient(145deg, rgba(11, 22, 41, 0.78), rgba(8, 17, 33, 0.82))',
          borderColor: 'rgba(139, 161, 203, 0.28)',
          color: 'var(--color-text)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        }}
        {...props}
      />
    </div>
  )
}
