import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">

      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tracking-wide">🎓 Portail Bacheliers</span>
      </div>

      {/* Liens de navigation */}
      <div className="flex items-center gap-2">
        <NavLink
          to="/accueil"
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg font-semibold transition ${
              isActive ? 'bg-indigo-600' : 'hover:bg-indigo-700'
            }`
          }
        >
          🏠 Accueil
        </NavLink>

        <NavLink
          to="/planning"
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg font-semibold transition ${
              isActive ? 'bg-green-600' : 'hover:bg-green-700'
            }`
          }
        >
          📅 Planning
        </NavLink>

        <NavLink
          to="/ressources"
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg font-semibold transition ${
              isActive ? 'bg-red-600' : 'hover:bg-red-700'
            }`
          }
        >
          📚 Ressources
        </NavLink>

        <NavLink
          to="/aides"
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg font-semibold transition ${
              isActive ? 'bg-purple-600' : 'hover:bg-purple-700'
            }`
          }
        >
          🆘 Aides
        </NavLink>
      </div>

      {user?.role === 'admin' && (
  <NavLink
    to="/admin"
    className={({ isActive }) =>
      `px-4 py-2 rounded-lg font-semibold transition ${
        isActive ? 'bg-gray-600' : 'hover:bg-gray-700'
      }`
    }
  >
    ⚙️ Admin
  </NavLink>
)}

      {/* Profil & déconnexion */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-indigo-200">
          <span className="font-semibold text-white">{user?.prenom} {user?.nom}</span>
          <br />
          <span className="text-xs">{user?.matricule}</span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg transition font-semibold"
        >
          Déconnexion
        </button>
      </div>

    </nav>
  )
}