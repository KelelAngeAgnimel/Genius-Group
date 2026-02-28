import { NavLink, Outlet } from 'react-router-dom'

const sousPages = [
  { path: 'actualites', label: '🔔 Actualités & annonces', color: 'bg-indigo-700 hover:bg-indigo-800' },
  { path: 'fiches', label: '📋 Fiches concours', color: 'bg-blue-600 hover:bg-blue-700', badge: 'NEW' },
  { path: 'calendrier', label: '📅 Calendrier des épreuves', color: 'bg-indigo-700 hover:bg-indigo-800' },
  { path: 'ecoles', label: '🏫 Présentation des écoles', color: 'bg-blue-600 hover:bg-blue-700' },
  { path: 'statistiques', label: '📊 Statistiques & admissibilités', color: 'bg-indigo-700 hover:bg-indigo-800' },
  { path: 'guide', label: '🔥 Guide du bachelier', color: 'bg-indigo-900 hover:bg-indigo-950' },
  { path: 'tendances', label: '🤖 Concours tendances', color: 'bg-blue-600 hover:bg-blue-700', badge: 'IA' },
]

export default function Accueil() {
  return (
    <div className="flex gap-6">

      {/* Sidebar gauche */}
      <div className="w-64 flex flex-col gap-3 shrink-0">
        <h2 className="text-xl font-bold text-indigo-900 mb-2">🏠 Accueil</h2>
        {sousPages.map((page) => (
          <NavLink
            key={page.path}
            to={page.path}
            className={({ isActive }) =>
              `${page.color} text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-between transition ${
                isActive ? 'ring-2 ring-yellow-400' : ''
              }`
            }
          >
            <span>{page.label}</span>
            {page.badge && (
              <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                {page.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Contenu de la sous-page */}
      <div className="flex-1 bg-white rounded-2xl shadow p-6">
        <Outlet />
      </div>

    </div>
  )
}