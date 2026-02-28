export default function ExercicesCorriges() {
  const exercices = [
    { titre: 'Séries entières — Annale 2024', matiere: 'Maths', difficulte: 'Difficile' },
    { titre: 'Oscillateur harmonique', matiere: 'Physique', difficulte: 'Moyen' },
    { titre: 'Synthèse organique', matiere: 'Chimie', difficulte: 'Très difficile' },
    { titre: 'Reading comprehension', matiere: 'Anglais', difficulte: 'Moyen' },
    { titre: 'Dissertation corrigée', matiere: 'Français', difficulte: 'Difficile' },
  ]
  return (
    <div>
      <h2 className="text-2xl font-bold text-red-800 mb-4">✏️ Exercices corrigés</h2>
      <div className="flex flex-col gap-3">
        {exercices.map((e, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow transition">
            <div>
              <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {e.matiere}
              </span>
              <h3 className="font-semibold text-gray-800 mt-1">{e.titre}</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                e.difficulte === 'Très difficile' ? 'bg-red-100 text-red-700'
                : e.difficulte === 'Difficile' ? 'bg-orange-100 text-orange-700'
                : 'bg-green-100 text-green-700'
              }`}>{e.difficulte}</span>
              <button className="bg-orange-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-orange-600">
                Voir corrigé
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}