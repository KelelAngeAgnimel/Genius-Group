import { useConcours } from '../../hooks/useConcours'

// Page d'attente : le workflow d'évaluation ENSEA (sujets, dépôt des copies, corrections) arrive ensuite.
export default function EvaluationsEnsea() {
  const { aConcours, estPersonnel } = useConcours()

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#7B4CC9' }}>Outils</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Évaluations ENSEA</h1>
      </div>
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f0ece0' }}>
        {aConcours('ensea') || estPersonnel ? (
          <p className="text-sm text-gray-500">
            Les évaluations ENSEA (Français : résumé et dissertation, et Mathématiques) seront bientôt disponibles ici.
          </p>
        ) : (
          <p className="text-sm text-gray-500">Cette page est réservée aux élèves inscrits au concours ENSEA.</p>
        )}
      </div>
    </div>
  )
}
