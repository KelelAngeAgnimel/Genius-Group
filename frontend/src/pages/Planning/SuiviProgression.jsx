import { lazy, Suspense, useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import { concoursDe, libelleConcours, libelleUtilisateur, couleurConcours as couleurCode, viseConcours, CODES_CONCOURS, CONCOURS } from '../../lib/concours'
import { cleMatiere, couleurNote, profilDepuisNotes } from '../../lib/profil'
import { useConcoursActif } from '../../hooks/useConcoursActif'
import SelecteurConcours from '../../components/SelecteurConcours'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'

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
  ],
  'CME': [
    { nom: 'Culture Générale', couleur: '#4CC9A8' },
    { nom: 'Culture Scientifique', couleur: '#7BC94C' },
    { nom: 'Anglais', couleur: '#4C9AC9' },
    { nom: 'Français', couleur: '#C9A84C' },
  ]
}

// Couleur d'un élève = celle de son premier concours
const couleurEleve = (e) => couleurCode(concoursDe(e)[0])

const couleurConcours = {
  'INP-HB': '#C9A84C',
  'ESATIC': '#4C7BC9',
  'CME': '#4CC9A8',
}

// Concours absents des tables ci-dessus (ENSEA…) : matières et couleur viennent du référentiel lib/concours.js
const PALETTE_MATIERES = ['#C9A84C', '#4C7BC9', '#4CC9A8', '#C94C7B', '#7B4CC9']
for (const c of Object.values(CONCOURS)) {
  if (!matieres[c.label]) matieres[c.label] = c.matieres.map((nom, i) => ({ nom, couleur: PALETTE_MATIERES[i % PALETTE_MATIERES.length] }))
  if (!couleurConcours[c.label]) couleurConcours[c.label] = c.couleur
}

