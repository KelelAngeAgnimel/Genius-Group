import { NavLink, Outlet, Navigate } from 'react-router-dom'

const sousPages = [
  { path: 'mathematiques', label: '➕ Mathématiques', color: 'bg-red-700 hover:bg-red-800' },
  { path: 'physique-chimie', label: '🔬 Physique-Chimie', color: 'bg-red-600 hover:bg-red-700' },
  { path: 'anglais', label: '🇬🇧 Anglais', color: 'bg-orange-500 hover:bg-orange-600' },
  { path: 'francais', label: '🇫🇷 Français', color: 'bg-orange-600 hover:bg-orange-700' },
  { path: 'cours-video', label: '🎥 Cours vidéo', color: 'bg-red-700 hover:bg-red-800', badge: 'NEW' },
  { path: 'fiches-revision', label: '📄 Fiches de révision', color: 'bg-red-600 hover:bg-red-700' },
  { path: 'exercices-corriges', label: '✏️ Exercices corrigés', color: 'bg-orange-500 hover:bg-orange-600' },
  { path: 'tuteur-ia', label: '🤖 Tuteur IA', color: 'bg-red-900 hover:bg-red-950', badge: 'IA' },
]

export default function Ressources() {
  return (
    <div className="flex gap-6">
      <div className="w-64 flex flex-col gap-3 shrink-0">
        <h2 className="text-xl font-bold text-red-800 mb-2">📚 Ressources</h2>
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

      <div className="flex-1 bg-white rounded-2xl shadow p-6">
        <Outlet />
      </div>
    </div>
  )
}