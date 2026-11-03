import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useConcours } from '../../hooks/useConcours'
import { useConcoursActif } from '../../hooks/useConcoursActif'
import { viseConcours, libelleConcours } from '../../lib/concours'
import SelecteurConcours from '../../components/SelecteurConcours'
import CarteProfilCompetences from '../../components/CarteProfilCompetences'
import { ouvrirFichierProtege } from '../../lib/fichiers'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'

// recharts est chargé à la demande (module séparé)
const RadarCompetences = lazy(() => import('../../components/Graphiques').then(m => ({ default: m.RadarCompetences })))

const VIOLET = '#7B4CC9'
const formaterDate = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '')

function Barre({ competence }) {
  const { score, provisoire, a_renforcer, seuil } = competence
  const couleur = score === null ? '#e5e7eb' : a_renforcer ? '#C94C7B' : score >= 75 ? '#2a9d7f' : '#C9A84C'
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm text-gray-700"><span className="font-semibold" style={{ color: VIOLET }}>{competence.code}</span> · {competence.libelle}</p>
        <p className="text-xs font-bold whitespace-nowrap" style={{ color: couleur }}>
          {score === null ? 'Pas encore évaluée' : `${Math.round(score)} / 100`}
          {provisoire && <span className="ml-2 font-normal text-gray-500">(provisoire)</span>}
        </p>
      </div>
      <div className="relative h-2 rounded-full mt-1" style={{ background: '#f0ece0' }}>
        {score !== null && <div className="h-2 rounded-full" style={{ width: `${score}%`, background: couleur }} />}
        <div className="absolute top-[-2px] h-3 w-px" style={{ left: `${seuil}%`, background: '#C94C7B' }} title={`Seuil : ${seuil}`} />
      </div>
    </div>
  )
}

