export default function Ecoles() {
  const ecoles = [
    { nom: 'École Polytechnique', lieu: 'Palaiseau', places: 500, niveau: 'MP/PC' },
    { nom: 'CentraleSupélec', lieu: 'Gif-sur-Yvette', places: 900, niveau: 'MP/PC/PSI' },
    { nom: 'Mines Paris', lieu: 'Paris', places: 180, niveau: 'MP/PC' },
    { nom: 'ENSTA Paris', lieu: 'Palaiseau', places: 250, niveau: 'MP/PC/PSI' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-indigo-900 mb-4">🏫 Présentation des écoles</h2>
      <div className="grid grid-cols-2 gap-4">
        {ecoles.map((e, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow transition">
            <h3 className="font-bold text-indigo-800 text-lg">{e.nom}</h3>
            <p className="text-sm text-gray-500 mt-1">📍 {e.lieu}</p>
            <p className="text-sm text-gray-500">🎓 Filières : {e.niveau}</p>
            <p className="text-sm text-gray-500">👥 Places : {e.places}</p>
          </div>
        ))}
      </div>
    </div>
  )
}