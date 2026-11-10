import { useAuth } from '../../context/AuthContext'
import { useConcours } from '../../hooks/useConcours'
import { useConcoursActif } from '../../hooks/useConcoursActif'
import { libelleConcours } from '../../lib/concours'
import SelecteurConcours from '../../components/SelecteurConcours'
import StatistiquesEnsea from './StatistiquesEnsea'

const ANNEE_RESULTATS = 2025

// Résultats d'admissibilité de la session précédente, par concours (valeurs inchangées)
const RESULTATS = {
  esatic: { valeur: '100 %', phrase: 'Taux d’admissibilité des élèves Genius Group à l’ESATIC, session 2025.' },
  inphb: { valeur: '83,33 %', phrase: 'Taux d’admissibilité des élèves Genius Group à l’INP-HB, session 2025.' }
}

// Programme de 3 semaines : ESATIC uniquement
const SEMAINES = [
  { label: 'Semaine 1', titre: 'Maîtrise des aptitudes cognitives', desc: 'Préparation ciblée sur la logique, l’organisation et la rapidité d’attention.' },
  { label: 'Semaine 2', titre: '3 sessions blanches intensives', desc: 'Examens de simulation hebdomadaires pour mesurer la progression en conditions réelles.' },
  { label: 'Semaine 3', titre: 'Score moyen global : 72 %', desc: 'Niveau de maîtrise atteint sur l’ensemble des tests de logique et d’organisation.' }
]

function Carte({ titre, children }) {
  return (
    <section className="bg-white rounded-xl p-5" style={{ border: '1px solid #e5e7eb' }}>
      <h2 className="text-sm font-semibold mb-3" style={{ color: '#071020' }}>{titre}</h2>
      {children}
    </section>
  )
}

function ResultatAdmissibilite({ code }) {
  const r = RESULTATS[code]
  return (
    <Carte titre={`Résultat d’admissibilité — session ${ANNEE_RESULTATS}`}>
      <p className="text-4xl font-bold" style={{ color: '#071020' }}>{r.valeur}</p>
      <p className="text-sm text-gray-600 mt-2">{r.phrase}</p>
    </Carte>
  )
}

function ProgrammeEsatic() {
  return (
    <Carte titre="Programme ESATIC — 3 semaines">
      <ol className="flex flex-col">
        {SEMAINES.map(s => (
          <li key={s.label} className="py-3 border-b last:border-b-0 first:pt-0 last:pb-0" style={{ borderColor: '#f0ece0' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#8A6D1A' }}>{s.label}</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#071020' }}>{s.titre}</p>
            <p className="text-sm text-gray-600 mt-0.5">{s.desc}</p>
          </li>
        ))}
      </ol>
    </Carte>
  )
}

function ContenuConcours({ code, estEtudiant }) {
  if (code === 'esatic') return <div className="flex flex-col gap-4"><ResultatAdmissibilite code="esatic" /><ProgrammeEsatic /></div>
  if (code === 'inphb') return <ResultatAdmissibilite code="inphb" />
  if (code === 'ensea') {
    return (
      <div className="flex flex-col gap-4">
        <Carte titre="Première promotion ENSEA">
          <p className="text-sm text-gray-600">Préparation sur plusieurs mois, pas encore de résultats historiques.</p>
        </Carte>
        {estEtudiant && <StatistiquesEnsea />}
      </div>
    )
  }
  return (
    <Carte titre={libelleConcours(code)}>
      <p className="text-sm text-gray-600">Pas de statistiques publiées pour ce concours.</p>
    </Carte>
  )
}

export default function Statistiques() {
  const { user } = useAuth()
  const { estEtudiant } = useConcours()
  const { codes, actif, choisir } = useConcoursActif()

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>Accueil</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Mes statistiques</h1>
        <p className="text-gray-500 text-sm mt-1">Bilan de préparation — {user?.prenom} {user?.nom}</p>
      </div>

      {!actif ? (
        <p className="text-sm text-gray-600">Aucun concours n’est associé à votre compte. Contactez l’administration pour être inscrit.</p>
      ) : (
        <>
          <SelecteurConcours codes={codes} actif={actif} onChoisir={choisir} />
          <ContenuConcours key={actif} code={actif} estEtudiant={estEtudiant} />
        </>
      )}
    </div>
  )
}
