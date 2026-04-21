import { createContext, useContext, useState, type ReactNode } from 'react'
import api from '../api'

export interface AmbassadorAdminUser {
  id: string
  name: string
  email: string
  role: 'ambassador_admin'
}

interface AmbassadorAdminAuthContextValue {
  user: AmbassadorAdminUser | null
  setUser: (user: AmbassadorAdminUser | null) => void
  logout: () => Promise<void>
}

const AmbassadorAdminAuthContext = createContext<AmbassadorAdminAuthContextValue | null>(null)

export function AmbassadorAdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AmbassadorAdminUser | null>(() => {
    try {
      const stored = localStorage.getItem('ambassador_admin_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  function setUser(u: AmbassadorAdminUser | null) {
    setUserState(u)
    if (u) localStorage.setItem('ambassador_admin_user', JSON.stringify(u))
    else localStorage.removeItem('ambassador_admin_user')
  }

  async function logout() {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('ambassador_admin_token')
    localStorage.removeItem('ambassador_admin_user')
    setUserState(null)
  }

  return (
    <AmbassadorAdminAuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AmbassadorAdminAuthContext.Provider>
  )
}

export function useAmbassadorAdminAuth() {
  const ctx = useContext(AmbassadorAdminAuthContext)
  if (!ctx) throw new Error('useAmbassadorAdminAuth must be used within AmbassadorAdminAuthProvider')
  return ctx
}
