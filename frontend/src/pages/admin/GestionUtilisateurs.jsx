import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import API_URL from '../../config'

const roleConfig = {
  admin: { label: 'Admin', couleur: '#C94C7B' },
  professeur: { label: 'Professeur', couleur: '#4CC9A8' },
  etudiant_inphb: { label: 'INP-HB', couleur: '#C9A84C' },
  etudiant_esatic: { label: 'ESATIC', couleur: '#4C7BC9' },
  etudiant_both: { label: 'INP-HB + ESATIC', couleur: '#7B4CC9' },
}

export default function GestionUtilisateurs() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreRole, setFiltreRole] = useState('tous')

  useEffect(() => {
    chargerUtilisateurs()
  }, [])

  const chargerUtilisateurs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/all`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.users) setUsers(data.users)
      else setErreur('Impossible de charger les utilisateurs.')
    } catch {
      setErreur('Impossible de charger les utilisateurs.')
    } finally {
      setLoading(false)
    }
  }

  const supprimerUtilisateur = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  const usersFiltres = users.filter(u => {
    const matchRecherche = recherche === '' ||
      u.username?.toLowerCase().includes(recherche.toLowerCase()) ||
      u.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      u.prenom?.toLowerCase().includes(recherche.toLowerCase()) ||
      u.matricule?.toLowerCase().includes(recherche.toLowerCase())
    const matchRole = filtreRole === 'tous' || u.role === filtreRole
    return matchRecherche && matchRole
  })

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Administration
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Gestion des utilisateurs
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {users.length} utilisateur{users.length > 1 ? 's' : ''} inscrit{users.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Object.entries(roleConfig).map(([key, val]) => (
          <div key={key} className="bg-white rounded-2xl p-3 text-center"
            style={{ border: `1px solid ${val.couleur}20` }}>
            <p className="text-2xl font-bold" style={{ color: val.couleur }}>
              {users.filter(u => u.role === key).length}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{val.label}</p>
          </div>
        ))}
      </div>

      {/* FILTRES */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          className="flex-1 border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
          style={{ borderColor: '#f0ece0' }}
          onFocus={e => e.target.style.borderColor = '#C9A84C'}
          onBlur={e => e.target.style.borderColor = '#f0ece0'}
        />
        <select
          value={filtreRole}
          onChange={e => setFiltreRole(e.target.value)}
          className="border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none bg-white"
          style={{ borderColor: '#f0ece0' }}>
          <option value="tous">Tous les roles</option>
          {Object.entries(roleConfig).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* CONTENU */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
        </div>
      )}

      {erreur && (
        <div className="p-4 rounded-xl text-sm"
          style={{ background: 'rgba(201,76,123,0.1)', color: '#C94C7B', border: '1px solid rgba(201,76,123,0.3)' }}>
          {erreur}
        </div>
      )}

      {!loading && !erreur && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0ece0' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '2px solid #f0ece0' }}>
                  <th className="text-left p-4 font-semibold text-gray-400 uppercase tracking-widest">Matricule</th>
                  <th className="text-left p-4 font-semibold text-gray-400 uppercase tracking-widest">Nom complet</th>
                  <th className="text-left p-4 font-semibold text-gray-400 uppercase tracking-widest">Identifiant</th>
                  <th className="text-left p-4 font-semibold text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="text-left p-4 font-semibold text-gray-400 uppercase tracking-widest">Inscrit le</th>
                  <th className="text-left p-4 font-semibold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersFiltres.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
                {usersFiltres.map((u, i) => {
                  const role = roleConfig[u.role] || { label: u.role, couleur: '#9ca3af' }
                  return (
                    <tr key={u.id}
                      style={{ borderBottom: '1px solid #f8f7f4' }}
                      className="hover:bg-gray-50 transition">
                      <td className="p-4 font-mono font-bold" style={{ color: '#C9A84C' }}>
                        {u.matricule || '—'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: '#071020' }}>
                            {u.username?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-800">
                            {u.prenom || ''} {u.nom || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-500">{u.username}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs font-bold"
                          style={{ background: `${role.couleur}15`, color: role.couleur }}>
                          {role.label}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => supprimerUtilisateur(u.id)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold transition"
                          style={{ background: 'rgba(201,76,123,0.1)', color: '#C94C7B' }}>
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}