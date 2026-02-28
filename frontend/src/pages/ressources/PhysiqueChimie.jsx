const chapitres = [
  { titre: 'Thermodynamique', exercices: 10, niveau: 'Difficile' },
  { titre: 'Mécanique des fluides', exercices: 7, niveau: 'Très difficile' },
  { titre: 'Électrocinétique', exercices: 9, niveau: 'Moyen' },
  { titre: 'Chimie organique', exercices: 11, niveau: 'Difficile' },
]

export default function PhysiqueChimie() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-red-800 mb-4">🔬 Physique-Chimie</h2>
      <div className="flex flex-col gap-3">
        {chapitres.map((c, i) => (
          <div key={i} className="border border-red-100 rounded-xl p-4 flex items-center justify-between hover:shadow transition">
            <div>
              <h3 className="font-bold text-gray-800">{c.titre}</h3>
              <p className="text-sm text-gray-400">{c.exercices} exercices disponibles</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                c.niveau === 'Très difficile' ? 'bg-red-100 text-red-700'
                : c.niveau === 'Difficile' ? 'bg-orange-100 text-orange-700'
                : 'bg-green-100 text-green-700'
              }`}>{c.niveau}</span>
              <button className="bg-red-700 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-800">
                Accéder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}