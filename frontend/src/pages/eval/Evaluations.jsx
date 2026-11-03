import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { libelleContenu as labelConcours, codesDepuisContenu } from '../../lib/concours'
import api from '../../api'
import { useToast, useConfirm } from '../../hooks/useUi'
import Loader from '../../components/Loader'
import LecteurPDF from '../../components/LecteurPDF'
import EmptyState from '../../components/EmptyState'

const COULEURS = { or: '#C9A84C', bleu: '#4C7BC9', vert: '#4CC9A8', rose: '#C94C7B', navy: '#071020', violet: '#7B4CC9' }

// ══════════════════════════════════════════
// VUE ÉTUDIANT — évaluations filtrées par son concours
// ══════════════════════════════════════════
function VueEtudiant({ concours }) {
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [matiere, setMatiere] = useState('toutes')
  const [ouverte, setOuverte] = useState(null)

  useEffect(() => {
    const charger = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/api/ressources/evaluations?concours=${concours}`)
        const data = res.data
        if (data.ressources) setEvaluations(data.ressources)
        else setErreur('Erreur lors du chargement')
      } catch { setErreur('Erreur serveur') }
      finally { setLoading(false) }
    }
    charger()
  }, [concours])

  const matieres = ['toutes', ...Array.from(new Set(evaluations.map(e => e.matiere).filter(Boolean)))]
  const liste = matiere === 'toutes' ? evaluations : evaluations.filter(e => e.matiere === matiere)

  return (
    <div>
      {ouverte && <LecteurPDF ressource={ouverte} onFermer={() => setOuverte(null)} nature="évaluation" />}

      {matieres.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {matieres.map(m => (
            <button key={m} onClick={() => setMatiere(m)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition"
              style={{
                background: matiere === m ? `linear-gradient(135deg, #b8891e, ${COULEURS.or})` : '#fff',
                color: matiere === m ? COULEURS.navy : '#9ca3af',
                border: `1px solid ${matiere === m ? COULEURS.or : '#f0ece0'}`
              }}>
              {m === 'toutes' ? 'Toutes les matières' : m}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Loader texte="Chargement…" />
      ) : erreur ? (
        <p className="text-xs text-center py-10" style={{ color: COULEURS.rose }}>{erreur}</p>
      ) : liste.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <p className="text-3xl mb-3">📭</p>
          <p className="text-sm font-semibold text-gray-500">Aucune évaluation disponible</p>
          <p className="text-xs text-gray-500 mt-1">Vos enseignants n'ont pas encore publié d'évaluation pour vos concours.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {liste.map((ev, i) => (
            <div key={i}
              className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all hover:shadow-lg"
              style={{ border: '1px solid #f0ece0' }}
              onClick={() => setOuverte(ev)}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: `${COULEURS.rose}15` }}>
                📝
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-800">{ev.titre}</p>
                {ev.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{ev.description}</p>}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${COULEURS.or}15`, color: '#b8891e' }}>{ev.matiere}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${COULEURS.bleu}15`, color: COULEURS.bleu }}>{labelConcours(ev.concours)}</span>
                  {ev.professeur && <span className="text-xs text-gray-500">Par {ev.professeur.prenom || ev.professeur.username}</span>}
                  <span className="text-xs text-gray-500">{new Date(ev.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
                Ouvrir →
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// VUE PROF / ADMIN — gestion des évaluations
// (le prof ne voit que les siennes, l'admin voit tout)
// ══════════════════════════════════════════
function VueProf({ role, concours }) {
  const toast = useToast()
  const confirmer = useConfirm()
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [ouverte, setOuverte] = useState(null)

  const charger = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/ressources/evaluations/gestion')
      const data = res.data
      if (data.ressources) {
        setEvaluations(data.ressources.filter(r => {
          const cibles = codesDepuisContenu(r.concours)
          return cibles === null || cibles.includes(concours)
        }))
      } else setErreur(data.message || 'Erreur lors du chargement')
    } catch { setErreur('Erreur serveur') }
    finally { setLoading(false) }
  }

  useEffect(() => { charger() }, [concours])

  const basculerVisibilite = async (ev) => {
    try {
      const res = await api.patch(`/api/ressources/${ev.id}/visibilite`, { visible: !ev.visible })
      if (res.ok) setEvaluations(prev => prev.map(x => x.id === ev.id ? { ...x, visible: !ev.visible } : x))
      else { const d = res.data ?? {}; toast.erreur(d.message || 'Action impossible') }
    } catch { toast.erreur('Erreur réseau') }
  }

  const supprimer = async (ev) => {
    if (!(await confirmer({ titre: 'Supprimer l’évaluation ?', message: 'Cette action est définitive.', confirmer: 'Supprimer', danger: true }))) return
    try {
      const res = await api.delete(`/api/ressources/${ev.id}`)
      if (res.ok) setEvaluations(prev => prev.filter(x => x.id !== ev.id))
      else { const d = res.data ?? {}; toast.erreur(d.message || 'Suppression impossible') }
    } catch { toast.erreur('Erreur réseau') }
  }

  return (
    <div>
      {ouverte && <LecteurPDF ressource={ouverte} onFermer={() => setOuverte(null)} nature="évaluation" />}

      <div className="rounded-2xl p-4 mb-5 flex items-start gap-3" style={{ background: `${COULEURS.or}0F`, border: `1px solid ${COULEURS.or}33` }}>
        <span className="text-lg">💡</span>
        <p className="text-xs text-gray-600">
          Pour ajouter une évaluation, allez dans <span className="font-semibold" style={{ color: '#b8891e' }}>Enseignant → Publier une ressource</span> et activez l'option
          <span className="font-semibold"> « Cette ressource est une évaluation »</span>. Elle apparaîtra ici et sera visible par les élèves selon le concours ciblé.
          {role !== 'admin' && ' Vous ne voyez que vos propres évaluations.'}
        </p>
      </div>

      {loading ? (
        <Loader texte="Chargement…" />
      ) : erreur ? (
        <p className="text-xs text-center py-10" style={{ color: COULEURS.rose }}>{erreur}</p>
      ) : evaluations.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <p className="text-3xl mb-2">📭</p>
          <EmptyState icone="📝" titre="Aucune évaluation publiée pour le moment" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evaluations.map((ev, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs tracking-widest uppercase" style={{ color: '#8A6D1A' }}>{ev.matiere}</span>
                {!ev.visible && (
                  <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '10px', background: `${COULEURS.rose}1A`, color: COULEURS.rose }}>🚫 Masquée</span>
                )}
              </div>
              <p className="font-bold text-sm" style={{ color: COULEURS.navy }}>{ev.titre}</p>
              {ev.description && <p className="text-xs text-gray-500 mt-0.5">{ev.description}</p>}
              <p className="text-xs mt-1 flex items-start gap-1" style={{ color: COULEURS.bleu }}>
                <span>👥</span>
                <span>Visible par : {labelConcours(ev.concours)}</span>
              </p>
              {role === 'admin' && ev.professeur && (
                <p className="text-xs text-gray-500 mt-1">Publiée par {ev.professeur.prenom || ev.professeur.username}</p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button onClick={() => setOuverte(ev)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: `${COULEURS.bleu}1A`, color: COULEURS.bleu, border: `1px solid ${COULEURS.bleu}4D` }}>
                  Ouvrir
                </button>
                <button onClick={() => basculerVisibilite(ev)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={!ev.visible
                    ? { background: `${COULEURS.vert}1A`, color: COULEURS.vert, border: `1px solid ${COULEURS.vert}4D` }
                    : { background: 'rgba(230,150,40,0.12)', color: '#C97B1A', border: '1px solid rgba(230,150,40,0.3)' }}>
                  {!ev.visible ? 'Démasquer' : 'Masquer'}
                </button>
                <button onClick={() => supprimer(ev)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: `${COULEURS.rose}1A`, color: COULEURS.rose, border: `1px solid ${COULEURS.rose}4D` }}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// LISTE D'UN CONCOURS (évaluations PDF) — l'en-tête et le fil d'Ariane sont dans EvaluationsConcours
// ══════════════════════════════════════════
export default function Evaluations({ concours }) {
  const { user } = useAuth()
  const isProfOrAdmin = ['professeur', 'admin'].includes(user?.role)
  return isProfOrAdmin ? <VueProf role={user?.role} concours={concours} /> : <VueEtudiant concours={concours} />
}
