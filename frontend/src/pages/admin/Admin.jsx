import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Admin() {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">⛔ Accès refusé</p>
          <p className="text-gray-500 mt-2">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      <div className="w-64 flex flex-col gap-3 shrink-0">
        <h2 className="text-xl font-bold text-gray-800 mb-2">⚙️ Administration</h2>
        {[
          { path: 'utilisateurs', label: '👥 Gestion utilisateurs' },
          { path: 'creer', label: '➕ Créer un utilisateur' },
          { path: 'planning', label: '📅 Gestion du planning' },
        ].map((page) => (
          <NavLink
            key={page.path}
            to={page.path}
            className={({ isActive }) =>
              `bg-gray-800 hover:bg-gray-900 text-white px-4 py-3 rounded-xl font-semibold transition ${
                isActive ? 'ring-2 ring-yellow-400' : ''
              }`
            }
          >
            {page.label}
          </NavLink>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow p-6">
        <Outlet />
      </div>
    </div>
  )
}