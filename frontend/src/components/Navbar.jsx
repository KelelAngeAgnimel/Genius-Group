import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CODES_CONCOURS } from '../lib/concours'
import { useConcours } from '../hooks/useConcours'
import Icon from './Icone'

// Nom affiché dans le bandeau : « Prénom Nom », sinon le matricule seul
function identite(user) {
  const nom = [user?.prenom, user?.nom].filter(Boolean).join(' ').trim()
  const matricule = user?.matricule || user?.username || ''
  return nom ? { principal: nom, secondaire: matricule } : { principal: matricule, secondaire: '' }
}

// Le concours de l'élève est visible ailleurs (Ressources, Tableau de bord) : le bandeau n'affiche que le rôle du personnel
function libelleRole(role) {
  if (role === 'admin') return 'Administrateur'
  if (role === 'professeur') return 'Enseignant'
  return ''
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
  const id = identite(user)
  const role = libelleRole(user?.role)

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
                <Icon name={openMenu === item.label ? 'chevronUp' : 'chevronDown'} className="w-3.5 h-3.5 opacity-60" />
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
          <div className="text-right leading-tight">
            <p className="text-sm text-gray-200">{id.principal}</p>
            {(id.secondaire || role) && (
              <p className="text-[11px] text-gray-500">{[id.secondaire, role].filter(Boolean).join(' · ')}</p>
            )}
          </div>
          <button onClick={handleLogout}
            className="px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:underline underline-offset-4 transition">
            Déconnexion
          </button>
        </div>

        {/* Burger mobile */}
        <button className="md:hidden text-white text-xl p-2" aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}>
          <Icon name={mobileOpen ? 'close' : 'menu'} className="w-6 h-6" />
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
                <Icon name={mobileExpanded === item.label ? 'chevronUp' : 'chevronDown'} className="w-4 h-4 opacity-60" />
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
          <div className="pt-3 flex items-center justify-between gap-3">
            <div className="min-w-0 leading-tight">
              <p className="text-sm text-gray-200 truncate">{id.principal}</p>
              {(id.secondaire || role) && (
                <p className="text-[11px] text-gray-500 truncate">{[id.secondaire, role].filter(Boolean).join(' · ')}</p>
              )}
            </div>
            <button onClick={handleLogout}
              className="text-xs px-2 py-2 text-gray-400 hover:text-white hover:underline underline-offset-4 flex-shrink-0">
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}