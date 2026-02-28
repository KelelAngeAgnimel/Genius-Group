export default function CoursVideo() {
  const videos = [
    { titre: 'Intégrales — Cours complet', matiere: 'Maths', duree: '45 min', vues: 128 },
    { titre: 'Thermodynamique — Les bases', matiere: 'Physique', duree: '38 min', vues: 94 },
    { titre: 'Essay writing — Tips & tricks', matiere: 'Anglais', duree: '22 min', vues: 76 },
    { titre: 'Dissertation — Introduction', matiere: 'Français', duree: '30 min', vues: 110 },
  ]
  return (
    <div>
      <h2 className="text-2xl font-bold text-red-800 mb-2">🎥 Cours vidéo</h2>
      <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full mb-4 inline-block">NEW</span>
      <div className="grid grid-cols-2 gap-4 mt-2">
        {videos.map((v, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow transition">
            <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center mb-3">
              <span className="text-4xl">▶️</span>
            </div>
            <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {v.matiere}
            </span>
            <h3 className="font-bold text-gray-800 mt-2">{v.titre}</h3>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>⏱️ {v.duree}</span>
              <span>👁️ {v.vues} vues</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}