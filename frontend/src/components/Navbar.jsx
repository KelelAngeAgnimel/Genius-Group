import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { libelleUtilisateur, CODES_CONCOURS } from '../lib/concours'
import { useConcours } from '../hooks/useConcours'

// ── Icônes SVG monochromes (héritent de la couleur du texte via currentColor) ──
const ICONS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-5.5h5V20" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>,
  book: <><path d="M6.5 4H18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4Z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H19" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
  lifebuoy: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="M5.5 5.5 9 9M15 15l3.5 3.5M18.5 5.5 15 9M9 15l-3.5 3.5" /></>,
  presentation: <><path d="M3 4h18" /><path d="M4 4v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4" /><path d="M12 15v4M9 21l3-2 3 2" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h8M16 17h4" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="14" cy="17" r="2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>,
  newspaper: <><path d="M4 5h13v15H5a1 1 0 0 1-1-1V5Z" /><path d="M17 9h3v9a2 2 0 0 1-2 2" /><path d="M7 8.5h7M7 12h7M7 15.5h4" /></>,
  bookOpen: <><path d="M12 6.5C10 5 7 5 4 5.5v13c3-.5 6-.5 8 1" /><path d="M12 6.5C14 5 17 5 20 5.5v13c-3-.5-6-.5-8 1" /><path d="M12 6.5v13" /></>,
  barChart: <><path d="M4 21h16" /><path d="M6 21V11M12 21V4M18 21v-7" /></>,
  calendarDays: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /><path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" /></>,
  trendingUp: <><path d="M3 16l5-5 4 4 8-8" /><path d="M16 7h4v4" /></>,
  pencil: <><path d="M4 20l1-4L16 5l3 3L8 19l-4 1Z" /><path d="M14 7l3 3" /></>,
  fileText: <><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M13 3v6h6" /><path d="M9 13h6M9 16.5h6" /></>,
  cap: <><path d="M12 4 2 9l10 5 10-5-10-5Z" /><path d="M6 11.5V16c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5" /><path d="M22 9v5" /></>,
  video: <><rect x="3" y="6" width="12.5" height="12" rx="2" /><path d="M15.5 10l5-3v10l-5-3" /></>,
  clipboard: <><rect x="6" y="4.5" width="12" height="16" rx="2" /><path d="M9 4.5h6v-1a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v1Z" /><path d="M9 11h6M9 14.5h4" /></>,
  checkSquare: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>,
  helpCircle: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.4 2.4 0 1 1 3.3 2.3c-.8.4-1.4 1-1.4 1.9" /><path d="M12 16.7h.01" /></>,
  mail: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 7l8.5 5.5L20.5 7" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z" /></>,
  heart: <><path d="M12 20.5C7 17 3 13.5 3 9.2 3 6.6 5 4.5 7.5 4.5c1.7 0 3.2 1 4.5 2.5 1.3-1.5 2.8-2.5 4.5-2.5C19 4.5 21 6.6 21 9.2c0 4.3-4 7.8-9 11.3Z" /></>,
  message: <><path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8.5L4 20.5V6.5a1 1 0 0 1 0-1Z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" /></>,
}

function Icon({ name, className = 'w-4 h-4' }) {
  const contenu = ICONS[name]
  if (!contenu) return null
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {contenu}
    </svg>
  )
}

