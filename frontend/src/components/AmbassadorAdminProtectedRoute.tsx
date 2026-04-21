import { Navigate } from 'react-router-dom'
import { useAmbassadorAdminAuth } from '../context/AmbassadorAdminAuthContext'

export default function AmbassadorAdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAmbassadorAdminAuth()
  if (!user) return <Navigate to="/ambassador-admin/login" replace />
  return <>{children}</>
}
