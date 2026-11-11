import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { libelleContenu as labelConcours, codesDepuisContenu } from '../../lib/concours'
import api from '../../api'
import { useToast, useConfirm } from '../../hooks/useUi'
import Loader from '../../components/Loader'
import LecteurPDF from '../../components/LecteurPDF'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icone'

const COULEURS = { or: '#C9A84C', rose: '#C94C7B', navy: '#071020' }

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
                background: matiere === m ? COULEURS.navy : '#fff',
                color: matiere === m ? COULEURS.or : '#6b7280',
                border: `1px solid ${matiere === m ? COULEURS.navy : '#e5e7eb'}`
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
        <div className="rounded-2xl bg-white" style={{ border: '1px solid #e5e7eb' }}>
          <EmptyState titre="Aucune évaluation disponible" texte="Vos enseignants n'ont pas encore publié d'évaluation pour vos concours." />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {liste.map((ev, i) => (
            <div key={i}
              className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-colors hover:border-gray-400"
              style={{ border: '1px solid #e5e7eb' }}
              onClick={() => setOuverte(ev)}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-gray-500"
                style={{ background: '#f3f4f6' }}>
                <Icon name="fileText" className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-800">{ev.titre}</p>
                {ev.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{ev.description}</p>}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#f3f4f6', color: '#8A6D1A' }}>{ev.matiere}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#f3f4f6', color: '#4b5563' }}>{labelConcours(ev.concours)}</span>
                  {ev.professeur && <span className="text-xs text-gray-500">Par {ev.professeur.prenom || ev.professeur.username}</span>}
                  <span className="text-xs text-gray-500">{new Date(ev.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-2 rounded-xl flex-shrink-0"
                style={{ color: COULEURS.navy, border: '1px solid #d1d5db' }}>
                Ouvrir
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

      <div className="rounded-2xl p-4 mb-5" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
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
        <div className="rounded-2xl bg-white" style={{ border: '1px solid #e5e7eb' }}>
          <EmptyState titre="Aucune évaluation publiée pour le moment" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evaluations.map((ev, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs tracking-widest uppercase" style={{ color: '#8A6D1A' }}>{ev.matiere}</span>
                {!ev.visible && (
                  <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '10px', background: `${COULEURS.rose}1A`, color: COULEURS.rose }}>Masquée</span>
                )}
              </div>
              <p className="font-bold text-sm" style={{ color: COULEURS.navy }}>{ev.titre}</p>
              {ev.description && <p className="text-xs text-gray-500 mt-0.5">{ev.description}</p>}
              <p className="text-xs mt-1 flex items-start gap-1.5 text-gray-500">
                <Icon name="users" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Visible par : {labelConcours(ev.concours)}</span>
              </p>
              {role === 'admin' && ev.professeur && (
                <p className="text-xs text-gray-500 mt-1">Publiée par {ev.professeur.prenom || ev.professeur.username}</p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button onClick={() => setOuverte(ev)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ color: COULEURS.navy, border: '1px solid #d1d5db' }}>
                  Ouvrir
                </button>
                <button onClick={() => basculerVisibilite(ev)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ color: COULEURS.navy, border: '1px solid #d1d5db' }}>
                  {!ev.visible ? 'Démasquer' : 'Masquer'}
                </button>
                <button onClick={() => supprimer(ev)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ color: COULEURS.rose, border: `1px solid ${COULEURS.rose}66` }}>
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
