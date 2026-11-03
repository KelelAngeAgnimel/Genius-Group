import { Navigate, useParams } from 'react-router-dom'
import { useConcours } from '../../hooks/useConcours'
import { concoursVisibles } from '../../lib/evaluations'
import { CODES_CONCOURS, libelleConcours, couleurConcours } from '../../lib/concours'
import Breadcrumb from '../../components/Breadcrumb'
import Evaluations from './Evaluations'
import VueEleveEnsea from './ensea/VueEleveEnsea'
import VueProfEnsea from './ensea/VueProfEnsea'

// /outils/evaluations/:concours — la vue dépend de l'option du concours (generation_auto_tests), pas de son nom
export default function EvaluationsConcours() {
  const { concours: param } = useParams()
  const code = String(param ?? '').toLowerCase()
  const { peutAcceder, generationAutoTests, estPersonnel } = useConcours()

  if (!CODES_CONCOURS.includes(code) || !peutAcceder(code)) return <Navigate to="/outils/evaluations" replace />

  const unique = concoursVisibles(peutAcceder).length === 1
  const sigle = libelleConcours(code)
  // Élève mono-concours : « Évaluations » n'est pas cliquable (le hub le renverrait ici)
  const crumbs = [
    { label: 'Accueil', path: '/accueil' },
    { label: 'Évaluations', path: unique ? undefined : '/outils/evaluations' },
    { label: sigle }
  ]
  const papier = !generationAutoTests(code) // sujet → copie scannée → correction

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <Breadcrumb crumbs={crumbs}
        retourPath={unique ? '/accueil' : '/outils/evaluations'}
        retourLabel={unique ? 'Accueil' : 'Évaluations'} />
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: couleurConcours(code) }}>Évaluations</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          {estPersonnel ? `Évaluations ${sigle}` : `Mes évaluations ${sigle}`}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {papier
            ? (estPersonnel
              ? 'Créez des évaluations, consultez les copies et saisissez les corrections.'
              : 'Téléchargez le sujet, déposez votre copie en photo ou en PDF, puis consultez votre note.')
            : (estPersonnel ? 'Gérez les évaluations publiées' : 'Les évaluations publiées pour ce concours')}
        </p>
      </div>
      {papier
        ? (estPersonnel ? <VueProfEnsea concours={code} /> : <VueEleveEnsea concours={code} />)
        : <Evaluations concours={code} />}
    </div>
  )
}
