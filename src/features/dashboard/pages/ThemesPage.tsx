import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { GradientCard, Button, Toast } from '@/shared/ui'
import { Check, Lock, Crown, Palette, Save, RotateCcw } from 'lucide-react'
import { THEMES, applyTheme, loadSavedTheme, type Theme } from '@/services/themes.service'

export function ThemesPage() {
  const { user } = useAuth()
  const [savedTheme, setSavedTheme] = useState<Theme>(loadSavedTheme())
  const [previewTheme, setPreviewTheme] = useState<Theme>(loadSavedTheme())
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'streak' | 'goal' | 'task' | 'achievement'>('success')
  const [showToast, setShowToast] = useState(false)
  const isPremium = (user as any)?.isPremium || false

  const hasChanges = savedTheme.id !== previewTheme.id

  useEffect(() => {
    // Apply saved theme on mount
    applyTheme(savedTheme)
  }, [])

  // React to preview changes and apply immediately
  useEffect(() => {
    applyTheme(previewTheme)
  }, [previewTheme])

  function handleThemePreview(theme: Theme) {
    if (theme.isPremium && !isPremium) {
      setToastMessage('Este tema é exclusivo para usuários Premium! 👑')
      setToastType('achievement')
      setShowToast(true)
      return
    }

    // Update preview - o useEffect vai pegar a mudança e aplicar
    setPreviewTheme(theme)
  }

  function handleSaveTheme() {
    setSavedTheme(previewTheme)
    applyTheme(previewTheme)
    // Save to localStorage
    localStorage.setItem('selectedTheme', previewTheme.id)
    // Show success message
    setToastMessage('Tema salvo com sucesso!')
    setToastType('success')
    setShowToast(true)
  }

  function handleResetTheme() {
    setPreviewTheme(savedTheme)
    applyTheme(savedTheme)
  }

  const freeThemes = THEMES.filter(t => !t.isPremium)
  const premiumThemes = THEMES.filter(t => t.isPremium)

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Palette className="w-8 h-8 text-brand-purple" />
              <h1 className="text-3xl font-bold">Temas</h1>
            </div>
            <p className="text-gray-400 mt-2">Personalize a aparência do seu dashboard</p>
          </div>

          {/* Action Buttons - Show when changes detected */}
          {hasChanges && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleResetTheme}
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Desfazer
              </Button>
              <Button
                onClick={handleSaveTheme}
                variant="primary"
                size="md"
                icon={<Save className="w-4 h-4" />}
                className="animate-pulse"
              >
                Salvar Alterações
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Current Theme Preview */}
        <GradientCard className="mb-8 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              {hasChanges ? 'Visualizando' : 'Tema Atual'}
            </h2>
            <div className="inline-flex items-center gap-3 mb-4">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">
                {previewTheme.name}
              </h3>
              {previewTheme.isPremium && <Crown className="w-6 h-6 text-yellow-500" />}
            </div>
            <p className="text-gray-400">{previewTheme.description}</p>
            
            {hasChanges && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-500">
                  ⚠️ Você está visualizando um tema. Clique em "Salvar Alterações" para manter.
                </p>
              </div>
            )}
            
            {/* Color Swatches */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div 
                className="w-12 h-12 rounded-xl border-2 border-white/20"
                style={{ background: previewTheme.colors.primary }}
              />
              <div 
                className="w-12 h-12 rounded-xl border-2 border-white/20"
                style={{ background: previewTheme.colors.secondary }}
              />
              <div 
                className="w-12 h-12 rounded-xl border-2 border-white/20"
                style={{ background: previewTheme.colors.accent }}
              />
              <div 
                className="w-16 h-12 rounded-xl border-2 border-white/20"
                style={{ background: previewTheme.colors.gradient }}
              />
            </div>
          </div>
        </GradientCard>

        {/* Free Themes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Temas Gratuitos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isSelected={previewTheme.id === theme.id}
                isSaved={savedTheme.id === theme.id}
                isLocked={false}
                onSelect={handleThemePreview}
              />
            ))}
          </div>
        </div>

        {/* Premium Themes */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold">Temas Premium</h2>
            <Crown className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isSelected={previewTheme.id === theme.id}
                isSaved={savedTheme.id === theme.id}
                isLocked={!isPremium}
                onSelect={handleThemePreview}
              />
            ))}
          </div>
        </div>
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

interface ThemeCardProps {
  theme: Theme
  isSelected: boolean
  isSaved: boolean
  isLocked: boolean
  onSelect: (theme: Theme) => void
}

function ThemeCard({ theme, isSelected, isSaved, isLocked, onSelect }: ThemeCardProps) {
  return (
    <div 
      className={`
        relative group cursor-pointer rounded-2xl border-2 transition-all duration-300
        ${isSelected ? 'border-brand-purple scale-105 ring-4 ring-brand-purple/30' : 'border-white/10 hover:border-brand-purple/50 hover:scale-105 hover:ring-4 hover:ring-brand-purple/20'}
        ${isLocked ? 'opacity-70' : ''}
      `}
      onClick={() => onSelect(theme)}
    >
      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-yellow-500">Premium</p>
          </div>
        </div>
      )}

      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-20">
          <div className="p-2 bg-brand-purple rounded-full">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Saved Badge */}
      {isSaved && !isSelected && (
        <div className="absolute top-3 right-3 z-20">
          <div className="px-2 py-1 bg-green-500 rounded-full text-xs font-bold text-white">
            ✓ Salvo
          </div>
        </div>
      )}

      {/* Theme Preview */}
      <div 
        className="p-6 rounded-2xl"
        style={{ background: theme.colors.background }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
            {theme.name}
          </h3>
          {theme.isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
        </div>

        {/* Description */}
        <p className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
          {theme.description}
        </p>

        {/* Color Palette */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div 
            className="h-10 rounded-lg border border-white/20"
            style={{ background: theme.colors.primary }}
          />
          <div 
            className="h-10 rounded-lg border border-white/20"
            style={{ background: theme.colors.secondary }}
          />
          <div 
            className="h-10 rounded-lg border border-white/20"
            style={{ background: theme.colors.accent }}
          />
          <div 
            className="h-10 rounded-lg border border-white/20"
            style={{ background: theme.colors.gradient }}
          />
        </div>

        {/* Sample Card */}
        <div 
          className="p-4 rounded-xl border"
          style={{ 
            background: theme.colors.backgroundSecondary,
            borderColor: theme.colors.primary + '40'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-8 h-8 rounded-lg"
              style={{ background: theme.colors.gradient }}
            />
            <div className="flex-1">
              <div 
                className="h-3 rounded mb-1"
                style={{ background: theme.colors.text + '80', width: '80%' }}
              />
              <div 
                className="h-2 rounded"
                style={{ background: theme.colors.textSecondary + '60', width: '60%' }}
              />
            </div>
          </div>
        </div>

        {/* Effects Info */}
        <div className="mt-4 flex items-center justify-between text-xs" style={{ color: theme.colors.textSecondary }}>
          <span>Glow: {theme.effects.glow}</span>
          <span>Animations: {theme.effects.animations}</span>
        </div>
      </div>
    </div>
  )
}
