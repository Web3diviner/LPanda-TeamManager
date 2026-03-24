import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../api'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
}

interface AuthContextValue {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  function setUser(u: User | null) {
    setUserState(u)
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore errors
    }
    localStorage.removeItem('user')
    setUserState(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
