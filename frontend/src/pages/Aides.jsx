import { NavLink, Outlet, Navigate } from 'react-router-dom'

const sousPages = [
  { path: 'faq-generale', label: '❓ FAQ Générale', color: 'bg-purple-700 hover:bg-purple-800' },
  { path: 'faq-concours', label: '💬 FAQ Concours', color: 'bg-purple-600 hover:bg-purple-700' },
  { path: 'contacts', label: '📞 Contacts & équipe', color: 'bg-purple-700 hover:bg-purple-800' },
  { path: 'orientation', label: '🎯 Conseils orientation', color: 'bg-purple-600 hover:bg-purple-700' },
  { path: 'preparation-mentale', label: '🧠 Préparation mentale', color: 'bg-purple-700 hover:bg-purple-800' },
  { path: 'forum', label: '👥 Forum étudiant', color: 'bg-purple-600 hover:bg-purple-700', badge: 'NEW' },
  { path: 'chatbot', label: '🤖 Chatbot d\'aide', color: 'bg-purple-900 hover:bg-purple-950', badge: 'IA' },
]

export default function Aides() {
  return (
    <div className="flex gap-6">
      <div className="w-64 flex flex-col gap-3 shrink-0">
        <h2 className="text-xl font-bold text-purple-800 mb-2">🆘 Aides</h2>
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