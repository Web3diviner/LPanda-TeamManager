import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AmbassadorAdminAuthProvider } from './context/AmbassadorAdminAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AmbassadorAdminProtectedRoute from './components/AmbassadorAdminProtectedRoute'
import Layout from './components/Layout'
import AmbassadorAdminLayout from './components/AmbassadorAdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AmbassadorPage from './pages/AmbassadorPage'
import LeaderboardPage from './pages/LeaderboardPage'
import AmbassadorLeaderboardPage from './pages/AmbassadorLeaderboardPage'
import WeeklyRecapPage from './pages/WeeklyRecapPage'
import AmbassadorRecapPage from './pages/AmbassadorRecapPage'
import ProfilePage from './pages/ProfilePage'
import UsersPage from './pages/UsersPage'
import SchedulePage from './pages/SchedulePage'
import AmbassadorSchedulePage from './pages/AmbassadorSchedulePage'
import MeetingRoomPage from './pages/MeetingRoomPage'
import AmbassadorAdminLoginPage from './pages/AmbassadorAdminLoginPage'
import AmbassadorAdminDashboardPage from './pages/AmbassadorAdminDashboardPage'
import AmbassadorAdminAmbassadorsPage from './pages/AmbassadorAdminAmbassadorsPage'
import AmbassadorAdminProfilePage from './pages/AmbassadorAdminProfilePage'
import AmbassadorAdminTasksPage from './pages/AmbassadorAdminTasksPage'
import AmbassadorAdminLeaderboardPage from './pages/AmbassadorAdminLeaderboardPage'
import AmbassadorAdminSchedulePage from './pages/AmbassadorAdminSchedulePage'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ambassador' || user.role === 'admin') return <Navigate to="/ambassador" replace />
  return <Navigate to="/dashboard" replace />
}

function RegularApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ambassador" element={<AmbassadorPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/ambassador-leaderboard" element={<AmbassadorLeaderboardPage />} />
            <Route path="/recap" element={<WeeklyRecapPage />} />
            <Route path="/ambassador-recap" element={<AmbassadorRecapPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/ambassador-schedule" element={<AmbassadorSchedulePage />} />
            <Route path="/meeting" element={<MeetingRoomPage />} />
          </Route>
        </Route>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </AuthProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ambassador Admin panel — completely separate from regular app */}
        <Route path="/ambassador-admin/login" element={
          <AmbassadorAdminAuthProvider>
            <AmbassadorAdminLoginPage />
          </AmbassadorAdminAuthProvider>
        } />
        <Route path="/ambassador-admin/*" element={
          <AmbassadorAdminAuthProvider>
            <AmbassadorAdminProtectedRoute>
              <AmbassadorAdminLayout />
            </AmbassadorAdminProtectedRoute>
          </AmbassadorAdminAuthProvider>
        }>
          <Route path="dashboard" element={<AmbassadorAdminDashboardPage />} />
          <Route path="ambassadors" element={<AmbassadorAdminAmbassadorsPage />} />
          <Route path="ambassadors/:id" element={<AmbassadorAdminProfilePage />} />
          <Route path="tasks" element={<AmbassadorAdminTasksPage />} />
          <Route path="leaderboard" element={<AmbassadorAdminLeaderboardPage />} />
          <Route path="schedule" element={<AmbassadorAdminSchedulePage />} />
        </Route>

        {/* Regular app — all other routes */}
        <Route path="*" element={<RegularApp />} />
      </Routes>
    </BrowserRouter>
  )
}
