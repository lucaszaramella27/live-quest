import { useMemo } from 'react'

interface PetAvatarProps {
  level: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  showLevel?: boolean
  className?: string
}

const PET_STAGES = [
  { maxLevel: 9, emoji: '\u{1F95A}', name: 'Ovo', description: 'Inicio da jornada' },
  { maxLevel: 24, emoji: '\u{1F423}', name: 'Filhote', description: 'Crescimento inicial' },
  { maxLevel: 49, emoji: '\u{1F425}', name: 'Jovem', description: 'Ritmo acelerado' },
  { maxLevel: 99, emoji: '\u{1F985}', name: 'Adulto', description: 'Fase forte' },
  { maxLevel: Number.POSITIVE_INFINITY, emoji: '\u{1F525}', name: 'Lendario', description: 'Nivel maximo' },
]

const PETS_BY_LEVEL = [
  { level: 1, emoji: '\u{1F95A}', name: 'Ovo Misterioso' },
  { level: 10, emoji: '\u{1F423}', name: 'Pintinho Noob' },
  { level: 25, emoji: '\u{1F425}', name: 'Passaro Streamer' },
  { level: 50, emoji: '\u{1F985}', name: 'Aguia Pro' },
  { level: 100, emoji: '\u{1F525}', name: 'Fenix Imortal' },
]

export function PetAvatar({ level, size = 'md', animated = true, showLevel = true, className = '' }: PetAvatarProps) {
  const currentPet = useMemo(
    () => PET_STAGES.find((stage) => level <= stage.maxLevel) || PET_STAGES[PET_STAGES.length - 1],
    [level]
  )

  const emojiSize = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-7xl',
    xl: 'text-9xl',
  }

  const boxSize = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
    xl: 'h-48 w-48',
  }

  return (
    <div className={`group relative ${className}`}>
      <div
        className={`${boxSize[size]} ${animated ? 'animate-float' : ''} relative flex cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-105`}
        style={{
          background: 'linear-gradient(145deg, rgba(94, 247, 226, 0.2), rgba(143, 161, 255, 0.18))',
          borderColor: 'rgba(94, 247, 226, 0.4)',
        }}
      >
        <div
          className="absolute inset-0 rounded-full opacity-35 blur-xl transition-opacity duration-300 group-hover:opacity-55"
          style={{ background: 'var(--gradient-primary)' }}
        />

        <span className={`${emojiSize[size]} relative z-10 ${animated ? 'animate-bounce-subtle' : ''}`}>
          {currentPet.emoji}
        </span>

        {showLevel && (
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1"
            style={{
              background: 'var(--gradient-primary)',
              borderColor: 'rgba(94, 247, 226, 0.4)',
              color: '#04131f',
            }}
          >
            <span className="text-xs font-bold">Lv {level}</span>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute -bottom-16 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-xl border px-4 py-2 opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100" style={{ background: 'rgba(8, 17, 33, 0.94)', borderColor: 'rgba(94, 247, 226, 0.3)' }}>
        <p className="text-sm font-bold text-gradient">{currentPet.name}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {currentPet.description}
        </p>
      </div>
    </div>
  )
}

export function getPetStage(level: number) {
  return PET_STAGES.find((stage) => level <= stage.maxLevel) || PET_STAGES[PET_STAGES.length - 1]
}

export function getNextEvolution(level: number): { level: number; name: string } | null {
  const nextPet = PETS_BY_LEVEL.find((pet) => pet.level > level)
  return nextPet || null
}
