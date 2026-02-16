import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { GradientCard, Button, Toast, IconMapper } from '@/shared/ui'
import { ShoppingBag, Coins, Sparkles, Lock, Crown, Check, ShoppingCart } from 'lucide-react'
import { getUserProgress, subscribeToUserProgress, type UserProgress } from '@/services/progress.service'
import { getUserInventory, purchaseShopItem, type ActivePowerup } from '@/services/inventory.service'
import {
  SHOP_ITEMS,
  canPurchaseItem,
  getRarityColor,
  getRarityGradient,
  getCategoryIcon,
  getCategoryName,
  type ShopItem,
} from '@/services/shop.service'
import { reportError } from '@/services/logger.service'

export function ShopPage() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPurchase, setProcessingPurchase] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ShopItem['category'] | 'all'>('all')
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])
  const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([])
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
      const [progressData, inventoryData] = await Promise.all([
        getUserProgress(user.id),
        getUserInventory(),
      ])
      setProgress(progressData)
      setPurchasedItems(inventoryData.purchasedItemIds)
      setActivePowerups(inventoryData.activePowerups)
    } catch (error) {
      reportError('Erro ao carregar loja:', error)
      setToastMessage('Erro ao carregar dados da loja')
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
      setToastMessage(reason || 'Nao e possivel comprar este item')
      setToastType('achievement')
      setShowToast(true)
      return
    }

    try {
      setProcessingPurchase(item.id)
      const result = await purchaseShopItem(item.id)

      if (!result.success) {
        if (result.reason === 'coins_insufficient') {
          setToastMessage('Compra recusada: saldo insuficiente.')
        } else if (result.reason === 'backend_unavailable') {
          setToastMessage('Compra indisponivel no ambiente local sem backend de funcoes ativo.')
        } else {
          setToastMessage('Compra recusada: item indisponivel no momento.')
        }
        setToastType('error')
        setShowToast(true)
        return
      }

      setPurchasedItems(result.purchasedItemIds)
      setActivePowerups(result.activePowerups)
      setProgress((current) => (current ? { ...current, coins: result.newBalance } : current))

      setToastMessage(`Item comprado com sucesso: ${item.name}`)
      setToastType('success')
      setShowToast(true)
    } catch (error) {
      reportError('Erro ao comprar item:', error)
      setToastMessage('Erro ao processar compra')
      setToastType('error')
      setShowToast(true)
    } finally {
      setProcessingPurchase(null)
    }
  }

  const categories: Array<{ id: ShopItem['category'] | 'all'; name: string; icon: string }> = [
    { id: 'all', name: 'Todos', icon: 'Loja' },
    { id: 'powerup', name: 'Power-ups', icon: 'XP' },
    { id: 'avatar', name: 'Avatares', icon: 'Avatar' },
    { id: 'badge', name: 'Badges', icon: 'Badge' },
  ]

  const filteredItems = selectedCategory === 'all'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter((item) => item.category === selectedCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando loja...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-brand-purple" />
              <h1 className="text-3xl font-bold">Loja</h1>
            </div>
            <p className="text-gray-400 mt-2">Compre power-ups, avatares e itens exclusivos</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl">
            <Coins className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-amber-500">{progress?.coins || 0}</span>
          </div>
        </div>
      </div>

      {activePowerups.length > 0 && (
        <div className="mb-8 p-4 rounded-xl border border-brand-purple/20 bg-brand-purple/5">
          <p className="text-sm text-brand-purple font-semibold mb-2">Power-ups ativos</p>
          <div className="flex flex-wrap gap-2">
            {activePowerups.map((powerup) => (
              <span key={`${powerup.itemId}_${powerup.activatedAt}`} className="text-xs px-2 py-1 rounded-lg bg-white/10">
                {powerup.itemId}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-300
                ${selectedCategory === category.id
                  ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white scale-105'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }
              `}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const { canPurchase, reason } = canPurchaseItem(item, progress?.coins || 0, isPremium)
            const isPurchased = purchasedItems.includes(item.id) && item.category !== 'powerup'

            return (
              <GradientCard
                key={item.id}
                hover
                className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:rotate-1"
              >
                <div className={`p-6 rounded-xl bg-gradient-to-br ${getRarityGradient(item.rarity)} transition-all duration-300`}>
                  {item.isPremiumOnly && (
                    <div className="absolute top-3 right-3">
                      <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-lg flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs font-bold text-yellow-500">Premium</span>
                      </div>
                    </div>
                  )}

                  {item.isLimited && (
                    <div className="absolute top-3 left-3">
                      <div className="px-2 py-1 bg-red-500/20 border border-red-500/40 rounded-lg">
                        <span className="text-xs font-bold text-red-500">LIMITADO</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center items-center mb-4">
                    <IconMapper icon={item.icon} size={64} />
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold" style={{ color: getRarityColor(item.rarity) }}>
                        {item.name}
                      </h3>
                      <span className="text-xs uppercase tracking-wider" style={{ color: getRarityColor(item.rarity) }}>
                        {item.rarity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{item.description}</p>

                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs">
                      <IconMapper icon={getCategoryIcon(item.category)} size={16} />
                      <span>{getCategoryName(item.category)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-amber-500" />
                      <span className="text-xl font-bold text-amber-500">{item.price}</span>
                    </div>

                    {isPurchased ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-bold">Comprado</span>
                      </div>
                    ) : canPurchase ? (
                      <Button
                        onClick={() => void handlePurchase(item)}
                        disabled={processingPurchase === item.id}
                        variant="primary"
                        size="sm"
                        icon={<ShoppingCart className="w-4 h-4" />}
                      >
                        {processingPurchase === item.id ? 'Comprando...' : 'Comprar'}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs">{reason}</span>
                      </div>
                    )}
                  </div>

                  {item.effect && (
                    <div className="mt-3 p-2 bg-black/20 rounded-lg">
                      <p className="text-xs text-gray-400">
                        {item.effect.duration
                          ? `Duracao: ${item.effect.duration}h`
                          : 'Uso unico'
                        }
                      </p>
                    </div>
                  )}

                  {item.isLimited && item.stock !== undefined && (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-red-400">
                        Estoque limitado no backend
                      </p>
                    </div>
                  )}
                </div>
              </GradientCard>
            )
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">Nenhum item encontrado nesta categoria</p>
          </div>
        )}
      </div>

      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}



