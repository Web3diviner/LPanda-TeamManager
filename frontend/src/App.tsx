import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
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

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ambassador' || user.role === 'admin') return <Navigate to="/ambassador" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  )
}
