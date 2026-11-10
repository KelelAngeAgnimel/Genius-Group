import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../../api'
import { libelleUtilisateur, libelleConcours, viseConcours } from '../../lib/concours'
import { useConcoursActif } from '../../hooks/useConcoursActif'
import SelecteurConcours from '../../components/SelecteurConcours'
import { ouvrirFichierProtege } from '../../lib/fichiers'
import Loader from '../../components/Loader'
import CarteProfilCompetences from '../../components/CarteProfilCompetences'

// ========================
// VUE ÉTUDIANT
// ========================
function VueEtudiant({ user }) {
  const { codes, actif, choisir } = useConcoursActif()
  const [notes, setNotes] = useState([])
  const [exercices, setExercices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const charger = async () => {
      try {
        const [notesRes, exRes] = await Promise.all([
          api.get('/api/notes/mes-notes'),
          api.get('/api/exercices/recus'),
        ])
        const notesData = notesRes.data
        const exData = exRes.data
        if (notesData.notes) setNotes(notesData.notes)
        if (exData.exercices) setExercices(exData.exercices)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    charger()
  }, [])

  const marquerFait = async (id) => {
    try {
      await api.patch(`/api/exercices/${id}/statut`, { statut: 'fait' })
      setExercices(prev => prev.map(e => e.id === id ? { ...e, statut: 'fait' } : e))
    } catch (err) { console.error(err) }
  }

  const exercicesEnAttente = exercices.filter(e => e.statut !== 'fait').length

  return (
    <div>
      <SelecteurConcours codes={codes} actif={actif} onChoisir={choisir} />
      <div className="mb-6">
        {/* Notes du concours choisi seulement : la moyenne et le radar ne mélangent pas les concours */}
        <CarteProfilCompetences
          nom={`${user?.prenom ?? ''} ${user?.nom || user?.username || ''}`.trim()}
          matricule={[user?.matricule, actif ? libelleConcours(actif) : libelleUtilisateur(user)].filter(Boolean).join(' — ')}
          notes={actif ? notes.filter(n => viseConcours(n.concours, actif)) : notes}
          chargement={loading} />
      </div>

      {/* EXERCICES REÇUS */}
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>Exercices</p>
            <h2 className="font-bold text-base" style={{ color: '#071020' }}>Exercices assignés par vos professeurs</h2>
          </div>
          {exercicesEnAttente > 0 && (
            <span className="text-xs px-2 py-1 rounded-full font-bold"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
              {exercicesEnAttente} en attente
            </span>
          )}
        </div>
        {loading ? (
          <Loader texte="Chargement…" />
        ) : exercices.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">Aucun exercice assigné pour le moment</p>
        ) : (
          <div className="flex flex-col gap-3">
            {exercices.map((ex, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: ex.statut === 'fait' ? '#f8f7f4' : 'rgba(201,168,76,0.04)',
                  border: `1px solid ${ex.statut === 'fait' ? '#f0ece0' : 'rgba(201,168,76,0.2)'}`,
                  opacity: ex.statut === 'fait' ? 0.7 : 1
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: ex.statut === 'fait' ? '#4CC9A8' : '#C9A84C' }}>
                  {ex.statut === 'fait' ? '✓' : '!'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: '#071020' }}>{ex.titre}</p>
                  <p className="text-xs text-gray-500">{ex.matiere} — De : {ex.professeur_nom || 'Professeur'}</p>
                  {ex.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{ex.description}</p>}
                </div>
                {ex.renforcement_id && (
                  <button onClick={() => ouvrirFichierProtege(`/api/renforcement/envoyes/${ex.id}/fichier`)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(76,123,201,0.1)', color: '#4C7BC9', border: '1px solid rgba(76,123,201,0.3)' }}>
                    Fichier
                  </button>
                )}
                {ex.url_fichier && (
                  <a href={ex.url_fichier} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(76,123,201,0.1)', color: '#4C7BC9', border: '1px solid rgba(76,123,201,0.3)' }}>
                    Fichier
                  </a>
                )}
                {ex.statut !== 'fait' && (
                  <button onClick={() => marquerFait(ex.id)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(76,201,168,0.1)', color: '#4CC9A8', border: '1px solid rgba(76,201,168,0.3)' }}>
                    Marquer fait
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ========================
// VUE PROFESSEUR / ADMIN
// ========================
function VueProfesseur() {
  const [etudiants, setEtudiants] = useState([])
  const [etudiantSelectionne, setEtudiantSelectionne] = useState(null)
  const [notesEtudiant, setNotesEtudiant] = useState([])
  const [exercicesEnvoyes, setExercicesEnvoyes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [envoi, setEnvoi] = useState({ titre: '', matiere: '', description: '', url_fichier: '' })
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const charger = async () => {
      try {
        const [usersRes, exRes] = await Promise.all([
          api.get('/api/users/all'),
          api.get('/api/exercices/envoyes'),
        ])
        const usersData = usersRes.data
        const exData = exRes.data
        if (usersData.users) setEtudiants(usersData.users.filter(u => u.role.startsWith('etudiant')))
        if (exData.exercices) setExercicesEnvoyes(exData.exercices)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    charger()
  }, [])

  const selectionnerEtudiant = async (etudiant) => {
    setEtudiantSelectionne(etudiant)
    setLoadingNotes(true)
    try {
      const res = await api.get(`/api/notes/etudiant/${etudiant.id}`)
      const data = res.data
      if (data.notes) setNotesEtudiant(data.notes)
      else setNotesEtudiant([])
    } catch (err) { console.error(err); setNotesEtudiant([]) }
    finally { setLoadingNotes(false) }
  }

  const envoyerExercice = async () => {
    if (!etudiantSelectionne || !envoi.titre || !envoi.matiere) return
    setSending(true)
    try {
      await api.post('/api/exercices', { ...envoi, etudiant_id: etudiantSelectionne.id })
      setSuccess(true)
      setEnvoi({ titre: '', matiere: '', description: '', url_fichier: '' })
      const exRes = await api.get('/api/exercices/envoyes')
      const exData = exRes.data
      if (exData.exercices) setExercicesEnvoyes(exData.exercices)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* LISTE ÉTUDIANTS */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>Sélection</p>
          <p className="font-bold text-sm mb-4" style={{ color: '#071020' }}>Choisir un étudiant</p>
          {loading ? (
            <Loader texte="Chargement…" />
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '400px' }}>
              {etudiants.map((e, i) => (
                <div key={i}
                  onClick={() => selectionnerEtudiant(e)}
                  className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition"
                  style={{
                    background: etudiantSelectionne?.id === e.id ? 'rgba(201,168,76,0.08)' : '#fafafa',
                    border: `1px solid ${etudiantSelectionne?.id === e.id ? 'rgba(201,168,76,0.4)' : '#f0ece0'}`
                  }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: '#071020' }}>
                    {e.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: '#071020' }}>
                      {e.prenom || ''} {e.nom || e.username}
                    </p>
                    <p className="text-xs text-gray-400">{libelleUtilisateur(e)}</p>
                  </div>
                  {etudiantSelectionne?.id === e.id && (
                    <div className="w-2 h-2 rounded-full" style={{ background: '#C9A84C' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PROFIL ÉTUDIANT SÉLECTIONNÉ */}
        <div className="md:col-span-2 flex flex-col gap-4">

          {!etudiantSelectionne ? (
            <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full"
              style={{ background: '#071020', border: '1px solid rgba(201,168,76,0.2)' }}>
              <p className="text-4xl mb-3">👈</p>
              <p className="text-sm font-bold text-white mb-1">Sélectionnez un étudiant</p>
              <p className="text-xs text-gray-400">Cliquez sur un étudiant pour voir son profil et lui assigner un exercice</p>
            </div>
          ) : (
            <>
              {/* PROFIL + RADAR (même carte que côté élève) */}
              <CarteProfilCompetences
                nom={`${etudiantSelectionne.prenom ?? ''} ${etudiantSelectionne.nom || etudiantSelectionne.username || ''}`.trim()}
                matricule={etudiantSelectionne.matricule}
                notes={notesEtudiant}
                chargement={loadingNotes} />

              {/* FORMULAIRE EXERCICE */}
              <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>Assigner</p>
                <p className="font-bold text-sm mb-4" style={{ color: '#071020' }}>
                  Envoyer un exercice à {etudiantSelectionne.prenom || etudiantSelectionne.username}
                </p>

                {success && (
                  <div className="mb-3 p-3 rounded-xl text-xs font-semibold text-center"
                    style={{ background: 'rgba(76,201,168,0.1)', color: '#4CC9A8', border: '1px solid rgba(76,201,168,0.3)' }}>
                    ✓ Exercice envoyé avec succès !
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Titre *</label>
                    <input
                      value={envoi.titre}
                      onChange={e => setEnvoi(p => ({ ...p, titre: e.target.value }))}
                      placeholder="Ex: Série d'exercices logique"
                      className="w-full text-xs rounded-xl px-3 py-2 outline-none"
                      style={{ background: '#f8f7f4', border: '1px solid #e8e4da', color: '#071020' }}
                      aria-label="Titre" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Matière *</label>
                    <input
                      value={envoi.matiere}
                      onChange={e => setEnvoi(p => ({ ...p, matiere: e.target.value }))}
                      placeholder="Ex: Mathématiques"
                      className="w-full text-xs rounded-xl px-3 py-2 outline-none"
                      style={{ background: '#f8f7f4', border: '1px solid #e8e4da', color: '#071020' }}
                      aria-label="Matière" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-gray-400 mb-1 block">Description</label>
                  <textarea
                    value={envoi.description}
                    onChange={e => setEnvoi(p => ({ ...p, description: e.target.value }))}
                    placeholder="Instructions, consignes..."
                    rows={2}
                    className="w-full text-xs rounded-xl px-3 py-2 outline-none resize-none"
                    style={{ background: '#f8f7f4', border: '1px solid #e8e4da', color: '#071020' }}
                    aria-label="Description" />
                </div>
                <div className="mb-4">
                  <label className="text-xs text-gray-400 mb-1 block">Lien fichier (optionnel)</label>
                  <input
                    value={envoi.url_fichier}
                    onChange={e => setEnvoi(p => ({ ...p, url_fichier: e.target.value }))}
                    placeholder="https://..."
                    className="w-full text-xs rounded-xl px-3 py-2 outline-none"
                    style={{ background: '#f8f7f4', border: '1px solid #e8e4da', color: '#071020' }}
                    aria-label="Lien fichier (optionnel)" />
                </div>
                <button
                  onClick={envoyerExercice}
                  disabled={sending || !envoi.titre || !envoi.matiere}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition"
                  style={{
                    background: sending || !envoi.titre || !envoi.matiere
                      ? 'rgba(201,168,76,0.3)'
                      : '#C9A84C',
                    color: '#071020',
                    cursor: sending || !envoi.titre || !envoi.matiere ? 'not-allowed' : 'pointer'
                  }}>
                  {sending ? 'Envoi...' : 'Envoyer l\'exercice'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* EXERCICES ENVOYÉS */}
      {exercicesEnvoyes.length > 0 && (
        <div className="mt-6 rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>Historique</p>
          <p className="font-bold text-sm mb-4" style={{ color: '#071020' }}>Exercices envoyés ({exercicesEnvoyes.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exercicesEnvoyes.map((ex, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: '#f8f7f4', border: '1px solid #f0ece0' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: ex.statut === 'fait' ? '#4CC9A8' : '#C9A84C' }}>
                  {ex.statut === 'fait' ? '✓' : '→'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: '#071020' }}>{ex.titre}</p>
                  <p className="text-xs text-gray-500">{ex.matiere} — Pour : {ex.etudiant_nom || 'Étudiant'}</p>
                </div>
                <span className="text-xs font-semibold flex-shrink-0"
                  style={{ color: ex.statut === 'fait' ? '#4CC9A8' : '#C9A84C' }}>
                  {ex.statut === 'fait' ? 'Fait' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ========================
// COMPOSANT PRINCIPAL
// ========================
export default function PlanningPerso() {
  const { user } = useAuth()
  const isProfOrAdmin = ['professeur', 'admin'].includes(user?.role)

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>
          {isProfOrAdmin ? 'Suivi personnalisé' : 'Mon espace'}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          {isProfOrAdmin ? 'Gestion & suivi des étudiants' : 'Planning personnalisé'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isProfOrAdmin
            ? 'Visualisez les compétences et assignez des exercices'
            : 'Vos compétences et exercices personnalisés'}
        </p>
      </div>

      {isProfOrAdmin
        ? <VueProfesseur />
        : <VueEtudiant user={user} />
      }
    </div>
  )
}