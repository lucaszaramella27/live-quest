const SHOP_ITEMS = [
  {
    id: 'xp_boost_1h',
    price: 50,
    category: 'powerup',
    effect: { type: 'xp_boost', value: 2, duration: 1 },
  },
  {
    id: 'xp_boost_24h',
    price: 200,
    category: 'powerup',
    effect: { type: 'xp_boost', value: 2, duration: 24 },
  },
  {
    id: 'xp_boost_week',
    price: 1000,
    category: 'powerup',
    effect: { type: 'xp_boost', value: 3, duration: 168 },
  },
  {
    id: 'streak_freeze_1d',
    price: 100,
    category: 'powerup',
    effect: { type: 'streak_freeze', value: 1 },
  },
  {
    id: 'streak_freeze_3d',
    price: 250,
    category: 'powerup',
    effect: { type: 'streak_freeze', value: 3 },
  },
  {
    id: 'double_coins_24h',
    price: 150,
    category: 'powerup',
    effect: { type: 'double_coins', value: 2, duration: 24 },
  },
  {
    id: 'instant_level',
    price: 500,
    category: 'powerup',
    effect: { type: 'instant_level', value: 1 },
  },
  {
    id: 'sparkle_effect',
    price: 200,
    category: 'avatar',
  },
  {
    id: 'fire_aura',
    price: 300,
    category: 'avatar',
    isPremiumOnly: true,
  },
  {
    id: 'rainbow_trail',
    price: 400,
    category: 'avatar',
    isPremiumOnly: true,
  },
  {
    id: 'galaxy_aura',
    price: 1000,
    category: 'avatar',
    isPremiumOnly: true,
  },
  {
    id: 'streak_master_badge',
    price: 300,
    category: 'badge',
  },
  {
    id: 'whale_badge',
    price: 2000,
    category: 'badge',
    isLimited: true,
    stock: 100,
  },
  {
    id: 'og_badge',
    price: 5000,
    category: 'badge',
    isLimited: true,
    stock: 50,
  },
]

const ITEM_BY_ID = new Map(SHOP_ITEMS.map((item) => [item.id, item]))

export function getShopItemById(itemId) {
  return ITEM_BY_ID.get(itemId) || null
}
