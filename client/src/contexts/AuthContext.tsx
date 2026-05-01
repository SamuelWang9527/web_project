import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '@/utils/api'
import type { User, UserRole } from '@/types/models'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasRole: (role: UserRole) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const res = await apiLogin({ username, password })
    const { token, user: userData } = res.data.data
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const logout = async () => {
    await apiLogout()
    localStorage.removeItem('token')
    setUser(null)
  }

  const hasRole = (role: UserRole) => {
    if (!user) return false
    const hierarchy: UserRole[] = ['user', 'admin', 'super_admin']
    return hierarchy.indexOf(user.role) >= hierarchy.indexOf(role)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
