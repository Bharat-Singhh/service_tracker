import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DomainsPage } from '@/pages/DomainsPage'
import { ImportCSVPage } from '@/pages/ImportCSVPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ActivityLogPage } from '@/pages/ActivityLogPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/domains" element={<ProtectedRoute><DomainsPage /></ProtectedRoute>} />
      <Route path="/import" element={<ProtectedRoute><ImportCSVPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute><ActivityLogPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
