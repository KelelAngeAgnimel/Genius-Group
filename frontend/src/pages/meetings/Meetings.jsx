import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { useConfirm } from '../../hooks/useUi'
import Loader from '../../components/Loader'
import { useConcours } from '../../hooks/useConcours'

const COULEURS = { or: '#C9A84C', navy: '#071020', vert: '#4CC9A8', rose: '#C94C7B', bleu: '#4C7BC9' }

const concoursConfig = {
  inphb: { label: 'INP-HB', couleur: '#4C7BC9' },
  esatic: { label: 'ESATIC', couleur: '#4CC9A8' },
  cme: { label: 'CME', couleur: '#C97B4C' },
  ensea: { label: 'ENSEA', couleur: '#7B4CC9' },
  both: { label: 'Tous les concours', couleur: '#C9A84C' },
}

// Concours proposables à la publication d'un cours (« both » = visible de tous les élèves)
const OPTIONS_CONCOURS = [
  ['both', 'Tous les concours'],
  ['inphb', 'INP-HB seulement'],
  ['esatic', 'ESATIC seulement'],
  ['cme', 'CME seulement'],
  ['ensea', 'ENSEA seulement'],
]

export default function Meetings() {
  const confirmer = useConfirm()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const peutPublier = user?.role === 'admin' || user?.role === 'professeur'

  const [cours, setCours] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [filtreActive, setFiltreActive] = useState(false)

  // Un professeur rattaché à des concours ne publie que pour les siens (le serveur le vérifie aussi)
  const { concours: miens, estProfesseur } = useConcours()
  const restreint = estProfesseur && miens.length > 0
  const optionsConcours = restreint ? OPTIONS_CONCOURS.filter(([valeur]) => miens.includes(valeur)) : OPTIONS_CONCOURS
  const formVide = { titre: '', prof: '', heure: '', lien: '', concours: restreint ? miens[0] : 'both' }
  const [form, setForm] = useState(formVide)

  const charger = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/meetings')
      const data = res.data
      if (Array.isArray(data)) setCours(data)
      else setErreur(data.error || 'Erreur de chargement')
    } catch {
      setErreur('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { charger() }, [])

  const handleChange = (champ, val) => setForm(f => ({ ...f, [champ]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    setSucces('')
    if (!form.titre.trim() || !form.lien.trim()) {
      setErreur('Le titre et le lien sont obligatoires.')
      return
    }
    try {
      const res = editId
        ? await api.patch(`/api/meetings/${editId}`, form)
        : await api.post('/api/meetings', form)
      const data = res.data
      if (!res.ok) { setErreur(data.error || 'Erreur'); return }
      setSucces(editId ? 'Cours modifié.' : 'Cours publié avec succès.')
      setForm(formVide)
      setEditId(null)
      setShowForm(false)
      charger()
    } catch {
      setErreur('Erreur de connexion au serveur')
    }
  }

  const handleEdit = (c) => {
    setEditId(c.id)
    setForm({ titre: c.titre, prof: c.prof || '', heure: c.heure || '', lien: c.lien || '', concours: c.concours || 'both' })
    setShowForm(true)
    setErreur('')
    setSucces('')
  }

  const handleDelete = async (id) => {
    if (!(await confirmer({ titre: 'Supprimer le cours ?', message: 'Le lien du cours ne sera plus visible des élèves.', confirmer: 'Supprimer', danger: true }))) return
    try {
      await api.delete(`/api/meetings/${id}`)
      if (editId === id) { setForm(formVide); setEditId(null); setShowForm(false) }
      charger()
    } catch {
      setErreur('Erreur lors de la suppression')
    }
  }

  const toggleLive = async (id, currentLive) => {
    try {
      await api.patch(`/api/meetings/${id}`, { live: !currentLive })
      charger()
    } catch {
      setErreur('Erreur lors de la mise à jour')
    }
  }

  const coursAffiches = filtreActive ? cours.filter(c => c.live) : cours

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>Outils</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: COULEURS.navy }}>Cours à distance</h1>
            <p className="text-gray-500 text-sm mt-1">Rejoignez vos cours en ligne selon votre concours</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltreActive(f => !f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              style={{
                background: filtreActive ? COULEURS.navy : 'white',
                color: filtreActive ? COULEURS.or : '#6b7280',
                border: '1px solid #f0ece0'
              }}>
              {filtreActive ? 'En cours seulement' : 'Tous les cours'}
            </button>
            {peutPublier && (
              <button
                onClick={() => { setShowForm(true); setEditId(null); setForm(formVide); setErreur(''); setSucces('') }}
                className="px-4 py-2 rounded-xl text-xs font-bold transition"
                style={{ background: COULEURS.navy, color: COULEURS.or }}>
                + Publier un cours
              </button>
            )}
          </div>
        </div>
      </div>

      {erreur && (
        <div className="text-xs font-semibold p-3 rounded-xl mb-4" style={{ background: `${COULEURS.rose}15`, color: COULEURS.rose, border: `1px solid ${COULEURS.rose}40` }}>
          {erreur}
        </div>
      )}
      {succes && (
        <div className="text-xs font-semibold p-3 rounded-xl mb-4" style={{ background: `${COULEURS.vert}15`, color: COULEURS.vert, border: `1px solid ${COULEURS.vert}40` }}>
          {succes}
        </div>
      )}

      {peutPublier && showForm && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <p className="font-bold text-sm mb-4" style={{ color: COULEURS.navy }}>
            {editId ? 'Modifier le cours' : 'Publier un nouveau cours'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              value={form.titre}
              onChange={e => handleChange('titre', e.target.value)}
              placeholder="Titre du cours *"
              className="text-xs rounded-xl px-3 py-2.5 outline-none"
              style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }}
              aria-label="Titre du cours" />
            <input
              value={form.prof}
              onChange={e => handleChange('prof', e.target.value)}
              placeholder="Nom du professeur"
              className="text-xs rounded-xl px-3 py-2.5 outline-none"
              style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }}
              aria-label="Nom du professeur" />
            <input
              value={form.heure}
              onChange={e => handleChange('heure', e.target.value)}
              placeholder="Heure (ex : 14:00)"
              className="text-xs rounded-xl px-3 py-2.5 outline-none"
              style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }}
              aria-label="Heure (ex : 14:00)" />
            <select aria-label="Concours concerné"
              value={form.concours}
              onChange={e => handleChange('concours', e.target.value)}
              className="text-xs rounded-xl px-3 py-2.5 outline-none"
              style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }}>
              {optionsConcours.map(([valeur, libelle]) => <option key={valeur} value={valeur}>{libelle}</option>)}
            </select>
            <input
              value={form.lien}
              onChange={e => handleChange('lien', e.target.value)}
              placeholder="Lien du cours (Google Meet, Zoom, Teams...) *"
              className="text-xs rounded-xl px-3 py-2.5 outline-none sm:col-span-2"
              style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }}
              aria-label="Lien du cours (Google Meet, Zoom, Teams...)" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl text-xs font-bold transition"
              style={{ background: COULEURS.navy, color: COULEURS.or }}>
              {editId ? 'Enregistrer' : 'Publier'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null); setForm(formVide); setErreur('') }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 transition"
              style={{ background: '#f0ece0' }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <Loader texte="Chargement des cours…" />
      ) : coursAffiches.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm text-gray-500">
            {filtreActive ? 'Aucun cours en cours pour le moment.' : 'Aucun cours publié pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coursAffiches.map(c => (
            <div key={c.id} className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: '#fff', border: `1px solid ${c.live ? COULEURS.vert + '66' : '#f0ece0'}` }}>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{
                    background: `${concoursConfig[c.concours]?.couleur}18`,
                    color: concoursConfig[c.concours]?.couleur,
                    border: `1px solid ${concoursConfig[c.concours]?.couleur}40`
                  }}>
                  {concoursConfig[c.concours]?.label}
                </span>
                {c.live && (
                  <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: COULEURS.vert }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: COULEURS.vert }} />
                    En cours
                  </span>
                )}
              </div>

              <div>
                <p className="font-bold text-sm" style={{ color: COULEURS.navy }}>{c.titre}</p>
                {(c.prof || c.heure) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {c.prof && <span>{c.prof}</span>}
                    {c.prof && c.heure && <span> · </span>}
                    {c.heure && <span>{c.heure}</span>}
                  </p>
                )}
              </div>

              <a
                href={c.lien}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition"
                style={{
                  background: c.live
                    ? `linear-gradient(135deg, ${COULEURS.vert}, #3ab88f)`
                    : COULEURS.navy,
                  color: c.live ? COULEURS.navy : COULEURS.or,
                  textDecoration: 'none'
                }}>
                {c.live ? 'Rejoindre le cours maintenant' : 'Ouvrir le lien du cours'}
              </a>

              {peutPublier && (
                <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: '#f0ece0' }}>
                  <button
                    onClick={() => toggleLive(c.id, c.live)}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-lg transition"
                    style={{
                      background: c.live ? `${COULEURS.rose}15` : `${COULEURS.vert}15`,
                      color: c.live ? COULEURS.rose : COULEURS.vert,
                      border: `1px solid ${c.live ? COULEURS.rose : COULEURS.vert}40`
                    }}>
                    {c.live ? 'Arrêter' : 'Démarrer'}
                  </button>
                  <button
                    onClick={() => handleEdit(c)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    style={{ background: `${COULEURS.bleu}15`, color: COULEURS.bleu, border: `1px solid ${COULEURS.bleu}40` }}>
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    style={{ background: `${COULEURS.rose}15`, color: COULEURS.rose, border: `1px solid ${COULEURS.rose}40` }}>
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}