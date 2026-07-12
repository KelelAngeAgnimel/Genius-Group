import API_URL from '../config'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

// Photos d'étudiants africains/noirs — Unsplash (libres de droits)
// Sources : Emmanuel Ikwuegbu, Desola Lanre-Ologun, TopSphere Media, Nqobile Vundla
const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=85',
    legende: 'Préparez votre avenir avec méthode'
  },
  {
    url: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=1200&q=85',
    legende: 'Des outils pensés pour votre réussite'
  },
  {
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=85',
    legende: 'Rejoignez la communauté Genius Group'
  },
  {
    url: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1200&q=85',
    legende: 'Excellence · Méthode · Ambition'
  }
]

const BrainLogo = ({ size = 56 }) => (
  <svg viewBox="0 0 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#F5D78E', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#C9A84C', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#8B6914', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M100 40 C85 40, 65 45, 55 58 C42 72, 40 88, 45 102 C48 112, 52 118, 55 125 C58 132, 60 138, 58 145 C65 148, 72 146, 75 140 C78 134, 76 126, 74 118 C70 108, 68 98, 72 88 C76 78, 84 72, 90 68 C95 64, 100 62, 100 60 Z"
      fill="url(#goldGrad2)" />
    <path d="M100 40 C115 40, 135 45, 145 58 C158 72, 160 88, 155 102 C152 112, 148 118, 145 125 C142 132, 140 138, 142 145 C135 148, 128 146, 125 140 C122 134, 124 126, 126 118 C130 108, 132 98, 128 88 C124 78, 116 72, 110 68 C105 64, 100 62, 100 60 Z"
      fill="url(#goldGrad2)" />
    <line x1="100" y1="42" x2="100" y2="143" stroke="#0a1628" strokeWidth="2.5" />
    <path d="M75 65 Q65 72 68 82" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M65 85 Q58 95 63 105" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M125 65 Q135 72 132 82" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M135 85 Q142 95 137 105" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M88 143 C86 150, 85 158, 88 163 C91 168, 109 168, 112 163 C115 158, 114 150, 112 143 Z"
      fill="url(#goldGrad2)" />
  </svg>
)

export default function Login() {
  const [matricule, setMatricule] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [fondu, setFondu] = useState(true)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => {
      setFondu(false)
      setTimeout(() => {
        setSlideIndex(i => (i + 1) % SLIDES.length)
        setFondu(true)
      }, 400)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const allerSlide = (index) => {
    setFondu(false)
    setTimeout(() => { setSlideIndex(index); setFondu(true) }, 200)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { matricule, password })
      login(res.data.user, res.data.token)
      navigate('/accueil')
    } catch (err) {
      setError(err.response?.data?.message || 'Matricule ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── PANNEAU GAUCHE : Diaporama ── */}
      <div style={{
        display: 'none',
        position: 'relative',
        overflow: 'hidden',
        flex: 1
      }} className="login-left">

        {/* Image en fond */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${SLIDES[slideIndex].url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: fondu ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out'
        }} />

        {/* Dégradé sombre en bas pour lisibilité du texte */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(7,16,32,0.25) 0%, rgba(7,16,32,0.1) 35%, rgba(7,16,32,0.75) 100%)'
        }} />

        {/* Logo Genius Group en haut à gauche */}
        <div style={{
          position: 'absolute', top: 28, left: 28,
          display: 'flex', alignItems: 'center', gap: 10, zIndex: 10
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: '#071020', border: '1px solid rgba(201,168,76,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BrainLogo size={26} />
          </div>
          <div>
            <p style={{ color: '#C9A84C', fontWeight: 800, fontSize: 12, letterSpacing: '0.2em', margin: 0 }}>GENIUS GROUP</p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, letterSpacing: '0.15em', margin: 0 }}>PORTAIL ÉTUDIANT</p>
          </div>
        </div>

        {/* Texte en bas */}
        <div style={{ position: 'absolute', bottom: 72, left: 36, right: 36, zIndex: 10 }}>
          <div style={{ width: 36, height: 3, background: '#C9A84C', borderRadius: 2, marginBottom: 14 }} />
          <p style={{
            color: 'white', fontSize: 20, fontWeight: 700, lineHeight: 1.35, margin: 0,
            opacity: fondu ? 1 : 0, transition: 'opacity 0.5s ease-in-out'
          }}>
            {SLIDES[slideIndex].legende}
          </p>
        </div>

        {/* Points de navigation */}
        <div style={{
          position: 'absolute', bottom: 30, left: 36,
          display: 'flex', gap: 8, zIndex: 10
        }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => allerSlide(i)} style={{
              width: i === slideIndex ? 22 : 8, height: 8,
              borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0,
              background: i === slideIndex ? '#C9A84C' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>
      </div>

      {/* ── PANNEAU DROIT : Formulaire ── */}
      <div style={{
        width: '100%', background: 'white',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', minHeight: '100vh', boxSizing: 'border-box'
      }} className="login-right">

        <div style={{ width: '100%', maxWidth: 390 }}>

          {/* Logo visible uniquement sur mobile */}
          <div className="login-mobile-logo" style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#071020', border: '1px solid rgba(201,168,76,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <BrainLogo size={30} />
            </div>
            <div>
              <p style={{ color: '#071020', fontWeight: 800, fontSize: 13, letterSpacing: '0.15em', margin: 0 }}>GENIUS GROUP</p>
              <p style={{ color: '#9ca3af', fontSize: 10, letterSpacing: '0.1em', margin: 0 }}>PORTAIL ÉTUDIANT</p>
            </div>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#071020', margin: '0 0 6px 0' }}>
            Connexion
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 30px 0' }}>
            Utiliser votre compte Genius Group
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Matricule
              </label>
              <input
                type="text"
                value={matricule}
                onChange={e => setMatricule(e.target.value)}
                placeholder="Ex: 26GEN0001"
                required
                style={{
                  width: '100%', padding: '13px 16px', fontSize: 14,
                  border: '2px solid #e5e7eb', borderRadius: 12, outline: 'none',
                  boxSizing: 'border-box', color: '#111827',
                  transition: 'border-color 0.2s', background: '#f9fafb'
                }}
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '13px 48px 13px 16px', fontSize: 14,
                    border: '2px solid #e5e7eb', borderRadius: 12, outline: 'none',
                    boxSizing: 'border-box', color: '#111827',
                    transition: 'border-color 0.2s', background: '#f9fafb'
                  }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', fontSize: 16, padding: 4,
                  display: 'flex', alignItems: 'center'
                }}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 10, padding: '10px 14px',
                color: '#dc2626', fontSize: 13, textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #071020, #1a3a6b)',
              color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 12, fontSize: 14, fontWeight: 800,
              letterSpacing: '0.15em', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', marginTop: 6,
              boxShadow: '0 4px 20px rgba(201,168,76,0.15)'
            }}>
              {loading ? 'Connexion en cours...' : 'SE CONNECTER'}
            </button>
          </form>

          <p style={{ color: '#d1d5db', fontSize: 11, textAlign: 'center', marginTop: 40 }}>
            © 2026 Genius Group — Tous droits réservés
          </p>
        </div>
      </div>

      {/* CSS responsive */}
      <style>{`
        @media (min-width: 768px) {
          .login-left { display: block !important; }
          .login-right { width: 440px !important; flex-shrink: 0; }
          .login-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  )
}