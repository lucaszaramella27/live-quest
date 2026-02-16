import { useState, type ElementType } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Calendar,
  Coins as CoinsIcon,
  Crown,
  Flame,
  LayoutDashboard,
  LogOut,
  Medal,
  Menu,
  Palette,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Trophy,
  Twitch,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { signOut } from '@/services/auth.service'
import { reportError } from '@/services/logger.service'
import type { UserProgress } from '@/services/progress.service'
import { Button } from './Button'
import { Modal } from './Modal'
import { PetAvatar } from './PetAvatar'
import { XPBar } from './XPBar'

interface SidebarProps {
  progress: UserProgress | null
  onClose?: () => void
}

interface NavItem {
  path: string
  icon: ElementType
  label: string
  badge?: string
}

export function Sidebar({ progress, onClose }: SidebarProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAdmin } = useAuth()

  const navItems: NavItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/activity', icon: Calendar, label: 'Atividade' },
    { path: '/challenges', icon: Flame, label: 'Desafios' },
    { path: '/twitch', icon: Twitch, label: 'Twitch' },
    { path: '/achievements', icon: Trophy, label: 'Conquistas' },
    { path: '/titles', icon: Medal, label: 'Titulos' },
    { path: '/themes', icon: Palette, label: 'Temas' },
    { path: '/shop', icon: ShoppingBag, label: 'Loja' },
    { path: '/inventory', icon: Package, label: 'Inventario' },
    { path: '/leaderboard', icon: Users, label: 'Ranking' },
  ]

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin', badge: 'ADMIN' })
  }

  const level = progress?.level || 1
  const currentXP = progress?.xp || 0
  const coins = progress?.coins || 0

  const handleNavigation = (path: string) => {
    navigate(path)
    onClose?.()
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
      onClose?.()
    } catch (error) {
      reportError('sidebar_sign_out', error)
    }
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 transition-all duration-300 ${isCollapsed ? 'w-24' : 'w-80'}`}
      style={{
        background: 'linear-gradient(180deg, rgba(8, 16, 30, 0.96) 0%, rgba(6, 12, 24, 0.98) 100%)',
        borderRight: '1px solid rgba(139, 161, 203, 0.2)',
        boxShadow: '24px 0 56px -42px rgba(2, 8, 20, 0.95)',
      }}
    >
      <div className="flex h-full flex-col">
        <header className="border-b p-5" style={{ borderColor: 'rgba(139, 161, 203, 0.18)' }}>
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="absolute right-4 top-5 rounded-lg border p-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-900/62"
            style={{ borderColor: 'rgba(139, 161, 203, 0.2)', color: 'var(--color-text-secondary)' }}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? <Menu size={18} /> : <X size={18} />}
          </button>

          {!isCollapsed ? (
            <div className="space-y-4 pr-10">
              <div className="flex justify-center">
                <PetAvatar level={level} size="lg" />
              </div>

              <div className="text-center">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                    {user?.displayName || user?.email?.split('@')[0] || 'Streamer'}
                  </h3>
                  {progress?.isPremium && <Crown className="h-5 w-5 text-amber-400" />}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-secondary)' }}>
                  Nivel {level}
                </p>
              </div>

              <XPBar xp={currentXP} level={level} />

              <div
                className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5"
                style={{
                  background: 'linear-gradient(140deg, rgba(251, 191, 36, 0.18) 0%, rgba(245, 158, 11, 0.08) 100%)',
                  borderColor: 'rgba(245, 158, 11, 0.34)',
                }}
              >
                <CoinsIcon size={18} className="text-amber-300" />
                <span className="text-sm font-bold text-amber-300">{coins.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-3">
              <PetAvatar level={level} size="sm" showLevel={false} />
              <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                Lv {level}
              </span>
            </div>
          )}
        </header>

        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`sidebar-nav-item group relative w-full overflow-hidden rounded-xl px-4 py-3 text-[var(--color-text-secondary)] transition-colors duration-200 ${
                    isCollapsed ? 'flex items-center justify-center' : 'flex items-center gap-3'
                  } ${isActive ? 'active' : ''}`}
                  style={{
                    background: isActive ? 'var(--gradient-primary)' : undefined,
                    color: isActive ? '#031320' : undefined,
                  }}
                  aria-label={item.label}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && <span className="font-semibold">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span
                      className="ml-auto rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide"
                      style={{ background: 'rgba(4, 14, 25, 0.55)', color: '#daf5ff' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {!isCollapsed && (
          <div className="px-4 pb-4">
            {progress?.isPremium ? (
              <div
                className="rounded-xl border p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(245, 158, 11, 0.12) 100%)',
                  borderColor: 'rgba(251, 191, 36, 0.3)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-300/20">
                    <Crown size={20} className="text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-200">Premium ativo</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Recursos desbloqueados
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleNavigation('/plans')}
                className="w-full rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(87, 215, 255, 0.14) 0%, rgba(143, 161, 255, 0.14) 100%)',
                  borderColor: 'rgba(87, 215, 255, 0.3)',
                }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles size={15} className="text-cyan-200" />
                  <span className="text-sm font-bold text-cyan-100">Upgrade Premium</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Mais analytics, temas e boosts.
                </p>
              </button>
            )}
          </div>
        )}

        <footer className="border-t p-4" style={{ borderColor: 'rgba(139, 161, 203, 0.18)' }}>
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`group w-full rounded-xl border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400/38 hover:bg-red-500/10 ${
              isCollapsed ? 'flex justify-center' : 'flex items-center gap-3'
            }`}
            style={{ borderColor: 'rgba(139, 161, 203, 0.14)' }}
            aria-label="Sair"
          >
            <LogOut size={20} className="flex-shrink-0 text-slate-400 transition-colors group-hover:text-red-300" />
            {!isCollapsed && (
              <span className="font-semibold text-slate-300 transition-colors group-hover:text-red-300">Sair</span>
            )}
          </button>
        </footer>
      </div>

      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Sair da conta">
        <div className="mb-6 flex items-center gap-3 text-slate-300">
          <AlertTriangle className="h-7 w-7 flex-shrink-0 text-amber-300" />
          <span>Voce tem certeza que deseja sair?</span>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowLogoutModal(false)
              void handleLogout()
            }}
          >
            Sair
          </Button>
        </div>
      </Modal>
    </aside>
  )
}
