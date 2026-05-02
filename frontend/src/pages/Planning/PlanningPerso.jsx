import { useAuth } from '../../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import API_URL from '../../config'

// ========================
// RADAR CHART FIFA-STYLE
// ========================
function RadarChart({ competences, couleur = '#C9A84C', size = 260 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38
  const n = competences.length
  if (n < 3) return null

  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pt = (i, pct) => ({
    x: cx + r * (pct / 100) * Math.cos(angle(i)),
    y: cy + r * (pct / 100) * Math.sin(angle(i)),
  })

  const gridLevels = [20, 40, 60, 80, 100]
  const gridPolygon = (pct) =>
    competences.map((_, i) => `${pt(i, pct).x},${pt(i, pct).y}`).join(' ')
  const dataPolygon = competences.map((c, i) => `${pt(i, c.note).x},${pt(i, c.note).y}`).join(' ')

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {gridLevels.map((pct) => (
        <polygon key={pct} points={gridPolygon(pct)}
          fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="1" />
      ))}
      {competences.map((_, i) => (
        <line key={i}
          x1={cx} y1={cy}
          x2={pt(i, 100).x} y2={pt(i, 100).y}
          stroke="rgba(201,168,76,0.15)" strokeWidth="1" />
      ))}
      <polygon points={dataPolygon}
        fill={`${couleur}33`} stroke={couleur} strokeWidth="2" strokeLinejoin="round" />
      {competences.map((c, i) => {
        const p = pt(i, c.note)
        return (
          <circle key={i} cx={p.x} cy={p.y} r="4"
            fill={couleur} stroke="#071020" strokeWidth="1.5" />
        )
      })}
      {competences.map((c, i) => {
        const p = pt(i, 105)
        const labelX = p.x + (Math.cos(angle(i)) > 0.1 ? 6 : Math.cos(angle(i)) < -0.1 ? -6 : 0)
        const anchor = Math.cos(angle(i)) > 0.1 ? 'start' : Math.cos(angle(i)) < -0.1 ? 'end' : 'middle'
        return (
          <text key={i} x={labelX} y={p.y + 4}
            textAnchor={anchor} fontSize="10"
            fill="rgba(255,255,255,0.7)" fontWeight="600">
            {c.matiere.length > 8 ? c.matiere.slice(0, 8) + '.' : c.matiere}
          </text>
        )
      })}
      {competences.map((c, i) => {
        const p = pt(i, c.note)
        return (
          <text key={i} x={p.x} y={p.y - 7}
            textAnchor="middle" fontSize="9"
            fill={couleur} fontWeight="700">
            {Math.round(c.note)}
          </text>
        )
      })}
    </svg>
  )
}

