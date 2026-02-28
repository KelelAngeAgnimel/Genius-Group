export default function Anglais() {
  const exercices = [
    { titre: 'Compréhension écrite — Texte scientifique', duree: '30 min' },
    { titre: 'Expression écrite — Essay writing', duree: '45 min' },
    { titre: 'Vocabulaire technique — Engineering', duree: '20 min' },
    { titre: 'Listening — Cambridge B2', duree: '25 min' },
  ]
  return (
    <div>
      <h2 className="text-2xl font-bold text-red-800 mb-4">🇬🇧 Anglais</h2>
      <div className="flex flex-col gap-3">
        {exercices.map((e, i) => (
          <div key={i} className="border border-orange-100 rounded-xl p-4 flex items-center justify-between hover:shadow transition">
            <h3 className="font-semibold text-gray-800">{e.titre}</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">⏱️ {e.duree}</span>
              <button className="bg-orange-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-orange-600">
                Commencer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}