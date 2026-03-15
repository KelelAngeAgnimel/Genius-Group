import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import API_URL from '../../config'

const ecoles = [
  {
    sigle: 'INP-HB',
    nom: 'Institut National Polytechnique Houphouët-Boigny',
    logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png',
    matieres: [
      { nom: 'Culture Scientifique', progression: 70, couleur: '#C9A84C' },
      { nom: 'Culture Générale', progression: 75, couleur: '#7B4CC9' },
      { nom: 'Culture Littéraire', progression: 65, couleur: '#C97B4C' },
    ],
    couleur: '#C9A84C',
    site: 'https://inphb.ci',
    roles: ['etudiant_inphb', 'etudiant_both']
  },
  {
    sigle: 'ESATIC',
    nom: 'Ecole Supérieure Africaine des TIC',
    logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
    matieres: [
      { nom: 'Mathématiques', progression: 70, couleur: '#4C7BC9' },
      { nom: 'Physique', progression: 70, couleur: '#4CC9A8' },
      { nom: 'Anglais', progression: 75, couleur: '#C94C7B' },
      { nom: 'Français', progression: 60, couleur: '#C9A84C' },
    ],
    couleur: '#4C7BC9',
    site: 'https://esatic.ci',
    roles: ['etudiant_esatic', 'etudiant_both']
  },
]

const evenements = [
  { date: 'Lun 16 Mar', heure: '08h00', titre: 'Cours Mathématiques', couleur: '#C9A84C' },
  { date: 'Lun 16 Mar', heure: '10h00', titre: 'Cours Anglais', couleur: '#4C7BC9' },
  { date: 'Mar 17 Mar', heure: '08h00', titre: 'Concours Blanc', couleur: '#C94C7B' },
  { date: 'Mer 18 Mar', heure: '14h00', titre: 'Culture Générale', couleur: '#7B4CC9' },
  { date: 'Jeu 19 Mar', heure: '09h00', titre: 'Réunion parents', couleur: '#4CC9A8' },
]

