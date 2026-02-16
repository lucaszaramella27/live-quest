import { Title, getRarityColor } from '@/services/titles.service'

interface TitleBadgeProps {
  title: Title
  size?: 'sm' | 'md' | 'lg'
  showDescription?: boolean
  className?: string
}

export function TitleBadge({ title, size = 'md', showDescription = false, className = '' }: TitleBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  }

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <div className={className}>
      <div
        className={`inline-flex items-center ${sizeClasses[size]} rounded-lg border font-bold backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5`}
        style={{
          backgroundColor: `${getRarityColor(title.rarity)}15`,
          borderColor: `${getRarityColor(title.rarity)}40`,
          color: getRarityColor(title.rarity),
        }}
      >
        <span className={iconSizes[size]}>{title.icon}</span>
        <span>{title.name}</span>
      </div>
      {showDescription && (
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {title.description}
        </p>
      )}
    </div>
  )
}
