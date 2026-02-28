export default function Guide() {
  const etapes = [
    { num: '01', titre: 'Choisir ses concours', desc: 'Identifie les concours adaptés à ta filière et tes objectifs.' },
    { num: '02', titre: 'Organiser son planning', desc: 'Utilise le planning personnalisé pour structurer tes révisions.' },
    { num: '03', titre: 'S\'entraîner régulièrement', desc: 'Fais des exercices corrigés et des sessions blanches.' },
    { num: '04', titre: 'Suivre sa progression', desc: 'Consulte tes statistiques pour identifier tes points faibles.' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-indigo-900 mb-4">🔥 Guide du bachelier</h2>
      <div className="flex flex-col gap-4">
        {etapes.map((e, i) => (
          <div key={i} className="flex items-start gap-4 border border-gray-100 rounded-xl p-4 hover:shadow transition">
            <span className="bg-indigo-700 text-white font-bold text-lg px-3 py-1 rounded-lg">{e.num}</span>
            <div>
              <h3 className="font-bold text-indigo-800">{e.titre}</h3>
              <p className="text-gray-500 text-sm mt-1">{e.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}