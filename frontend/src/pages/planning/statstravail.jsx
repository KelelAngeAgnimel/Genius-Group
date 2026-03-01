const stats = [
  { label: 'Heures cette semaine', valeur: '14h', couleur: 'bg-green-100 text-green-800' },
  { label: 'Heures ce mois', valeur: '52h', couleur: 'bg-blue-100 text-blue-800' },
  { label: 'Jours consécutifs', valeur: '7', couleur: 'bg-orange-100 text-orange-800' },
  { label: 'Exercices complétés', valeur: '38', couleur: 'bg-purple-100 text-purple-800' },
]

export default function StatsTravail() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-6">📊 Statistiques de travail</h2>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`${s.couleur} rounded-xl p-6 text-center`}>
            <p className="text-4xl font-bold">{s.valeur}</p>
            <p className="text-sm mt-2 font-medium">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}