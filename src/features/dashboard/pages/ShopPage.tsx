import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { GradientCard, Button, Toast, IconMapper } from '@/shared/ui'
import { ShoppingBag, Coins, Sparkles, Lock, Crown, Check, ShoppingCart } from 'lucide-react'
import { getUserProgress, spendCoins, type UserProgress } from '@/services/progress.service'
import { 
  SHOP_ITEMS, 
  canPurchaseItem, 
  getRarityColor, 
  getRarityGradient,
  getCategoryIcon,
  getCategoryName,
  type ShopItem 
} from '@/services/shop.service'

export function ShopPage() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ShopItem['category'] | 'all'>('all')
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'streak' | 'goal' | 'task' | 'achievement'>('success')
  const [showToast, setShowToast] = useState(false)

  const isPremium = (user as any)?.isPremium || false

  useEffect(() => {
    if (user) {
      loadProgress()
      loadPurchasedItems()
    }
  }, [user])

  async function loadProgress() {
    if (!user) return
    
    try {
      setLoading(true)
      const progressData = await getUserProgress(user.id)
      setProgress(progressData)
    } catch (error) {
      console.error('Erro ao carregar progresso:', error)
    } finally {
      setLoading(false)
    }
  }

  function loadPurchasedItems() {
    const saved = localStorage.getItem(`purchasedItems_${user?.id}`)
    if (saved) {
      setPurchasedItems(JSON.parse(saved))
    }
  }

  async function handlePurchase(item: ShopItem) {
    if (!user || !progress) return

    const { canPurchase, reason } = canPurchaseItem(item, progress.coins, isPremium)
    
    if (!canPurchase) {
      setToastMessage(reason || 'Não é possível comprar este item')
      setToastType('achievement')
      setShowToast(true)
      return
    }

    const result = await spendCoins(user.id, item.price)
    
    if (result.success) {
      // Save purchase
      const newPurchased = [...purchasedItems, item.id]
      setPurchasedItems(newPurchased)
      localStorage.setItem(`purchasedItems_${user.id}`, JSON.stringify(newPurchased))
      
      // Update balance
      setProgress({ ...progress, coins: result.newBalance })
      
      // Show success
      setToastMessage(`✨ ${item.name} comprado com sucesso!`)
      setToastType('success')
      setShowToast(true)

      // Apply power-up effect if applicable
      if (item.effect) {
        applyPowerup(item)
      }
    } else {
      setToastMessage('Erro ao processar compra. Moedas insuficientes.')
      setToastType('achievement')
      setShowToast(true)
    }
  }

  function applyPowerup(item: ShopItem) {
    if (!item.effect || !user) return

    const activePowerups = JSON.parse(localStorage.getItem(`activePowerups_${user.id}`) || '[]')
    
    const powerup = {
      itemId: item.id,
      effect: item.effect,
      activatedAt: new Date().toISOString(),
      expiresAt: item.effect.duration 
        ? new Date(Date.now() + item.effect.duration * 60 * 60 * 1000).toISOString()
        : null
    }

    activePowerups.push(powerup)
    localStorage.setItem(`activePowerups_${user.id}`, JSON.stringify(activePowerups))
    
    setToastMessage(`🚀 Power-up ativado! ${item.description}`)
    setToastType('task')
    setShowToast(true)
  }

  const categories: Array<{ id: ShopItem['category'] | 'all'; name: string; icon: string }> = [
    { id: 'all', name: 'Todos', icon: '🛒' },
    { id: 'powerup', name: 'Power-ups', icon: '⚡' },
    { id: 'avatar', name: 'Avatares', icon: '✨' },
    { id: 'badge', name: 'Badges', icon: '🏆' }
  ]

  const filteredItems = selectedCategory === 'all' 
    ? SHOP_ITEMS 
    : SHOP_ITEMS.filter(item => item.category === selectedCategory)

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
      {/* Page Header */}
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

      <div className="space-y-8">
        {/* Category Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all duration-300
                ${selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white scale-105'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }
              `}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const { canPurchase, reason } = canPurchaseItem(item, progress?.coins || 0, isPremium)
            const isPurchased = purchasedItems.includes(item.id)

            return (
              <GradientCard 
                key={item.id} 
                hover 
                className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:rotate-1"
              >
                <div className={`p-6 rounded-xl bg-gradient-to-br ${getRarityGradient(item.rarity)} transition-all duration-300`}>
                  {/* Premium Badge */}
                  {item.isPremiumOnly && (
                    <div className="absolute top-3 right-3">
                      <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-lg flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs font-bold text-yellow-500">Premium</span>
                      </div>
                    </div>
                  )}

                  {/* Limited Badge */}
                  {item.isLimited && (
                    <div className="absolute top-3 left-3">
                      <div className="px-2 py-1 bg-red-500/20 border border-red-500/40 rounded-lg">
                        <span className="text-xs font-bold text-red-500">LIMITADO</span>
                      </div>
                    </div>
                  )}

                  {/* Item Icon */}
                  <div className="flex justify-center items-center mb-4">
                    <IconMapper icon={item.icon} size={64} />
                  </div>

                  {/* Item Info */}
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
                    
                    {/* Category Badge */}
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs">
                      <IconMapper icon={getCategoryIcon(item.category)} size={16} />
                      <span>{getCategoryName(item.category)}</span>
                    </div>
                  </div>

                  {/* Price & Purchase */}
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
                        onClick={() => handlePurchase(item)}
                        variant="primary"
                        size="sm"
                        icon={<ShoppingCart className="w-4 h-4" />}
                      >
                        Comprar
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs">{reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Effect Info */}
                  {item.effect && (
                    <div className="mt-3 p-2 bg-black/20 rounded-lg">
                      <p className="text-xs text-gray-400">
                        {item.effect.duration 
                          ? `Duração: ${item.effect.duration}h`
                          : 'Uso único'
                        }
                      </p>
                    </div>
                  )}

                  {/* Stock Info */}
                  {item.isLimited && item.stock !== undefined && (
                    <div className="mt-2 text-center">
                      <p className="text-xs text-red-400">
                        Restam apenas <span className="font-bold">{item.stock}</span> unidades!
                      </p>
                    </div>
                  )}
                </div>
              </GradientCard>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">Nenhum item encontrado nesta categoria</p>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
