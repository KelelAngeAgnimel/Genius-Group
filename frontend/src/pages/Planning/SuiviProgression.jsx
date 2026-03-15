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

// Progression fictive par étudiant (à remplacer par vraies notes plus tard)
const getProgression = (etudiantId, concours) => {
  const seed = etudiantId.charCodeAt(0) + etudiantId.charCodeAt(1)
  return matieres[concours]?.map(m => ({
    ...m,
    progression: Math.min(95, Math.max(30, (seed * (m.nom.length + 1)) % 60 + 35))
  })) || []
}

function SuiviProfesseur({ token }) {
  const [etudiants, setEtudiants] = useState([])
  const [loading, setLoading] = useState(true)
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

  const getMoyenne = (etudiantId, concours) => {
    const prog = getProgression(etudiantId, concours)
    if (!prog.length) return 0
    return Math.round(prog.reduce((a, m) => a + m.progression, 0) / prog.length)
  }

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
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
            onClick={() => setEtudiantActif(null)}
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
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                style={{ background: `${roleCouleur[etudiantActif.role]}30`, border: `2px solid ${roleCouleur[etudiantActif.role]}` }}>
                {etudiantActif.username?.[0]?.toUpperCase()}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-white">
                  {etudiantActif.prenom || ''} {etudiantActif.nom || etudiantActif.username}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{etudiantActif.username} — {etudiantActif.matricule}</p>
                <span className="text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded-full"
                  style={{ background: `${roleCouleur[etudiantActif.role]}20`, color: roleCouleur[etudiantActif.role] }}>
                  {roleLabel[etudiantActif.role]}
                </span>
              </div>
            </div>
          </div>

          {/* Progression par concours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getConcours(etudiantActif.role).map((concours, ci) => {
              const prog = getProgression(etudiantActif.id, concours)
              const moyenne = getMoyenne(etudiantActif.id, concours)
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
                      <p className="text-xs text-gray-400 mt-0.5">Progression globale</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold" style={{ color: couleur }}>{moyenne}%</p>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-4">
                    {prog.map((m, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{m.nom}</span>
                          <span className="text-xs font-bold" style={{ color: m.couleur }}>{m.progression}%</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-gray-100">
                          <div className="h-2.5 rounded-full transition-all duration-700"
                            style={{
                              width: `${m.progression}%`,
                              background: `linear-gradient(90deg, ${m.couleur}66, ${m.couleur})`
                            }} />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-xs text-gray-300">Débutant</span>
                          <span className="text-xs text-gray-300">Expert</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Analyse rapide */}
                  <div className="px-5 pb-5">
                    <div className="p-3 rounded-xl"
                      style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}>
                      <p className="text-xs font-bold mb-2" style={{ color: '#C9A84C' }}>Analyse</p>
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        Point fort : {prog.reduce((a, b) => a.progression > b.progression ? a : b).nom}
                      </p>
                      <p className="text-xs text-gray-600">
                        A renforcer : {prog.reduce((a, b) => a.progression < b.progression ? a : b).nom}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      ) : (
        // LISTE DES ÉTUDIANTS
        <div>
          {/* Filtres */}
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
            <div className="flex gap-2">
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
                    onClick={() => setEtudiantActif(etudiant)}>

                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                        style={{ background: `${couleur}20`, border: `2px solid ${couleur}40`, color: couleur }}>
                        {etudiant.username?.[0]?.toUpperCase()}
                      </div>

                      {/* Infos */}
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
                        <p className="text-xs text-gray-400 mt-0.5">{etudiant.matricule} — {etudiant.username}</p>

                        {/* Mini barres de progression */}
                        <div className="flex gap-3 mt-2 flex-wrap">
                          {concours.map((c, ci) => {
                            const moy = getMoyenne(etudiant.id, c)
                            const coul = c === 'INP-HB' ? '#C9A84C' : '#4C7BC9'
                            return (
                              <div key={ci} className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{c}</span>
                                <div className="w-24 h-1.5 rounded-full bg-gray-100">
                                  <div className="h-1.5 rounded-full"
                                    style={{
                                      width: `${moy}%`,
                                      background: coul
                                    }} />
                                </div>
                                <span className="text-xs font-bold" style={{ color: coul }}>{moy}%</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Flèche */}
                      <span className="text-xs flex-shrink-0 px-2 py-1 rounded-lg"
                        style={{ background: `${couleur}10`, color: couleur }}>
                        Voir détail →
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
const ecoles = [
  {
    sigle: 'INP-HB',
    nom: 'Institut National Polytechnique Houphouët-Boigny',
    logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png',
    couleur: '#C9A84C',
    site: 'https://inphb.ci',
    matieres: [
      { nom: 'Culture Scientifique', progression: 68, couleur: '#4CC9A8' },
      { nom: 'Culture Générale', progression: 75, couleur: '#7B4CC9' },
      { nom: 'Culture Littéraire', progression: 65, couleur: '#C97B4C' },
    ],
    roles: ['etudiant_inphb', 'etudiant_both'],
  },
  {
    sigle: 'ESATIC',
    nom: 'Ecole Supérieure Africaine des TIC',
    logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
    couleur: '#4C7BC9',
    site: 'https://esatic.ci',
    matieres: [
      { nom: 'Mathématiques', progression: 70, couleur: '#C9A84C' },
      { nom: 'Physique', progression: 70, couleur: '#4CC9A8' },
      { nom: 'Anglais', progression: 75, couleur: '#C94C7B' },
      { nom: 'Français', progression: 60, couleur: '#4C7BC9' },
    ],
    roles: ['etudiant_esatic', 'etudiant_both'],
  },
]

function SuiviEtudiant({ user }) {
  const [ecoleSelectionnee, setEcoleSelectionnee] = useState(null)
  const ecoleActive = ecoles.find(e => e.sigle === ecoleSelectionnee)
  const ecolesVisibles = ecoles.filter(e => e.roles.includes(user?.role))

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
          {ecolesVisibles.map((ecole, i) => (
            <div key={i}
              onClick={() => setEcoleSelectionnee(ecole.sigle)}
              className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                border: `2px solid ${ecole.couleur}40`,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>

              <div className="flex items-center justify-center py-16 px-8">
                <img src={ecole.logo} alt={ecole.sigle}
                  className="object-contain"
                  style={{ maxHeight: '140px', maxWidth: '260px' }}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentNode.innerHTML = `<span style="font-size:48px;font-weight:bold;color:#C9A84C">${ecole.sigle}</span>`
                  }} />
              </div>

              <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${ecole.couleur}, transparent)` }} />
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{ecole.sigle}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ecole.nom}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg"
                  style={{ background: `${ecole.couleur}20`, color: ecole.couleur }}>
                  Voir progression
                </span>
              </div>
            </div>
          ))}
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
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Progression globale</p>
                <p className="text-5xl font-bold" style={{ color: ecoleActive.couleur }}>
                  {Math.round(ecoleActive.matieres.reduce((a, m) => a + m.progression, 0) / ecoleActive.matieres.length)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f0ece0' }}>
            <h3 className="font-bold text-base mb-6" style={{ color: '#071020' }}>
              Progression par matière
            </h3>
            <div className="flex flex-col gap-6">
              {ecoleActive.matieres.map((m, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{m.nom}</span>
                    <span className="text-sm font-bold" style={{ color: m.couleur }}>{m.progression}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-gray-100">
                    <div className="h-3 rounded-full transition-all duration-700"
                      style={{
                        width: `${m.progression}%`,
                        background: `linear-gradient(90deg, ${m.couleur}66, ${m.couleur})`
                      }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">Débutant</span>
                    <span className="text-xs text-gray-400">Expert</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

  return <SuiviEtudiant user={user} />
}