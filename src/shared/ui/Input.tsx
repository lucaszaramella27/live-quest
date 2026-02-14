import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 bg-brand-dark-secondary border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-all ${className}`}
        {...props}
      />
    </div>
  )
}
