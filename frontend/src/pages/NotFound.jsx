import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Affichée pour toute adresse inconnue (rapport QA n°2) : message clair + retour
export default function NotFound() {
  const { user } = useAuth()
  const retour = user ? '/accueil' : '/'

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f8f7f4' }}>
      <div className="max-w-md text-center bg-white rounded-2xl p-8" style={{ border: '1px solid #f0ece0' }}>
        <p className="text-5xl font-bold mb-2" style={{ color: '#C9A84C' }}>404</p>
        <h1 className="text-xl font-bold mb-2" style={{ color: '#071020' }}>Page introuvable</h1>
        <p className="text-sm text-gray-500 mb-6">
          Cette adresse n'existe pas ou n'existe plus. Vérifiez le lien ou revenez à l'accueil.
        </p>
        <Link to={retour}
          className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#071020', color: '#C9A84C' }}>
          {user ? 'Retour à l’accueil' : 'Retour à la connexion'}
        </Link>
      </div>
    </div>
  )
}
