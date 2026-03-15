import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, token } = useAuth()

  if (!token || !user) return <Navigate to="/" />

  // Si des rôles sont spécifiés, vérifier que l'utilisateur a le bon rôle
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/accueil/actualites" />
  }

  return children
}