// Menu regroupé par usage. `id` / `concours` servent à masquer ce qui ne concerne pas l'utilisateur (voir `visible`).
const menuItems = [
  {
    label: 'Accueil',
    icon: 'home',
    dropdown: [
      { label: 'Mon Espace', icon: 'user', path: '/accueil/tableau-de-bord' },
      { label: 'Actualités & Concours', icon: 'newspaper', path: '/accueil/actualites' },
      { label: 'Guide de Préparation', icon: 'bookOpen', path: '/accueil/guide' },
      { label: 'Mes Statistiques', icon: 'barChart', path: '/accueil/statistiques' },
    ]
  },
  {
    label: 'Mes cours',
    icon: 'calendar',
    dropdown: [
      { label: 'Emploi du Temps', icon: 'calendarDays', path: '/planning/emploi-du-temps' },
      { label: 'Cours à Distance', icon: 'video', path: '/outils/teams' },
      { label: 'Agenda Personnel', icon: 'pencil', path: '/planning/planning-perso' },
      { label: 'Séances et auto-évaluations', icon: 'calendarDays', path: '/outils/seances', id: 'seances' },
    ]
  },
  {
    label: 'Mes évaluations',
    icon: 'target',
    dropdown: [
      { label: 'Évaluations', icon: 'fileText', path: '/outils/evaluations' },
      { label: 'Quiz', icon: 'checkSquare', path: '/outils/genius-eval', id: 'quiz' },
    ]
  },
  {
    label: 'Mes progrès',
    icon: 'trendingUp',
    dropdown: [
      { label: 'Notes', icon: 'clipboard', path: '/outils/notes' },
      { label: 'Suivi de Progression', icon: 'trendingUp', path: '/planning/suivi-progression' },
      { label: 'Mes compétences', icon: 'target', path: '/outils/competences', id: 'competences' },
      { label: 'Élèves en difficulté', icon: 'trendingUp', path: '/outils/difficultes', id: 'difficultes' },
    ]
  },
  {
    label: 'Ressources',
    icon: 'book',
    dropdown: [
      { label: 'Tous mes documents', icon: 'fileText', path: '/ressources', id: 'documents' },
      { label: 'INP-HB', icon: 'cap', path: '/ressources/inphb', concours: 'inphb' },
      { label: 'ESATIC', icon: 'cap', path: '/ressources/esatic', concours: 'esatic' },
      { label: 'CME', icon: 'cap', path: '/ressources/cme', concours: 'cme' },
      { label: 'ENSEA', icon: 'cap', path: '/ressources/ensea', concours: 'ensea' },
    ]
  },
  {
    label: 'Aide',
    icon: 'lifebuoy',
    dropdown: [
      { label: 'Guide d’utilisation', icon: 'bookOpen', path: '/aides/guide-utilisation' },
      { label: 'Questions Fréquentes', icon: 'helpCircle', path: '/aides/faq-generale' },
      { label: 'Nous Contacter', icon: 'mail', path: '/aides/contacts' },
      { label: 'Guide d\'Orientation', icon: 'compass', path: '/aides/orientation' },
      { label: 'Préparation Mentale', icon: 'heart', path: '/aides/preparation-mentale' },
      { label: 'Assistant IA', icon: 'message', path: '/aides/chatbot' },
    ]
  },
]

// Ce qui ne concerne pas l'utilisateur est masqué :
//  - Quiz : seulement si un de ses concours propose des quiz automatiques
//  - Mes compétences : élèves (le personnel suit les élèves depuis son espace)
//  - Séances, élèves en difficulté : personnel
//  - Ressources par concours : les concours de l'élève (le personnel voit ceux auxquels il a accès)
function visible(sub, ctx) {
  switch (sub.id) {
    case 'quiz': return ctx.peutVoirQuiz
    case 'seances':
    case 'difficultes': return ctx.estPersonnel
    case 'competences': return ctx.estEtudiant
    // « Tous mes documents » double l'entrée du concours quand il n'y en a qu'un seul
    case 'documents': return CODES_CONCOURS.filter(code => ctx.peutAcceder(code)).length > 1
    default: return sub.concours ? ctx.peutAcceder(sub.concours) : true
  }
}

// Un groupe est actif quand la page courante est l'une de ses entrées
const groupeActif = (item, pathname) => item.dropdown.some(sub => pathname === sub.path.split('?')[0] || (sub.path.length > 1 && pathname.startsWith(sub.path.split('?')[0] + '/')))

