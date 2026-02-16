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
        background: 'rgba(87, 215, 255, 0.2)',
        borderColor: 'rgba(87, 215, 255, 0.45)',
        color: '#9cf9ff',
      }
    }
    if (variant === 'pink') {
      return {
        background: 'rgba(143, 161, 255, 0.2)',
        borderColor: 'rgba(143, 161, 255, 0.45)',
        color: '#d9e1ff',
      }
    }
    return {
      background: 'var(--gradient-primary)',
      borderColor: 'rgba(94, 247, 226, 0.34)',
      color: '#04131f',
    }
  }

  return (
    <span 
      className={`
        inline-flex items-center gap-1
        rounded-full border
        font-semibold
        transition-all duration-300
        hover:-translate-y-0.5
        ${sizeClasses[size]}
      `}
      style={{
        ...getVariantStyle(),
        boxShadow: glow ? '0 0 0 1px rgba(94, 247, 226, 0.26), 0 12px 24px -16px var(--glow-color)' : undefined
      }}
    >
      {children}
    </span>
  )
}
