const matieres = [
  { nom: 'Mathématiques', progression: 75, couleur: 'bg-blue-500' },
  { nom: 'Physique-Chimie', progression: 60, couleur: 'bg-purple-500' },
  { nom: 'Anglais', progression: 85, couleur: 'bg-yellow-500' },
  { nom: 'Français', progression: 50, couleur: 'bg-red-500' },
]

export default function SuiviProgression() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-6">✅ Suivi de progression</h2>
      <div className="flex flex-col gap-6">
        {matieres.map((m, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-700">{m.nom}</span>
              <span className="text-gray-500 text-sm">{m.progression}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`${m.couleur} h-4 rounded-full transition-all`}
                style={{ width: `${m.progression}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}