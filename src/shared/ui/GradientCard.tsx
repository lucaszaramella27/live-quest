import { ReactNode } from 'react'

interface GradientCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  animation?: 'fade-in' | 'fade-in-up' | 'scale-in' | 'slide-in-left' | 'slide-in-right'
  delay?: string
}

export function GradientCard({ 
  children, 
  className = '', 
  hover = true,
  animation = 'fade-in-up',
  delay = ''
}: GradientCardProps) {
  const hoverClasses = hover 
    ? 'hover:bg-white/8 hover:border-white/10 hover:shadow-lg' 
    : ''
  
  return (
    <div 
      className={`
        glass rounded-xl p-6
        transition-all duration-300
        ${hoverClasses}
        animate-${animation}
        ${delay}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
