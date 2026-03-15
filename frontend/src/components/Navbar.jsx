import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const menuItems = [
  {
    label: 'Accueil',
    path: '/accueil',
    dropdown: [
      { label: 'Tableau de bord', path: '/accueil/actualites' },
      { label: 'Statistiques', path: '/accueil/statistiques' },
      { label: 'Calendrier', path: '/accueil/calendrier' },
      { label: 'Ecoles', path: '/accueil/ecoles' },
      { label: 'Actualites', path: '/accueil/fiches' },
      { label: 'Tendances', path: '/accueil/tendances' },
      { label: 'Guide', path: '/accueil/guide' },
    ]
  },
  {
    label: 'Planning',
    path: '/planning',
    dropdown: [
      { label: 'Emploi du temps', path: '/planning/emploi-du-temps' },
      { label: 'Suivi progression', path: '/planning/suivi-progression' },
      { label: 'Rappels', path: '/planning/rappels' },
      { label: 'Calendrier revisions', path: '/planning/calendrier-revisions' },
      { label: 'Sessions blanc', path: '/planning/sessions-blanc' },
      { label: 'Stats travail', path: '/planning/stats-travail' },
      { label: 'Planning perso', path: '/planning/planning-perso' },
    ]
  },
  {
    label: 'Ressources',
    path: '/ressources',
    dropdown: [
      { label: 'Centre de ressources', path: '/ressources' },
      { label: 'INP-HB', path: '/ressources' },
      { label: 'ESATIC', path: '/ressources' },
    ]
  },
  {
    label: 'Aides',
    path: '/aides',
    dropdown: [
      { label: 'FAQ Generale', path: '/aides/faq-generale' },
      { label: 'FAQ Concours', path: '/aides/faq-concours' },
      { label: 'Contacts', path: '/aides/contacts' },
      { label: 'Orientation', path: '/aides/orientation' },
      { label: 'Preparation mentale', path: '/aides/preparation-mentale' },
      { label: 'Forum', path: '/aides/forum' },
      { label: 'Chatbot', path: '/aides/chatbot' },
    ]
  },
]

function DropdownMenu({ items, onClose }) {
  return (
    <div
      className="absolute top-full left-0 mt-1 w-52 rounded-xl shadow-xl z-50 overflow-hidden"
      style={{ background: '#0d1f3c', border: '1px solid rgba(201,168,76,0.2)' }}>
      {items.map((item, i) => (
        <Link
          key={i}
          to={item.path}
          onClick={onClose}
          className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:text-white transition-all"
          style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {item.label}
        </Link>
      ))}
    </div>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [openMenu, setOpenMenu] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const navRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav ref={navRef} className="sticky top-0 z-50 shadow-lg"
      style={{ background: '#071020', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>

      {/* BARRE PRINCIPALE */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">

        {/* Logo */}
        <Link to="/accueil" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl">🧠</span>
          <div className="hidden sm:block">
            <p className="font-bold tracking-widest text-xs leading-tight" style={{ color: '#C9A84C' }}>
              GENIUS GROUP
            </p>
            <p className="leading-tight" style={{ color: 'rgba(201,168,76,0.5)', fontSize: '9px', letterSpacing: '0.2em' }}>
              LA METHODE GENIUS
            </p>
          </div>
        </Link>

        {/* Menu desktop */}
        <div className="hidden md:flex items-center gap-1">
          {menuItems.map((item) => (
            <div key={item.label} className="relative">
              <button
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  color: location.pathname.startsWith(item.path) ? '#C9A84C' : '#9ca3af',
                  background: location.pathname.startsWith(item.path) ? 'rgba(201,168,76,0.1)' : 'transparent',
                  borderBottom: location.pathname.startsWith(item.path) ? '2px solid #C9A84C' : '2px solid transparent'
                }}
                onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}>
                {item.label}
                <span className="text-xs opacity-60">{openMenu === item.label ? '▲' : '▼'}</span>
              </button>

              {openMenu === item.label && (
                <DropdownMenu items={item.dropdown} onClose={() => setOpenMenu(null)} />
              )}
            </div>
          ))}

          {user?.role === 'admin' && (
            <Link to="/admin"
              className="px-3 py-2 rounded-lg text-sm transition-all"
              style={{ color: '#C94C7B' }}>
              Admin
            </Link>
          )}
        </div>

        {/* Profil + deconnexion */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-gray-400">{user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            style={{
              background: 'rgba(201,168,76,0.1)',
              color: '#C9A84C',
              border: '1px solid rgba(201,168,76,0.3)'
            }}>
            Deconnexion
          </button>
        </div>

        {/* Burger mobile */}
        <button
          className="md:hidden text-white text-xl p-2"
          onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? 'X' : '='}
        </button>
      </div>

      {/* MENU MOBILE */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 overflow-y-auto max-h-96"
          style={{ background: '#071020', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          {menuItems.map((item) => (
            <div key={item.label}>
              <button
                className="w-full flex items-center justify-between py-3 text-sm font-semibold"
                style={{ color: '#C9A84C', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}>
                {item.label}
                <span>{mobileExpanded === item.label ? '▲' : '▼'}</span>
              </button>
              {mobileExpanded === item.label && (
                <div className="pl-3 pb-2">
                  {item.dropdown.map((sub, i) => (
                    <Link
                      key={i}
                      to={sub.path}
                      onClick={() => { setMobileOpen(false); setMobileExpanded(null) }}
                      className="block py-2 text-xs text-gray-400">
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {user?.role === 'admin' && (
            <Link to="/admin"
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-semibold"
              style={{ color: '#C94C7B', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              Admin
            </Link>
          )}

          <div className="pt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
              Deconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}