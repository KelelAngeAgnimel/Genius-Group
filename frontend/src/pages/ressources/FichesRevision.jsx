export default function FichesRevision() {
  const fiches = [
    { titre: 'Formules d\'analyse', matiere: 'Maths', pages: 4 },
    { titre: 'Constantes physiques', matiere: 'Physique', pages: 2 },
    { titre: 'Vocabulaire avancé B2/C1', matiere: 'Anglais', pages: 6 },
    { titre: 'Connecteurs logiques', matiere: 'Français', pages: 3 },
    { titre: 'Algèbre linéaire', matiere: 'Maths', pages: 5 },
    { titre: 'Réactions chimiques', matiere: 'Chimie', pages: 4 },
  ]
  return (
    <div>
      <h2 className="text-2xl font-bold text-red-800 mb-4">📄 Fiches de révision</h2>
      <div className="grid grid-cols-2 gap-4">
        {fiches.map((f, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow transition">
            <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {f.matiere}
            </span>
            <h3 className="font-bold text-gray-800 mt-2">{f.titre}</h3>
            <p className="text-xs text-gray-400 mt-1">{f.pages} pages</p>
            <button className="mt-3 bg-red-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-700">
              📥 Télécharger
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}