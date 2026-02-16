import { useState, type ElementType } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Coins as CoinsIcon,
  Crown,
  Flame,
  LayoutDashboard,
  LogOut,
  Medal,
  Menu,
  Palette,
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
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAdmin } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems: NavItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/activity', icon: Calendar, label: 'Atividade' },
    { path: '/challenges', icon: Flame, label: 'Desafios' },
    { path: '/twitch', icon: Twitch, label: 'Twitch' },
    { path: '/achievements', icon: Trophy, label: 'Conquistas' },
    { path: '/titles', icon: Medal, label: 'Titulos' },
    { path: '/themes', icon: Palette, label: 'Temas' },
    { path: '/shop', icon: ShoppingBag, label: 'Loja' },
    { path: '/leaderboard', icon: Users, label: 'Ranking' },
  ]

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin', badge: 'ADMIN' })
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    onClose?.()
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      reportError('sidebar_sign_out', error)
    }
  }

  const level = progress?.level || 1
  const currentXP = progress?.xp || 0
  const coins = progress?.coins || 0

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}
      style={{
        background: 'linear-gradient(180deg, rgba(9, 14, 27, 0.96) 0%, rgba(8, 12, 24, 0.98) 100%)',
        borderRight: '1px solid rgba(148, 163, 184, 0.18)',
        boxShadow: '24px 0 50px -42px rgba(2, 6, 23, 0.92)',
      }}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 p-6">
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="absolute right-4 top-6 rounded-lg p-2 transition-colors hover:bg-slate-800/70"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>

          {!isCollapsed ? (
            <div className="space-y-4">
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
                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                  Nivel {level}
                </p>
              </div>

              <XPBar xp={currentXP} level={level} />

              <div
                className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.08) 100%)',
                  borderColor: 'rgba(251, 191, 36, 0.3)',
                }}
              >
                <CoinsIcon size={18} className="text-amber-400" />
                <span className="font-bold text-amber-300">{coins}</span>
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-3">
              <PetAvatar level={level} size="sm" />
              <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>
                {level}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`sidebar-nav-item group relative w-full overflow-hidden rounded-xl px-4 py-3 transition-all duration-200 ${
                    isCollapsed ? 'justify-center' : 'flex items-center gap-3'
                  } ${isActive ? 'active' : ''}`}
                  style={{
                    background: isActive ? 'var(--gradient-primary)' : 'transparent',
                    color: isActive ? '#031321' : 'var(--color-text-secondary)',
                    border: isActive ? '1px solid rgba(125, 211, 252, 0.45)' : '1px solid transparent',
                  }}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && <span className="font-semibold">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span
                      className="ml-auto rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide"
                      style={{ background: 'rgba(6, 18, 32, 0.55)', color: '#dbeafe' }}
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
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.16) 0%, rgba(249, 115, 22, 0.16) 100%)',
                  borderColor: 'rgba(251, 191, 36, 0.35)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/20">
                    <Crown size={20} className="text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-300">Premium ativo</p>
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
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.13) 0%, rgba(249, 115, 22, 0.13) 100%)',
                  borderColor: 'rgba(56, 189, 248, 0.28)',
                }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles size={15} className="text-sky-300" />
                  <span className="text-sm font-bold text-sky-200">Upgrade Premium</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Mais analytics, themes e boosts.
                </p>
              </button>
            )}
          </div>
        )}

        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/10"
          >
            <LogOut size={20} className="flex-shrink-0 text-slate-400 transition-colors group-hover:text-red-300" />
            {!isCollapsed && (
              <span className="font-semibold text-slate-300 transition-colors group-hover:text-red-300">Sair</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
