import { backendClient } from './backend-client'
import {
  createUserProgress,
  getTotalXPForLevel,
  getUserProgress,
  publishUserProgressSnapshot,
} from './progress.service'
import { getItemById, type ShopItem } from './shop.service'

export interface ActivePowerup {
  itemId: string
  type: string
  value: number
  activatedAt: string
  expiresAt: string | null
}

export type InventoryEquipSlot = Exclude<ShopItem['category'], 'powerup'>

export interface EquippedItems {
  avatar: string | null
  badge: string | null
  theme: string | null
}

export interface UserInventoryResponse {
  purchasedItemIds: string[]
  activePowerups: ActivePowerup[]
  equippedItems: EquippedItems
}

export interface PurchaseShopItemResponse {
  success: boolean
  reason?: string
  newBalance: number
  newXP: number
  newLevel: number
  purchasedItemIds: string[]
  activePowerups: ActivePowerup[]
  equippedItems: EquippedItems
}

export interface UpdateEquippedItemsResponse {
  success: boolean
  reason?: 'item_unavailable' | 'item_not_owned' | 'item_not_equipable'
  equippedItems: EquippedItems
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

export interface RewardPowerupModifiers {
  xpMultiplier: number
  coinMultiplier: number
}

export interface StreakFreezeConsumptionResult {
  success: boolean
  consumedUses: number
  remainingUses: number
}

const DEFAULT_EQUIPPED_ITEMS: EquippedItems = {
  avatar: null,
  badge: null,
  theme: null,
}

const DEFAULT_REWARD_POWERUP_MODIFIERS: RewardPowerupModifiers = {
  xpMultiplier: 1,
  coinMultiplier: 1,
}

const inventorySubscribers = new Map<string, Set<(inventory: UserInventoryResponse) => void>>()

function getEquippedStorageKey(userId: string): string {
  return `livequest_equipped_items:${userId}`
}

function readEquippedItemsFromStorage(userId: string): Partial<EquippedItems> {
  if (typeof window === 'undefined') return {}

  try {
    const rawValue = window.localStorage.getItem(getEquippedStorageKey(userId))
    if (!rawValue) return {}

    const parsed = JSON.parse(rawValue) as Partial<EquippedItems>
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

function saveEquippedItemsToStorage(userId: string, equippedItems: EquippedItems): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(getEquippedStorageKey(userId), JSON.stringify(equippedItems))
  } catch {
    // Ignore storage errors.
  }
}

function normalizeEquippedItems(userId: string, ownedItems: Set<string>): EquippedItems {
  const storageState = readEquippedItemsFromStorage(userId)
  const normalized: EquippedItems = { ...DEFAULT_EQUIPPED_ITEMS }

  ;(['avatar', 'badge', 'theme'] as const).forEach((slot) => {
    const candidate = storageState[slot]
    normalized[slot] = typeof candidate === 'string' && ownedItems.has(candidate) ? candidate : null
  })

  saveEquippedItemsToStorage(userId, normalized)
  return normalized
}

function registerInventorySubscriber(
  userId: string,
  callback: (inventory: UserInventoryResponse) => void
): void {
  const listeners = inventorySubscribers.get(userId)
  if (listeners) {
    listeners.add(callback)
    return
  }

  inventorySubscribers.set(userId, new Set([callback]))
}

function unregisterInventorySubscriber(
  userId: string,
  callback: (inventory: UserInventoryResponse) => void
): void {
  const listeners = inventorySubscribers.get(userId)
  if (!listeners) return

  listeners.delete(callback)
  if (listeners.size === 0) {
    inventorySubscribers.delete(userId)
  }
}

function notifyInventorySubscribers(userId: string, inventory: UserInventoryResponse): void {
  const listeners = inventorySubscribers.get(userId)
  if (!listeners || listeners.size === 0) return

  listeners.forEach((listener) => {
    try {
      listener(inventory)
    } catch {
      // Ignore subscriber callback errors.
    }
  })
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

  if (!Number.isFinite(value) || value <= 0) {
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

function toPositiveInteger(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.floor(value))
}

function getStreakFreezeUses(activePowerups: ActivePowerup[]): number {
  return activePowerups.reduce((total, powerup) => {
    if (powerup.type !== 'streak_freeze') return total
    return total + toPositiveInteger(powerup.value)
  }, 0)
}

function getPowerupExpirationTimestamp(powerup: ActivePowerup): number {
  if (!powerup.expiresAt) return Number.POSITIVE_INFINITY

  const timestamp = new Date(powerup.expiresAt).getTime()
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp
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
  const purchasedItemIds = Array.isArray(row?.purchased_item_ids) ? row?.purchased_item_ids : []
  const purchasedSet = new Set(purchasedItemIds)

  const activePowerups = (row?.active_powerups || [])
    .map((entry) => mapActivePowerup(entry))
    .filter((entry): entry is ActivePowerup => Boolean(entry))

  const equippedItems = normalizeEquippedItems(userId, purchasedSet)

  if (activePowerups.length !== (row?.active_powerups || []).length) {
    await backendClient
      .from('user_inventories')
      .update({
        active_powerups: activePowerups,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  }

  return {
    purchasedItemIds,
    activePowerups,
    equippedItems,
  }
}

function sanitizeMultiplier(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.max(1, value)
}

export async function getRewardPowerupModifiers(userId: string): Promise<RewardPowerupModifiers> {
  try {
    const inventory = await normalizeInventory(userId)
    return inventory.activePowerups.reduce<RewardPowerupModifiers>((result, powerup) => {
      if (powerup.type === 'xp_boost') {
        return {
          ...result,
          xpMultiplier: Math.max(result.xpMultiplier, sanitizeMultiplier(powerup.value)),
        }
      }

      if (powerup.type === 'double_coins') {
        return {
          ...result,
          coinMultiplier: Math.max(result.coinMultiplier, sanitizeMultiplier(powerup.value)),
        }
      }

      return result
    }, { ...DEFAULT_REWARD_POWERUP_MODIFIERS })
  } catch {
    return { ...DEFAULT_REWARD_POWERUP_MODIFIERS }
  }
}

export async function getUserInventory(): Promise<UserInventoryResponse> {
  const userId = await getCurrentUserId()
  const inventory = await normalizeInventory(userId)
  notifyInventorySubscribers(userId, inventory)
  return inventory
}

export function publishUserInventorySnapshot(userId: string, inventory: UserInventoryResponse): void {
  notifyInventorySubscribers(userId, inventory)
}

export function subscribeToUserInventory(
  userId: string,
  callback: (inventory: UserInventoryResponse) => void
): () => void {
  registerInventorySubscriber(userId, callback)

  void normalizeInventory(userId)
    .then((inventory) => {
      notifyInventorySubscribers(userId, inventory)
    })
    .catch(() => {
      // Ignore bootstrap sync errors.
    })

  return () => {
    unregisterInventorySubscriber(userId, callback)
  }
}

export async function consumeStreakFreezeUses(
  userId: string,
  usesToConsume: number
): Promise<StreakFreezeConsumptionResult> {
  const requiredUses = toPositiveInteger(usesToConsume)
  const inventoryRow = await getInventoryRow(userId)
  const purchasedItemIds = Array.isArray(inventoryRow?.purchased_item_ids) ? inventoryRow.purchased_item_ids : []
  const activePowerups = (inventoryRow?.active_powerups || [])
    .map((entry) => mapActivePowerup(entry))
    .filter((entry): entry is ActivePowerup => Boolean(entry))

  const availableUses = getStreakFreezeUses(activePowerups)
  if (requiredUses <= 0) {
    return {
      success: true,
      consumedUses: 0,
      remainingUses: availableUses,
    }
  }

  if (availableUses < requiredUses) {
    return {
      success: false,
      consumedUses: 0,
      remainingUses: availableUses,
    }
  }

  let remainingToConsume = requiredUses
  const nextPowerups: ActivePowerup[] = []
  const sortedPowerups = [...activePowerups].sort(
    (left, right) => getPowerupExpirationTimestamp(left) - getPowerupExpirationTimestamp(right)
  )

  for (const powerup of sortedPowerups) {
    if (powerup.type !== 'streak_freeze') {
      nextPowerups.push(powerup)
      continue
    }

    const currentUses = toPositiveInteger(powerup.value)
    if (remainingToConsume <= 0) {
      nextPowerups.push(powerup)
      continue
    }

    const consumedNow = Math.min(currentUses, remainingToConsume)
    const remainingUses = currentUses - consumedNow
    remainingToConsume -= consumedNow

    if (remainingUses > 0) {
      nextPowerups.push({
        ...powerup,
        value: remainingUses,
      })
    }
  }

  const nowIso = new Date().toISOString()
  const { error: updateError } = await backendClient.from('user_inventories').upsert(
    {
      user_id: userId,
      purchased_item_ids: purchasedItemIds,
      active_powerups: nextPowerups,
      updated_at: nowIso,
      created_at: inventoryRow?.created_at || nowIso,
    },
    { onConflict: 'user_id' }
  )

  if (updateError) {
    throw updateError
  }

  const equippedItems = normalizeEquippedItems(userId, new Set(purchasedItemIds))
  notifyInventorySubscribers(userId, {
    purchasedItemIds,
    activePowerups: nextPowerups,
    equippedItems,
  })

  return {
    success: true,
    consumedUses: requiredUses,
    remainingUses: getStreakFreezeUses(nextPowerups),
  }
}

export async function equipInventoryItem(itemId: string): Promise<UpdateEquippedItemsResponse> {
  const userId = await getCurrentUserId()
  const item = getItemById(itemId)

  if (!item) {
    return {
      success: false,
      reason: 'item_unavailable',
      equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
    }
  }

  if (item.category === 'powerup') {
    const inventory = await normalizeInventory(userId)
    return {
      success: false,
      reason: 'item_not_equipable',
      equippedItems: inventory.equippedItems,
    }
  }

  const inventory = await normalizeInventory(userId)
  const ownedItems = new Set(inventory.purchasedItemIds)
  if (!ownedItems.has(item.id)) {
    return {
      success: false,
      reason: 'item_not_owned',
      equippedItems: inventory.equippedItems,
    }
  }

  const slot = item.category as InventoryEquipSlot
  const nextEquippedItems: EquippedItems = {
    ...inventory.equippedItems,
    [slot]: item.id,
  }

  saveEquippedItemsToStorage(userId, nextEquippedItems)
  notifyInventorySubscribers(userId, {
    purchasedItemIds: inventory.purchasedItemIds,
    activePowerups: inventory.activePowerups,
    equippedItems: nextEquippedItems,
  })

  return {
    success: true,
    equippedItems: nextEquippedItems,
  }
}

export async function unequipInventorySlot(slot: InventoryEquipSlot): Promise<UpdateEquippedItemsResponse> {
  const userId = await getCurrentUserId()
  const inventory = await normalizeInventory(userId)

  const nextEquippedItems: EquippedItems = {
    ...inventory.equippedItems,
    [slot]: null,
  }

  saveEquippedItemsToStorage(userId, nextEquippedItems)
  notifyInventorySubscribers(userId, {
    purchasedItemIds: inventory.purchasedItemIds,
    activePowerups: inventory.activePowerups,
    equippedItems: nextEquippedItems,
  })

  return {
    success: true,
    equippedItems: nextEquippedItems,
  }
}

export async function purchaseShopItem(itemId: string): Promise<PurchaseShopItemResponse> {
  const userId = await getCurrentUserId()
  const item = getItemById(itemId)

  if (!item) {
    return {
      success: false,
      reason: 'item_unavailable',
      newBalance: 0,
      newXP: 0,
      newLevel: 1,
      purchasedItemIds: [],
      activePowerups: [],
      equippedItems: { ...DEFAULT_EQUIPPED_ITEMS },
    }
  }

  const progress = (await getUserProgress(userId)) || (await createUserProgress(userId))
  const currentInventory = await normalizeInventory(userId)

  if (item.category !== 'powerup' && currentInventory.purchasedItemIds.includes(item.id)) {
    return {
      success: false,
      reason: 'item_already_owned',
      newBalance: progress.coins,
      newXP: progress.xp,
      newLevel: progress.level,
      purchasedItemIds: currentInventory.purchasedItemIds,
      activePowerups: currentInventory.activePowerups,
      equippedItems: currentInventory.equippedItems,
    }
  }

  if (item.isPremiumOnly && !progress.isPremium) {
    return {
      success: false,
      reason: 'premium_required',
      newBalance: progress.coins,
      newXP: progress.xp,
      newLevel: progress.level,
      purchasedItemIds: currentInventory.purchasedItemIds,
      activePowerups: currentInventory.activePowerups,
      equippedItems: currentInventory.equippedItems,
    }
  }

  if (progress.coins < item.price) {
    return {
      success: false,
      reason: 'coins_insufficient',
      newBalance: progress.coins,
      newXP: progress.xp,
      newLevel: progress.level,
      purchasedItemIds: currentInventory.purchasedItemIds,
      activePowerups: currentInventory.activePowerups,
      equippedItems: currentInventory.equippedItems,
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
        newXP: progress.xp,
        newLevel: progress.level,
        purchasedItemIds: currentInventory.purchasedItemIds,
        activePowerups: currentInventory.activePowerups,
        equippedItems: currentInventory.equippedItems,
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

  const equippedItems = normalizeEquippedItems(userId, purchasedItemIds)
  if (item.category !== 'powerup') {
    const slot = item.category as InventoryEquipSlot
    if (!equippedItems[slot]) {
      equippedItems[slot] = item.id
      saveEquippedItemsToStorage(userId, equippedItems)
    }
  }

  const nextInventory: UserInventoryResponse = {
    purchasedItemIds: Array.from(purchasedItemIds),
    activePowerups,
    equippedItems,
  }

  publishUserProgressSnapshot({
    ...progress,
    coins: newBalance,
    xp: updatedXP,
    level: updatedLevel,
    updatedAt: new Date(nowIso),
  })

  notifyInventorySubscribers(userId, nextInventory)

  return {
    success: true,
    newBalance,
    newXP: updatedXP,
    newLevel: updatedLevel,
    ...nextInventory,
  }
}
