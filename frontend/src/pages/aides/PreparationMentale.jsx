export default function PreparationMentale() {
  const conseils = [
    { emoji: '😴', titre: 'Bien dormir', desc: 'Minimum 8h de sommeil, surtout avant les épreuves.' },
    { emoji: '🧘', titre: 'Gérer le stress', desc: 'Respirations profondes, méditation 10 min/jour.' },
    { emoji: '🏃', titre: 'Faire du sport', desc: '30 min d\'activité physique améliore la concentration.' },
    { emoji: '🍎', titre: 'Bien manger', desc: 'Évite le sucre avant les révisions, privilégie les protéines.' },
  ]
  return (
    <div>
      <h2 className="text-2xl font-bold text-purple-800 mb-4">🧠 Préparation mentale</h2>
      <div className="grid grid-cols-2 gap-4">
        {conseils.map((c, i) => (
          <div key={i} className="border border-purple-100 rounded-xl p-4 hover:shadow transition text-center">
            <span className="text-4xl">{c.emoji}</span>
            <h3 className="font-bold text-gray-800 mt-2">{c.titre}</h3>
            <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}