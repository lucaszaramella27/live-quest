import type { IconName } from '@/shared/ui'

export interface ShopItem {
  id: string
  name: string
  description: string
  icon: IconName
  price: number
  category: 'theme' | 'powerup' | 'avatar' | 'badge'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  effect?: {
    type: 'xp_boost' | 'streak_freeze' | 'double_coins' | 'instant_level'
    value: number
    duration?: number // in hours
  }
  isPremiumOnly?: boolean
  isLimited?: boolean
  stock?: number
}

export const SHOP_ITEMS: ShopItem[] = [
  // Power-ups
  {
    id: 'xp_boost_1h',
    name: '2x XP - 1 Hora',
    description: 'Dobra todo XP ganho por 1 hora',
    icon: 'zap' as IconName,
    price: 50,
    category: 'powerup',
    rarity: 'common',
    effect: {
      type: 'xp_boost',
      value: 2,
      duration: 1
    }
  },
  {
    id: 'xp_boost_24h',
    name: '2x XP - 24 Horas',
    description: 'Dobra todo XP ganho por 24 horas',
    icon: 'zap-double' as IconName,
    price: 200,
    category: 'powerup',
    rarity: 'rare',
    effect: {
      type: 'xp_boost',
      value: 2,
      duration: 24
    }
  },
  {
    id: 'xp_boost_week',
    name: '3x XP - 1 Semana',
    description: 'TRIPLICA todo XP ganho por 7 dias!',
    icon: 'zap-triple' as IconName,
    price: 1000,
    category: 'powerup',
    rarity: 'legendary',
    effect: {
      type: 'xp_boost',
      value: 3,
      duration: 168
    }
  },
  {
    id: 'streak_freeze_1d',
    name: 'Reviver Streak - 1 Uso',
    description: 'Salva seu streak de 1 dia perdido',
    icon: 'snowflake' as IconName,
    price: 100,
    category: 'powerup',
    rarity: 'rare',
    effect: {
      type: 'streak_freeze',
      value: 1
    }
  },
  {
    id: 'streak_freeze_3d',
    name: 'Reviver Streak - 3 Usos',
    description: 'Salva seu streak por até 3 dias',
    icon: 'snowflake-double' as IconName,
    price: 250,
    category: 'powerup',
    rarity: 'epic',
    effect: {
      type: 'streak_freeze',
      value: 3
    }
  },
  {
    id: 'double_coins_24h',
    name: '2x Moedas - 24h',
    description: 'Dobra todas as moedas ganhas por 24h',
    icon: 'coins-double' as IconName,
    price: 150,
    category: 'powerup',
    rarity: 'rare',
    effect: {
      type: 'double_coins',
      value: 2,
      duration: 24
    }
  },
  {
    id: 'instant_level',
    name: 'Level Up Instantâneo',
    description: 'Sobe 1 nível imediatamente',
    icon: 'rocket' as IconName,
    price: 500,
    category: 'powerup',
    rarity: 'epic',
    effect: {
      type: 'instant_level',
      value: 1
    }
  },

  // Avatar Decorations
  {
    id: 'sparkle_effect',
    name: 'Efeito Brilho',
    description: 'Seu avatar brilha com estrelas',
    icon: 'sparkles' as IconName,
    price: 200,
    category: 'avatar',
    rarity: 'rare'
  },
  {
    id: 'fire_aura',
    name: 'Aura de Fogo',
    description: 'Chamas ao redor do seu avatar',
    icon: 'fire-aura' as IconName,
    price: 300,
    category: 'avatar',
    rarity: 'epic',
    isPremiumOnly: true
  },
  {
    id: 'rainbow_trail',
    name: 'Rastro Arco-íris',
    description: 'Deixa um rastro colorido',
    icon: 'rainbow' as IconName,
    price: 400,
    category: 'avatar',
    rarity: 'epic',
    isPremiumOnly: true
  },
  {
    id: 'galaxy_aura',
    name: 'Aura Galáctica',
    description: 'Efeito de galáxia cósmico',
    icon: 'stars' as IconName,
    price: 1000,
    category: 'avatar',
    rarity: 'legendary',
    isPremiumOnly: true
  },

  // Special Badges
  {
    id: 'streak_master_badge',
    name: 'Badge Mestre do Streak',
    description: 'Mostra sua dedicação',
    icon: 'flame' as IconName,
    price: 300,
    category: 'badge',
    rarity: 'epic'
  },
  {
    id: 'whale_badge',
    name: 'Badge Baleia',
    description: 'Para os verdadeiros supporters',
    icon: 'waves' as IconName,
    price: 2000,
    category: 'badge',
    rarity: 'legendary',
    isLimited: true,
    stock: 100
  },
  {
    id: 'og_badge',
    name: 'Badge OG',
    description: 'Early Adopter exclusivo',
    icon: 'crown-legendary' as IconName,
    price: 5000,
    category: 'badge',
    rarity: 'legendary',
    isLimited: true,
    stock: 50
  }
]

export interface UserInventory {
  userId: string
  items: {
    itemId: string
    quantity: number
    purchasedAt: Date
    expiresAt?: Date
  }[]
  activePowerups: {
    itemId: string
    activatedAt: Date
    expiresAt: Date
  }[]
}

export function getItemsByCategory(category: ShopItem['category']): ShopItem[] {
  return SHOP_ITEMS.filter(item => item.category === category)
}

export function getItemsByRarity(rarity: ShopItem['rarity']): ShopItem[] {
  return SHOP_ITEMS.filter(item => item.rarity === rarity)
}

export function getItemById(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find(item => item.id === itemId)
}

export function canPurchaseItem(item: ShopItem, userCoins: number, isPremium: boolean): { canPurchase: boolean; reason?: string } {
  if (item.isPremiumOnly && !isPremium) {
    return { canPurchase: false, reason: 'Item exclusivo Premium' }
  }

  if (userCoins < item.price) {
    return { canPurchase: false, reason: 'Moedas insuficientes' }
  }

  if (item.isLimited && item.stock !== undefined && item.stock <= 0) {
    return { canPurchase: false, reason: 'Esgotado' }
  }

  return { canPurchase: true }
}

export function getRarityColor(rarity: ShopItem['rarity']): string {
  const colors = {
    common: '#9ca3af',
    rare: '#06b6d4',
    epic: '#8b5cf6',
    legendary: '#fbbf24'
  }
  return colors[rarity]
}

export function getRarityGradient(rarity: ShopItem['rarity']): string {
  const gradients = {
    common: 'from-gray-500/20 to-gray-600/20',
    rare: 'from-cyan-500/20 to-blue-500/20',
    epic: 'from-purple-500/20 to-indigo-500/20',
    legendary: 'from-yellow-500/20 to-orange-500/20'
  }
  return gradients[rarity]
}

export function getCategoryIcon(category: ShopItem['category']): IconName {
  const icons: Record<ShopItem['category'], IconName> = {
    theme: 'palette',
    powerup: 'zap',
    avatar: 'sparkles',
    badge: 'trophy'
  }
  return icons[category]
}

export function getCategoryName(category: ShopItem['category']): string {
  const names = {
    theme: 'Temas',
    powerup: 'Power-ups',
    avatar: 'Avatares',
    badge: 'Badges'
  }
  return names[category]
}
