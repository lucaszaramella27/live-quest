import { useEffect, useState } from 'react'

interface ConfettiProps {
  active: boolean
  onComplete?: () => void
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{
    id: number
    left: number
    delay: number
    duration: number
    color: string
  }>>([])

  useEffect(() => {
    if (active) {
      // Criar 50 partículas de confetti
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 200,
        duration: 2000 + Math.random() * 1000,
        color: ['#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#3B82F6'][Math.floor(Math.random() * 5)]
      }))
      
      setParticles(newParticles)

      // Limpar após animação
      const timer = setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, 3500)

      return () => clearTimeout(timer)
    }
  }, [active, onComplete])

  if (!active || particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute -top-4 w-2 h-2 rounded-full animate-confetti-fall"
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${particle.duration}ms`,
          }}
        />
      ))}
    </div>
  )
}
