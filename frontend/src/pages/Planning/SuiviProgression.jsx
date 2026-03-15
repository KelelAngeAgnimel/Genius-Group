import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import API_URL from '../../config'

// ================================
// SUIVI PROGRESSION PROFESSEUR
// ================================
const matieres = {
  'INP-HB': [
    { nom: 'Culture Scientifique', couleur: '#C9A84C' },
    { nom: 'Culture Générale', couleur: '#7B4CC9' },
    { nom: 'Culture Littéraire', couleur: '#C97B4C' },
  ],
  'ESATIC': [
    { nom: 'Mathématiques', couleur: '#4C7BC9' },
    { nom: 'Physique', couleur: '#4CC9A8' },
    { nom: 'Anglais', couleur: '#C94C7B' },
    { nom: 'Français', couleur: '#C9A84C' },
  ]
}

const roleLabel = {
  etudiant_inphb: 'INP-HB',
  etudiant_esatic: 'ESATIC',
  etudiant_both: 'INP-HB + ESATIC',
}

const roleCouleur = {
  etudiant_inphb: '#C9A84C',
  etudiant_esatic: '#4C7BC9',
  etudiant_both: '#4CC9A8',
}

function SuiviProfesseur({ token }) {
  const [etudiants, setEtudiants] = useState([])
  const [notesEtudiant, setNotesEtudiant] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [etudiantActif, setEtudiantActif] = useState(null)
  const [filtreRole, setFiltreRole] = useState('tous')
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/all`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.users) {
          setEtudiants(data.users.filter(u => u.role.startsWith('etudiant')))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    charger()
  }, [])

  const ouvrirEtudiant = async (etudiant) => {
    setEtudiantActif(etudiant)
    setLoadingNotes(true)
    try {
      const res = await fetch(`${API_URL}/api/notes/etudiant/${etudiant.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.notes) setNotesEtudiant(data.notes)
      else setNotesEtudiant([])
    } catch (err) {
      console.error(err)
      setNotesEtudiant([])
    } finally {
      setLoadingNotes(false)
    }
  }

  const etudiantsFiltres = etudiants.filter(e => {
    const matchRole = filtreRole === 'tous' || e.role === filtreRole
    const matchRecherche = recherche === '' ||
      e.username?.toLowerCase().includes(recherche.toLowerCase()) ||
      e.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      e.prenom?.toLowerCase().includes(recherche.toLowerCase()) ||
      e.matricule?.toLowerCase().includes(recherche.toLowerCase())
    return matchRole && matchRecherche
  })

  const getConcours = (role) => {
    if (role === 'etudiant_inphb') return ['INP-HB']
    if (role === 'etudiant_esatic') return ['ESATIC']
    if (role === 'etudiant_both') return ['INP-HB', 'ESATIC']
    return []
  }

  const getDerniereNote = (matiere, concours) => {
    const notes = notesEtudiant
      .filter(n => n.matiere === matiere && n.concours === concours)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return notes.length > 0 ? notes[0].note : null
  }

  const getMoyenneConcours = (concours) => {
    const matieresConcours = matieres[concours] || []
    const notes = matieresConcours
      .map(m => getDerniereNote(m.nom, concours))
      .filter(n => n !== null)
    if (notes.length === 0) return null
    return (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1)
  }

  const couleurNote = (note) => {
    if (note >= 14) return '#4CC9A8'
    if (note >= 10) return '#C9A84C'
    return '#C94C7B'
  }

  // Moyenne rapide pour la liste
  const getMoyenneRapide = (etudiantId, concours) => {
    return null // sera remplacé quand on ouvre l'étudiant
  }

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#4CC9A8' }}>
          Planning
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Suivi de progression
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {etudiants.length} etudiant{etudiants.length > 1 ? 's' : ''} — Vue enseignant
        </p>
      </div>

      {/* VUE DÉTAIL ÉTUDIANT */}
      {etudiantActif ? (
        <div>
          <button
            onClick={() => { setEtudiantActif(null); setNotesEtudiant([]) }}
            className="flex items-center gap-2 mb-6 text-xs font-semibold"
            style={{ color: '#C9A84C' }}>
            &lt; Retour à la liste
          </button>

          {/* Header étudiant */}
          <div className="bg-white rounded-2xl overflow-hidden mb-6"
            style={{ border: '1px solid #f0ece0' }}>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-5"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                borderBottom: `2px solid ${roleCouleur[etudiantActif.role]}`
              }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
                style={{
                  background: `${roleCouleur[etudiantActif.role]}30`,
                  border: `2px solid ${roleCouleur[etudiantActif.role]}`,
                  color: roleCouleur[etudiantActif.role]
                }}>
                {etudiantActif.username?.[0]?.toUpperCase()}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-white">
                  {etudiantActif.prenom || ''} {etudiantActif.nom || etudiantActif.username}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {etudiantActif.username} — {etudiantActif.matricule}
                </p>
                <span className="text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded-full"
                  style={{
                    background: `${roleCouleur[etudiantActif.role]}20`,
                    color: roleCouleur[etudiantActif.role]
                  }}>
                  {roleLabel[etudiantActif.role]}
                </span>
              </div>
            </div>
          </div>

          {loadingNotes ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getConcours(etudiantActif.role).map((concours, ci) => {
                const matieresConcours = matieres[concours] || []
                const moyenne = getMoyenneConcours(concours)
                const couleur = concours === 'INP-HB' ? '#C9A84C' : '#4C7BC9'

                return (
                  <div key={ci} className="bg-white rounded-2xl overflow-hidden"
                    style={{ border: '1px solid #f0ece0' }}>

                    <div className="p-4 flex items-center justify-between"
                      style={{
                        background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                        borderBottom: `2px solid ${couleur}`
                      }}>
                      <div>
                        <p className="font-bold text-white">{concours}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Notes publiées</p>
                      </div>
                      <div className="text-right">
                        {moyenne ? (
                          <>
                            <p className="text-3xl font-bold" style={{ color: couleur }}>{moyenne}</p>
                            <p className="text-xs text-gray-400">/20 moy.</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Aucune note</p>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col gap-4">
                      {matieresConcours.map((m, i) => {
                        const note = getDerniereNote(m.nom, concours)
                        const notesHisto = notesEtudiant
                          .filter(n => n.matiere === m.nom && n.concours === concours)
                          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

                        return (
                          <div key={i}>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-medium text-gray-700">{m.nom}</span>
                              {note !== null ? (
                                <span className="text-xs font-bold"
                                  style={{ color: couleurNote(note) }}>
                                  {note}/20
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 italic">—</span>
                              )}
                            </div>
                            {note !== null && (
                              <div className="w-full h-2.5 rounded-full bg-gray-100 mb-1">
                                <div className="h-2.5 rounded-full transition-all duration-700"
                                  style={{
                                    width: `${(note / 20) * 100}%`,
                                    background: `linear-gradient(90deg, ${couleurNote(note)}66, ${couleurNote(note)})`
                                  }} />
                              </div>
                            )}
                            {notesHisto.length > 1 && (
                              <div className="flex gap-1 flex-wrap mt-1">
                                {notesHisto.map((n, j) => (
                                  <span key={j} className="text-xs px-1.5 py-0.5 rounded"
                                    style={{
                                      background: `${couleurNote(n.note)}10`,
                                      color: couleurNote(n.note)
                                    }}>
                                    {n.periode}: {n.note}
                                  </span>
                                ))}
                              </div>
                            )}
                            {note === null && (
                              <p className="text-xs text-gray-300 italic">Pas encore de note</p>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Analyse */}
                    {moyenne && (
                      <div className="px-5 pb-5">
                        <div className="p-3 rounded-xl"
                          style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}>
                          <p className="text-xs font-bold mb-2" style={{ color: '#C9A84C' }}>Analyse</p>
                          {(() => {
                            const notesAvec = matieresConcours
                              .map(m => ({ nom: m.nom, note: getDerniereNote(m.nom, concours) }))
                              .filter(m => m.note !== null)
                            if (notesAvec.length === 0) return null
                            const meilleur = notesAvec.reduce((a, b) => a.note > b.note ? a : b)
                            const faible = notesAvec.reduce((a, b) => a.note < b.note ? a : b)
                            return (
                              <>
                                <p className="text-xs font-semibold text-gray-600 mb-1">
                                  Point fort : {meilleur.nom} ({meilleur.note}/20)
                                </p>
                                <p className="text-xs text-gray-600">
                                  A renforcer : {faible.nom} ({faible.note}/20)
                                </p>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      ) : (
        // LISTE DES ÉTUDIANTS
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input
              type="text"
              placeholder="Rechercher un etudiant..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              className="flex-1 border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
              style={{ borderColor: '#f0ece0' }}
              onFocus={e => e.target.style.borderColor = '#C9A84C'}
              onBlur={e => e.target.style.borderColor = '#f0ece0'}
            />
            <div className="flex gap-2 flex-wrap">
              {['tous', 'etudiant_inphb', 'etudiant_esatic', 'etudiant_both'].map((role, i) => (
                <button key={i}
                  onClick={() => setFiltreRole(role)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap"
                  style={{
                    background: filtreRole === role ? '#071020' : 'white',
                    color: filtreRole === role ? '#C9A84C' : '#6b7280',
                    border: filtreRole === role ? '1px solid rgba(201,168,76,0.4)' : '1px solid #f0ece0'
                  }}>
                  {role === 'tous' ? 'Tous' : roleLabel[role]}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
            </div>
          )}

          {!loading && (
            <div className="flex flex-col gap-3">
              {etudiantsFiltres.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Aucun etudiant trouve
                </div>
              )}
              {etudiantsFiltres.map((etudiant, i) => {
                const concours = getConcours(etudiant.role)
                const couleur = roleCouleur[etudiant.role]
                return (
                  <div key={i}
                    className="bg-white rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg"
                    style={{ border: '1px solid #f0ece0' }}
                    onClick={() => ouvrirEtudiant(etudiant)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                        style={{ background: `${couleur}20`, border: `2px solid ${couleur}40`, color: couleur }}>
                        {etudiant.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-gray-800">
                            {etudiant.prenom || ''} {etudiant.nom || etudiant.username}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: `${couleur}15`, color: couleur }}>
                            {roleLabel[etudiant.role]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {etudiant.matricule} — {etudiant.username}
                        </p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {concours.map((c, ci) => (
                            <span key={ci} className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: c === 'INP-HB' ? 'rgba(201,168,76,0.1)' : 'rgba(76,123,201,0.1)',
                                color: c === 'INP-HB' ? '#C9A84C' : '#4C7BC9'
                              }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs flex-shrink-0 px-2 py-1 rounded-lg"
                        style={{ background: `${couleur}10`, color: couleur }}>
                        Voir notes →
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ================================
// SUIVI PROGRESSION ETUDIANT
// ================================
function SuiviEtudiant({ user, token }) {
  const [ecoleSelectionnee, setEcoleSelectionnee] = useState(null)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const ecolesDispo = [
    {
      sigle: 'INP-HB',
      nom: 'Institut National Polytechnique Houphouët-Boigny',
      logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png',
      couleur: '#C9A84C',
      site: 'https://inphb.ci',
      matieres: ['Culture Scientifique', 'Culture Générale', 'Culture Littéraire'],
      couleursMatieres: {
        'Culture Scientifique': '#4CC9A8',
        'Culture Générale': '#7B4CC9',
        'Culture Littéraire': '#C97B4C',
      },
      roles: ['etudiant_inphb', 'etudiant_both'],
    },
    {
      sigle: 'ESATIC',
      nom: 'Ecole Supérieure Africaine des TIC',
      logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
      couleur: '#4C7BC9',
      site: 'https://esatic.ci',
      matieres: ['Mathématiques', 'Physique', 'Anglais', 'Français'],
      couleursMatieres: {
        'Mathématiques': '#C9A84C',
        'Physique': '#4CC9A8',
        'Anglais': '#C94C7B',
        'Français': '#4C7BC9',
      },
      roles: ['etudiant_esatic', 'etudiant_both'],
    },
  ]

  const ecolesVisibles = ecolesDispo.filter(e => e.roles.includes(user?.role))
  const ecoleActive = ecolesDispo.find(e => e.sigle === ecoleSelectionnee)

  useEffect(() => {
    chargerNotes()
  }, [])

  const chargerNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notes/mes-notes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.notes) setNotes(data.notes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getNotesMatiere = (matiere, concours) => {
    return notes
      .filter(n => n.matiere === matiere && n.concours === concours)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }

  const getDerniereNote = (matiere, concours) => {
    const notesMatiere = getNotesMatiere(matiere, concours)
    return notesMatiere.length > 0 ? notesMatiere[notesMatiere.length - 1].note : null
  }

  const getMoyenneConcours = (ecole) => {
    const notesEcole = ecole.matieres
      .map(m => getDerniereNote(m, ecole.sigle))
      .filter(n => n !== null)
    if (notesEcole.length === 0) return null
    return (notesEcole.reduce((a, b) => a + b, 0) / notesEcole.length).toFixed(1)
  }

  const couleurNote = (note) => {
    if (note >= 14) return '#4CC9A8'
    if (note >= 10) return '#C9A84C'
    return '#C94C7B'
  }

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Planning
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Suivi de progression
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Sélectionnez un concours pour voir votre progression
        </p>
      </div>

      {/* CARTES ÉCOLES */}
      {!ecoleSelectionnee && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ecolesVisibles.map((ecole, i) => {
            const moyenne = getMoyenneConcours(ecole)
            return (
              <div key={i}
                onClick={() => setEcoleSelectionnee(ecole.sigle)}
                className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                  border: `2px solid ${ecole.couleur}40`,
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>

                <div className="flex items-center justify-center py-14 px-8">
                  <img src={ecole.logo} alt={ecole.sigle}
                    className="object-contain"
                    style={{ maxHeight: '130px', maxWidth: '240px' }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentNode.innerHTML = `<span style="font-size:48px;font-weight:bold;color:#C9A84C">${ecole.sigle}</span>`
                    }} />
                </div>

                <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${ecole.couleur}, transparent)` }} />

                <div className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{ecole.sigle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ecole.matieres.length} matières</p>
                  </div>
                  {moyenne ? (
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: ecole.couleur }}>{moyenne}</p>
                      <p className="text-xs text-gray-400">/20 moy.</p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 italic">Aucune note</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DÉTAIL PROGRESSION */}
      {ecoleActive && (
        <div>
          <button onClick={() => setEcoleSelectionnee(null)}
            className="flex items-center gap-2 mb-6 text-xs font-semibold"
            style={{ color: '#C9A84C' }}>
            &lt; Retour aux concours
          </button>

          <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid #f0ece0' }}>
            <div className="flex flex-col sm:flex-row items-center gap-5 p-6"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                borderBottom: `2px solid ${ecoleActive.couleur}`
              }}>
              <div className="w-24 h-24 rounded-xl bg-white flex items-center justify-center p-2 flex-shrink-0">
                <img src={ecoleActive.logo} alt={ecoleActive.sigle}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentNode.innerHTML = `<span style="font-weight:bold;color:#C9A84C;font-size:14px">${ecoleActive.sigle}</span>`
                  }} />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-white">{ecoleActive.sigle}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{ecoleActive.nom}</p>
                <a href={ecoleActive.site} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold mt-2 inline-block"
                  style={{ color: ecoleActive.couleur }}>
                  Visiter le site officiel
                </a>
              </div>
              <div className="sm:ml-auto text-center">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Moyenne générale</p>
                <p className="text-5xl font-bold" style={{ color: ecoleActive.couleur }}>
                  {getMoyenneConcours(ecoleActive) || '—'}
                </p>
                {getMoyenneConcours(ecoleActive) && (
                  <p className="text-xs text-gray-400">/20</p>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {ecoleActive.matieres.map((matiere, i) => {
                const notesMatiere = getNotesMatiere(matiere, ecoleActive.sigle)
                const derniereNote = getDerniereNote(matiere, ecoleActive.sigle)
                const couleurMatiere = ecoleActive.couleursMatieres[matiere] || ecoleActive.couleur

                return (
                  <div key={i} className="bg-white rounded-2xl p-5"
                    style={{ border: '1px solid #f0ece0' }}>

                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm" style={{ color: '#071020' }}>{matiere}</h3>
                      {derniereNote !== null ? (
                        <span className="text-lg font-bold"
                          style={{ color: couleurNote(derniereNote) }}>
                          {derniereNote}/20
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Pas encore de note</span>
                      )}
                    </div>

                    {derniereNote !== null && (
                      <div className="mb-3">
                        <div className="w-full h-2.5 rounded-full bg-gray-100">
                          <div className="h-2.5 rounded-full transition-all duration-700"
                            style={{
                              width: `${(derniereNote / 20) * 100}%`,
                              background: `linear-gradient(90deg, ${couleurNote(derniereNote)}66, ${couleurNote(derniereNote)})`
                            }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-300">0</span>
                          <span className="text-xs text-gray-300">20</span>
                        </div>
                      </div>
                    )}

                    {notesMatiere.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                          Historique
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {notesMatiere.map((n, j) => (
                            <div key={j} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                              style={{
                                background: `${couleurNote(n.note)}10`,
                                border: `1px solid ${couleurNote(n.note)}30`
                              }}>
                              <span className="text-xs text-gray-500">{n.periode}</span>
                              <span className="text-xs font-bold"
                                style={{ color: couleurNote(n.note) }}>
                                {n.note}/20
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {notesMatiere.length === 0 && (
                      <p className="text-xs text-gray-300 italic mt-1">
                        Aucune note publiée par votre professeur pour cette matière
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ========================
// COMPOSANT PRINCIPAL
// ========================
export default function SuiviProgression() {
  const { user, token } = useAuth()

  if (user?.role === 'professeur' || user?.role === 'admin') {
    return <SuiviProfesseur token={token} />
  }

  return <SuiviEtudiant user={user} token={token} />
}