// « Mes compétences » : même carte de profil que l'espace professeur (radar et barres par matière, d'après les notes),
// puis, pour les concours qui suivent des compétences détaillées : radar, compétences à renforcer, exercices recommandés
export default function MesCompetences() {
  const { user } = useAuth()
  const { estPersonnel } = useConcours()
  const { codes, actif, choisir } = useConcoursActif()
  const [donnees, setDonnees] = useState(null)
  const [notes, setNotes] = useState(null)
  const [erreur, setErreur] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (estPersonnel) return
    let vivant = true
    api.get('/api/notes/mes-notes')
      .then(res => {
        if (!vivant) return
        if (res.ok) setNotes(res.data.notes ?? [])
        else setErreur(res.data?.message || 'Impossible de charger vos notes')
      })
      .catch(() => vivant && setErreur('Erreur de connexion au serveur'))
    return () => { vivant = false }
  }, [estPersonnel])

  useEffect(() => {
    if (estPersonnel) return
    let vivant = true
    api.get('/api/renforcement/mes-competences')
      .then(res => {
        if (!vivant) return
        if (res.ok) setDonnees(res.data)
        else setErreur(res.data?.message || 'Impossible de charger vos compétences')
      })
      .catch(() => vivant && setErreur('Erreur de connexion au serveur'))
    return () => { vivant = false }
  }, [version, estPersonnel])

  const ouvrir = async (id) => {
    const message = await ouvrirFichierProtege(`/api/renforcement/envoyes/${id}/fichier`)
    if (message) setErreur(message)
  }
  const marquerFait = async (id) => {
    const res = await api.patch(`/api/exercices/${id}/statut`, { statut: 'fait' })
    if (res.ok) setVersion(v => v + 1)
  }

  // Le personnel n'a pas de profil élève : il consulte les élèves depuis l'espace professeur
  if (estPersonnel) return <Navigate to="/outils/difficultes" replace />

  const competences = donnees ? donnees.competences.filter(c => c.concours_code === actif) : []
  const exercices = donnees ? donnees.exercices.filter(e => !e.competence || e.competence.concours_code === actif) : []
  const matieres = [...new Set(competences.map(c => c.matiere))]
  const aRenforcer = competences.filter(c => c.a_renforcer)
  const notesConcours = (notes ?? []).filter(n => viseConcours(n.concours, actif))

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: VIOLET }}>Outils</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Mes compétences</h1>
        <p className="text-gray-500 text-sm mt-1">Votre niveau sur chaque point du programme, d’après vos auto-évaluations et vos notes.</p>
      </div>

      {erreur && <p className="text-sm mb-4" style={{ color: '#C94C7B' }}>{erreur}</p>}
      {!actif ? (
        <EmptyState icone="🎓" titre="Aucun concours associé à votre compte" texte="Contactez l’administration pour être inscrit à un concours." />
      ) : (
      <>
      <SelecteurConcours codes={codes} actif={actif} onChoisir={choisir} />

      <div className="mb-6">
        <CarteProfilCompetences
          nom={`${user?.prenom ?? ''} ${user?.nom || user?.username || ''}`.trim()}
          matricule={[user?.matricule, libelleConcours(actif)].filter(Boolean).join(' — ')}
          notes={notesConcours}
          chargement={notes === null && !erreur} />
      </div>

      {!donnees && !erreur && <Loader texte="Chargement…" />}

      {donnees && competences.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-3" style={{ color: '#071020' }}>Compétences détaillées {libelleConcours(actif)}</h2>
          {aRenforcer.length > 0 && (
            <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(201,76,123,0.08)', border: '1px solid rgba(201,76,123,0.25)' }}>
              <p className="text-sm font-bold" style={{ color: '#a8335c' }}>À renforcer</p>
              <p className="text-xs text-gray-600 mt-1">{aRenforcer.map(c => c.code).join(', ')} — sous le seuil de {aRenforcer[0].seuil} / 100.</p>
            </div>
          )}

          {matieres.map(matiere => {
            const liste = competences.filter(c => c.matiere === matiere)
            const pointsRadar = liste.filter(c => c.score !== null).map(c => ({ nom: c.code, score: Math.round(c.score), seuil: c.seuil }))
            return (
              <div key={matiere} className="bg-white rounded-2xl p-5 mb-5" style={{ border: '1px solid #f0ece0' }}>
                <h2 className="font-bold mb-3" style={{ color: '#071020' }}>{matiere}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    {pointsRadar.length >= 3 ? (
                      <Suspense fallback={<div className="h-[300px] flex items-center justify-center text-xs text-gray-500">Chargement du graphique…</div>}>
                        <RadarCompetences data={pointsRadar} />
                      </Suspense>
                    ) : (
                      <p className="text-xs text-gray-500 py-12 text-center">Le radar apparaît dès que 3 compétences ont un score.</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {liste.map(c => <Barre key={c.id} competence={c} />)}
                  </div>
                </div>
              </div>
            )
          })}

          <p className="text-xs text-gray-500 mb-6">
            Le trait rouge marque le seuil de renforcement. Un score « provisoire » ne repose que sur votre auto-évaluation : il devient définitif
            dès qu’une note est rattachée à la compétence.
          </p>

          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
            <h2 className="font-bold mb-3" style={{ color: '#071020' }}>Exercices recommandés</h2>
            {exercices.length === 0 ? (
              <EmptyState icone="✏️" titre="Aucun exercice pour le moment" />
            ) : (
              <ul className="flex flex-col gap-3">
                {exercices.map(e => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl p-3"
                    style={{ background: e.statut === 'fait' ? '#f8f7f4' : 'rgba(201,168,76,0.06)', border: '1px solid #f0ece0' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#071020' }}>{e.titre}</p>
                      <p className="text-xs text-gray-500">
                        {e.competence ? `${e.competence.code} · ` : ''}envoyé le {formaterDate(e.envoye_le)}
                        {e.statut === 'fait' && ' · fait ✓'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => ouvrir(e.id)} className="text-xs font-bold px-3 py-1.5 rounded-xl"
                        style={{ color: VIOLET, border: `1px solid ${VIOLET}60` }}>Ouvrir</button>
                      {e.statut !== 'fait' && (
                        <button type="button" onClick={() => marquerFait(e.id)} className="text-xs font-bold px-3 py-1.5 rounded-xl text-white" style={{ background: '#4CC9A8' }}>
                          Marquer fait
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
      </>
      )}
    </div>
  )
}
