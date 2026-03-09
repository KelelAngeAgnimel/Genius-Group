import API_URL from '../config'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

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

        {/* Cercles décoratifs en arrière-plan */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-5"
          style={{ background: '#C9A84C', filter: 'blur(40px)' }} />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full opacity-5"
          style={{ background: '#C9A84C', filter: 'blur(60px)' }} />

        {/* Contenu principal */}
        <div className="relative z-10 flex flex-col items-center text-center px-8">

          {/* Cerveau emoji stylisé */}
          <div className="relative mb-6">
            <div className="w-40 h-40 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))',
                border: '2px solid rgba(201,168,76,0.3)',
                boxShadow: '0 0 60px rgba(201,168,76,0.15)'
              }}>
              <span style={{ fontSize: '80px' }}>🧠</span>
            </div>
            {/* Anneau doré autour */}
            <div className="absolute inset-0 rounded-full"
              style={{
                border: '1px solid rgba(201,168,76,0.2)',
                transform: 'scale(1.15)'
              }} />
          </div>

          {/* Nom */}
          <h1 className="text-4xl font-bold tracking-widest mb-1"
            style={{ color: '#C9A84C' }}>
            GENIUS
          </h1>
          <p className="text-sm tracking-[0.5em] mb-6"
            style={{ color: 'rgba(201,168,76,0.6)' }}>
            G R O U P
          </p>

          {/* Séparateur doré */}
          <div className="w-20 h-0.5 mb-6"
            style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />

          {/* Slogan */}
          <p className="text-sm tracking-[0.25em] font-semibold uppercase mb-3"
            style={{ color: 'rgba(201,168,76,0.8)' }}>
            La Méthode Genius
          </p>
          <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
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

          {/* Petit logo en haut du formulaire */}
          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl">🧠</span>
            <div>
              <p className="font-bold text-gray-900 tracking-widest text-sm">GENIUS GROUP</p>
              <p className="text-xs text-gray-400 tracking-widest">PORTAIL ÉTUDIANT</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Connexion</h2>
          <p className="text-gray-500 mb-8">Utiliser votre compte Genius Group</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identifiant
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: jean.dupont"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none transition text-gray-800"
                style={{ outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none transition text-gray-800"
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
                {error}
              </p>
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