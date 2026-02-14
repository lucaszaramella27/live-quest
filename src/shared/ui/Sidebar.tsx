import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { signOut } from '@/services/auth.service'
import { isAdmin } from '@/services/admin.service'
import { PetAvatar } from './PetAvatar'
import { XPBar } from './XPBar'
import {
  LayoutDashboard,
  Trophy,
  Palette,
  Medal,
  ShoppingBag,
  Users,
  LogOut,
  Menu,
  X,
  Coins as CoinsIcon,
  Twitch,
  Calendar,
  Flame,
  Crown,
  Sparkles,
  Shield
} from 'lucide-react'
import type { UserProgress } from '@/services/progress.service'

interface SidebarProps {
  progress: UserProgress | null
  onClose?: () => void
}

interface NavItem {
  path: string
  icon: React.ElementType
  label: string
  badge?: string | number
}

export function Sidebar({ progress, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems: NavItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/activity', icon: Calendar, label: 'Atividade' },
    { path: '/challenges', icon: Flame, label: 'Desafios' },
    { path: '/twitch', icon: Twitch, label: 'Twitch' },
    { path: '/achievements', icon: Trophy, label: 'Conquistas' },
    { path: '/titles', icon: Medal, label: 'Títulos' },
    { path: '/themes', icon: Palette, label: 'Temas' },
    { path: '/shop', icon: ShoppingBag, label: 'Loja' },
    { path: '/leaderboard', icon: Users, label: 'Ranking' },
  ]

  // Add Admin option only for admins
  if (isAdmin(user?.id)) {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin', badge: '🔒' })
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    onClose?.() // Close sidebar on mobile after navigation
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const level = progress?.level || 1
  const currentXP = progress?.xp || 0
  const coins = progress?.coins || 0

  return (
    <div
      className={`fixed left-0 top-0 h-screen transition-all duration-300 z-40 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
      style={{
        background: 'var(--color-background-secondary)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header - User Info */}
        <div className="p-6 border-b border-white/5">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute top-6 right-4 p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)' + '20'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>

          {!isCollapsed && (
            <div className="space-y-4">
              {/* Pet Avatar */}
              <div className="flex justify-center">
                <PetAvatar level={level} size="lg" />
              </div>

              {/* User Name */}
              <div className="text-center">
                <h3 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                  {user?.displayName || user?.email?.split('@')[0] || 'Streamer'}
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-primary)' }}>Nível {level}</p>
              </div>

              {/* XP Bar */}
              <XPBar xp={currentXP} level={level} />

              {/* Coins */}
              <div
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                <CoinsIcon size={20} className="text-amber-400" />
                <span className="font-bold text-amber-400">{coins}</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="flex flex-col items-center space-y-3 mt-8">
              <PetAvatar level={level} size="sm" />
              <div className="text-center">
                <p className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>{level}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`sidebar-nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${isActive ? 'active' : ''}`}
                  style={{
                    background: isActive ? 'var(--gradient-primary)' : 'transparent',
                    opacity: isActive ? 0.9 : 1
                  }}
                >
                  {/* Hover overlay */}
                  {!isActive && (
                    <span 
                      className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200 rounded-lg"
                    />
                  )}
                  <Icon
                    size={20}
                    className="flex-shrink-0 transition-colors relative z-10"
                    style={{ color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)' }}
                  />
                  {!isCollapsed && (
                    <span
                      className="font-medium transition-colors relative z-10"
                      style={{ color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)' }}
                    >
                      {item.label}
                    </span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-white text-xs rounded-full relative z-10" style={{ background: 'var(--color-primary)' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Premium Banner */}
        {!isCollapsed && (
          <div className="px-4 pb-4">
            {progress?.isPremium ? (
              /* Premium Active Badge */
              <div
                className="w-full relative overflow-hidden rounded-xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)',
                  border: '1px solid rgba(251, 191, 36, 0.4)'
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Crown icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse"
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)'
                    }}
                  >
                    <Crown size={20} className="text-white" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-sm" style={{ color: '#fbbf24' }}>
                        Premium Ativo
                      </span>
                      <Sparkles size={14} style={{ color: '#fbbf24' }} />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Todos os recursos liberados!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Premium Offer Banner */
              <button
                onClick={() => handleNavigation('/plans')}
                className="w-full relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-105 group"
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}
              >
                {/* Sparkle decoration */}
                <div className="absolute top-1 right-1 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Sparkles size={16} style={{ color: '#fbbf24' }} />
                </div>

                <div className="flex items-center gap-3">
                  {/* Crown icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                    }}
                  >
                    <Crown size={20} className="text-white" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-sm" style={{ color: '#fbbf24' }}>
                        Premium
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white'
                        }}
                      >
                        OFERTA
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Desbloqueie tudo!
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Footer - Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/50 transition-all duration-200 group"
          >
            <LogOut
              size={20}
              className="flex-shrink-0 text-gray-400 group-hover:text-red-400 transition-colors"
            />
            {!isCollapsed && (
              <span className="font-medium text-gray-300 group-hover:text-red-400 transition-colors">
                Sair
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
