import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../../api'
import { concoursDe } from '../../lib/concours'
import CarteConcoursBanniere from '../../components/CarteConcoursBanniere'
import GrilleConcours from '../../components/GrilleConcours'

// =====================
// DASHBOARD ADMIN
// =====================
function DashboardAdmin({ user }) {
  const [stats, setStats] = useState({ total: 0, etudiants: 0, professeurs: 0, admins: 0 })
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const charger = async () => {
      try {
        const [usersRes, msgRes] = await Promise.all([
          api.get('/api/users/all'),
          api.get('/api/messages/recus')
        ])
        const usersData = usersRes.data
        const msgData = msgRes.data
        if (usersData.users) {
          const u = usersData.users
          setStats({ total: u.length, etudiants: u.filter(x => x.role.startsWith('etudiant')).length, professeurs: u.filter(x => x.role === 'professeur').length, admins: u.filter(x => x.role === 'admin').length })
        }
        if (msgData.messages) setMessages(msgData.messages)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    charger()
  }, [])

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C94C7B' }}>Tableau de bord</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Bonjour, {user?.prenom || user?.username}</h1>
        <p className="text-gray-500 text-sm mt-1">Vue administrateur — Genius Group</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total utilisateurs', valeur: stats.total },
          { label: 'Etudiants', valeur: stats.etudiants },
          { label: 'Professeurs', valeur: stats.professeurs },
          { label: 'Admins', valeur: stats.admins },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 md:p-5" style={{ border: '1px solid #e5e7eb' }}>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-3xl md:text-4xl font-bold" style={{ color: '#071020' }}>{loading ? '...' : s.valeur}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { titre: 'Créer un compte', desc: 'Ajouter un etudiant, professeur ou admin', path: '/admin/creer' },
          { titre: 'Gérer les comptes', desc: 'Voir et supprimer les utilisateurs', path: '/admin/utilisateurs' },
          { titre: 'Espace professeur', desc: 'Publier des ressources et envoyer des messages', path: '/professeur' },
        ].map((c, i) => (
          <Link key={i} to={c.path} className="block rounded-2xl p-5 transition hover:border-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: '#fff', border: '1px solid #e5e7eb', outlineColor: '#C9A84C' }}>
            <p className="font-bold mb-1" style={{ color: '#071020' }}>{c.titre}</p>
            <p className="text-xs text-gray-500">{c.desc}</p>
            <p className="text-xs mt-3 font-semibold" style={{ color: '#8A6D1A' }}>Ouvrir</p>
          </Link>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e7eb' }}>
        <h2 className="font-bold text-base mb-4" style={{ color: '#071020' }}>Messages recus ({messages.length})</h2>
        {messages.length === 0 ? <p className="text-xs text-gray-400 text-center py-6">Aucun message</p> : (
          <div className="flex flex-col gap-2">
            {messages.slice(0, 5).map((msg, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#f8f7f4', border: '1px solid #e5e7eb' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#071020' }}>
                  {msg.expediteur?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-800">{msg.expediteur?.username}</p>
                    <p className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{msg.sujet}</p>
                </div>
                {!msg.lu && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: '#C9A84C' }} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =====================
// DASHBOARD PROFESSEUR
// =====================
function DashboardProfesseur({ user }) {
  const [ressources, setRessources] = useState([])
  const [etudiants, setEtudiants] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const charger = async () => {
      try {
        const [resRes, usersRes, msgRes] = await Promise.all([
          api.get('/api/ressources/toutes'),
          api.get('/api/users/all'),
          api.get('/api/messages/envoyes')
        ])
        const resData = resRes.data
        const usersData = usersRes.data
        const msgData = msgRes.data
        if (resData.ressources) setRessources(resData.ressources)
        if (usersData.users) setEtudiants(usersData.users.filter(u => u.role.startsWith('etudiant')))
        if (msgData.messages) setMessages(msgData.messages)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    charger()
  }, [])

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#4CC9A8' }}>Tableau de bord</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Bonjour, {user?.prenom || user?.username}</h1>
        <p className="text-gray-500 text-sm mt-1">Espace enseignant — Genius Group</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Ressources publiees', valeur: ressources.filter(r => r.visible).length },
          { label: 'Ressources masquees', valeur: ressources.filter(r => !r.visible).length },
          { label: 'Etudiants', valeur: etudiants.length },
          { label: 'Messages envoyes', valeur: messages.length },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 md:p-5" style={{ border: '1px solid #e5e7eb' }}>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-3xl md:text-4xl font-bold" style={{ color: '#071020' }}>{loading ? '...' : s.valeur}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { titre: 'Publier une ressource', desc: 'Ajouter un PDF, une video ou un exercice', path: '/professeur' },
          { titre: 'Envoyer un message', desc: 'Contacter un etudiant directement', path: '/professeur' },
        ].map((c, i) => (
          <Link key={i} to={c.path} className="block rounded-2xl p-5 transition hover:border-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: '#fff', border: '1px solid #e5e7eb', outlineColor: '#C9A84C' }}>
            <p className="font-bold mb-1" style={{ color: '#071020' }}>{c.titre}</p>
            <p className="text-xs text-gray-500">{c.desc}</p>
            <p className="text-xs mt-3 font-semibold" style={{ color: '#8A6D1A' }}>Ouvrir</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// RADAR DES COMPÉTENCES — toile d'araignée SVG
// ══════════════════════════════════════════
function RadarCompetences({ matieres, couleur }) {
  const cx = 130, cy = 130, r = 88
  const n = matieres.length
  if (n < 3) return null

  const pt = (idx, val) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2
    const dist = (val / 100) * r
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) }
  }

  const poly = (pct) => matieres.map((_, i) => { const p = pt(i, pct); return `${p.x},${p.y}` }).join(' ')
  const dataPoints = matieres.map((m, i) => { const p = pt(i, m.valeur); return `${p.x},${p.y}` }).join(' ')

  const labelPt = (idx) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2
    return { x: cx + (r + 26) * Math.cos(angle), y: cy + (r + 26) * Math.sin(angle) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="260" height="260" viewBox="0 0 260 260" style={{ overflow: 'visible' }}>
        {[25, 50, 75, 100].map((p, i) => (
          <polygon key={i} points={poly(p)} fill="none"
            stroke={p === 100 ? `${couleur}60` : `${couleur}20`}
            strokeWidth={p === 100 ? 1.5 : 1} />
        ))}
        {matieres.map((_, i) => {
          const a = pt(i, 100)
          return <line key={i} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke={`${couleur}30`} strokeWidth="1" />
        })}
        <polygon points={dataPoints} fill={`${couleur}22`} stroke={couleur} strokeWidth="2.5" strokeLinejoin="round" />
        {matieres.map((m, i) => {
          const p = pt(i, m.valeur)
          return <circle key={i} cx={p.x} cy={p.y} r="5" fill={couleur} stroke="white" strokeWidth="2" />
        })}
        {matieres.map((m, i) => {
          const lp = labelPt(i)
          const mots = m.nom.split(' ')
          return (
            <text key={i} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill="#071020">
              {mots.map((mot, wi) => (
                <tspan key={wi} x={lp.x} y={lp.y + (wi - (mots.length - 1) / 2) * 12}>{mot}</tspan>
              ))}
            </text>
          )
        })}
        {matieres.map((m, i) => {
          const p = pt(i, m.valeur)
          if (m.valeur === 0) return null
          return (
            <text key={i} x={p.x} y={p.y - 12} textAnchor="middle" fontSize="8" fontWeight="700" fill="#8A6D1A">
              {m.note !== null ? `${m.note}/20` : ''}
            </text>
          )
        })}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 12px', justifyContent: 'center', marginTop: 4 }}>
        {matieres.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.valeur > 0 ? couleur : '#d1d5db', flexShrink: 0 }} />
            <span style={{ fontSize: 9.5, color: m.valeur > 0 ? '#374151' : '#9ca3af', fontWeight: 600 }}>
              {m.nom}{m.note !== null ? ` (${m.note}/20)` : ' (non noté)'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// CARTE DES COMPÉTENCES avec les vraies notes
// ══════════════════════════════════════════
function CarteCompetences({ config, notes }) {
  const matiereAvecNotes = config.matieres.map(matiere => {
    const notesM = notes.filter(n =>
      n.concours?.toLowerCase() === config.codeConcours?.toLowerCase() &&
      n.matiere?.toLowerCase().trim() === matiere.toLowerCase().trim()
    )
    if (notesM.length === 0) return { nom: matiere, note: null, valeur: 0 }
    const moy = notesM.reduce((acc, n) => acc + parseFloat(n.note), 0) / notesM.length
    return { nom: matiere, note: Math.round(moy * 10) / 10, valeur: Math.round((moy / 20) * 100) }
  })

  const notees = matiereAvecNotes.filter(m => m.note !== null)
  const noteGlobale = notees.length > 0
    ? Math.round(notees.reduce((acc, m) => acc + m.valeur, 0) / notees.length)
    : null

  const couleurCarte = noteGlobale === null ? '#9ca3af' : '#C9A84C'

  return (
    <CarteConcoursBanniere code={config.codeConcours} sousTitre={config.nom}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>
        <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>
          {notees.length}/{config.matieres.length} matière(s) notée(s)
        </p>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ color: '#071020', fontSize: 24, fontWeight: 700, lineHeight: 1, display: 'block' }}>
            {noteGlobale !== null ? noteGlobale : '—'}
          </span>
          <span style={{ color: '#9ca3af', fontSize: 10 }}>Global</span>
        </div>
      </div>
      <div style={{ padding: '12px 0 12px', display: 'flex', justifyContent: 'center' }}>
        {notees.length === 0 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Aucune note enregistrée</p>
            <p style={{ color: '#9ca3af', fontSize: 11, margin: '6px 0 0 0' }}>Le diagramme apparaîtra dès que vos professeurs auront saisi des notes</p>
          </div>
        ) : (
          <RadarCompetences matieres={matiereAvecNotes} couleur={couleurCarte} />
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: '#9ca3af', fontSize: 10, margin: 0 }}>Données issues de vos évaluations</p>
        {config.site && config.site !== '#' && (
          <a href={config.site} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: '#6b7280', textDecoration: 'underline' }}>
            Site officiel
          </a>
        )}
      </div>
    </CarteConcoursBanniere>
  )
}

// ══════════════════════════════════════════
// DÉCOMPTE DYNAMIQUE VERS LE CONCOURS
// ══════════════════════════════════════════
function DecompteConcours({ dateConcours, nomConcours }) {
  if (!dateConcours) return null
  return <DecompteAvecDate dateConcours={dateConcours} nomConcours={nomConcours} />
}

function DecompteAvecDate({ dateConcours, nomConcours }) {
  const calcJours = () => {
    const auj = new Date(); auj.setHours(0, 0, 0, 0)
    const cible = new Date(dateConcours); cible.setHours(0, 0, 0, 0)
    return Math.max(0, Math.ceil((cible - auj) / (1000 * 60 * 60 * 24)))
  }
  const [jours, setJours] = useState(calcJours())
  useEffect(() => {
    const t = setInterval(() => setJours(calcJours()), 60000)
    return () => clearInterval(t)
  }, [])

  const semaines = Math.floor(jours / 7)
  const joursR = jours % 7

  const dateDebut = new Date('2026-01-01')
  const dateFin = new Date(dateConcours)
  const auj = new Date()
  const pct = Math.min(100, Math.max(0, Math.round(((auj - dateDebut) / (dateFin - dateDebut)) * 100)))

  return (
    <div className="rounded-2xl p-4 md:p-5 bg-white" style={{ border: '1px solid #e5e7eb' }}>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Épreuves écrites</p>
      <p className="text-sm font-bold" style={{ color: '#071020' }}>{nomConcours}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 6 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: '#071020', lineHeight: 1 }}>{jours}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>jours</span>
      </div>
      <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
        {semaines > 0 ? `${semaines}sem ${joursR}j · ` : ''}
        {new Date(dateConcours).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 9, color: '#d1d5db' }}>Jan 2026</span>
          <span style={{ fontSize: 9, color: '#d1d5db' }}>Épreuves</span>
        </div>
        <div style={{ width: '100%', height: 5, background: '#e5e7eb', borderRadius: 3 }}>
          <div style={{ width: `${pct}%`, height: 5, background: '#C9A84C', borderRadius: 3 }} />
        </div>
        <p style={{ fontSize: 9, color: '#d1d5db', marginTop: 2, textAlign: 'right' }}>{pct}% du parcours écoulé</p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// CONFIG DES CONCOURS (avec CME)
// ══════════════════════════════════════════
const CONCOURS_CONFIG = [
  {
    sigle: 'INP-HB',
    codeConcours: 'inphb',
    nom: 'Institut National Polytechnique Houphouët-Boigny',
    matieres: ['Culture Scientifique', 'Culture Générale', 'Culture Littéraire'],
    site: 'https://inphb.ci',
    dateConcours: '2026-08-05',
    nomConcours: 'Épreuves INP-HB'
  },
  {
    sigle: 'ESATIC',
    codeConcours: 'esatic',
    nom: 'Ecole Supérieure Africaine des TIC',
    matieres: ['Mathématiques', 'Physique', 'Anglais', 'Français'],
    site: 'https://esatic.ci',
    dateConcours: '2026-08-04',
    nomConcours: 'Épreuves ESATIC'
  },
  {
    sigle: 'CME',
    codeConcours: 'cme',
    nom: 'Concours des Meilleurs Etudiants',
    matieres: ['Culture Générale', 'Culture Scientifique', 'Anglais', 'Français'],
    site: '#',
    dateConcours: '2026-08-10',
    nomConcours: 'Épreuves CME'
  },
  {
    sigle: 'ENSEA',
    codeConcours: 'ensea',
    nom: 'École Nationale Supérieure de Statistique et d’Économie Appliquée',
    matieres: ['Français', 'Mathématiques'],
    site: 'https://ensea.ed.ci',
    dateConcours: null, // date non fournie par le pôle éducatif : le décompte n'est pas affiché
    nomConcours: 'Épreuves ENSEA'
  },
]

// Colonnes de la ligne « Épreuves écrites » selon le nombre d'échéances (classes écrites en entier pour Tailwind)
const COLONNES_ECHEANCES = {
  1: 'md:grid-cols-1 md:max-w-xs',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4'
}

// Couleur par type d'événement
const COULEUR_TYPE = {
  cours: '#9ca3af',
  examen: '#C9A84C',
  evenement: '#9ca3af',
}

// ══════════════════════════════════════════
// DASHBOARD ÉTUDIANT
// ══════════════════════════════════════════
function DashboardEtudiant({ user, navigate }) {
  const [messages, setMessages] = useState([])
  const [notes, setNotes] = useState([])
  const [planning, setPlanning] = useState([])
  const [loadingMsg, setLoadingMsg] = useState(true)
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [loadingPlanning, setLoadingPlanning] = useState(true)
  const [messageOuvert, setMessageOuvert] = useState(null)

  useEffect(() => {
    chargerMessages()
    chargerNotes()
    chargerPlanning()
  }, [])

  const chargerMessages = async () => {
    try {
      const res = await api.get('/api/messages/recus')
      const data = res.data
      if (data.messages) setMessages(data.messages)
    } catch (err) { console.error(err) }
    finally { setLoadingMsg(false) }
  }

  const chargerNotes = async () => {
    try {
      const res = await api.get('/api/notes/mes-notes')
      const data = res.data
      if (data.notes) setNotes(data.notes)
    } catch (err) { console.error(err) }
    finally { setLoadingNotes(false) }
  }

  const chargerPlanning = async () => {
    try {
      const res = await api.get('/api/planning')
      const data = res.data
      if (Array.isArray(data)) setPlanning(data)
    } catch (err) { console.error(err) }
    finally { setLoadingPlanning(false) }
  }

  const marquerLu = async (id) => {
    try {
      await api.patch(`/api/messages/${id}/lu`)
      setMessages(prev => prev.map(m => m.id === id ? { ...m, lu: true } : m))
    } catch (err) { console.error(err) }
  }

  const ouvrirMessage = (msg) => {
    setMessageOuvert(messageOuvert?.id === msg.id ? null : msg)
    if (!msg.lu) marquerLu(msg.id)
  }

  // Concours visibles : ceux auxquels l'élève est inscrit
  const concoursVisibles = CONCOURS_CONFIG.filter(c => concoursDe(user).includes(c.codeConcours))
  const echeances = concoursVisibles.filter(c => c.dateConcours) // ENSEA : pas de date, pas de décompte
  const messagesNonLus = messages.filter(m => !m.lu).length

  // Planning de la semaine courante (lun → dim)
  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const coursTriees = [...planning]
    .sort((a, b) => {
      const ia = jours.indexOf(a.jour)
      const ib = jours.indexOf(b.jour)
      if (ia !== ib) return ia - ib
      return (a.heure_debut || '').localeCompare(b.heure_debut || '')
    })
    .slice(0, 6)

  // Prochain cours (premier cours de la semaine)
  const prochainCours = coursTriees[0] || null

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TÊTE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>Tableau de bord</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Bonjour, {user?.prenom || user?.username}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* CARTES STATS DU HAUT */}
      <div className={`grid grid-cols-2 gap-3 md:gap-4 ${echeances.length > 0 ? 'mb-3 md:mb-4' : 'mb-6'} ${concoursVisibles.length === 0 ? 'md:grid-cols-3' : ''}`}>

        {/* Messages */}
        <div className="rounded-2xl p-4 md:p-5"
          style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Messages</p>
          <p className="text-4xl font-bold" style={{ color: '#071020' }}>{loadingMsg ? '...' : messagesNonLus}</p>
          <p className="text-gray-500 text-xs mt-1">{messagesNonLus > 0 ? 'non lus' : 'aucun nouveau'}</p>
        </div>

        {/* Prochain cours (depuis l'API planning) */}
        <div className="rounded-2xl p-4 md:p-5 bg-white" style={{ border: '1px solid #e5e7eb' }}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Prochain cours</p>
          {loadingPlanning ? (
            <p className="text-sm font-bold text-gray-300">Chargement...</p>
          ) : prochainCours ? (
            <>
              <p className="text-sm font-bold" style={{ color: '#071020' }}>{prochainCours.matiere}</p>
              <p className="text-gray-400 text-xs mt-1">
                {prochainCours.jour} — {prochainCours.heure_debut}
                {prochainCours.salle ? ` · ${prochainCours.salle}` : ''}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500">Aucun cours planifié</p>
          )}
        </div>

        {concoursVisibles.length === 0 && (
          <div className="rounded-2xl p-4 md:p-5 bg-white col-span-2 md:col-span-1" style={{ border: '1px solid #e5e7eb' }}>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Concours</p>
            <p className="text-sm text-gray-500">Aucun concours assigné</p>
          </div>
        )}
      </div>

      {/* ÉPREUVES ÉCRITES — une carte par concours daté, sur une seule ligne (jamais de carte orpheline) */}
      {echeances.length > 0 && (
        <div className={`grid grid-cols-1 gap-3 md:gap-4 mb-6 ${COLONNES_ECHEANCES[echeances.length] ?? COLONNES_ECHEANCES[4]}`}>
          {echeances.map(config => (
            <DecompteConcours key={config.codeConcours} dateConcours={config.dateConcours} nomConcours={config.nomConcours} />
          ))}
        </div>
      )}

      {/* RADARS — un par concours */}
      {concoursVisibles.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base md:text-lg" style={{ color: '#071020' }}>
                Vos compétences par matière
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Calculé à partir de vos notes
              </p>
            </div>
            <button onClick={() => navigate('/accueil/statistiques')}
              className="text-xs font-semibold" style={{ color: '#8A6D1A' }}>
              Voir les statistiques
            </button>
          </div>

          {loadingNotes ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <GrilleConcours>
              {concoursVisibles.map(config => (
                <CarteCompetences key={config.codeConcours} config={config} notes={notes} />
              ))}
            </GrilleConcours>
          )}
        </div>
      )}

      {/* PLANNING + MESSAGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

        {/* Planning de la semaine (données réelles) */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e7eb' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#071020' }}>Planning de la semaine</h2>
            <button onClick={() => navigate('/planning/emploi-du-temps')}
              className="text-xs font-semibold" style={{ color: '#8A6D1A' }}>
              Voir tout
            </button>
          </div>

          {loadingPlanning ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
            </div>
          ) : coursTriees.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500">Aucun cours dans votre planning</p>
              <p className="text-xs text-gray-300 mt-1">L'emploi du temps sera renseigné par votre administration</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {coursTriees.map((cours, i) => {
                const couleur = COULEUR_TYPE[cours.type] || '#9ca3af'
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: '#fafafa', border: '1px solid #e5e7eb' }}>
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: couleur }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{cours.matiere}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {cours.jour} {cours.heure_debut}–{cours.heure_fin}
                        {cours.salle ? ` · ${cours.salle}` : ''}
                      </p>
                      {cours.prof && (
                        <p className="text-xs italic mt-0.5 text-gray-500">{cours.prof}</p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-lg font-semibold flex-shrink-0"
                      style={{ background: '#f3f4f6', color: '#4b5563' }}>
                      {cours.type === 'cours' ? 'Cours' : cours.type === 'examen' ? 'Exam' : 'Évén.'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Boîte de réception */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #e5e7eb' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#071020' }}>Boîte de réception</h2>
            {messagesNonLus > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                {messagesNonLus} nouveau{messagesNonLus > 1 ? 'x' : ''}
              </span>
            )}
          </div>
          {loadingMsg ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Aucun message pour le moment</p>
              <p className="text-xs text-gray-300 mt-1">Vos professeurs vous contacteront ici</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 380 }}>
              {messages.map((msg, i) => (
                <div key={i}>
                  <div className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition"
                    onClick={() => ouvrirMessage(msg)}
                    style={{ background: msg.lu ? '#fafafa' : 'rgba(201,168,76,0.04)', border: `1px solid ${msg.lu ? '#f0ece0' : 'rgba(201,168,76,0.2)'}` }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                      style={{ background: '#0d1f3c' }}>
                      {msg.expediteur?.username?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {msg.expediteur?.prenom || msg.expediteur?.username || 'Professeur'}
                        </p>
                        <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {new Date(msg.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{msg.sujet}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{msg.contenu}</p>
                    </div>
                    {!msg.lu && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: '#C9A84C' }} />}
                  </div>
                  {messageOuvert?.id === msg.id && (
                    <div className="mx-1 p-4 rounded-xl mt-1"
                      style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)' }}>
                      <p className="text-xs font-bold mb-1" style={{ color: '#C9A84C' }}>{msg.sujet}</p>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{msg.contenu}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        De : {msg.expediteur?.prenom || ''} {msg.expediteur?.nom || msg.expediteur?.username} —
                        Le {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ========================
// COMPOSANT PRINCIPAL
// ========================
export default function TableauDeBord() {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (user?.role === 'admin') return <DashboardAdmin user={user} navigate={navigate} />
  if (user?.role === 'professeur') return <DashboardProfesseur user={user} navigate={navigate} />
  return <DashboardEtudiant user={user} navigate={navigate} />
}