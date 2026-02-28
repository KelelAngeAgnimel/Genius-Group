export default function Contacts() {
  const equipe = [
    { nom: 'M. Martin', role: 'Responsable pédagogique', email: 'martin@portail.fr', emoji: '👨‍🏫' },
    { nom: 'Mme. Dubois', role: 'Coordinatrice concours', email: 'dubois@portail.fr', emoji: '👩‍💼' },
    { nom: 'M. Bernard', role: 'Support technique', email: 'support@portail.fr', emoji: '🧑‍💻' },
  ]
  return (
    <div>
      <h2 className="text-2xl font-bold text-purple-800 mb-4">📞 Contacts & équipe</h2>
      <div className="flex flex-col gap-4">
        {equipe.map((e, i) => (
          <div key={i} className="border border-purple-100 rounded-xl p-4 flex items-center gap-4 hover:shadow transition">
            <span className="text-4xl">{e.emoji}</span>
            <div>
              <h3 className="font-bold text-gray-800">{e.nom}</h3>
              <p className="text-sm text-purple-600">{e.role}</p>
              <p className="text-sm text-gray-400">{e.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}