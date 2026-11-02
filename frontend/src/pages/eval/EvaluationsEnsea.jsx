import { useConcours } from '../../hooks/useConcours'
import VueEleveEnsea from './ensea/VueEleveEnsea'
import VueProfEnsea from './ensea/VueProfEnsea'

// Évaluations papier ENSEA : sujet → copie scannée ou photographiée → correction
export default function EvaluationsEnsea() {
  const { aConcours, estPersonnel } = useConcours()

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#7B4CC9' }}>Outils</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          {estPersonnel ? 'Évaluations ENSEA' : 'Mes évaluations'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {estPersonnel
            ? 'Créez des évaluations, consultez les copies et saisissez les corrections.'
            : 'Téléchargez le sujet, déposez votre copie en photo ou en PDF, puis consultez votre note.'}
        </p>
      </div>

      {estPersonnel ? <VueProfEnsea />
        : aConcours('ensea') ? <VueEleveEnsea />
        : (
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f0ece0' }}>
            <p className="text-sm text-gray-500">Cette page est réservée aux élèves inscrits au concours ENSEA.</p>
          </div>
        )}
    </div>
  )
}
