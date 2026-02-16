import { ReactNode } from 'react'

interface HoverGlowBorderProps {
  children: ReactNode
  className?: string
}

export function HoverGlowBorder({ children, className = '' }: HoverGlowBorderProps) {
  return (
    <div className={`relative group ${className}`}>
      <div 
        className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-5 blur-sm transition-opacity duration-300" 
        style={{ background: 'var(--gradient-primary)' }}
      />
      <div className="relative glass rounded-xl p-6 transition-all duration-300">
        {children}
      </div>
    </div>
  )
}
