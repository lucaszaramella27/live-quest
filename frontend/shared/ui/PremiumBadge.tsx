import { ReactNode } from 'react'

interface PremiumBadgeProps {
  children: ReactNode
  variant?: 'purple' | 'pink' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
}

export function PremiumBadge({ 
  children, 
  variant = 'gradient',
  size = 'md',
  glow = false 
}: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const getVariantStyle = () => {
    if (variant === 'purple') {
      return {
        background: 'var(--color-primary)',
        borderColor: 'var(--color-primary)',
        color: 'var(--color-text)',
        opacity: 0.8
      }
    }
    if (variant === 'pink') {
      return {
        background: 'var(--color-secondary)',
        borderColor: 'var(--color-secondary)',
        color: 'var(--color-text)',
        opacity: 0.8
      }
    }
    return {
      background: 'var(--gradient-primary)',
      borderColor: 'var(--color-primary)',
      color: 'var(--color-text)',
      opacity: 0.8
    }
  }

  return (
    <span 
      className={`
        inline-flex items-center gap-1
        rounded-full border
        font-semibold
        transition-all duration-300
        hover:scale-105
        ${sizeClasses[size]}
      `}
      style={{
        ...getVariantStyle(),
        boxShadow: glow ? '0 0 20px var(--glow-color)' : undefined
      }}
    >
      {children}
    </span>
  )
}
