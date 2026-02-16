import { ReactNode } from 'react'

interface GlassHeaderProps {
  children: ReactNode
  className?: string
}

export function GlassHeader({ children, className = '' }: GlassHeaderProps) {
  return (
    <header 
      className={`sticky top-0 z-50 glass backdrop-blur-lg border-b border-white/10 ${className}`}
    >
      <div className="container mx-auto px-4 py-4 animate-fade-in-down">
        {children}
      </div>
    </header>
  )
}
