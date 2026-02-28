const faqs = [
  { q: 'Quels concours sont disponibles ?', r: 'Centrale, Mines-Ponts, CCP, E3A-Polytech et plus encore.' },
  { q: 'Comment s\'inscrire aux concours ?', r: 'Les inscriptions se font sur le site officiel de chaque concours.' },
  { q: 'Quelle filière choisir ?', r: 'Consulte la section Conseils orientation dans Aides.' },
  { q: 'Y a-t-il des annales disponibles ?', r: 'Oui, dans Ressources → Exercices corrigés.' },
]

export default function FaqConcours() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-purple-800 mb-4">💬 FAQ Concours</h2>
      <div className="flex flex-col gap-3">
        {faqs.map((f, i) => (
          <div key={i} className="border border-purple-100 rounded-xl p-4 hover:shadow transition">
            <h3 className="font-bold text-purple-800">Q : {f.q}</h3>
            <p className="text-gray-600 text-sm mt-1">R : {f.r}</p>
          </div>
        ))}
      </div>
    </div>
  )
}