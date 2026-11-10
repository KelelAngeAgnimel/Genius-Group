import { useEffect, useState } from 'react'
import api from '../../api'
import { viseConcours } from '../../lib/concours'
import { cleMatiere, profilDepuisNotes } from '../../lib/profil'
import Loader from '../../components/Loader'

const MATIERES = ['Français', 'Mathématiques']

// Une ligne « libellé — valeur » ; `vide` s'affiche en gris quand il n'y a rien à montrer
function Ligne({ libelle, valeur, vide }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b last:border-b-0" style={{ borderColor: '#f0ece0' }}>
      <p className="text-sm text-gray-700">{libelle}</p>
      {valeur != null
        ? <p className="text-sm font-semibold whitespace-nowrap" style={{ color: '#071020' }}>{valeur}</p>
        : <p className="text-xs text-gray-500">{vide}</p>}
    </div>
  )
}

function Bloc({ titre, children }) {
  return (
    <section className="bg-white rounded-xl p-5" style={{ border: '1px solid #e5e7eb' }}>
      <h3 className="text-sm font-semibold mb-1" style={{ color: '#071020' }}>{titre}</h3>
      {children}
    </section>
  )
}

// Statistiques personnelles ENSEA, tirées des endpoints existants (notes, évaluations, auto-évaluations, compétences)
export default function StatistiquesEnsea() {
  const [donnees, setDonnees] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let vivant = true
    const charger = (url) => api.get(url).then(r => (r.ok ? r.data : null)).catch(() => null)
    Promise.all([
      charger('/api/notes/mes-notes'),
      charger('/api/evaluations/mes'),
      charger('/api/auto-eval/en-attente'),
      charger('/api/renforcement/mes-competences')
    ]).then(([notes, evaluations, autoEval, competences]) => {
      if (!vivant) return
      if (!notes && !evaluations && !autoEval && !competences) setErreur('Impossible de charger vos statistiques pour le moment.')
      setDonnees({ notes, evaluations, autoEval, competences })
    })
    return () => { vivant = false }
  }, [])

  if (!donnees) return <Loader texte="Chargement…" />

  const notes = (donnees.notes?.notes ?? []).filter(n => viseConcours(n.concours, 'ensea'))
  const { matieres } = profilDepuisNotes(notes)
  const moyenneMatiere = (nom) => matieres.find(m => m.cle === cleMatiere(nom))

  const evals = (donnees.evaluations?.evaluations ?? []).filter(e => e.concours_code === 'ensea')
  const corrigees = evals.filter(e => e.etat === 'corrigee').length
  const rendues = evals.filter(e => e.etat === 'deposee' || e.etat === 'corrigee').length

  const bilan = donnees.autoEval?.bilan?.ensea
  const tauxAuto = bilan && bilan.terminees > 0 ? Math.round((bilan.remplies / bilan.terminees) * 100) : null

  const comps = (donnees.competences?.competences ?? []).filter(c => c.concours_code === 'ensea')
  const evaluees = comps.filter(c => c.score !== null)
  const scoreMoyen = evaluees.length ? Math.round(evaluees.reduce((s, c) => s + c.score, 0) / evaluees.length) : null
  const aRenforcer = comps.filter(c => c.a_renforcer).length

  return (
    <div className="flex flex-col gap-4">
      {erreur && <p className="text-sm" style={{ color: '#a8335c' }}>{erreur}</p>}

      <Bloc titre="Moyennes par matière">
        {MATIERES.map(nom => {
          const m = moyenneMatiere(nom)
          return (
            <Ligne key={nom} libelle={nom}
              valeur={m ? `${m.moyenne.toFixed(1)} / 20 (${m.nb} note${m.nb > 1 ? 's' : ''})` : null}
              vide="Aucune note pour l’instant" />
          )
        })}
      </Bloc>

      <Bloc titre="Évaluations">
        {evals.length === 0 ? (
          <p className="text-xs text-gray-500 pt-2">Aucune évaluation proposée pour l’instant.</p>
        ) : (
          <>
            <Ligne libelle="Copies rendues" valeur={`${rendues} sur ${evals.length}`} />
            <Ligne libelle="Copies corrigées" valeur={`${corrigees} sur ${rendues}`} vide="" />
          </>
        )}
      </Bloc>

      <Bloc titre="Auto-évaluations">
        {tauxAuto === null ? (
          <p className="text-xs text-gray-500 pt-2">Aucune séance terminée à auto-évaluer pour l’instant.</p>
        ) : (
          <Ligne libelle="Séances auto-évaluées" valeur={`${bilan.remplies} sur ${bilan.terminees} (${tauxAuto} %)`} />
        )}
      </Bloc>

      <Bloc titre="Compétences">
        {evaluees.length === 0 ? (
          <p className="text-xs text-gray-500 pt-2">Aucune compétence évaluée pour l’instant.</p>
        ) : (
          <>
            <Ligne libelle="Compétences évaluées" valeur={`${evaluees.length} sur ${comps.length}`} />
            <Ligne libelle="Score moyen" valeur={`${scoreMoyen} / 100`} />
            <Ligne libelle="À renforcer" valeur={aRenforcer ? `${aRenforcer}` : 'Aucune'} />
          </>
        )}
      </Bloc>
    </div>
  )
}
