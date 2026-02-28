import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

export default function CreerUtilisateur() {
  const { token } = useAuth()
  const [form, setForm] = useState({
    username: '', password: '', nom: '', prenom: '', role: 'etudiant'
  })
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSucces('')
    setErreur('')

    try {
      const res = await axios.post(
        'http://localhost:3001/api/users/create',
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSucces(`✅ Utilisateur créé ! Matricule : ${res.data.user.matricule}`)
      setForm({ username: '', password: '', nom: '', prenom: '', role: 'etudiant' })
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la création.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">➕ Créer un utilisateur</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
            <input
              name="prenom"
              value={form.prenom}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              name="nom"
              value={form.nom}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="ex: jean.dupont"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="etudiant">Étudiant</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        {succes && <p className="text-green-600 font-semibold text-sm bg-green-50 p-3 rounded-lg">{succes}</p>}
        {erreur && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{erreur}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-gray-800 text-white font-semibold rounded-lg py-2 hover:bg-gray-900 transition disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer l\'utilisateur'}
        </button>

      </form>
    </div>
  )
}