function DropdownMenu({ items, onClose }) {
  return (
    <div className="absolute top-full left-0 mt-1 w-56 rounded-xl shadow-xl z-50 overflow-hidden"
      style={{ background: '#0d1f3c', border: '1px solid rgba(201,168,76,0.2)' }}>
      {items.map((item, i) => (
        <Link key={i} to={item.path} onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-all"
          style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Icon name={item.icon} className="w-4 h-4 flex-shrink-0 opacity-80" />
          {item.label}
        </Link>
      ))}
    </div>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { peutVoirQuiz, aConcours, estPersonnel, peutAcceder } = useConcours()
  const menus = menuItems.map(m => ({
    ...m,
    dropdown: m.dropdown.filter(sub => visible(sub, { peutVoirQuiz, aConcours, estPersonnel, peutAcceder }))
  })).filter(m => m.dropdown.length > 0)
  const navigate = useNavigate()
  const location = useLocation()
  const [openMenu, setOpenMenu] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const navRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }
  const isProfOrAdmin = ['professeur', 'admin'].includes(user?.role)
  const isAdmin = user?.role === 'admin'

  return (
    <nav ref={navRef} className="sticky top-0 z-50 shadow-lg"
      style={{ background: '#071020', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>

      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">

        {/* Logo */}
        <Link to="/accueil" className="flex items-center gap-2 flex-shrink-0">
          <img src="/photo/logo.png" alt="Genius Group"
            className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
            style={{ border: '1px solid rgba(201,168,76,0.3)' }} />
          <div className="hidden sm:block">
            <p className="font-bold tracking-widest text-xs leading-tight" style={{ color: '#C9A84C' }}>GENIUS GROUP</p>
            <p className="leading-tight" style={{ color: 'rgba(201,168,76,0.5)', fontSize: '9px', letterSpacing: '0.2em' }}>LA METHODE GENIUS</p>
          </div>
        </Link>

        {/* Menu desktop */}
        <div className="hidden md:flex items-center gap-1">
          {menus.map((item) => (
            <div key={item.label} className="relative">
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  color: groupeActif(item, location.pathname) ? '#C9A84C' : '#9ca3af',
                  background: groupeActif(item, location.pathname) ? 'rgba(201,168,76,0.1)' : 'transparent',
                  borderBottom: groupeActif(item, location.pathname) ? '2px solid #C9A84C' : '2px solid transparent'
                }}
                aria-haspopup="true" aria-expanded={openMenu === item.label}
                onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}>
                <Icon name={item.icon} className="w-4 h-4" />
                {item.label}
                <span className="text-xs opacity-60">{openMenu === item.label ? '▲' : '▼'}</span>
              </button>
              {openMenu === item.label && (
                <DropdownMenu items={item.dropdown} onClose={() => setOpenMenu(null)} />
              )}
            </div>
          ))}

          {isProfOrAdmin && (
            <Link to="/professeur"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                color: '#4CC9A8',
                background: location.pathname === '/professeur' ? 'rgba(76,201,168,0.1)' : 'transparent',
                borderBottom: location.pathname === '/professeur' ? '2px solid #4CC9A8' : '2px solid transparent'
              }}>
              <Icon name="presentation" className="w-4 h-4" />
              Enseignant
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                color: '#C94C7B',
                background: location.pathname.startsWith('/admin') ? 'rgba(201,76,123,0.1)' : 'transparent',
                borderBottom: location.pathname.startsWith('/admin') ? '2px solid #C94C7B' : '2px solid transparent'
              }}>
              <Icon name="sliders" className="w-4 h-4" />
              Administration
            </Link>
          )}
        </div>

        {/* Profil desktop */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-lg font-semibold"
            style={{
              background: isAdmin ? 'rgba(201,76,123,0.1)' : isProfOrAdmin ? 'rgba(76,201,168,0.1)' : 'rgba(201,168,76,0.1)',
              color: isAdmin ? '#C94C7B' : isProfOrAdmin ? '#4CC9A8' : '#C9A84C'
            }}>
            {libelleUtilisateur(user)}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-gray-400">{user?.username}</span>
          </div>
          <button onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
            Déconnexion
          </button>
        </div>

        {/* Burger mobile */}
        <button className="md:hidden text-white text-xl p-2" aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 overflow-y-auto max-h-[calc(100vh-3.5rem)]"
          style={{ background: '#071020', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          {menus.map((item) => (
            <div key={item.label}>
              <button
                className="w-full flex items-center justify-between py-3 text-sm font-semibold"
                style={{ color: '#C9A84C', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                aria-expanded={mobileExpanded === item.label}
                onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}>
                <span className="flex items-center gap-2">
                  <Icon name={item.icon} className="w-4 h-4" />
                  {item.label}
                </span>
                <span>{mobileExpanded === item.label ? '▲' : '▼'}</span>
              </button>
              {mobileExpanded === item.label && (
                <div className="pl-3 pb-2">
                  {item.dropdown.map((sub, i) => (
                    <Link key={i} to={sub.path}
                      onClick={() => { setMobileOpen(false); setMobileExpanded(null) }}
                      className="flex items-center gap-2.5 py-3 text-sm text-gray-300">
                      <Icon name={sub.icon} className="w-4 h-4 flex-shrink-0 opacity-80" />
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isProfOrAdmin && (
            <Link to="/professeur" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-3 text-sm font-semibold"
              style={{ color: '#4CC9A8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Icon name="presentation" className="w-4 h-4" />
              Enseignant
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-3 text-sm font-semibold"
              style={{ color: '#C94C7B', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Icon name="sliders" className="w-4 h-4" />
              Administration
            </Link>
          )}
          <div className="pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{user?.username}</span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                {libelleUtilisateur(user)}
              </span>
            </div>
            <button onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}