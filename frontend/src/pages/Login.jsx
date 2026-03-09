import API_URL from '../config'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const BrainLogo = () => (
  <svg viewBox="0 0 200 200" width="160" height="160" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#F5D78E', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#C9A84C', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#8B6914', stopOpacity: 1 }} />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Hémisphère gauche */}
    <path
      d="M100 40
         C85 40, 65 45, 55 58
         C42 72, 40 88, 45 102
         C48 112, 52 118, 55 125
         C58 132, 60 138, 58 145
         C65 148, 72 146, 75 140
         C78 134, 76 126, 74 118
         C70 108, 68 98, 72 88
         C76 78, 84 72, 90 68
         C95 64, 100 62, 100 60
         Z"
      fill="url(#goldGrad)"
      stroke="#F5D78E"
      strokeWidth="1"
      filter="url(#glow)"
    />

    {/* Hémisphère droit */}
    <path
      d="M100 40
         C115 40, 135 45, 145 58
         C158 72, 160 88, 155 102
         C152 112, 148 118, 145 125
         C142 132, 140 138, 142 145
         C135 148, 128 146, 125 140
         C122 134, 124 126, 126 118
         C130 108, 132 98, 128 88
         C124 78, 116 72, 110 68
         C105 64, 100 62, 100 60
         Z"
      fill="url(#goldGrad)"
      stroke="#F5D78E"
      strokeWidth="1"
      filter="url(#glow)"
    />

    {/* Ligne centrale */}
    <line x1="100" y1="42" x2="100" y2="143"
      stroke="#0a1628" strokeWidth="2.5" />

    {/* Circonvolutions gauche */}
    <path d="M75 65 Q65 72 68 82" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M65 85 Q58 95 63 105" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M70 108 Q65 118 68 128" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M80 58 Q72 65 75 75" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M60 98 Q55 108 58 118" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round"/>

    {/* Circonvolutions droite */}
    <path d="M125 65 Q135 72 132 82" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M135 85 Q142 95 137 105" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M130 108 Q135 118 132 128" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M120 58 Q128 65 125 75" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M140 98 Q145 108 142 118" fill="none" stroke="#0a1628" strokeWidth="1.8" strokeLinecap="round"/>

    {/* Tronc cérébral */}
    <path
      d="M88 143 C86 150, 85 158, 88 163
         C91 168, 109 168, 112 163
         C115 158, 114 150, 112 143 Z"
      fill="url(#goldGrad)"
      stroke="#F5D78E"
      strokeWidth="1"
    />
  </svg>
)

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password })
      login(res.data.user, res.data.token)
      navigate('/accueil')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* PARTIE GAUCHE */}
      <div className="w-1/2 flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)' }}>

        {/* Cercles décoratifs */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full"
          style={{ background: '#C9A84C', filter: 'blur(80px)', opacity: 0.08 }} />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full"
          style={{ background: '#C9A84C', filter: 'blur(100px)', opacity: 0.06 }} />

        {/* Contenu principal */}
        <div className="relative z-10 flex flex-col items-center text-center px-8">

          {/* Cercle doré autour du logo */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-52 h-52 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)',
                border: '1px solid rgba(201,168,76,0.25)',
                boxShadow: '0 0 80px rgba(201,168,76,0.1)'
              }}>
              <BrainLogo />
            </div>
          </div>

          {/* Séparateur doré */}
          <div className="w-24 h-px mb-5"
            style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />

          {/* Slogan */}
          <p className="text-base font-bold tracking-[0.3em] uppercase"
            style={{ color: '#C9A84C' }}>
            La Méthode Genius
          </p>
          <p className="text-gray-500 text-sm mt-3 max-w-xs leading-relaxed">
            Votre portail de préparation aux concours des grandes écoles
          </p>
        </div>

        {/* Copyright */}
        <p className="absolute bottom-6 text-gray-700 text-xs">
          © 2026 Genius Group — Tous droits réservés
        </p>
      </div>

      {/* PARTIE DROITE — Formulaire */}
      <div className="w-1/2 flex flex-col items-center justify-center bg-white px-16">
        <div className="w-full max-w-md">

          {/* Mini logo en haut */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 flex items-center justify-center rounded-full"
              style={{ background: '#0a1628', border: '1px solid rgba(201,168,76,0.4)' }}>
              <span className="text-lg">🧠</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 tracking-widest text-sm">GENIUS GROUP</p>
              <p className="text-xs text-gray-400 tracking-widest">PORTAIL ÉTUDIANT</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h2>
          <p className="text-gray-500 mb-8">Utiliser votre compte Genius Group</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: jean.dupont"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 transition-all duration-200"
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 transition-all duration-200"
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 text-white font-bold rounded-xl py-3 transition-all duration-200 disabled:opacity-50 text-lg tracking-widest"
              style={{
                background: 'linear-gradient(135deg, #0a1628, #1a3a6b)',
                border: '1px solid rgba(201,168,76,0.4)',
                boxShadow: '0 4px 20px rgba(201,168,76,0.15)'
              }}
            >
              {loading ? 'Connexion...' : 'SE CONNECTER'}
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}