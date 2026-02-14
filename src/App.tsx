import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './features/auth/context/AuthContext'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'
import { AdminRoute } from './features/auth/components/AdminRoute'
import { DashboardLayout } from './shared/ui'
import { LandingPage } from './features/auth/pages/LandingPage'
import { LoginPage } from './features/auth/pages/LoginPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { DashboardPage } from './features/dashboard/pages/DashboardPage'
import { PlansPage } from './features/dashboard/pages/PlansPage'
import { AchievementsPage } from './features/dashboard/pages/AchievementsPage'
import { ThemesPage } from './features/dashboard/pages/ThemesPage'
import { TitlesPage } from './features/dashboard/pages/TitlesPage'
import { ShopPage } from './features/dashboard/pages/ShopPage'
import { LeaderboardPage } from './features/dashboard/pages/LeaderboardPage'
import { TwitchPage } from './features/dashboard/pages/TwitchPage'
import { TwitchCallbackPage } from './features/dashboard/pages/TwitchCallbackPage'
import { ActivityPage } from './features/dashboard/pages/ActivityPage'
import { ChallengesPage } from './features/dashboard/pages/ChallengesPage'
import { AdminPage } from './features/dashboard/pages/AdminPage'
import { loadSavedTheme, applyTheme } from './services/themes.service'

function App() {
  // Apply saved theme on app mount (before any component renders)
  useEffect(() => {
    const savedTheme = loadSavedTheme()
    applyTheme(savedTheme)

    // Listen for theme changes from storage (other tabs) or custom events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedTheme') {
        const newTheme = loadSavedTheme()
        applyTheme(newTheme)
      }
    }

    const handleThemeChange = () => {
      const newTheme = loadSavedTheme()
      applyTheme(newTheme)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('themeChanged', handleThemeChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('themeChanged', handleThemeChange)
    }
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
