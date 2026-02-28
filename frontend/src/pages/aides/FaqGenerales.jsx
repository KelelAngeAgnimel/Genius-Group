const faqs = [
  { q: 'Comment accéder à mes fiches ?', r: 'Va dans Ressources → Fiches de révision.' },
  { q: 'Comment changer mon mot de passe ?', r: 'Contacte l\'administrateur via Contacts & équipe.' },
  { q: 'Les données sont-elles sauvegardées ?', r: 'Oui, toutes tes données sont sauvegardées automatiquement.' },
  { q: 'Comment suivre ma progression ?', r: 'Va dans Planning → Suivi de progression.' },
]

export default function FaqGenerale() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-purple-800 mb-4">❓ FAQ Générale</h2>
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