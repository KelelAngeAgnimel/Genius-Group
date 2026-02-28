const revisions = [
  { matiere: 'Mathématiques', sujet: 'Analyse — Séries entières', date: '01 Mars', duree: '2h' },
  { matiere: 'Physique-Chimie', sujet: 'Thermodynamique', date: '02 Mars', duree: '1h30' },
  { matiere: 'Anglais', sujet: 'Compréhension écrite', date: '03 Mars', duree: '1h' },
  { matiere: 'Mathématiques', sujet: 'Algèbre — Réduction', date: '04 Mars', duree: '2h' },
  { matiere: 'Français', sujet: 'Dissertation — Plan', date: '05 Mars', duree: '1h30' },
]

const couleurs = {
  'Mathématiques': 'bg-blue-100 text-blue-800',
  'Physique-Chimie': 'bg-purple-100 text-purple-800',
  'Anglais': 'bg-yellow-100 text-yellow-800',
  'Français': 'bg-red-100 text-red-800',
}

export default function CalendrierRevisions() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-4">📅 Calendrier des révisions</h2>
      <div className="flex flex-col gap-3">
        {revisions.map((r, i) => (
          <div key={i} className="flex items-center gap-4 border border-gray-100 rounded-xl p-4 hover:shadow transition">
            <div className="text-center bg-green-100 rounded-lg px-3 py-2 min-w-16">
              <p className="text-green-800 font-bold text-sm">{r.date}</p>
            </div>
            <div className="flex-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${couleurs[r.matiere]}`}>
                {r.matiere}
              </span>
              <p className="font-semibold text-gray-700 mt-1">{r.sujet}</p>
            </div>
            <span className="text-sm text-gray-400">⏱️ {r.duree}</span>
          </div>
        ))}
      </div>
    </div>
  )
}