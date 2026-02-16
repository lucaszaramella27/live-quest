import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { GradientCard, Button, Toast } from '@/shared/ui'
import { Check, Lock, Crown, Palette, Save, RotateCcw } from 'lucide-react'
import { THEMES, applyTheme, loadSavedTheme, type Theme } from '@/services/themes.service'
import { subscribeToUserProgress, type UserProgress } from '@/services/progress.service'

export function ThemesPage() {
  const { user } = useAuth()
  const [savedTheme, setSavedTheme] = useState<Theme>(loadSavedTheme())
  const [previewTheme, setPreviewTheme] = useState<Theme>(loadSavedTheme())
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'streak' | 'goal' | 'task' | 'achievement' | 'error'>('success')
  const [showToast, setShowToast] = useState(false)
  const [progress, setProgress] = useState<UserProgress | null>(null)

  const isPremium = progress?.isPremium || false
  const hasChanges = savedTheme.id !== previewTheme.id

  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToUserProgress(user.id, (updatedProgress) => {
      if (updatedProgress) {
        setProgress(updatedProgress)
      }
    })

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    applyTheme(previewTheme, { persist: false })
  }, [previewTheme])

  useEffect(() => {
    return () => {
      applyTheme(loadSavedTheme(), { persist: false, dispatchEvent: false })
    }
  }, [])

  function handleThemePreview(theme: Theme) {
    if (theme.isPremium && !isPremium) {
      setToastMessage('Tema exclusivo para usuarios Premium.')
      setToastType('error')
      setShowToast(true)
      return
    }

    setPreviewTheme(theme)
  }

  function handleSaveTheme() {
    setSavedTheme(previewTheme)
    applyTheme(previewTheme, { persist: true })

    setToastMessage('Tema salvo com sucesso.')
    setToastType('success')
    setShowToast(true)
  }

  function handleResetTheme() {
    setPreviewTheme(savedTheme)
  }

  const freeThemes = THEMES.filter((theme) => !theme.isPremium)
  const premiumThemes = THEMES.filter((theme) => theme.isPremium)

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Palette className="h-7 w-7" style={{ color: 'var(--color-primary)' }} />
            <h1 className="text-3xl font-bold">Temas</h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Personalize o visual do dashboard com temas de alta identidade.
          </p>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-3">
            <Button onClick={handleResetTheme} variant="ghost" size="sm" icon={<RotateCcw className="h-4 w-4" />}>
              Desfazer
            </Button>
            <Button onClick={handleSaveTheme} variant="primary" size="md" icon={<Save className="h-4 w-4" />}>
              Salvar alteracoes
            </Button>
          </div>
        )}
      </header>

      <GradientCard className="rounded-2xl border p-8">
        <div className="text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-secondary)' }}>
            {hasChanges ? 'Preview' : 'Tema ativo'}
          </p>
          <h2 className="mb-2 text-3xl font-bold text-gradient">{previewTheme.name}</h2>
          <p className="mx-auto max-w-2xl" style={{ color: 'var(--color-text-secondary)' }}>
            {previewTheme.description}
          </p>

          {previewTheme.isPremium && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(250, 204, 21, 0.35)', color: '#facc15' }}>
              <Crown className="h-3.5 w-3.5" /> Premium
            </div>
          )}

          {hasChanges && (
            <div className="mx-auto mt-4 max-w-xl rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'rgba(125, 211, 252, 0.28)', background: 'rgba(8, 47, 73, 0.28)', color: 'var(--color-text-secondary)' }}>
              Voce esta visualizando um tema nao salvo. Clique em "Salvar alteracoes" para manter.
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-12 w-12 rounded-xl border border-white/20" style={{ background: previewTheme.colors.primary }} />
            <div className="h-12 w-12 rounded-xl border border-white/20" style={{ background: previewTheme.colors.secondary }} />
            <div className="h-12 w-12 rounded-xl border border-white/20" style={{ background: previewTheme.colors.accent }} />
            <div className="h-12 w-16 rounded-xl border border-white/20" style={{ background: previewTheme.colors.gradient }} />
          </div>
        </div>
      </GradientCard>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Temas gratuitos</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-2xl font-bold">Temas premium</h2>
          <Crown className="h-5 w-5 text-yellow-400" />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
      </section>

      <Toast message={toastMessage} type={toastType} show={showToast} onClose={() => setShowToast(false)} />
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
    <button
      type="button"
      onClick={() => onSelect(theme)}
      className={`relative overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
        isSelected ? 'scale-[1.015] ring-2 ring-sky-300/30' : 'hover:-translate-y-0.5 hover:shadow-xl'
      } ${isLocked ? 'opacity-75' : ''}`}
      style={{
        borderColor: isSelected ? 'rgba(125, 211, 252, 0.45)' : 'rgba(148, 163, 184, 0.24)',
        background: theme.colors.backgroundSecondary,
      }}
    >
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="rounded-xl border px-4 py-3 text-center" style={{ borderColor: 'rgba(250, 204, 21, 0.4)' }}>
            <Lock className="mx-auto mb-1 h-5 w-5 text-yellow-400" />
            <p className="text-xs font-bold text-yellow-400">Premium</p>
          </div>
        </div>
      )}

      {isSelected && (
        <div className="absolute right-3 top-3 z-20 rounded-full p-1" style={{ background: 'var(--gradient-primary)' }}>
          <Check className="h-4 w-4 text-slate-900" />
        </div>
      )}

      {isSaved && !isSelected && (
        <div className="absolute right-3 top-3 z-20 rounded-full border px-2 py-1 text-[10px] font-bold" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399', background: 'rgba(6, 95, 70, 0.32)' }}>
          Salvo
        </div>
      )}

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
            {theme.name}
          </h3>
          {theme.isPremium && <Crown className="h-4 w-4 text-yellow-400" />}
        </div>

        <p className="mb-4 text-sm" style={{ color: theme.colors.textSecondary }}>
          {theme.description}
        </p>

        <div className="mb-4 grid grid-cols-4 gap-2">
          <div className="h-8 rounded-lg border border-white/20" style={{ background: theme.colors.primary }} />
          <div className="h-8 rounded-lg border border-white/20" style={{ background: theme.colors.secondary }} />
          <div className="h-8 rounded-lg border border-white/20" style={{ background: theme.colors.accent }} />
          <div className="h-8 rounded-lg border border-white/20" style={{ background: theme.colors.gradient }} />
        </div>

        <div className="rounded-xl border p-3" style={{ background: theme.colors.backgroundTertiary, borderColor: `${theme.colors.primary}40` }}>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-7 w-7 rounded-md" style={{ background: theme.colors.gradient }} />
            <div className="flex-1">
              <div className="mb-1 h-2 rounded" style={{ background: `${theme.colors.text}99`, width: '80%' }} />
              <div className="h-2 rounded" style={{ background: `${theme.colors.textSecondary}99`, width: '60%' }} />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]" style={{ color: theme.colors.textSecondary }}>
            <span>Glow {theme.effects.glow}</span>
            <span>Anim {theme.effects.animations}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
