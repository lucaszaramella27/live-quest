interface GradientDividerProps {
  className?: string
}

export function GradientDivider({ className = '' }: GradientDividerProps) {
  return (
    <div 
      className={`h-px ${className}`} 
      style={{ background: 'linear-gradient(to right, transparent, var(--color-primary), transparent)', opacity: 0.2 }}
    />
  )
}
