import { createContext, useContext, useState, ReactNode } from 'react'
import { api } from '@/lib/api'

interface AuthContextType {
  username: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem('username')
  )

  const login = async (username: string, password: string) => {
    const res = await api.post('/login', { username, password })
    localStorage.setItem('access_token', res.data.access_token)
    localStorage.setItem('username', res.data.username)
    setUsername(res.data.username)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('username')
    setUsername(null)
  }

  return (
    <AuthContext.Provider
      value={{
        username,
        isAuthenticated: !!username && !!localStorage.getItem('access_token'),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
