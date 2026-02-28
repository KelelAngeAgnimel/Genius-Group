export default function Calendrier() {
  const epreuves = [
    { concours: 'Centrale-Supélec', matiere: 'Mathématiques', date: '15 Avril 2026', heure: '8h00' },
    { concours: 'Mines-Ponts', matiere: 'Physique', date: '16 Avril 2026', heure: '14h00' },
    { concours: 'CCP', matiere: 'Français', date: '17 Avril 2026', heure: '8h00' },
    { concours: 'E3A', matiere: 'Anglais', date: '18 Avril 2026', heure: '10h00' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-indigo-900 mb-4">📅 Calendrier des épreuves</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-indigo-100 text-indigo-900">
            <th className="p-3 text-left rounded-tl-lg">Concours</th>
            <th className="p-3 text-left">Matière</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left rounded-tr-lg">Heure</th>
          </tr>
        </thead>
        <tbody>
          {epreuves.map((e, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-3 font-semibold text-indigo-700">{e.concours}</td>
              <td className="p-3">{e.matiere}</td>
              <td className="p-3">{e.date}</td>
              <td className="p-3">{e.heure}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}