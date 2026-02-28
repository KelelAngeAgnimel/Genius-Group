export default function Francais() {
  const exercices = [
    { titre: 'Dissertation — Méthodologie complète', duree: '1h' },
    { titre: 'Résumé de texte', duree: '30 min' },
    { titre: 'Contraction de texte', duree: '45 min' },
    { titre: 'Commentaire composé', duree: '1h' },
  ]
  return (
    <div>
      <h2 className="text-2xl font-bold text-red-800 mb-4">🇫🇷 Français</h2>
      <div className="flex flex-col gap-3">
        {exercices.map((e, i) => (
          <div key={i} className="border border-orange-100 rounded-xl p-4 flex items-center justify-between hover:shadow transition">
            <h3 className="font-semibold text-gray-800">{e.titre}</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">⏱️ {e.duree}</span>
              <button className="bg-orange-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-orange-700">
                Commencer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}