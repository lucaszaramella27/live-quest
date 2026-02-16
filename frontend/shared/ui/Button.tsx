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
  const baseClasses =
    'relative inline-flex items-center justify-center gap-2 rounded-xl border font-semibold tracking-[0.01em] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-55'
  
  const variantClasses = {
    primary: 'hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_22px_38px_-22px_var(--glow-color)] active:translate-y-0',
    secondary: 'hover:-translate-y-0.5 hover:border-cyan-200/35 hover:bg-slate-900/68 active:translate-y-0',
    ghost: 'hover:bg-slate-900/46 hover:text-[var(--color-text)] active:translate-y-0',
  }

  const sizeClasses = {
    sm: 'px-3.5 py-2 text-xs sm:text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-sm sm:text-base',
  }

  const getVariantStyle = () => {
    if (variant === 'primary') {
      return {
        background: 'var(--gradient-primary)',
        color: '#031320',
        borderColor: 'rgba(133, 248, 233, 0.45)',
        boxShadow: '0 14px 32px -20px rgba(87, 215, 255, 0.75)',
        ...style
      }
    }

    if (variant === 'secondary') {
      return {
        background: 'linear-gradient(145deg, rgba(11, 22, 41, 0.78), rgba(9, 18, 34, 0.8))',
        color: 'var(--color-text)',
        borderColor: 'rgba(139, 161, 203, 0.28)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        ...style
      }
    }

    if (variant === 'ghost') {
      return {
        color: 'var(--color-text-secondary)',
        borderColor: 'rgba(139, 161, 203, 0)',
        background: 'transparent',
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
