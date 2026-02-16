import { useEffect, useState, type ElementType } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Button, GradientCard, IconMapper, Modal, Toast } from '@/shared/ui'
import {
  BadgeCheck,
  Check,
  Coins,
  Crown,
  LayoutGrid,
  Lock,
  Package,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getUserInventory, purchaseShopItem, type ActivePowerup } from '@/services/inventory.service'
import { subscribeToUserProgress, type UserProgress } from '@/services/progress.service'
import {
  SHOP_ITEMS,
  canPurchaseItem,
  getCategoryIcon,
  getCategoryName,
  getRarityColor,
  getRarityGradient,
  type ShopItem,
} from '@/services/shop.service'
import { reportError } from '@/services/logger.service'

interface CategoryFilter {
  id: ShopItem['category'] | 'all'
  name: string
  icon: ElementType
}

const categories: CategoryFilter[] = [
  { id: 'all', name: 'Todos', icon: LayoutGrid },
  { id: 'powerup', name: 'Power-ups', icon: Zap },
  { id: 'avatar', name: 'Avatares', icon: Sparkles },
  { id: 'badge', name: 'Badges', icon: BadgeCheck },
]

export function ShopPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPurchase, setProcessingPurchase] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ShopItem['category'] | 'all'>('all')
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])
  const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([])
  const [pendingPurchaseItem, setPendingPurchaseItem] = useState<ShopItem | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'streak' | 'goal' | 'task' | 'achievement' | 'error'>('success')
  const [showToast, setShowToast] = useState(false)

  const isPremium = progress?.isPremium || false

  useEffect(() => {
    if (!user) return

    void loadData()

    const unsubscribe = subscribeToUserProgress(user.id, (updatedProgress) => {
      if (updatedProgress) {
        setProgress(updatedProgress)
      }
    })

    return () => unsubscribe()
  }, [user])

  async function loadData() {
    if (!user) return

    try {
      setLoading(true)
      const inventory = await getUserInventory()
      setPurchasedItems(inventory.purchasedItemIds)
      setActivePowerups(inventory.activePowerups)
    } catch (error) {
      reportError('shop_load_data', error, { userId: user.id })
      setToastMessage('Nao foi possivel carregar os dados da loja.')
      setToastType('error')
      setShowToast(true)
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchase(item: ShopItem) {
    if (!progress) return

    const { canPurchase, reason } = canPurchaseItem(item, progress.coins, isPremium)
    if (!canPurchase) {
      setToastMessage(reason || 'Compra indisponivel no momento.')
      setToastType('error')
      setShowToast(true)
      return
    }

    try {
      setProcessingPurchase(item.id)
      const result = await purchaseShopItem(item.id)

      if (!result.success) {
        if (result.reason === 'coins_insufficient') {
          setToastMessage('Saldo insuficiente para este item.')
        } else if (result.reason === 'premium_required') {
          setToastMessage('Item exclusivo para usuarios Premium.')
        } else if (result.reason === 'backend_unavailable') {
          setToastMessage('Compra indisponivel no ambiente local sem backend ativo.')
        } else {
          setToastMessage('Item indisponivel no momento.')
        }
        setToastType('error')
        setShowToast(true)
        return
      }

      setPurchasedItems(result.purchasedItemIds)
      setActivePowerups(result.activePowerups)
      setProgress((current) =>
        current
          ? {
              ...current,
              coins: result.newBalance,
              xp: result.newXP,
              level: result.newLevel,
            }
          : current
      )

      setToastMessage(`Item comprado com sucesso: ${item.name}`)
      setToastType('success')
      setShowToast(true)
    } catch (error) {
      reportError('shop_purchase_item', error, { itemId: item.id })
      setToastMessage('Erro ao processar compra.')
      setToastType('error')
      setShowToast(true)
    } finally {
      setProcessingPurchase(null)
    }
  }

  function handleOpenPurchaseConfirmation(item: ShopItem) {
    if (!progress) return

    const { canPurchase, reason } = canPurchaseItem(item, progress.coins, isPremium)
    if (!canPurchase) {
      setToastMessage(reason || 'Compra indisponivel no momento.')
      setToastType('error')
      setShowToast(true)
      return
    }

    setPendingPurchaseItem(item)
  }

  function handleClosePurchaseConfirmation() {
    if (processingPurchase) return
    setPendingPurchaseItem(null)
  }

  function handleConfirmPurchase() {
    if (!pendingPurchaseItem) return

    const item = pendingPurchaseItem
    setPendingPurchaseItem(null)
    void handlePurchase(item)
  }

  const filteredItems = selectedCategory === 'all'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter((item) => item.category === selectedCategory)

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-cyan-200/20 border-t-cyan-200" />
          <p style={{ color: 'var(--color-text-secondary)' }}>Carregando loja...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header className="surface-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-90" style={{ background: 'var(--gradient-overlay)' }} />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(94, 247, 226, 0.28)', color: '#bbfff8' }}>
              <Sparkles className="h-4 w-4" />
              Store
            </div>

            <div className="flex items-center gap-3">
              <ShoppingBag className="h-8 w-8" style={{ color: 'var(--color-primary)' }} />
              <h1 className="text-3xl font-bold sm:text-4xl">Loja</h1>
            </div>
            <p className="mt-3 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
              Compre power-ups, badges e itens visuais para acelerar sua evolucao.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={<Package className="h-4 w-4" />}
              onClick={() => navigate('/inventory')}
            >
              Inventario
            </Button>
            <div
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5"
              style={{
                background: 'linear-gradient(140deg, rgba(251, 191, 36, 0.18), rgba(245, 158, 11, 0.1))',
                borderColor: 'rgba(245, 158, 11, 0.35)',
              }}
            >
              <Coins className="h-5 w-5 text-amber-300" />
              <span className="text-sm font-bold text-amber-200">{progress?.coins || 0}</span>
            </div>

            {isPremium ? (
              <div className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5" style={{ borderColor: 'rgba(245, 158, 11, 0.35)', background: 'rgba(251, 191, 36, 0.15)', color: '#fde68a' }}>
                <Crown className="h-4 w-4" />
                Premium
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5" style={{ borderColor: 'rgba(139, 161, 203, 0.26)', color: 'var(--color-text-secondary)' }}>
                <Lock className="h-4 w-4" />
                Plano Free
              </div>
            )}
          </div>
        </div>
      </header>

      {activePowerups.length > 0 && (
        <section className="glass rounded-2xl border p-4 sm:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: '#a9fff5' }}>
            Power-ups ativos
          </p>
          <div className="flex flex-wrap gap-2">
            {activePowerups.map((powerup) => (
              <span
                key={`${powerup.itemId}_${powerup.activatedAt}`}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold"
                style={{
                  borderColor: 'rgba(87, 215, 255, 0.3)',
                  background: 'rgba(5, 15, 28, 0.8)',
                  color: 'var(--color-text)',
                }}
              >
                <Zap className="h-3.5 w-3.5 text-cyan-200" />
                {powerup.itemId}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = category.icon
          const isSelected = selectedCategory === category.id
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200"
              style={{
                background: isSelected ? 'var(--gradient-primary)' : 'rgba(8, 17, 33, 0.75)',
                color: isSelected ? '#031320' : 'var(--color-text-secondary)',
                borderColor: isSelected ? 'rgba(94, 247, 226, 0.45)' : 'rgba(139, 161, 203, 0.22)',
                transform: isSelected ? 'translateY(-1px)' : 'none',
              }}
            >
              <Icon className="h-4 w-4" />
              {category.name}
            </button>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => {
          const { canPurchase, reason } = canPurchaseItem(item, progress?.coins || 0, isPremium)
          const isPurchased = purchasedItems.includes(item.id) && item.category !== 'powerup'

          return (
            <GradientCard key={item.id} hover className="relative overflow-hidden p-0">
              <div className={`h-full rounded-2xl bg-gradient-to-br p-5 ${getRarityGradient(item.rarity)}`}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: 'rgba(139, 161, 203, 0.24)', color: getRarityColor(item.rarity), background: 'rgba(4, 13, 25, 0.58)' }}>
                    {item.rarity}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.isPremiumOnly && (
                      <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold" style={{ borderColor: 'rgba(245, 158, 11, 0.42)', color: '#fcd34d', background: 'rgba(120, 53, 15, 0.35)' }}>
                        <Crown className="h-3 w-3" />
                        Premium
                      </span>
                    )}
                    {item.isLimited && (
                      <span className="inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-bold" style={{ borderColor: 'rgba(248, 113, 113, 0.4)', color: '#fda4af', background: 'rgba(127, 29, 29, 0.32)' }}>
                        Limitado
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4 flex justify-center">
                  <div className="glass flex h-20 w-20 items-center justify-center rounded-2xl border">
                    <IconMapper icon={item.icon} size={56} />
                  </div>
                </div>

                <h3 className="text-xl font-bold" style={{ color: getRarityColor(item.rarity) }}>
                  {item.name}
                </h3>
                <p className="mt-2 min-h-[44px] text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.description}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs" style={{ borderColor: 'rgba(139, 161, 203, 0.24)', color: 'var(--color-text-secondary)' }}>
                  <IconMapper icon={getCategoryIcon(item.category)} size={14} />
                  {getCategoryName(item.category)}
                </div>

                <div className="mt-5 border-t pt-4" style={{ borderColor: 'rgba(139, 161, 203, 0.2)' }}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(120, 53, 15, 0.28)' }}>
                      <Coins className="h-4 w-4 text-amber-300" />
                      <span className="font-bold text-amber-200">{item.price}</span>
                    </div>

                    {isPurchased ? (
                      <div className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-300">
                        <Check className="h-4 w-4" />
                        Comprado
                      </div>
                    ) : canPurchase ? (
                      <Button
                        onClick={() => handleOpenPurchaseConfirmation(item)}
                        disabled={processingPurchase === item.id}
                        variant="primary"
                        size="sm"
                        icon={<ShoppingCart className="h-4 w-4" />}
                      >
                        {processingPurchase === item.id ? 'Comprando...' : 'Comprar'}
                      </Button>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <Lock className="h-4 w-4" />
                        {reason}
                      </div>
                    )}
                  </div>

                  {item.effect && (
                    <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'rgba(139, 161, 203, 0.2)', background: 'rgba(5, 13, 24, 0.65)', color: 'var(--color-text-secondary)' }}>
                      {item.effect.duration ? `Duracao: ${item.effect.duration}h` : 'Uso unico'}
                    </div>
                  )}

                  {item.isLimited && item.stock !== undefined && (
                    <p className="mt-2 text-xs text-rose-300">Estoque limitado no backend</p>
                  )}
                </div>
              </div>
            </GradientCard>
          )
        })}
      </section>

      {filteredItems.length === 0 && (
        <div className="surface-card rounded-2xl p-12 text-center">
          <Sparkles className="mx-auto mb-4 h-14 w-14 opacity-60" style={{ color: 'var(--color-text-secondary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Nenhum item encontrado nesta categoria.</p>
        </div>
      )}

      <Modal
        isOpen={Boolean(pendingPurchaseItem)}
        onClose={handleClosePurchaseConfirmation}
        title="Confirmar compra"
      >
        {pendingPurchaseItem && (
          <div className="space-y-5">
            <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(139, 161, 203, 0.24)', background: 'rgba(8, 17, 33, 0.68)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {pendingPurchaseItem.name}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {pendingPurchaseItem.description}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(120, 53, 15, 0.28)', color: '#fde68a' }}>
                <Coins className="h-4 w-4" />
                <span className="font-semibold">{pendingPurchaseItem.price} moedas</span>
              </div>
            </div>

            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Tem certeza que deseja comprar este item?
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={handleClosePurchaseConfirmation} disabled={Boolean(processingPurchase)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPurchase}
                disabled={processingPurchase === pendingPurchaseItem.id}
                icon={<ShoppingCart className="h-4 w-4" />}
              >
                {processingPurchase === pendingPurchaseItem.id ? 'Comprando...' : 'Confirmar compra'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Toast message={toastMessage} type={toastType} show={showToast} onClose={() => setShowToast(false)} />
    </div>
  )
}
