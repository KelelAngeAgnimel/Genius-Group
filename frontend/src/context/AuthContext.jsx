import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  // Compte connecté avant la migration : on rafraîchit rôle + concours depuis /api/users/me
  useEffect(() => {
    if (!token || Array.isArray(user?.concours)) return
    api.get('/api/users/me').then(res => {
      if (!res.ok) return
      const frais = { ...user, ...res.data }
      setUser(frais)
      localStorage.setItem('user', JSON.stringify(frais))
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', userToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}