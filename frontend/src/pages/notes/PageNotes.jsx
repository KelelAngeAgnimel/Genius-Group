import { Link } from 'react-router-dom'
import { useConcours } from '../../hooks/useConcours'
import { useConcoursActif } from '../../hooks/useConcoursActif'
import SelecteurConcours from '../../components/SelecteurConcours'
import EmptyState from '../../components/EmptyState'
import MesNotes from './MesNotes'
import TableauNotesEleve from './TableauNotesEleve'
import GrilleNotes from './GrilleNotes'

// /outils/notes : tableau de bord selon le rôle
//  - élève : courbes, moyennes, dernières corrections (+ détail par concours existant)
//  - professeur / admin : grille de saisie rapide
export default function PageNotes() {
  const { estPersonnel, estAdmin } = useConcours()
  const { codes, actif, choisir } = useConcoursActif()

  if (estPersonnel) {
    return (
      <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#7B4CC9' }}>Outils</p>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Notes de la classe</h1>
            <p className="text-gray-500 text-sm mt-1">Saisissez et suivez les notes par concours, matière et période.</p>
          </div>
          {estAdmin && (
            <Link to="/admin/vue-globale" className="text-xs font-bold underline" style={{ color: '#7B4CC9' }}>Voir la vue globale par concours →</Link>
          )}
        </div>
        <GrilleNotes />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>Outils</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Mes notes</h1>
        <p className="text-gray-500 text-sm mt-1">Votre progression, matière par matière.</p>
      </div>
      {!actif ? (
        <EmptyState icone="🎓" titre="Aucun concours associé à votre compte" texte="Contactez l’administration pour être inscrit à un concours." />
      ) : (
        <>
          <SelecteurConcours codes={codes} actif={actif} onChoisir={choisir} />
          <TableauNotesEleve concours={actif} />
          <MesNotes concours={actif} />
        </>
      )}
    </div>
  )
}
