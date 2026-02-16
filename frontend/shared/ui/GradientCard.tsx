import { ReactNode, CSSProperties } from 'react'

interface GradientCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  animation?: 'fade-in' | 'fade-in-up' | 'scale-in' | 'slide-in-left' | 'slide-in-right'
  delay?: string
  style?: CSSProperties
}

export function GradientCard({ 
  children, 
  className = '', 
  hover = true,
  animation = 'fade-in-up',
  delay = '',
  style,
}: GradientCardProps) {
  const animationClass = {
    'fade-in': 'animate-fade-in',
    'fade-in-up': 'animate-fade-in-up',
    'scale-in': 'animate-scale-in',
    'slide-in-left': 'animate-slide-in-left',
    'slide-in-right': 'animate-slide-in-right',
  }[animation]

  const hoverClasses = hover 
    ? 'card-hover-fx hover:-translate-y-1 hover:border-sky-300/35 hover:shadow-[0_24px_48px_-34px_rgba(14,165,233,0.78)]' 
    : ''
  
  return (
    <div 
      className={`
        surface-card reveal-on-scroll p-6
        transition-all duration-300
        ${hoverClasses}
        ${animationClass}
        ${delay}
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  )
}
