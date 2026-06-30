import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import API_URL from '../../config'

// =====================
// TABLEAU DE BORD ADMIN
// =====================
function DashboardAdmin({ user, token, navigate }) {
  const [stats, setStats] = useState({ total: 0, etudiants: 0, professeurs: 0, admins: 0 })
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const charger = async () => {
      try {
        const [usersRes, msgRes] = await Promise.all([
          fetch(`${API_URL}/api/users/all`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/messages/recus`, { headers: { Authorization: `Bearer ${token}` } })
        ])
        const usersData = await usersRes.json()
        const msgData = await msgRes.json()
        if (usersData.users) {
          const users = usersData.users
          setStats({
            total: users.length,
            etudiants: users.filter(u => u.role.startsWith('etudiant')).length,
            professeurs: users.filter(u => u.role === 'professeur').length,
            admins: users.filter(u => u.role === 'admin').length,
          })
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
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Bonjour, {user?.prenom || user?.username}
        </h1>
        <p className="text-gray-400 text-sm mt-1">Vue administrateur — Genius Group</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total utilisateurs', valeur: stats.total, couleur: '#C9A84C' },
          { label: 'Etudiants', valeur: stats.etudiants, couleur: '#4C7BC9' },
          { label: 'Professeurs', valeur: stats.professeurs, couleur: '#4CC9A8' },
          { label: 'Admins', valeur: stats.admins, couleur: '#C94C7B' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 md:p-5" style={{ border: `1px solid ${s.couleur}20` }}>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-3xl md:text-4xl font-bold" style={{ color: s.couleur }}>{loading ? '...' : s.valeur}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { titre: 'Creer un compte', desc: 'Ajouter un etudiant, professeur ou admin', couleur: '#C9A84C', path: '/admin/creer' },
          { titre: 'Gerer les comptes', desc: 'Voir et supprimer les utilisateurs', couleur: '#4C7BC9', path: '/admin/utilisateurs' },
          { titre: 'Espace professeur', desc: 'Publier des ressources et envoyer des messages', couleur: '#4CC9A8', path: '/professeur' },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl p-5 cursor-pointer transition hover:shadow-lg"
            onClick={() => navigate(c.path)}
            style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', border: `1px solid ${c.couleur}40` }}>
            <p className="font-bold text-white mb-1">{c.titre}</p>
            <p className="text-xs text-gray-400">{c.desc}</p>
            <p className="text-xs mt-3 font-semibold" style={{ color: c.couleur }}>Acceder →</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
        <h2 className="font-bold text-base mb-4" style={{ color: '#071020' }}>Messages recus ({messages.length})</h2>
        {messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Aucun message</p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.slice(0, 5).map((msg, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#f8f7f4', border: '1px solid #f0ece0' }}>
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

// =========================
// TABLEAU DE BORD PROFESSEUR
// =========================
function DashboardProfesseur({ user, token, navigate }) {
  const [ressources, setRessources] = useState([])
  const [etudiants, setEtudiants] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const charger = async () => {
      try {
        const [resRes, usersRes, msgRes] = await Promise.all([
          fetch(`${API_URL}/api/ressources/toutes`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/users/all`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/messages/envoyes`, { headers: { Authorization: `Bearer ${token}` } })
        ])
        const resData = await resRes.json()
        const usersData = await usersRes.json()
        const msgData = await msgRes.json()
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
        <p className="text-gray-400 text-sm mt-1">Espace enseignant — Genius Group</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Ressources publiees', valeur: ressources.filter(r => r.visible).length, couleur: '#C9A84C' },
          { label: 'Ressources masquees', valeur: ressources.filter(r => !r.visible).length, couleur: '#9ca3af' },
          { label: 'Etudiants', valeur: etudiants.length, couleur: '#4C7BC9' },
          { label: 'Messages envoyes', valeur: messages.length, couleur: '#4CC9A8' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 md:p-5" style={{ border: `1px solid ${s.couleur}20` }}>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-3xl md:text-4xl font-bold" style={{ color: s.couleur }}>{loading ? '...' : s.valeur}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { titre: 'Publier une ressource', desc: 'Ajouter un PDF, une video ou un exercice', couleur: '#4CC9A8', path: '/professeur' },
          { titre: 'Envoyer un message', desc: 'Contacter un etudiant directement', couleur: '#C9A84C', path: '/professeur' },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl p-5 cursor-pointer transition hover:shadow-lg"
            onClick={() => navigate(c.path)}
            style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', border: `1px solid ${c.couleur}40` }}>
            <p className="font-bold text-white mb-1">{c.titre}</p>
            <p className="text-xs text-gray-400">{c.desc}</p>
            <p className="text-xs mt-3 font-semibold" style={{ color: c.couleur }}>Acceder →</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// RADAR CHART FIFA (toile d'araignée SVG)
// ══════════════════════════════════════════
function RadarFIFA({ matieres, couleur }) {
  const cx = 130, cy = 130, r = 90
  const n = matieres.length

  const point = (index, valeur) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2
    const dist = (valeur / 100) * r
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) }
  }

  const polygone = (pct) =>
    matieres.map((_, i) => { const p = point(i, pct); return `${p.x},${p.y}` }).join(' ')

  const dataPoints = matieres.map((m, i) => {
    const p = point(i, m.valeur)
    return `${p.x},${p.y}`
  }).join(' ')

  const labelPoint = (index) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2
    const dist = r + 26
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="260" height="260" viewBox="0 0 260 260" style={{ overflow: 'visible' }}>

        {/* Toiles de fond : 25%, 50%, 75%, 100% */}
        {[25, 50, 75, 100].map((pct, i) => (
          <polygon key={i} points={polygone(pct)} fill="none"
            stroke={pct === 100 ? `${couleur}60` : `${couleur}20`}
            strokeWidth={pct === 100 ? 1.5 : 1} />
        ))}

        {/* Axes */}
        {matieres.map((_, i) => {
          const a = point(i, 100)
          return <line key={i} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke={`${couleur}30`} strokeWidth="1" />
        })}

        {/* Zone colorée des données */}
        <polygon points={dataPoints}
          fill={`${couleur}22`} stroke={couleur} strokeWidth="2.5" strokeLinejoin="round" />

        {/* Points sur chaque axe */}
        {matieres.map((m, i) => {
          const p = point(i, m.valeur)
          return <circle key={i} cx={p.x} cy={p.y} r="5" fill={couleur} stroke="white" strokeWidth="2.5" />
        })}

        {/* Labels des matières */}
        {matieres.map((m, i) => {
          const lp = labelPoint(i)
          const mots = m.nom.split(' ')
          return (
            <text key={i} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fontWeight="700" fill="#071020">
              {mots.map((mot, wi) => (
                <tspan key={wi} x={lp.x} dy={wi === 0 ? (mots.length > 1 ? `${lp.y - (mots.length - 1) * 6}` : lp.y) : '13'} y={wi === 0 ? lp.y - (mots.length > 1 ? 6 : 0) : undefined}>
                  {mot}
                </tspan>
              ))}
            </text>
          )
        })}

        {/* Scores au-dessus de chaque point */}
        {matieres.map((m, i) => {
          const p = point(i, m.valeur)
          if (m.valeur === 0) return null
          return (
            <text key={i} x={p.x} y={p.y - 12}
              textAnchor="middle" fontSize="8.5" fontWeight="900" fill={couleur}>
              {m.note !== null ? `${m.note}/20` : '—'}
            </text>
          )
        })}
      </svg>

      {/* Légende */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', justifyContent: 'center', marginTop: 2 }}>
        {matieres.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.valeur > 0 ? couleur : '#d1d5db', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: m.valeur > 0 ? '#374151' : '#9ca3af', fontWeight: 600 }}>
              {m.nom} {m.note !== null ? `(${m.note}/20)` : '(non noté)'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// CARTE FIFA AVEC DONNÉES RÉELLES
// ══════════════════════════════════════════
function CarteCompetencesFIFA({ config, notes }) {
  // Pour chaque matière du concours, calcule la moyenne des notes /20 → % sur 100
  const matiereAvecNotes = config.matieres.map(matiere => {
    const notesMatiere = notes.filter(n =>
      n.concours === config.codeConcours &&
      n.matiere.toLowerCase().trim() === matiere.toLowerCase().trim()
    )
    if (notesMatiere.length === 0) {
      return { nom: matiere, note: null, valeur: 0 }
    }
    const moyenne = notesMatiere.reduce((acc, n) => acc + parseFloat(n.note), 0) / notesMatiere.length
    return {
      nom: matiere,
      note: Math.round(moyenne * 10) / 10,
      valeur: Math.round((moyenne / 20) * 100)
    }
  })

  // Note globale = moyenne des matières notées uniquement
  const matiereNotees = matiereAvecNotes.filter(m => m.note !== null)
  const noteGlobale = matiereNotees.length > 0
    ? Math.round(matiereNotees.reduce((acc, m) => acc + m.valeur, 0) / matiereNotees.length)
    : null

  const couleurCarte = noteGlobale === null ? '#9ca3af'
    : noteGlobale >= 80 ? '#C9A84C'
    : noteGlobale >= 65 ? '#4CC9A8'
    : noteGlobale >= 50 ? '#4C7BC9'
    : '#C94C7B'

  return (
    <div style={{
      background: 'linear-gradient(145deg, #071020, #0d1f3c)',
      borderRadius: 20, overflow: 'hidden',
      border: `1px solid ${couleurCarte}40`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.15)`
    }}>
      {/* En-tête */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: `1px solid ${couleurCarte}30`,
        background: `linear-gradient(135deg, ${couleurCarte}12, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 12,
            background: 'white', padding: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden'
          }}>
            <img src={config.logo} alt={config.sigle}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentNode.innerHTML = `<span style="font-weight:800;color:#C9A84C;font-size:11px">${config.sigle}</span>`
              }}
            />
          </div>
          <div>
            <p style={{ color: couleurCarte, fontWeight: 800, fontSize: 15, margin: 0, letterSpacing: '0.05em' }}>
              {config.sigle}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, margin: '2px 0 0 0' }}>
              {config.nom}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '1px 0 0 0' }}>
              {matiereNotees.length}/{config.matieres.length} matière(s) notée(s)
            </p>
          </div>
        </div>

        {/* Note globale style FIFA */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: `${couleurCarte}18`, borderRadius: 12, padding: '8px 14px',
          border: `1px solid ${couleurCarte}40`, minWidth: 62
        }}>
          <span style={{ color: couleurCarte, fontSize: 26, fontWeight: 900, lineHeight: 1 }}>
            {noteGlobale !== null ? noteGlobale : '—'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 600, letterSpacing: '0.1em' }}>
            GLOBAL
          </span>
        </div>
      </div>

      {/* Radar */}
      <div style={{ padding: '12px 8px 16px', display: 'flex', justifyContent: 'center' }}>
        {matiereNotees.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: 0 }}>
              Aucune note enregistrée
            </p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: '6px 0 0 0' }}>
              Le diagramme apparaîtra dès que vos professeurs auront saisi des notes
            </p>
          </div>
        ) : (
          <RadarFIFA matieres={matiereAvecNotes} couleur={couleurCarte} />
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '0 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, margin: 0 }}>
          Données issues de vos évaluations
        </p>
        <a href={config.site} target="_blank" rel="noopener noreferrer"
          style={{
            fontSize: 10, fontWeight: 600, color: couleurCarte,
            textDecoration: 'none', border: `1px solid ${couleurCarte}40`,
            padding: '3px 10px', borderRadius: 20
          }}>
          Site officiel →
        </a>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// DÉCOMPTE DYNAMIQUE VERS LE CONCOURS
// ══════════════════════════════════════════
function DecompteConcours({ dateConcours, nomConcours }) {
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
  const joursRest = jours % 7
  const couleur = jours <= 30 ? '#C94C7B' : jours <= 60 ? '#C9A84C' : '#4CC9A8'

  const dateDebut = new Date('2026-01-01')
  const dateFin = new Date(dateConcours)
  const auj = new Date()
  const pct = Math.min(100, Math.max(0, Math.round(((auj - dateDebut) / (dateFin - dateDebut)) * 100)))

  return (
    <div className="rounded-2xl p-4 md:p-5 bg-white col-span-2 md:col-span-1"
      style={{ border: `1px solid ${couleur}30` }}>
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Prochain concours</p>
      <p className="text-sm font-bold" style={{ color: '#071020' }}>{nomConcours}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
        <span style={{ fontSize: 30, fontWeight: 900, color: couleur, lineHeight: 1 }}>{jours}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: couleur }}>jours</span>
      </div>
      <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
        {semaines > 0 ? `${semaines}sem ${joursRest}j · ` : ''} 10 août 2026
      </p>
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 9, color: '#d1d5db' }}>Jan 2026</span>
          <span style={{ fontSize: 9, color: '#d1d5db' }}>Août 2026</span>
        </div>
        <div style={{ width: '100%', height: 5, background: '#f0ece0', borderRadius: 3 }}>
          <div style={{ width: `${pct}%`, height: 5, background: `linear-gradient(90deg, ${couleur}80, ${couleur})`, borderRadius: 3 }} />
        </div>
        <p style={{ fontSize: 9, color: '#d1d5db', marginTop: 2, textAlign: 'right' }}>{pct}% écoulé</p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// CONFIG DES CONCOURS
// ══════════════════════════════════════════
const CONCOURS_CONFIG = [
  {
    sigle: 'INP-HB',
    codeConcours: 'inphb',
    nom: 'Institut National Polytechnique Houphouët-Boigny',
    logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png',
    // Matières exactement telles qu'elles sont saisies dans la table notes
    matieres: ['Culture Scientifique', 'Culture Générale', 'Culture Littéraire'],
    couleur: '#C9A84C',
    site: 'https://inphb.ci',
    roles: ['etudiant_inphb', 'etudiant_both'],
    dateConcours: '2026-08-10',
    nomConcours: 'Concours INP-HB'
  },
  {
    sigle: 'ESATIC',
    codeConcours: 'esatic',
    nom: 'Ecole Supérieure Africaine des TIC',
    logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
    matieres: ['Mathématiques', 'Physique', 'Anglais', 'Français'],
    couleur: '#4C7BC9',
    site: 'https://esatic.ci',
    roles: ['etudiant_esatic', 'etudiant_both'],
    dateConcours: '2026-08-10',
    nomConcours: 'Concours ESATIC'
  },
]

const EVENEMENTS = [
  { date: 'Lun 16 Mar', heure: '08h00', titre: 'Cours Mathématiques', couleur: '#C9A84C' },
  { date: 'Lun 16 Mar', heure: '10h00', titre: 'Cours Anglais', couleur: '#4C7BC9' },
  { date: 'Mar 17 Mar', heure: '08h00', titre: 'Concours Blanc', couleur: '#C94C7B' },
  { date: 'Mer 18 Mar', heure: '14h00', titre: 'Culture Générale', couleur: '#7B4CC9' },
  { date: 'Jeu 19 Mar', heure: '09h00', titre: 'Réunion parents', couleur: '#4CC9A8' },
]

// ══════════════════════════════════════════
// TABLEAU DE BORD ÉTUDIANT
// ══════════════════════════════════════════
function DashboardEtudiant({ user, token, navigate }) {
  const [messages, setMessages] = useState([])
  const [notes, setNotes] = useState([])
  const [loadingMsg, setLoadingMsg] = useState(true)
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [messageOuvert, setMessageOuvert] = useState(null)

  useEffect(() => {
    chargerMessages()
    chargerNotes()
  }, [])

  const chargerMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/messages/recus`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch (err) { console.error(err) }
    finally { setLoadingMsg(false) }
  }

  const chargerNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notes/mes-notes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.notes) setNotes(data.notes)
    } catch (err) { console.error(err) }
    finally { setLoadingNotes(false) }
  }

  const marquerLu = async (id) => {
    try {
      await fetch(`${API_URL}/api/messages/${id}/lu`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, lu: true } : m))
    } catch (err) { console.error(err) }
  }

  const ouvrirMessage = (msg) => {
    setMessageOuvert(messageOuvert?.id === msg.id ? null : msg)
    if (!msg.lu) marquerLu(msg.id)
  }

  // Concours visibles selon le rôle de l'étudiant
  const concoursVisibles = CONCOURS_CONFIG.filter(c => c.roles.includes(user?.role))
  const messagesNonLus = messages.filter(m => !m.lu).length
  const concoursPrincipal = concoursVisibles[0]

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TÊTE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Tableau de bord</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Bonjour, {user?.prenom || user?.username} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* CARTES STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="rounded-2xl p-4 md:p-5"
          style={{ background: 'linear-gradient(135deg, #071020, #0d1f3c)', border: '1px solid rgba(201,168,76,0.3)' }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'rgba(201,168,76,0.7)' }}>Messages</p>
          <p className="text-4xl font-bold" style={{ color: '#C9A84C' }}>{loadingMsg ? '...' : messagesNonLus}</p>
          <p className="text-gray-400 text-xs mt-1">{messagesNonLus > 0 ? 'non lus' : 'aucun nouveau'}</p>
        </div>

        <div className="rounded-2xl p-4 md:p-5 bg-white" style={{ border: '1px solid #f0ece0' }}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Prochain cours</p>
          <p className="text-sm font-bold" style={{ color: '#071020' }}>Mathématiques</p>
          <p className="text-gray-400 text-xs mt-1">Lun 16 Mar — 08h00</p>
        </div>

        {concoursPrincipal && (
          <DecompteConcours
            dateConcours={concoursPrincipal.dateConcours}
            nomConcours={concoursPrincipal.nomConcours}
          />
        )}
      </div>

      {/* RADARS FIFA — un par concours */}
      {concoursVisibles.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base md:text-lg" style={{ color: '#071020' }}>
                Vos compétences par matière
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Basé sur vos notes réelles · {concoursVisibles.length > 1 ? 'Un radar par concours' : concoursVisibles[0].sigle}
              </p>
            </div>
            <button onClick={() => navigate('/accueil/statistiques')}
              className="text-xs font-semibold" style={{ color: '#C9A84C' }}>
              Voir statistiques →
            </button>
          </div>

          {loadingNotes ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <div className={`grid gap-4 md:gap-6 ${concoursVisibles.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-md'}`}>
              {concoursVisibles.map((config, i) => (
                <CarteCompetencesFIFA key={i} config={config} notes={notes} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* PLANNING + MESSAGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#071020' }}>Planning de la semaine</h2>
            <button onClick={() => navigate('/planning/emploi-du-temps')}
              className="text-xs font-semibold" style={{ color: '#C9A84C' }}>Voir tout →</button>
          </div>
          <div className="flex flex-col gap-3">
            {EVENEMENTS.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: `${ev.couleur}08` }}>
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: ev.couleur }} />
                <div>
                  <p className="text-xs font-semibold text-gray-800">{ev.titre}</p>
                  <p className="text-xs text-gray-400">{ev.date} — {ev.heure}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#071020' }}>Boite de réception</h2>
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
              <p className="text-sm text-gray-400">Aucun message pour le moment</p>
              <p className="text-xs text-gray-300 mt-1">Vos professeurs vous contacteront ici</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '400px' }}>
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
                      <p className="text-xs text-gray-400 mt-2">
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
  const { user, token } = useAuth()
  const navigate = useNavigate()
  if (user?.role === 'admin') return <DashboardAdmin user={user} token={token} navigate={navigate} />
  if (user?.role === 'professeur') return <DashboardProfesseur user={user} token={token} navigate={navigate} />
  return <DashboardEtudiant user={user} token={token} navigate={navigate} />
}