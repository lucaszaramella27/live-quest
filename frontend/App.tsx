import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './features/auth/context/AuthContext'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'
import { AdminRoute } from './features/auth/components/AdminRoute'
import { DashboardLayout } from './shared/ui'
import { AppErrorBoundary } from './shared/ui/AppErrorBoundary'
import { ScrollRevealManager } from './shared/ui/ScrollRevealManager'
import { loadSavedTheme, applyTheme } from './services/themes.service'

const LandingPage = lazy(async () => ({ default: (await import('./features/auth/pages/LandingPage')).LandingPage }))
const LoginPage = lazy(async () => ({ default: (await import('./features/auth/pages/LoginPage')).LoginPage }))
const RegisterPage = lazy(async () => ({ default: (await import('./features/auth/pages/RegisterPage')).RegisterPage }))

const DashboardPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/DashboardPage')).DashboardPage }))
const PlansPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/PlansPage')).PlansPage }))
const AchievementsPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/AchievementsPage')).AchievementsPage }))
const ThemesPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/ThemesPage')).ThemesPage }))
const TitlesPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/TitlesPage')).TitlesPage }))
const ShopPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/ShopPage')).ShopPage }))
const InventoryPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/InventoryPage')).InventoryPage }))
const LeaderboardPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/LeaderboardPage')).LeaderboardPage }))
const TwitchPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/TwitchPage')).TwitchPage }))
const TwitchCallbackPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/TwitchCallbackPage')).TwitchCallbackPage }))
const ActivityPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/ActivityPage')).ActivityPage }))
const ChallengesPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/ChallengesPage')).ChallengesPage }))
const AdminPage = lazy(async () => ({ default: (await import('./features/dashboard/pages/AdminPage')).AdminPage }))

const TermsPage = lazy(async () => ({ default: (await import('./features/legal/pages/TermsPage')).TermsPage }))
const PrivacyPage = lazy(async () => ({ default: (await import('./features/legal/pages/PrivacyPage')).PrivacyPage }))
const NotFoundPage = lazy(async () => ({ default: (await import('./features/legal/pages/NotFoundPage')).NotFoundPage }))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
    </div>
  )
}

function App() {
  useEffect(() => {
    const savedTheme = loadSavedTheme()
    applyTheme(savedTheme, { dispatchEvent: false })

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'selectedTheme') {
        const newTheme = loadSavedTheme()
        applyTheme(newTheme, { dispatchEvent: false, persist: false })
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return (
    <BrowserRouter>
      <ScrollRevealManager />
      <AuthProvider>
        <AppErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <DashboardPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plans"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <PlansPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/achievements"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AchievementsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/themes"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ThemesPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/titles"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <TitlesPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shop"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ShopPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <InventoryPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <LeaderboardPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/twitch"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <TwitchPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/twitch/callback"
                element={
                  <ProtectedRoute>
                    <TwitchCallbackPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ActivityPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/challenges"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ChallengesPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AdminPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AppErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
