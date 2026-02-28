export default function Fiches() {
  const fiches = [
    { titre: 'Concours Centrale-Supélec', niveau: 'MP/PC/PSI', annee: '2025' },
    { titre: 'Concours Mines-Ponts', niveau: 'MP/PC', annee: '2025' },
    { titre: 'Concours CCP', niveau: 'MP/PC/PSI/PT', annee: '2025' },
    { titre: 'Concours E3A-Polytech', niveau: 'MP/PC/PSI/PT', annee: '2025' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-indigo-900 mb-4">📋 Fiches concours</h2>
      <div className="grid grid-cols-2 gap-4">
        {fiches.map((f, i) => (
          <div key={i} className="border border-indigo-100 bg-indigo-50 rounded-xl p-4 hover:shadow transition">
            <h3 className="font-bold text-indigo-800">{f.titre}</h3>
            <p className="text-sm text-gray-500 mt-1">Filières : {f.niveau}</p>
            <p className="text-sm text-gray-500">Année : {f.annee}</p>
            <button className="mt-3 bg-indigo-700 text-white text-xs px-3 py-1 rounded-lg hover:bg-indigo-800">
              Voir la fiche
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}