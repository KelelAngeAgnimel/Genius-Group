import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))

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

  // Helpers rôles
  const isAdmin = () => user?.role === 'admin'
  const isProfesseur = () => user?.role === 'professeur'
  const isEtudiant = () => ['etudiant_inphb', 'etudiant_esatic', 'etudiant_both'].includes(user?.role)
  const isEtudiantInphb = () => user?.role === 'etudiant_inphb'
  const isEtudiantEsatic = () => user?.role === 'etudiant_esatic'
  const isEtudiantBoth = () => user?.role === 'etudiant_both'
  const canAccessInphb = () => ['etudiant_inphb', 'etudiant_both', 'professeur', 'admin'].includes(user?.role)
  const canAccessEsatic = () => ['etudiant_esatic', 'etudiant_both', 'professeur', 'admin'].includes(user?.role)

  return (
    <AuthContext.Provider value={{
      user, token, login, logout,
      isAdmin, isProfesseur, isEtudiant,
      isEtudiantInphb, isEtudiantEsatic, isEtudiantBoth,
      canAccessInphb, canAccessEsatic
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}