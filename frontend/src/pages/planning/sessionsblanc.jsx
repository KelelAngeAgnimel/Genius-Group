const sessions = [
  { nom: 'Session blanc #1', date: '10 Janv 2026', score: 68, statut: 'Terminée' },
  { nom: 'Session blanc #2', date: '07 Fév 2026', score: 74, statut: 'Terminée' },
  { nom: 'Session blanc #3', date: '07 Mars 2026', score: null, statut: 'À venir' },
]

export default function SessionsBlanc() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-2">📝 Sessions de blanc</h2>
      <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full mb-4 inline-block">NEW</span>
      <div className="flex flex-col gap-4 mt-2">
        {sessions.map((s, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow transition">
            <div>
              <h3 className="font-bold text-gray-800">{s.nom}</h3>
              <p className="text-sm text-gray-400">{s.date}</p>
            </div>
            <div className="flex items-center gap-4">
              {s.score !== null
                ? <span className="text-2xl font-bold text-green-600">{s.score}%</span>
                : <span className="text-gray-400 text-sm">—</span>
              }
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                s.statut === 'Terminée'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {s.statut}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}