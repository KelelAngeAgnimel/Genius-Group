export default function Tendances() {
  const tendances = [
    { concours: 'Centrale-Supélec', tendance: '↑ +5%', places: 520, difficulte: 'Élevée' },
    { concours: 'Mines-Ponts', tendance: '→ stable', places: 350, difficulte: 'Très élevée' },
    { concours: 'CCP', tendance: '↑ +2%', places: 1200, difficulte: 'Moyenne' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-indigo-900 mb-2">🤖 Concours tendances</h2>
      <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full mb-4 inline-block">IA</span>
      <p className="text-gray-500 text-sm mb-4">Analyse IA des tendances des concours cette année.</p>
      <div className="flex flex-col gap-3">
        {tendances.map((t, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow transition">
            <h3 className="font-bold text-indigo-800">{t.concours}</h3>
            <span className="text-green-600 font-semibold">{t.tendance}</span>
            <span className="text-gray-500 text-sm">Places : {t.places}</span>
            <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{t.difficulte}</span>
          </div>
        ))}
      </div>
    </div>
  )
}