// ========================
// BADGE NIVEAU FIFA
// ========================
function NiveauBadge({ note }) {
  if (note >= 85) return <span style={{ background: 'rgba(76,201,168,0.2)', color: '#4CC9A8', border: '1px solid #4CC9A8', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>ÉLITE</span>
  if (note >= 70) return <span style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid #C9A84C', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>AVANCÉ</span>
  if (note >= 55) return <span style={{ background: 'rgba(76,123,201,0.2)', color: '#4C7BC9', border: '1px solid #4C7BC9', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>INTERMÉD.</span>
  return <span style={{ background: 'rgba(201,76,123,0.2)', color: '#C94C7B', border: '1px solid #C94C7B', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>DÉBUTANT</span>
}

// ========================
// VUE ÉTUDIANT
// ========================
function VueEtudiant({ user, token }) {
  const [notes, setNotes] = useState([])
  const [exercices, setExercices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const charger = async () => {
      try {
        const [notesRes, exRes] = await Promise.all([
          fetch(`${API_URL}/api/notes/mes-notes`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/exercices/recus`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const notesData = await notesRes.json()
        const exData = await exRes.json()
        if (notesData.notes) setNotes(notesData.notes)
        if (exData.exercices) setExercices(exData.exercices)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    charger()
  }, [])

  const marquerFait = async (id) => {
    try {
      await fetch(`${API_URL}/api/exercices/${id}/statut`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'fait' })
      })
      setExercices(prev => prev.map(e => e.id === id ? { ...e, statut: 'fait' } : e))
    } catch (err) { console.error(err) }
  }

  const competences = notes.map(n => ({ matiere: n.matiere, note: Math.min(100, (n.note / 20) * 100) }))
  const moyenneGlobale = notes.length > 0 ? notes.reduce((s, n) => s + n.note, 0) / notes.length : 0
  const exercicesEnAttente = exercices.filter(e => e.statut !== 'fait').length

  const notesCouleurs = {
    default: '#C9A84C',
    high: '#4CC9A8',
    low: '#C94C7B',
  }

  const getCouleurNote = (note) => {
    if (note >= 14) return '#4CC9A8'
    if (note >= 10) return '#C9A84C'
    return '#C94C7B'
  }

  return (
    <div>
      {/* CARTE PROFIL ÉTUDIANT */}
      <div className="rounded-2xl p-5 mb-6 flex items-center gap-5"
        style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', border: '1px solid rgba(201,168,76,0.3)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '2px solid #C9A84C' }}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-bold text-white text-lg">{user?.prenom} {user?.nom || user?.username}</p>
          <p className="text-xs text-gray-400">{user?.matricule} — {user?.role?.replace('etudiant_', '').toUpperCase()}</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold" style={{ color: getCouleurNote(moyenneGlobale) }}>
            {loading ? '...' : moyenneGlobale.toFixed(1)}
          </p>
          <p className="text-xs text-gray-400">Moyenne /20</p>
          <div className="mt-1">
            <NiveauBadge note={(moyenneGlobale / 20) * 100} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* RADAR CHART */}
        <div className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(145deg, #071020, #0d1f3c)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs tracking-widest uppercase" style={{ color: '#C9A84C' }}>Profil de compétences</p>
              <p className="text-sm font-bold text-white">Carte des aptitudes</p>
            </div>
            <span style={{ fontSize: '10px', color: '#C9A84C', background: 'rgba(201,168,76,0.1)', padding: '3px 8px', borderRadius: '20px', border: '1px solid rgba(201,168,76,0.3)' }}>
              FIFA STYLE
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
            </div>
          ) : competences.length >= 3 ? (
            <div className="flex justify-center">
              <RadarChart competences={competences} />
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-10">Pas encore assez de notes pour afficher le radar</p>
          )}
        </div>

        {/* BARRES DE PROGRESSION PAR MATIÈRE */}
        <div className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(145deg, #071020, #0d1f3c)', border: '1px solid rgba(201,168,76,0.2)' }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Détail par matière</p>
          <p className="text-sm font-bold text-white mb-4">Notes & progression</p>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-10">Aucune note disponible</p>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '220px' }}>
              {notes.map((n, i) => {
                const couleur = getCouleurNote(n.note)
                const pct = Math.min(100, (n.note / 20) * 100)
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="text-xs font-semibold text-white">{n.matiere}</span>
                        {n.type && <span className="text-xs text-gray-500 ml-2">— {n.type}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <NiveauBadge note={pct} />
                        <span className="text-sm font-bold" style={{ color: couleur }}>{n.note}/20</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-2 rounded-full" style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${couleur}66, ${couleur})`,
                        transition: 'width 1s ease'
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* EXERCICES REÇUS */}
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Exercices</p>
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
          <p className="text-xs text-gray-400 text-center py-6">Chargement...</p>
        ) : exercices.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Aucun exercice assigné pour le moment</p>
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
                  <p className="text-xs text-gray-400">{ex.matiere} — De : {ex.professeur_nom || 'Professeur'}</p>
                  {ex.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{ex.description}</p>}
                </div>
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
function VueProfesseur({ user, token }) {
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
          fetch(`${API_URL}/api/users/all`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/exercices/envoyes`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const usersData = await usersRes.json()
        const exData = await exRes.json()
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
      const res = await fetch(`${API_URL}/api/notes/etudiant/${etudiant.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.notes) setNotesEtudiant(data.notes)
      else setNotesEtudiant([])
    } catch (err) { console.error(err); setNotesEtudiant([]) }
    finally { setLoadingNotes(false) }
  }

  const envoyerExercice = async () => {
    if (!etudiantSelectionne || !envoi.titre || !envoi.matiere) return
    setSending(true)
    try {
      await fetch(`${API_URL}/api/exercices`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...envoi, etudiant_id: etudiantSelectionne.id })
      })
      setSuccess(true)
      setEnvoi({ titre: '', matiere: '', description: '', url_fichier: '' })
      const exRes = await fetch(`${API_URL}/api/exercices/envoyes`, { headers: { Authorization: `Bearer ${token}` } })
      const exData = await exRes.json()
      if (exData.exercices) setExercicesEnvoyes(exData.exercices)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  const competences = notesEtudiant.map(n => ({ matiere: n.matiere, note: Math.min(100, (n.note / 20) * 100) }))
  const moyenneEtudiant = notesEtudiant.length > 0 ? notesEtudiant.reduce((s, n) => s + n.note, 0) / notesEtudiant.length : 0

  const getCouleurNote = (note) => {
    if (note >= 14) return '#4CC9A8'
    if (note >= 10) return '#C9A84C'
    return '#C94C7B'
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* LISTE ÉTUDIANTS */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Sélection</p>
          <p className="font-bold text-sm mb-4" style={{ color: '#071020' }}>Choisir un étudiant</p>
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-4">Chargement...</p>
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
                    <p className="text-xs text-gray-400">{e.role?.replace('etudiant_', '').toUpperCase()}</p>
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
              style={{ background: 'linear-gradient(145deg, #071020, #0d1f3c)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <p className="text-4xl mb-3">👈</p>
              <p className="text-sm font-bold text-white mb-1">Sélectionnez un étudiant</p>
              <p className="text-xs text-gray-400">Cliquez sur un étudiant pour voir son profil et lui assigner un exercice</p>
            </div>
          ) : (
            <>
              {/* PROFIL + RADAR */}
              <div className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(145deg, #071020, #0d1f3c)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid #C9A84C', color: '#C9A84C' }}>
                    {etudiantSelectionne.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">{etudiantSelectionne.prenom} {etudiantSelectionne.nom || etudiantSelectionne.username}</p>
                    <p className="text-xs text-gray-400">{etudiantSelectionne.matricule}</p>
                  </div>
                  {notesEtudiant.length > 0 && (
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: getCouleurNote(moyenneEtudiant) }}>
                        {moyenneEtudiant.toFixed(1)}/20
                      </p>
                      <NiveauBadge note={(moyenneEtudiant / 20) * 100} />
                    </div>
                  )}
                </div>

                {loadingNotes ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
                  </div>
                ) : competences.length >= 3 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-center">
                      <RadarChart competences={competences} size={220} />
                    </div>
                    <div className="flex flex-col gap-2 justify-center">
                      {notesEtudiant.map((n, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-300">{n.matiere}</span>
                            <span className="text-xs font-bold" style={{ color: getCouleurNote(n.note) }}>{n.note}/20</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-1.5 rounded-full"
                              style={{ width: `${(n.note / 20) * 100}%`, background: getCouleurNote(n.note) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">Pas encore assez de notes pour cet étudiant</p>
                )}
              </div>

              {/* FORMULAIRE EXERCICE */}
              <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Assigner</p>
                <p className="font-bold text-sm mb-4" style={{ color: '#071020' }}>
                  Envoyer un exercice à {etudiantSelectionne.prenom || etudiantSelectionne.username}
                </p>

                {success && (
                  <div className="mb-3 p-3 rounded-xl text-xs font-semibold text-center"
                    style={{ background: 'rgba(76,201,168,0.1)', color: '#4CC9A8', border: '1px solid rgba(76,201,168,0.3)' }}>
                    ✓ Exercice envoyé avec succès !
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Titre *</label>
                    <input
                      value={envoi.titre}
                      onChange={e => setEnvoi(p => ({ ...p, titre: e.target.value }))}
                      placeholder="Ex: Série d'exercices logique"
                      className="w-full text-xs rounded-xl px-3 py-2 outline-none"
                      style={{ background: '#f8f7f4', border: '1px solid #e8e4da', color: '#071020' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Matière *</label>
                    <input
                      value={envoi.matiere}
                      onChange={e => setEnvoi(p => ({ ...p, matiere: e.target.value }))}
                      placeholder="Ex: Mathématiques"
                      className="w-full text-xs rounded-xl px-3 py-2 outline-none"
                      style={{ background: '#f8f7f4', border: '1px solid #e8e4da', color: '#071020' }}
                    />
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
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs text-gray-400 mb-1 block">Lien fichier (optionnel)</label>
                  <input
                    value={envoi.url_fichier}
                    onChange={e => setEnvoi(p => ({ ...p, url_fichier: e.target.value }))}
                    placeholder="https://..."
                    className="w-full text-xs rounded-xl px-3 py-2 outline-none"
                    style={{ background: '#f8f7f4', border: '1px solid #e8e4da', color: '#071020' }}
                  />
                </div>
                <button
                  onClick={envoyerExercice}
                  disabled={sending || !envoi.titre || !envoi.matiere}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition"
                  style={{
                    background: sending || !envoi.titre || !envoi.matiere
                      ? 'rgba(201,168,76,0.3)'
                      : 'linear-gradient(135deg, #b8891e, #C9A84C)',
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
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Historique</p>
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
                  <p className="text-xs text-gray-400">{ex.matiere} — Pour : {ex.etudiant_nom || 'Étudiant'}</p>
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
  const { user, token } = useAuth()
  const isProfOrAdmin = ['professeur', 'admin'].includes(user?.role)

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          {isProfOrAdmin ? 'Suivi personnalisé' : 'Mon espace'}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          {isProfOrAdmin ? 'Gestion & suivi des étudiants' : 'Planning personnalisé'}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {isProfOrAdmin
            ? 'Visualisez les compétences et assignez des exercices'
            : 'Vos compétences et exercices personnalisés'}
        </p>
      </div>

      {isProfOrAdmin
        ? <VueProfesseur user={user} token={token} />
        : <VueEtudiant user={user} token={token} />
      }
    </div>
  )
}