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

      {/* PARTIE GAUCHE — Logo et fond sombre */}
      <div className="w-1/2 flex flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: '#0a1628' }}>

        {/* Effet lumineux */}
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.2) 0%, transparent 70%)'
          }}
        />

        {/* Logo centré */}
        <div className="relative z-10 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Genius Group"
            className="w-64 h-64 object-contain drop-shadow-2xl"
          />
          <h1 className="text-4xl font-bold text-white tracking-widest mt-4">GENIUS</h1>
          <p className="text-gray-400 tracking-[0.5em] text-sm mt-1">G R O U P</p>
          <p className="text-gray-500 text-sm mt-6 text-center max-w-xs">
            Votre portail de préparation aux concours des grandes écoles
          </p>
        </div>

        {/* Copyright */}
        <p className="absolute bottom-6 text-gray-600 text-xs">
          © 2026 Genius Group — Tous droits réservés
        </p>
      </div>

      {/* PARTIE DROITE — Formulaire */}
      <div className="w-1/2 flex flex-col items-center justify-center bg-white px-16">

        <div className="w-full max-w-md">
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
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition text-gray-800"
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
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition text-gray-800"
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
              className="mt-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl py-3 transition-all duration-200 disabled:opacity-50 text-lg"
            >
              {loading ? 'Connexion...' : 'SE CONNECTER'}
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}