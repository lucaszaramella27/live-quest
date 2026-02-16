import { backendClient } from './backend-client'
import { createUserProgress, getTotalXPForLevel, getUserProgress } from './progress.service'
import { getItemById } from './shop.service'

export interface ActivePowerup {
  itemId: string
  type: string
  value: number
  activatedAt: string
  expiresAt: string | null
}

export interface UserInventoryResponse {
  purchasedItemIds: string[]
  activePowerups: ActivePowerup[]
}

export interface PurchaseShopItemResponse {
  success: boolean
  reason?: string
  newBalance: number
  purchasedItemIds: string[]
  activePowerups: ActivePowerup[]
}

interface UserInventoryRow {
  user_id: string
  purchased_item_ids: string[] | null
  active_powerups: Array<Record<string, unknown>> | null
  created_at: string | null
  updated_at: string | null
}

interface ShopStockRow {
  item_id: string
  stock: number | null
}

function mapActivePowerup(entry: Record<string, unknown>): ActivePowerup | null {
  const itemId = typeof entry.itemId === 'string' ? entry.itemId : ''
  const type = typeof entry.type === 'string' ? entry.type : ''
  const value = Number(entry.value ?? 0)
  const activatedAt = typeof entry.activatedAt === 'string' ? entry.activatedAt : ''
  const expiresAt = typeof entry.expiresAt === 'string' ? entry.expiresAt : null

  if (!itemId || !type || !activatedAt) {
    return null
  }

  if (expiresAt) {
    const expirationDate = new Date(expiresAt)
    if (!Number.isNaN(expirationDate.getTime()) && expirationDate.getTime() < Date.now()) {
      return null
    }
  }

  return {
    itemId,
    type,
    value,
    activatedAt,
    expiresAt,
  }
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await backendClient.auth.getUser()

  if (!user) {
    throw new Error('Usuario nao autenticado.')
  }

  return user.id
}

async function getInventoryRow(userId: string): Promise<UserInventoryRow | null> {
  const { data, error } = await backendClient
    .from('user_inventories')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<UserInventoryRow>()

  if (error) {
    throw error
  }

  return data
}

async function normalizeInventory(userId: string): Promise<UserInventoryResponse> {
  const row = await getInventoryRow(userId)
  if (!row) {
    return {
      purchasedItemIds: [],
      activePowerups: [],
    }
  }

  const activePowerups = (row.active_powerups || [])
    .map((entry) => mapActivePowerup(entry))
    .filter((entry): entry is ActivePowerup => Boolean(entry))

  if (activePowerups.length !== (row.active_powerups || []).length) {
    await backendClient
      .from('user_inventories')
      .update({
        active_powerups: activePowerups,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  }

  return {
    purchasedItemIds: Array.isArray(row.purchased_item_ids) ? row.purchased_item_ids : [],
    activePowerups,
  }
}

export async function getUserInventory(): Promise<UserInventoryResponse> {
  const userId = await getCurrentUserId()
  return normalizeInventory(userId)
}

export async function purchaseShopItem(itemId: string): Promise<PurchaseShopItemResponse> {
  const userId = await getCurrentUserId()
  const item = getItemById(itemId)

  if (!item) {
    return {
      success: false,
      reason: 'item_unavailable',
      newBalance: 0,
      purchasedItemIds: [],
      activePowerups: [],
    }
  }

  const progress = (await getUserProgress(userId)) || (await createUserProgress(userId))

  if (item.isPremiumOnly && !progress.isPremium) {
    return {
      success: false,
      reason: 'premium_required',
      newBalance: progress.coins,
      purchasedItemIds: [],
      activePowerups: [],
    }
  }

  if (progress.coins < item.price) {
    const inventory = await normalizeInventory(userId)
    return {
      success: false,
      reason: 'coins_insufficient',
      newBalance: progress.coins,
      purchasedItemIds: inventory.purchasedItemIds,
      activePowerups: inventory.activePowerups,
    }
  }

  if (item.isLimited && typeof item.stock === 'number') {
    const { data: stockRow, error: stockError } = await backendClient
      .from('shop_stock')
      .select('item_id, stock')
      .eq('item_id', item.id)
      .maybeSingle<ShopStockRow>()

    if (stockError) {
      throw stockError
    }

    const currentStock = Number(stockRow?.stock ?? item.stock)
    if (currentStock <= 0) {
      return {
        success: false,
        reason: 'item_unavailable',
        newBalance: progress.coins,
        purchasedItemIds: [],
        activePowerups: [],
      }
    }

    const { error: stockUpdateError } = await backendClient.from('shop_stock').upsert(
      {
        item_id: item.id,
        stock: currentStock - 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'item_id' }
    )

    if (stockUpdateError) {
      throw stockUpdateError
    }
  }

  const inventoryRow = await getInventoryRow(userId)
  const purchasedItemIds = new Set<string>(inventoryRow?.purchased_item_ids || [])
  purchasedItemIds.add(item.id)

  const activePowerups = (inventoryRow?.active_powerups || [])
    .map((entry) => mapActivePowerup(entry))
    .filter((entry): entry is ActivePowerup => Boolean(entry))

  let updatedXP = progress.xp
  let updatedLevel = progress.level

  if (item.effect) {
    if (item.effect.type === 'instant_level') {
      updatedLevel = progress.level + Math.max(1, item.effect.value)
      updatedXP = Math.max(progress.xp, getTotalXPForLevel(updatedLevel))
    } else {
      const activatedAt = new Date().toISOString()
      const expiresAt =
        typeof item.effect.duration === 'number'
          ? new Date(Date.now() + item.effect.duration * 60 * 60 * 1000).toISOString()
          : null

      activePowerups.push({
        itemId: item.id,
        type: item.effect.type,
        value: item.effect.value,
        activatedAt,
        expiresAt,
      })
    }
  }

  const newBalance = progress.coins - item.price
  const nowIso = new Date().toISOString()

  const { error: progressUpdateError } = await backendClient
    .from('user_progress')
    .update({
      coins: newBalance,
      xp: updatedXP,
      level: updatedLevel,
      updated_at: nowIso,
    })
    .eq('user_id', userId)

  if (progressUpdateError) {
    throw progressUpdateError
  }

  const { error: inventoryUpdateError } = await backendClient.from('user_inventories').upsert(
    {
      user_id: userId,
      purchased_item_ids: Array.from(purchasedItemIds),
      active_powerups: activePowerups,
      updated_at: nowIso,
      created_at: inventoryRow?.created_at || nowIso,
    },
    { onConflict: 'user_id' }
  )

  if (inventoryUpdateError) {
    throw inventoryUpdateError
  }

  return {
    success: true,
    newBalance,
    purchasedItemIds: Array.from(purchasedItemIds),
    activePowerups,
  }
}
