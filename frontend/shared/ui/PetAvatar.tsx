import { useMemo } from 'react'

interface PetAvatarProps {
  level: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  showLevel?: boolean
  equippedAvatarItemId?: string | null
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

function getAvatarEffectName(itemId: string | null | undefined): string | null {
  if (itemId === 'sparkle_effect') return 'Brilho'
  if (itemId === 'fire_aura') return 'Aura de Fogo'
  if (itemId === 'rainbow_trail') return 'Rastro Arco-iris'
  if (itemId === 'galaxy_aura') return 'Aura Galactica'
  return null
}

function getAvatarContainerStyle(equippedAvatarItemId: string | null | undefined): Record<string, string> {
  if (equippedAvatarItemId === 'fire_aura') {
    return {
      background: 'linear-gradient(145deg, rgba(249, 115, 22, 0.26), rgba(245, 158, 11, 0.2))',
      borderColor: 'rgba(251, 146, 60, 0.5)',
      boxShadow: '0 0 35px -14px rgba(249, 115, 22, 0.8)',
    }
  }

  if (equippedAvatarItemId === 'rainbow_trail') {
    return {
      background: 'linear-gradient(145deg, rgba(56, 189, 248, 0.2), rgba(167, 139, 250, 0.24))',
      borderColor: 'rgba(125, 211, 252, 0.52)',
      boxShadow: '0 0 32px -14px rgba(96, 165, 250, 0.78)',
    }
  }

  if (equippedAvatarItemId === 'galaxy_aura') {
    return {
      background: 'linear-gradient(145deg, rgba(76, 29, 149, 0.3), rgba(30, 64, 175, 0.26))',
      borderColor: 'rgba(167, 139, 250, 0.48)',
      boxShadow: '0 0 38px -14px rgba(139, 92, 246, 0.82)',
    }
  }

  if (equippedAvatarItemId === 'sparkle_effect') {
    return {
      background: 'linear-gradient(145deg, rgba(94, 247, 226, 0.24), rgba(143, 161, 255, 0.2))',
      borderColor: 'rgba(94, 247, 226, 0.5)',
      boxShadow: '0 0 30px -14px rgba(94, 247, 226, 0.76)',
    }
  }

  return {
    background: 'linear-gradient(145deg, rgba(94, 247, 226, 0.2), rgba(143, 161, 255, 0.18))',
    borderColor: 'rgba(94, 247, 226, 0.4)',
  }
}

export function PetAvatar({
  level,
  size = 'md',
  animated = true,
  showLevel = true,
  equippedAvatarItemId = null,
  className = '',
}: PetAvatarProps) {
  const currentPet = useMemo(
    () => PET_STAGES.find((stage) => level <= stage.maxLevel) || PET_STAGES[PET_STAGES.length - 1],
    [level]
  )
  const effectName = getAvatarEffectName(equippedAvatarItemId)
  const containerStyle = getAvatarContainerStyle(equippedAvatarItemId)

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
        style={containerStyle}
      >
        {equippedAvatarItemId === 'sparkle_effect' && (
          <>
            <span className="pointer-events-none absolute left-2 top-2 text-sm text-cyan-100 opacity-90 animate-pulse">✦</span>
            <span className="pointer-events-none absolute bottom-2 right-2 text-xs text-sky-100 opacity-85 animate-pulse">✧</span>
          </>
        )}

        {equippedAvatarItemId === 'fire_aura' && (
          <div
            className="pointer-events-none absolute -inset-1 rounded-full opacity-65 blur-md"
            style={{ background: 'radial-gradient(circle, rgba(251, 146, 60, 0.42) 0%, rgba(251, 146, 60, 0) 70%)' }}
          />
        )}

        {equippedAvatarItemId === 'rainbow_trail' && (
          <div
            className="pointer-events-none absolute -inset-1 rounded-full animate-[spin_5s_linear_infinite]"
            style={{ background: 'conic-gradient(from 0deg, rgba(56, 189, 248, 0.45), rgba(251, 146, 60, 0.42), rgba(236, 72, 153, 0.44), rgba(56, 189, 248, 0.45))' }}
          />
        )}

        {equippedAvatarItemId === 'galaxy_aura' && (
          <>
            <div
              className="pointer-events-none absolute -inset-1 rounded-full opacity-70 blur-lg"
              style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.38) 0%, rgba(56, 189, 248, 0.1) 55%, transparent 75%)' }}
            />
            <span className="pointer-events-none absolute right-2 top-1.5 text-xs text-indigo-100 opacity-90">✦</span>
          </>
        )}

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
        {effectName && (
          <p className="mt-1 text-[11px] font-semibold" style={{ color: '#b9fff9' }}>
            Efeito: {effectName}
          </p>
        )}
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
