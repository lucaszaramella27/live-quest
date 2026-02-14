import { useMemo } from 'react'

interface PetAvatarProps {
  level: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  showLevel?: boolean
  className?: string
}

const PET_STAGES = [
  { maxLevel: 9, emoji: '🥚', name: 'Ovo', description: 'Seu início' },
  { maxLevel: 24, emoji: '🐣', name: 'Filhote', description: 'Crescendo!' },
  { maxLevel: 49, emoji: '🐥', name: 'Jovem', description: 'Ficando forte' },
  { maxLevel: 99, emoji: '🦅', name: 'Adulto', description: 'Poderoso' },
  { maxLevel: Infinity, emoji: '🔥', name: 'Lendário', description: 'DEUS' }
]

const PETS_BY_LEVEL = [
  { level: 1, emoji: '🥚', name: 'Ovo Misterioso' },
  { level: 10, emoji: '🐣', name: 'Pintinho Noob' },
  { level: 25, emoji: '🐥', name: 'Pássaro Streamer' },
  { level: 50, emoji: '🦅', name: 'Águia Pro' },
  { level: 100, emoji: '🔥', name: 'Fênix Imortal' }
]

export function PetAvatar({ level, size = 'md', animated = true, showLevel = true, className = '' }: PetAvatarProps) {
  const currentPet = useMemo(() => {
    const stage = PET_STAGES.find(s => level <= s.maxLevel) || PET_STAGES[PET_STAGES.length - 1]
    return stage
  }, [level])

  const sizeClasses = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-7xl',
    xl: 'text-9xl'
  }

  const containerSizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`
          ${containerSizes[size]} 
          rounded-full 
          bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 
          border-2 border-brand-purple/40
          flex items-center justify-center
          ${animated ? 'animate-float' : ''}
          relative
          group
          hover:scale-110 transition-transform duration-300
        `}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
        
        {/* Pet emoji */}
        <span className={`${sizeClasses[size]} relative z-10 ${animated ? 'animate-bounce-slow' : ''}`}>
          {currentPet.emoji}
        </span>

        {/* Level badge */}
        {showLevel && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-brand-purple to-brand-pink rounded-full border-2 border-brand-dark">
            <span className="text-xs font-bold text-white">Nv. {level}</span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
        <div className="bg-brand-dark-secondary border border-brand-purple/40 rounded-xl px-4 py-2 shadow-xl">
          <p className="text-sm font-bold text-gradient-animated">{currentPet.name}</p>
          <p className="text-xs text-gray-400">{currentPet.description}</p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export function getPetStage(level: number) {
  return PET_STAGES.find(s => level <= s.maxLevel) || PET_STAGES[PET_STAGES.length - 1]
}

export function getNextEvolution(level: number): { level: number; name: string } | null {
  const nextPet = PETS_BY_LEVEL.find(p => p.level > level)
  return nextPet || null
}
