import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { useConcours } from '../hooks/useConcours'
import Etoiles from './Etoiles'

const VIOLET = '#7B4CC9'
const CLE_REPORT = 'autoeval_reportee'

const formaterDate = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

// Une séance à auto-évaluer : une ligne d'étoiles par compétence abordée
function CarteSeance({ element, onFait }) {
  const { seance, competences } = element
  const [niveaux, setNiveaux] = useState({})   // competence_id -> 0..5
  const [commentaire, setCommentaire] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const restantes = competences.filter(c => c.niveau === null)
  const complet = restantes.every(c => niveaux[c.id] !== undefined)

  const envoyer = async () => {
    setEnvoi(true)
    setErreur('')
    try {
      const reponses = restantes.map((c, i) => ({
        competence_id: c.id, niveau: niveaux[c.id], ...(i === 0 && commentaire.trim() ? { commentaire: commentaire.trim() } : {})
      }))
      const res = await api.post('/api/auto-eval', { seance_id: seance.id, reponses })
      if (!res.ok) return setErreur(res.data?.message || 'Enregistrement impossible')
      onFait()
    } catch {
      setErreur('Erreur réseau : réessayez.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: '#f8f7f4', border: '1px solid #f0ece0' }}>
      <p className="font-bold text-sm" style={{ color: '#071020' }}>{seance.titre}</p>
      <p className="text-xs text-gray-400 mb-3">Séance du {formaterDate(seance.debut)}</p>
      <p className="text-xs text-gray-500 mb-3">Dans quelle mesure maîtrisez-vous chaque point abordé ? (0 = pas du tout, 5 = parfaitement)</p>

      <div className="flex flex-col gap-3">
        {restantes.map(c => (
          <div key={c.id} className="bg-white rounded-xl p-3" style={{ border: '1px solid #f0ece0' }}>
            <p className="text-xs font-semibold text-gray-700 mb-1">
              <span style={{ color: VIOLET }}>{c.code}</span> · {c.libelle}
            </p>
            <Etoiles value={niveaux[c.id] ?? null} onChange={n => setNiveaux(prev => ({ ...prev, [c.id]: n }))} />
          </div>
        ))}
      </div>

      <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={2} maxLength={1000}
        placeholder="Un commentaire pour votre professeur ? (facultatif)"
        className="w-full text-sm rounded-xl px-3 py-2 mt-3 outline-none bg-white" style={{ border: '1px solid #e8e4da' }} />

      {erreur && <p className="text-xs mt-2" style={{ color: '#C94C7B' }}>{erreur}</p>}
      <button type="button" onClick={envoyer} disabled={!complet || envoi}
        className="mt-3 text-xs font-bold px-4 py-2 rounded-xl text-white disabled:opacity-40" style={{ background: VIOLET }}>
        {envoi ? 'Envoi…' : 'Enregistrer mon auto-évaluation'}
      </button>
    </div>
  )
}

// Monté dans le Layout : fenêtre d'auto-évaluation post-séance pour les élèves.
//  - en attente : la fenêtre s'ouvre, on peut la fermer (bandeau de rappel conservé)
//  - rappel (24 h) : bandeau plus insistant
//  - verrouillé (48 h, si bloquante) : fenêtre impossible à fermer, cours et ressources inaccessibles
export default function AutoEvaluation() {
  const { token } = useAuth()
  const { estEtudiant } = useConcours()
  const [etat, setEtat] = useState({ en_attente: [], rappel: false, verrouille: false })
  const [ouverte, setOuverte] = useState(false)

  const [version, setVersion] = useState(0) // incrémenté après un envoi pour recharger la liste
  const charger = () => setVersion(v => v + 1)

  useEffect(() => {
    if (!token || !estEtudiant) return
    let actif = true
    api.get('/api/auto-eval/en-attente')
      .then(res => {
        if (!actif || !res.ok) return
        setEtat(res.data)
        setOuverte(res.data.verrouille || (res.data.en_attente.length > 0 && !sessionStorage.getItem(CLE_REPORT)))
      })
      .catch(() => { /* silencieux : la fenêtre n'est qu'une aide, jamais bloquante en cas de panne réseau */ })
    return () => { actif = false }
  }, [token, estEtudiant, version])

  if (!estEtudiant || etat.en_attente.length === 0) return null

  const fermer = () => { sessionStorage.setItem(CLE_REPORT, '1'); setOuverte(false) }

  return (
    <>
      {!ouverte && (
        <div className="px-4 py-2 text-sm flex flex-wrap items-center justify-between gap-2"
          style={{ background: etat.rappel ? 'rgba(201,76,123,0.12)' : 'rgba(201,168,76,0.15)', color: etat.rappel ? '#a8335c' : '#7a5f12' }}>
          <span>
            {etat.rappel ? '⏰ Rappel : ' : ''}vous avez {etat.en_attente.length} auto-évaluation{etat.en_attente.length > 1 ? 's' : ''} à remplir.
          </span>
          <button type="button" onClick={() => setOuverte(true)} className="text-xs font-bold underline">Remplir maintenant</button>
        </div>
      )}

      {ouverte && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(7,16,32,0.6)' }}
          role="dialog" aria-modal="true" aria-label="Auto-évaluation">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="font-bold text-lg" style={{ color: '#071020' }}>Votre auto-évaluation</h2>
                {etat.verrouille ? (
                  <p className="text-xs mt-1" style={{ color: '#C94C7B' }}>
                    Le délai est dépassé : l’accès aux cours et aux ressources ENSEA est suspendu jusqu’à ce que vous l’ayez remplie.
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    {etat.rappel ? 'Pensez à la remplir : l’accès aux cours sera suspendu passé le délai.' : 'Quelques secondes suffisent.'}
                  </p>
                )}
              </div>
              {!etat.verrouille && (
                <button type="button" onClick={fermer} className="text-xs font-semibold text-gray-400 shrink-0">Plus tard</button>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {etat.en_attente.map(e => <CarteSeance key={e.seance.id} element={e} onFait={charger} />)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
