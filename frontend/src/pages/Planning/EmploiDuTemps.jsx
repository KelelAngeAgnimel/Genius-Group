const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const creneaux = ['8h-10h', '10h-12h', '14h-16h', '16h-18h']
const emploi = {
  'Lundi':    ['Mathématiques', 'Physique-Chimie', 'Anglais', '-'],
  'Mardi':    ['Français', 'Mathématiques', '-', 'Physique-Chimie'],
  'Mercredi': ['Physique-Chimie', '-', 'Mathématiques', 'Français'],
  'Jeudi':    ['Anglais', 'Mathématiques', 'Physique-Chimie', '-'],
  'Vendredi': ['Mathématiques', 'Français', 'Anglais', 'Révisions'],
  'Samedi':   ['Session blanc', '-', 'Corrections', '-'],
}

export default function EmploiDuTemps() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-4">🗓️ Emploi du temps hebdo</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-100 text-green-900">
              <th className="p-3 text-left rounded-tl-lg">Créneau</th>
              {jours.map(j => (
                <th key={j} className="p-3 text-left">{j}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {creneaux.map((creneau, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 font-semibold text-green-700">{creneau}</td>
                {jours.map(jour => (
                  <td key={jour} className="p-3 text-gray-600">
                    {emploi[jour][i] === '-'
                      ? <span className="text-gray-300">—</span>
                      : <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-lg text-xs font-medium">
                          {emploi[jour][i]}
                        </span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}