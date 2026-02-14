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
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'shadow-sm hover:shadow-md',
    secondary: 'glass glass-hover border border-white/10',
    ghost: 'hover:bg-white/5 transition-colors',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const getVariantStyle = () => {
    if (variant === 'primary') {
      return {
        background: 'var(--gradient-primary)',
        color: 'var(--color-text)',
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
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : icon}
      {children}
    </button>
  )
}
