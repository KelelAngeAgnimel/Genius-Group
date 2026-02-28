import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'

export default function GestionUtilisateurs() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/users/all', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUsers(res.data)
      } catch (err) {
        setErreur('Impossible de charger les utilisateurs.')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [token])

  if (loading) return <p className="text-gray-400">Chargement...</p>
  if (erreur) return <p className="text-red-500">{erreur}</p>

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">👥 Gestion des utilisateurs</h2>
      <p className="text-sm text-gray-400 mb-4">{users.length} utilisateur(s) inscrit(s)</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-3 text-left rounded-tl-lg">Matricule</th>
              <th className="p-3 text-left">Nom complet</th>
              <th className="p-3 text-left">Identifiant</th>
              <th className="p-3 text-left">Rôle</th>
              <th className="p-3 text-left rounded-tr-lg">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 font-mono font-bold text-indigo-700">{u.matricule}</td>
                <td className="p-3 font-semibold">{u.prenom} {u.nom}</td>
                <td className="p-3 text-gray-500">{u.username}</td>
                <td className="p-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    u.role === 'admin'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-gray-400 text-xs">
                  {new Date(u.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}