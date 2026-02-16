import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  loading?: boolean
}

export function Button({ 
  children, 
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  disabled,
  style,
  ...props 
}: ButtonProps) {
  const baseClasses = 'btn-shine relative inline-flex items-center justify-center gap-2 rounded-xl border font-semibold tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50'
  
  const variantClasses = {
    primary: 'hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_14px_34px_-18px_var(--glow-color)] active:translate-y-0',
    secondary: 'hover:-translate-y-0.5 hover:border-sky-300/35 hover:bg-slate-900/70',
    ghost: 'hover:bg-slate-900/50 hover:text-[var(--color-text)]',
  }

  const sizeClasses = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-3.5 text-base',
  }

  const getVariantStyle = () => {
    if (variant === 'primary') {
      return {
        background: 'var(--gradient-primary)',
        color: '#04131f',
        borderColor: 'rgba(125, 211, 252, 0.5)',
        boxShadow: '0 12px 30px -18px rgba(14, 165, 233, 0.8)',
        ...style
      }
    }

    if (variant === 'secondary') {
      return {
        background: 'rgba(15, 23, 42, 0.76)',
        color: 'var(--color-text)',
        borderColor: 'rgba(148, 163, 184, 0.25)',
        ...style
      }
    }

    if (variant === 'ghost') {
      return {
        color: 'var(--color-text-secondary)',
        borderColor: 'transparent',
        ...style
      }
    }

    return style || {}
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={getVariantStyle()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon}
      {children}
    </button>
  )
}
