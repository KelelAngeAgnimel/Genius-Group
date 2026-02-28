import { NavLink, Outlet, Navigate } from 'react-router-dom'

const sousPages = [
  { path: 'emploi-du-temps', label: '🗓️ Emploi du temps hebdo', color: 'bg-green-700 hover:bg-green-800' },
  { path: 'suivi-progression', label: '✅ Suivi de progression', color: 'bg-green-600 hover:bg-green-700' },
  { path: 'rappels', label: '🔔 Rappels & alertes', color: 'bg-green-700 hover:bg-green-800' },
  { path: 'calendrier-revisions', label: '📅 Calendrier des révisions', color: 'bg-green-600 hover:bg-green-700' },
  { path: 'sessions-blanc', label: '📝 Sessions de blanc', color: 'bg-green-700 hover:bg-green-800', badge: 'NEW' },
  { path: 'stats-travail', label: '📊 Statistiques de travail', color: 'bg-green-600 hover:bg-green-700' },
  { path: 'planning-perso', label: '🤖 Planning personnalisé', color: 'bg-green-900 hover:bg-green-950', badge: 'IA' },
]

export default function Planning() {
  return (
    <div className="flex gap-6">
      <div className="w-64 flex flex-col gap-3 shrink-0">
        <h2 className="text-xl font-bold text-green-800 mb-2">📅 Planning</h2>
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