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
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password
      })
      login(res.data.user, res.data.token)
      navigate('/accueil')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#0a1628' }}>

      {/* Logo en fond flou */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <img
          src="/logo.png"
          alt="Genius Group"
          className="w-2/3 max-w-lg"
        />
      </div>

      {/* Effet de lumière */}
      <div className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)'
        }}
      />

      {/* Carte de connexion */}
      <div className="relative z-10 w-full max-w-md mx-4">
        
        {/* Logo en haut */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="Genius Group"
            className="w-32 h-32 object-contain mb-4 drop-shadow-2xl"
          />
          <h1 className="text-3xl font-bold text-white tracking-widest">GENIUS</h1>
          <p className="text-gray-400 tracking-[0.3em] text-sm">G R O U P</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white bg-opacity-5 backdrop-blur-md border border-white border-opacity-10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-center text-lg font-semibold mb-6">
            Connectez-vous à votre espace
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Identifiant
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: jean.dupont"
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-gray-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-gray-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900 bg-opacity-30 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-3 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-indigo-500/25"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 Genius Group — Tous droits réservés
        </p>
      </div>
    </div>
  )
}