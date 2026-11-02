import { useState } from 'react'
import { useConcours } from '../../hooks/useConcours'
import Markdown from '../../lib/markdown'
// Les guides vivent dans docs/ (source unique, relue et modifiée comme un simple fichier texte)
import guideEleve from '../../../../docs/guide-eleve.md?raw'
import guideProfesseur from '../../../../docs/guide-professeur.md?raw'

const GUIDES = {
  eleve: { titre: 'Guide de l’élève', texte: guideEleve },
  professeur: { titre: 'Guide du professeur', texte: guideProfesseur }
}

// Affiche le bon guide selon le rôle : élève → guide de l'élève, professeur → guide du professeur,
// administrateur → les deux (onglets).
export default function GuideUtilisation() {
  const { estEtudiant, estAdmin } = useConcours()
  const [choix, setChoix] = useState('professeur')

  const disponibles = estAdmin ? ['professeur', 'eleve'] : [estEtudiant ? 'eleve' : 'professeur']
  const actif = disponibles.includes(choix) ? choix : disponibles[0]

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-5">
        <p className="text-xs tracking-widest uppercase mb-1 texte-or">Aide</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Guide d’utilisation</h1>
        <p className="text-gray-500 text-sm mt-1">Les étapes à suivre, pas à pas.</p>
      </div>

      {disponibles.length > 1 && (
        <div className="flex gap-2 mb-5" role="tablist" aria-label="Choix du guide">
          {disponibles.map(id => (
            <button key={id} type="button" role="tab" aria-selected={actif === id} onClick={() => setChoix(id)}
              className="text-xs font-bold px-4 py-2 rounded-xl"
              style={{ background: actif === id ? '#071020' : 'white', color: actif === id ? '#C9A84C' : '#6b7280', border: '1px solid #f0ece0' }}>
              {GUIDES[id].titre}
            </button>
          ))}
        </div>
      )}

      <article className="bg-white rounded-2xl p-5 md:p-8 max-w-3xl" style={{ border: '1px solid #f0ece0' }}>
        <Markdown texte={GUIDES[actif].texte} />
      </article>
    </div>
  )
}