function SuiviProfesseur() {
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
        const res = await api.get('/api/users/all')
        const data = res.data
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
      const res = await api.get(`/api/notes/etudiant/${etudiant.id}`)
      const data = res.data
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
    const matchRole = filtreRole === 'tous' || concoursDe(e).includes(filtreRole)
    const matchRecherche = recherche === '' ||
      e.username?.toLowerCase().includes(recherche.toLowerCase()) ||
      e.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      e.prenom?.toLowerCase().includes(recherche.toLowerCase()) ||
      e.matricule?.toLowerCase().includes(recherche.toLowerCase())
    return matchRole && matchRecherche
  })

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

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#4CC9A8' }}>
          Planning
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Suivi de progression
        </h1>
        <p className="text-gray-500 text-sm mt-1">
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
                borderBottom: `2px solid ${couleurEleve(etudiantActif)}`
              }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
                style={{
                  background: `${couleurEleve(etudiantActif)}30`,
                  border: `2px solid ${couleurEleve(etudiantActif)}`,
                  color: couleurEleve(etudiantActif)
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
                    background: `${couleurEleve(etudiantActif)}20`,
                    color: couleurEleve(etudiantActif)
                  }}>
                  {libelleUtilisateur(etudiantActif)}
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
              {concoursDe(etudiantActif).map(libelleConcours).map((concours, ci) => {
                const matieresConcours = matieres[concours] || []
                const moyenne = getMoyenneConcours(concours)
                const couleur = couleurConcours[concours] || '#C9A84C'

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
                                <span className="text-xs text-gray-500 italic">—</span>
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
              aria-label="Rechercher un etudiant..." />
            <div className="flex gap-2 flex-wrap">
              {['tous', ...CODES_CONCOURS].map((role, i) => (
                <button key={i}
                  onClick={() => setFiltreRole(role)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap"
                  style={{
                    background: filtreRole === role ? '#071020' : 'white',
                    color: filtreRole === role ? '#C9A84C' : '#6b7280',
                    border: filtreRole === role ? '1px solid rgba(201,168,76,0.4)' : '1px solid #f0ece0'
                  }}>
                  {role === 'tous' ? 'Tous' : libelleConcours(role)}
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
                <div className="text-center py-12 text-gray-500 text-sm">
                  Aucun etudiant trouve
                </div>
              )}
              {etudiantsFiltres.map((etudiant, i) => {
                const concours = concoursDe(etudiant).map(libelleConcours)
                const couleur = couleurEleve(etudiant)
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
                            {libelleUtilisateur(etudiant)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {etudiant.matricule} — {etudiant.username}
                        </p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {concours.map((c, ci) => (
                            <span key={ci} className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: `${couleurConcours[c] || '#C9A84C'}18`,
                                color: couleurConcours[c] || '#C9A84C'
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
// SUIVI PROGRESSION ETUDIANT — un concours à la fois (?concours=), uniquement ceux de l'élève
// ================================
const CourbeNotes = lazy(() => import('../../components/Graphiques').then(m => ({ default: m.CourbeNotes })))
const COULEURS_MATIERES = ['#C9A84C', '#4C7BC9', '#4CC9A8', '#7B4CC9', '#C94C7B', '#C97B4C']

function SuiviEtudiant() {
  const { codes, actif, choisir } = useConcoursActif()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let vivant = true
    api.get('/api/notes/mes-notes')
      .then(res => {
        if (!vivant) return
        if (res.ok) setNotes(res.data.notes ?? [])
        else setErreur(res.data?.message || 'Impossible de charger vos notes')
      })
      .catch(() => vivant && setErreur('Erreur de connexion au serveur'))
      .finally(() => vivant && setLoading(false))
    return () => { vivant = false }
  }, [])

  const couleur = couleurCode(actif)
  const notesConcours = notes.filter(n => viseConcours(n.concours, actif))
  const { moyenneGenerale } = profilDepuisNotes(notesConcours)
  // Matières officielles du concours d'abord (même sans note), puis celles trouvées dans les notes
  const matieres = [...(CONCOURS[actif]?.matieres ?? [])]
  for (const n of notesConcours) if (!matieres.some(m => cleMatiere(m) === cleMatiere(n.matiere))) matieres.push(n.matiere)

  const notesMatiere = (matiere) => notesConcours
    .filter(n => cleMatiere(n.matiere) === cleMatiere(matiere))
    .sort((x, y) => new Date(x.created_at) - new Date(y.created_at))

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>Mes progrès</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Suivi de progression</h1>
        <p className="text-gray-500 text-sm mt-1">Votre évolution, matière par matière{codes.length > 1 ? ', concours par concours' : ''}</p>
      </div>

      {!actif ? (
        <EmptyState titre="Aucun concours associé à votre compte" texte="Contactez l’administration pour être inscrit à un concours." />
      ) : (
        <>
          <SelecteurConcours codes={codes} actif={actif} onChoisir={choisir} />
          {erreur && <p className="text-sm mb-4" style={{ color: '#C94C7B' }}>{erreur}</p>}

          <div className="rounded-2xl mb-6 p-5 flex items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', borderBottom: `2px solid ${couleur}` }}>
            <div>
              <h2 className="text-xl font-bold text-white">{libelleConcours(actif)}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{CONCOURS[actif]?.nom}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Moyenne générale</p>
              <p className="text-4xl font-bold" style={{ color: couleur }}>{notesConcours.length ? moyenneGenerale.toFixed(1) : '—'}</p>
              {notesConcours.length > 0 && <p className="text-xs text-gray-400">/20</p>}
            </div>
          </div>

          {loading ? (
            <Loader texte="Chargement…" />
          ) : (
            <div className="flex flex-col gap-4">
              {matieres.map((matiere, i) => {
                const liste = notesMatiere(matiere)
                const derniere = liste.length ? liste[liste.length - 1].note : null
                const points = liste.map(n => ({ periode: n.periode, note: Number(n.note) }))
                return (
                  <div key={cleMatiere(matiere)} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm" style={{ color: '#071020' }}>{matiere}</h3>
                      {derniere !== null
                        ? <span className="text-lg font-bold" style={{ color: couleurNote(derniere) }}>{derniere}/20</span>
                        : <span className="text-xs text-gray-500 italic">Pas encore de note</span>}
                    </div>

                    {derniere !== null && (
                      <div className="w-full h-2.5 rounded-full bg-gray-100 mb-3">
                        <div className="h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${(derniere / 20) * 100}%`, background: `linear-gradient(90deg, ${couleurNote(derniere)}66, ${couleurNote(derniere)})` }} />
                      </div>
                    )}

                    {points.length > 1 && (
                      <Suspense fallback={<div className="h-[180px] flex items-center justify-center text-xs text-gray-500">Chargement du graphique…</div>}>
                        <CourbeNotes points={points} couleur={COULEURS_MATIERES[i % COULEURS_MATIERES.length]} />
                      </Suspense>
                    )}

                    {liste.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Historique</p>
                        <div className="flex flex-wrap gap-2">
                          {liste.map((n, j) => (
                            <div key={j} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                              style={{ background: `${couleurNote(n.note)}10`, border: `1px solid ${couleurNote(n.note)}30` }}>
                              <span className="text-xs text-gray-500">{n.periode}</span>
                              <span className="text-xs font-bold" style={{ color: couleurNote(n.note) }}>{n.note}/20</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic mt-1">Aucune note publiée par votre professeur pour cette matière</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ========================
// COMPOSANT PRINCIPAL
// ========================
export default function SuiviProgression() {
  const { user } = useAuth()

  if (user?.role === 'professeur' || user?.role === 'admin') {
    return <SuiviProfesseur />
  }

  return <SuiviEtudiant />
}