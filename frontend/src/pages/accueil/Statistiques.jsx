import { useAuth } from '../../context/AuthContext'

export default function Statistiques() {
  const { user } = useAuth()

  return (
    <div>
      <h2 className="text-2xl font-bold text-indigo-900 mb-4">📊 Statistiques & admissibilités</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Exercices faits', valeur: '24', couleur: 'bg-indigo-100 text-indigo-800' },
          { label: 'Score moyen', valeur: '72%', couleur: 'bg-green-100 text-green-800' },
          { label: 'Sessions blanches', valeur: '3', couleur: 'bg-orange-100 text-orange-800' },
        ].map((s, i) => (
          <div key={i} className={`${s.couleur} rounded-xl p-4 text-center`}>
            <p className="text-3xl font-bold">{s.valeur}</p>
            <p className="text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-gray-500 text-sm">
        Connecté en tant que <span className="font-semibold">{user?.prenom} {user?.nom}</span> — {user?.matricule}
      </p>
    </div>
  )
}