import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import api from '../../api'
import { useConcours } from '../../hooks/useConcours'
import { concoursVisibles } from '../../lib/evaluations'
import Breadcrumb from '../../components/Breadcrumb'
import CarteConcoursBanniere from '../../components/CarteConcoursBanniere'
import GrilleConcours from '../../components/GrilleConcours'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'

const CRUMBS = [{ label: 'Accueil', path: '/accueil' }, { label: 'Évaluations' }]

// /outils/evaluations — une carte par concours accessible
export default function EvaluationsHub() {
  const navigate = useNavigate()
  const { peutAcceder, estPersonnel, generationAutoTests } = useConcours()
  const codes = concoursVisibles(peutAcceder)
  const [resume, setResume] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (codes.length <= 1) return
    let actif = true
    api.get('/api/evaluations/resume')
      .then(res => {
        if (!actif) return
        if (res.ok) setResume(Object.fromEntries(res.data.concours.map(c => [c.code, c])))
        else setErreur('Impossible de charger le détail des évaluations')
      })
      .catch(() => actif && setErreur('Erreur de connexion au serveur'))
    return () => { actif = false }
  }, [codes.length])

  // Un seul concours : on saute le choix
  if (codes.length === 1) return <Navigate to={`/outils/evaluations/${codes[0]}`} replace />

  const badges = (code) => {
    const r = resume?.[code]
    if (!r) return []
    const liste = []
    if (estPersonnel || (r.a_faire === 0 && r.total > 0 && !r.a_rendre)) liste.push({ texte: `${r.total} évaluation${r.total > 1 ? 's' : ''}` })
    else if (r.a_faire > 0) liste.push({ texte: `${r.a_faire} à faire` })
    if (r.a_rendre > 0) liste.push({ texte: `${r.a_rendre} à rendre`, alerte: true })
    return liste
  }

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <Breadcrumb crumbs={CRUMBS} retourPath="/accueil" retourLabel="Accueil" />
      <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>Mes évaluations</p>
      <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Évaluations</h1>
      <p className="text-gray-500 text-sm mt-1 mb-6">
        {estPersonnel ? 'Choisissez un concours pour gérer ses évaluations' : 'Choisissez votre concours'}
      </p>

      {erreur && <p className="text-xs mb-4" style={{ color: '#C94C7B' }}>{erreur}</p>}
      {codes.length === 0 ? (
        <EmptyState titre="Aucun concours associé à votre compte" texte="Contactez l’administration pour être inscrit à un concours." />
      ) : !resume && !erreur ? (
        <Loader texte="Chargement…" />
      ) : (
        <GrilleConcours>
          {codes.map(code => (
            <CarteConcoursBanniere key={code} code={code} badges={badges(code)} action="Accéder"
              sousTitre={generationAutoTests(code) ? 'Évaluations publiées par vos enseignants' : 'Sujet, copie scannée et correction'}
              onClick={() => navigate(`/outils/evaluations/${code}`)} />
          ))}
        </GrilleConcours>
      )}
    </div>
  )
}