export default function Actualites() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loadingMsg, setLoadingMsg] = useState(true)
  const [messageOuvert, setMessageOuvert] = useState(null)

  useEffect(() => {
    chargerMessages()
  }, [])

  const chargerMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/messages/recus`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch (err) {
      console.error('Erreur messages:', err)
    } finally {
      setLoadingMsg(false)
    }
  }

  const marquerLu = async (id) => {
    try {
      await fetch(`${API_URL}/api/messages/${id}/lu`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, lu: true } : m))
    } catch (err) {
      console.error('Erreur marquer lu:', err)
    }
  }

  const ouvrirMessage = (msg) => {
    setMessageOuvert(messageOuvert?.id === msg.id ? null : msg)
    if (!msg.lu) marquerLu(msg.id)
  }

  const ecolesVisibles = ecoles.filter(e =>
    e.roles.includes(user?.role) ||
    ['professeur', 'admin'].includes(user?.role)
  )

  const messagesNonLus = messages.filter(m => !m.lu).length

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Tableau de bord
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Bonjour, {user?.prenom || user?.username}
        </h1>
        <p className="text-gray-400 text-sm mt-1">Bienvenue sur Genius — Mars 2026</p>
      </div>

      {/* CARTES RÉSUMÉ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="rounded-2xl p-4 md:p-5"
          style={{
            background: 'linear-gradient(135deg, #071020, #0d1f3c)',
            border: '1px solid rgba(201,168,76,0.3)',
          }}>
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'rgba(201,168,76,0.7)' }}>
            Messages non lus
          </p>
          <p className="text-4xl font-bold" style={{ color: '#C9A84C' }}>
            {loadingMsg ? '...' : messagesNonLus}
          </p>
          <p className="text-gray-400 text-xs mt-1">nouveaux messages</p>
        </div>

        <div className="rounded-2xl p-4 md:p-5 bg-white" style={{ border: '1px solid #f0ece0' }}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Prochain cours</p>
          <p className="text-sm font-bold" style={{ color: '#071020' }}>Mathématiques</p>
          <p className="text-gray-400 text-xs mt-1">Lun 16 Mar — 08h00</p>
        </div>

        <div className="rounded-2xl p-4 md:p-5 bg-white col-span-2 md:col-span-1"
          style={{ border: '1px solid #f0ece0' }}>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Prochain concours</p>
          <p className="text-sm font-bold" style={{ color: '#071020' }}>Concours CPGE</p>
          <p className="text-xs mt-1 font-semibold" style={{ color: '#C94C7B' }}>45 jours restants</p>
        </div>
      </div>

      {/* ESPACES DE PRÉPARATION */}
      {ecolesVisibles.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base md:text-lg" style={{ color: '#071020' }}>
              Vos espaces de préparation
            </h2>
            <button
              onClick={() => navigate('/accueil/statistiques')}
              className="text-xs font-semibold"
              style={{ color: '#C9A84C' }}>
              Voir statistiques →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {ecolesVisibles.map((ecole, i) => (
              <div key={i}
                className="bg-white rounded-2xl overflow-hidden"
                style={{ border: '1px solid #f0ece0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>

                <div className="p-5 flex items-center gap-4"
                  style={{
                    background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                    borderBottom: `2px solid ${ecole.couleur}`
                  }}>
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex items-center justify-center flex-shrink-0 p-1">
                    <img src={ecole.logo} alt={ecole.sigle}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentNode.innerHTML = `<span style="font-weight:bold;color:#C9A84C;font-size:14px">${ecole.sigle}</span>`
                      }} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{ecole.sigle}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{ecole.nom}</p>
                  </div>
                  <div className="ml-auto">
                    <a href={ecole.site} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold px-3 py-1 rounded-lg"
                      style={{ border: `1px solid ${ecole.couleur}40`, color: ecole.couleur }}>
                      Site officiel
                    </a>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Progression par matière
                  </p>
                  <div className="flex flex-col gap-3">
                    {ecole.matieres.map((m, j) => (
                      <div key={j}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{m.nom}</span>
                          <span className="text-xs font-bold" style={{ color: m.couleur }}>{m.progression}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100">
                          <div className="h-2 rounded-full"
                            style={{
                              width: `${m.progression}%`,
                              background: `linear-gradient(90deg, ${m.couleur}66, ${m.couleur})`
                            }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRILLE PLANNING + MESSAGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

        {/* PLANNING */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: '#071020' }}>Planning de la semaine</h2>
            <button
              onClick={() => navigate('/planning/emploi-du-temps')}
              className="text-xs font-semibold"
              style={{ color: '#C9A84C' }}>
              Voir tout →
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {evenements.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg"
                style={{ background: `${ev.couleur}08` }}>
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: ev.couleur }} />
                <div>
                  <p className="text-xs font-semibold text-gray-800">{ev.titre}</p>
                  <p className="text-xs text-gray-400">{ev.date} — {ev.heure}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOITE DE RÉCEPTION */}
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

          {loadingMsg && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
            </div>
          )}

          {!loadingMsg && messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">Aucun message pour le moment</p>
              <p className="text-xs text-gray-300 mt-1">Vos professeurs vous contacteront ici</p>
            </div>
          )}

          {!loadingMsg && messages.length > 0 && (
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '400px' }}>
              {messages.map((msg, i) => (
                <div key={i}>
                  <div
                    className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition"
                    onClick={() => ouvrirMessage(msg)}
                    style={{
                      background: msg.lu ? '#fafafa' : 'rgba(201,168,76,0.04)',
                      border: `1px solid ${msg.lu ? '#f0ece0' : 'rgba(201,168,76,0.2)'}`
                    }}>
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
                    {!msg.lu && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                        style={{ background: '#C9A84C' }} />
                    )}
                  </div>

                  {/* Message ouvert */}
                  {messageOuvert?.id === msg.id && (
                    <div className="mx-1 p-4 rounded-xl mt-1"
                      style={{
                        background: 'rgba(201,168,76,0.04)',
                        border: '1px solid rgba(201,168,76,0.15)'
                      }}>
                      <p className="text-xs font-bold mb-1" style={{ color: '#C9A84C' }}>
                        {msg.sujet}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {msg.contenu}
                      </p>
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