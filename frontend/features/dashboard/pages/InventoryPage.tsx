import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button, GradientCard, IconMapper, Toast } from '@/shared/ui'
import { Archive, Check, Crown, Package, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import {
  equipInventoryItem,
  getUserInventory,
  subscribeToUserInventory,
  unequipInventorySlot,
  type ActivePowerup,
  type InventoryEquipSlot,
  type UserInventoryResponse,
} from '@/services/inventory.service'
import {
  SHOP_ITEMS,
  getCategoryIcon,
  getCategoryName,
  getRarityColor,
  getRarityGradient,
  type ShopItem,
} from '@/services/shop.service'
import { reportError } from '@/services/logger.service'

type InventoryCategoryFilter = 'all' | ShopItem['category']

export function InventoryPage() {
  const { user } = useAuth()
  const [inventory, setInventory] = useState<UserInventoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategoryFilter>('all')
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  })

  useEffect(() => {
    if (!user) return
    void loadInventory()

    const unsubscribe = subscribeToUserInventory(user.id, (updatedInventory) => {
      setInventory(updatedInventory)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  async function loadInventory() {
    if (!user) return

    try {
      setLoading(true)
      const data = await getUserInventory()
      setInventory(data)
    } catch (error) {
      reportError('inventory_page_load_inventory', error, { userId: user.id })
      setToast({
        show: true,
        message: 'Nao foi possivel carregar seu inventario agora.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleEquip(item: ShopItem) {
    setProcessingAction(`equip:${item.id}`)
    try {
      const result = await equipInventoryItem(item.id)
      if (!result.success) {
        setToast({
          show: true,
          message:
            result.reason === 'item_not_owned'
              ? 'Voce ainda nao possui este item.'
              : result.reason === 'item_not_equipable'
                ? 'Este item nao pode ser equipado.'
                : 'Nao foi possivel equipar este item.',
          type: 'error',
        })
        return
      }

      setInventory((current) =>
        current
          ? {
              ...current,
              equippedItems: result.equippedItems,
            }
          : current
      )
      setToast({ show: true, message: 'Item equipado com sucesso.', type: 'success' })
    } catch (error) {
      reportError('inventory_page_equip_item', error, { itemId: item.id })
      setToast({ show: true, message: 'Erro ao equipar item.', type: 'error' })
    } finally {
      setProcessingAction(null)
    }
  }

  async function handleUnequip(slot: InventoryEquipSlot) {
    setProcessingAction(`unequip:${slot}`)
    try {
      const result = await unequipInventorySlot(slot)
      if (!result.success) {
        setToast({ show: true, message: 'Nao foi possivel desequipar agora.', type: 'error' })
        return
      }

      setInventory((current) =>
        current
          ? {
              ...current,
              equippedItems: result.equippedItems,
            }
          : current
      )
      setToast({ show: true, message: 'Item desequipado.', type: 'success' })
    } catch (error) {
      reportError('inventory_page_unequip_slot', error, { slot })
      setToast({ show: true, message: 'Erro ao desequipar item.', type: 'error' })
    } finally {
      setProcessingAction(null)
    }
  }

  const ownedItems = useMemo(() => {
    if (!inventory) return []
    const ownedIds = new Set(inventory.purchasedItemIds)
    return SHOP_ITEMS.filter((item) => ownedIds.has(item.id))
  }, [inventory])

  const filteredOwnedItems = useMemo(() => {
    if (selectedCategory === 'all') return ownedItems
    return ownedItems.filter((item) => item.category === selectedCategory)
  }, [ownedItems, selectedCategory])

  const equippedEntries = useMemo(() => {
    const fallback: Array<{ slot: InventoryEquipSlot; item: ShopItem | null }> = [
      { slot: 'avatar', item: null },
      { slot: 'badge', item: null },
      { slot: 'theme', item: null },
    ]
    if (!inventory) return fallback

    const itemsById = new Map(SHOP_ITEMS.map((item) => [item.id, item]))
    return (Object.entries(inventory.equippedItems) as Array<[InventoryEquipSlot, string | null]>).map(
      ([slot, itemId]) => ({
        slot,
        item: itemId ? itemsById.get(itemId) || null : null,
      })
    )
  }, [inventory])

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <GradientCard hover={false} className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-90" style={{ background: 'var(--gradient-overlay)' }} />
        <div className="relative">
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ borderColor: 'rgba(94, 247, 226, 0.3)', color: '#b9fff9' }}
          >
            <Archive className="h-4 w-4" />
            Inventory
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">Inventario</h1>
          <p className="mt-3 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Tudo que voce conquista fica guardado aqui para equipar ou desequipar quando quiser.
          </p>
        </div>
      </GradientCard>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MiniStat label="Itens possuidos" value={ownedItems.length} icon={<Package className="h-4 w-4 text-cyan-200" />} />
        <MiniStat
          label="Power-ups ativos"
          value={inventory?.activePowerups.length || 0}
          icon={<Zap className="h-4 w-4 text-amber-300" />}
        />
        <MiniStat
          label="Slots equipados"
          value={equippedEntries.filter((entry) => entry.item).length}
          icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />}
        />
        <MiniStat label="Raros+" value={ownedItems.filter((item) => item.rarity !== 'common').length} icon={<Crown className="h-4 w-4 text-indigo-200" />} />
      </section>

      <GradientCard hover={false} className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <Sparkles className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-lg font-bold">Equipados agora</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {equippedEntries.map(({ slot, item }) => (
            <div key={slot} className="glass rounded-xl border p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
                {slot}
              </p>
              {item ? (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    <IconMapper icon={item.icon} size={18} />
                    <p className="font-semibold">{item.name}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    disabled={processingAction === `unequip:${slot}`}
                    onClick={() => void handleUnequip(slot)}
                  >
                    {processingAction === `unequip:${slot}` ? 'Processando...' : 'Desequipar'}
                  </Button>
                </>
              ) : (
                <p style={{ color: 'var(--color-text-secondary)' }}>Nenhum item equipado.</p>
              )}
            </div>
          ))}
        </div>
      </GradientCard>

      <section className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all' as const, label: 'Todos' },
          { id: 'avatar' as const, label: 'Avatares' },
          { id: 'badge' as const, label: 'Badges' },
          { id: 'theme' as const, label: 'Temas' },
          { id: 'powerup' as const, label: 'Power-ups' },
        ].map((option) => {
          const isActive = selectedCategory === option.id
          return (
            <button
              key={option.id}
              onClick={() => setSelectedCategory(option.id)}
              className="rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200"
              style={{
                background: isActive ? 'var(--gradient-primary)' : 'rgba(8, 17, 33, 0.78)',
                borderColor: isActive ? 'rgba(94, 247, 226, 0.45)' : 'rgba(139, 161, 203, 0.24)',
                color: isActive ? '#031320' : 'var(--color-text-secondary)',
              }}
            >
              {option.label}
            </button>
          )
        })}
      </section>

      {filteredOwnedItems.length === 0 ? (
        <GradientCard hover={false} className="p-12 text-center">
          <Archive className="mx-auto mb-4 h-12 w-12 opacity-40" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="font-semibold">Nenhum item encontrado nessa categoria.</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Compre itens na loja para montar seu inventario.
          </p>
        </GradientCard>
      ) : (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredOwnedItems.map((item) => {
            const isPowerup = item.category === 'powerup'
            const slot = item.category as InventoryEquipSlot
            const isEquipped = !isPowerup && inventory?.equippedItems[slot] === item.id
            const isProcessing = processingAction === `equip:${item.id}` || processingAction === `unequip:${slot}`
            const activeInstances = (inventory?.activePowerups || []).filter((entry) => entry.itemId === item.id)

            return (
              <GradientCard key={item.id} hover className="relative overflow-hidden p-0">
                <div className={`rounded-2xl bg-gradient-to-br p-5 ${getRarityGradient(item.rarity)}`}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span
                      className="rounded-lg border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        borderColor: 'rgba(139, 161, 203, 0.24)',
                        background: 'rgba(4, 13, 25, 0.58)',
                        color: getRarityColor(item.rarity),
                      }}
                    >
                      {item.rarity}
                    </span>

                    <span
                      className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px]"
                      style={{ borderColor: 'rgba(139, 161, 203, 0.24)', color: 'var(--color-text-secondary)' }}
                    >
                      <IconMapper icon={getCategoryIcon(item.category)} size={12} />
                      {getCategoryName(item.category)}
                    </span>
                  </div>

                  <div className="mb-4 flex items-center gap-3">
                    <div className="glass flex h-14 w-14 items-center justify-center rounded-xl border">
                      <IconMapper icon={item.icon} size={32} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold">{item.name}</p>
                      <p className="truncate text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {isPowerup ? (
                    <div className="glass rounded-xl border p-3">
                      <p className="text-sm font-semibold">Power-up utilitario</p>
                      {activeInstances.length > 0 ? (
                        <div className="mt-2 space-y-1">
                          {activeInstances.map((instance: ActivePowerup) => (
                            <p key={`${instance.itemId}:${instance.activatedAt}`} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {formatPowerupStatus(instance)}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Nenhuma instancia ativa no momento.
                        </p>
                      )}
                    </div>
                  ) : isEquipped ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      disabled={isProcessing}
                      onClick={() => void handleUnequip(slot)}
                      icon={<Check className="h-4 w-4" />}
                    >
                      {isProcessing ? 'Processando...' : 'Desequipar'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full"
                      disabled={isProcessing}
                      onClick={() => void handleEquip(item)}
                    >
                      {isProcessing ? 'Processando...' : 'Equipar'}
                    </Button>
                  )}
                </div>
              </GradientCard>
            )
          })}
        </section>
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, show: false }))}
      />
    </div>
  )
}

interface MiniStatProps {
  label: string
  value: string | number
  icon: ReactNode
}

function MiniStat({ label, value, icon }: MiniStatProps) {
  return (
    <div className="glass rounded-2xl border p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function formatPowerupExpiration(expiresAt: string | null): string {
  if (!expiresAt) return 'ate uso manual'

  const expiresDate = new Date(expiresAt)
  if (Number.isNaN(expiresDate.getTime())) return 'com duracao ativa'

  const diffMs = expiresDate.getTime() - Date.now()
  if (diffMs <= 0) return 'com expiracao encerrada'

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  if (diffHours > 0) return `por ${diffHours}h ${diffMinutes}m`
  return `por ${diffMinutes}m`
}

function formatPowerupStatus(powerup: ActivePowerup): string {
  if (powerup.type === 'streak_freeze') {
    const uses = Math.max(1, Math.floor(powerup.value))
    return `${uses} uso${uses > 1 ? 's' : ''} restante${uses > 1 ? 's' : ''}`
  }

  return `Ativo ${formatPowerupExpiration(powerup.expiresAt)}`
}
