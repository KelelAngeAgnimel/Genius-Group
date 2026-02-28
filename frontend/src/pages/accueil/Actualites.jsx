export default function Actualites() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-indigo-900 mb-4">🔔 Actualités & annonces</h2>
      <div className="flex flex-col gap-4">
        {[
          { titre: 'Ouverture des inscriptions 2026', date: '01 Mars 2026', contenu: 'Les inscriptions aux concours sont ouvertes jusqu\'au 15 avril.' },
          { titre: 'Nouveaux sujets disponibles', date: '25 Fév 2026', contenu: 'Les sujets des sessions blanches 2025 sont disponibles dans Ressources.' },
          { titre: 'Calendrier mis à jour', date: '20 Fév 2026', contenu: 'Le calendrier des épreuves 2026 a été mis à jour.' },
        ].map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow transition">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-indigo-800">{item.titre}</h3>
              <span className="text-xs text-gray-400">{item.date}</span>
            </div>
            <p className="text-gray-600 text-sm">{item.contenu}</p>
          </div>
        ))}
      </div>
    </div>
  )
}