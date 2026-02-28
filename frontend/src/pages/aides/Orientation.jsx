export default function Orientation() {
  const conseils = [
    { titre: 'Bien choisir sa filière', desc: 'MP pour les matheux purs, PC pour physique-maths, PSI pour mécanique.' },
    { titre: 'Concours vs grandes écoles', desc: 'Compare les débouchés, les niveaux requis et les spécialités.' },
    { titre: 'Préparer son dossier', desc: 'Les notes de prépa comptent beaucoup pour l\'admissibilité.' },
    { titre: 'Après le concours', desc: 'Intégration, vie en école, doubles diplômes et stages.' },
  ]
  return (
    <div>
      <h2 className="text-2xl font-bold text-purple-800 mb-4">🎯 Conseils orientation</h2>
      <div className="flex flex-col gap-4">
        {conseils.map((c, i) => (
          <div key={i} className="border-l-4 border-purple-500 pl-4 py-2 hover:bg-purple-50 rounded-r-xl transition">
            <h3 className="font-bold text-gray-800">{c.titre}</h3>
            <p className="text-gray-500 text-sm mt-1">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}