import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import API_URL from '../../config'

const roleConfig = {
  admin:             { label: 'Admin',                  couleur: '#C94C7B' },
  professeur:        { label: 'Professeur',             couleur: '#4CC9A8' },
  etudiant_inphb:    { label: 'INP-HB',                couleur: '#C9A84C' },
  etudiant_esatic:   { label: 'ESATIC',                couleur: '#4C7BC9' },
  etudiant_both:     { label: 'INP-HB + ESATIC',       couleur: '#7B4CC9' },
  etudiant_cme:      { label: 'CME',                   couleur: '#4CC9A8' },
  etudiant_inphb_cme:{ label: 'INP-HB + CME',         couleur: '#C97B4C' },
  etudiant_esatic_cme:{ label: 'ESATIC + CME',        couleur: '#C94C7B' },
  etudiant_all:      { label: 'INP-HB + ESATIC + CME', couleur: '#C9A84C' },
}

export default function GestionUtilisateurs() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreRole, setFiltreRole] = useState('tous')

  useEffect(() => { chargerUtilisateurs() }, [])

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
      u.prenom?.toLowerCase().includes(recherche.toLowerCase())
    const matchRole = filtreRole === 'tous' || u.role === filtreRole
    return matchRecherche && matchRole
  })

  // Stats simplifiées : admins, profs, étudiants total
  const nbAdmins    = users.filter(u => u.role === 'admin').length
  const nbProfs     = users.filter(u => u.role === 'professeur').length
  const nbEtudiants = users.filter(u => u.role?.startsWith('etudiant')).length

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
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Administrateurs', valeur: nbAdmins,    couleur: '#C94C7B' },
          { label: 'Professeurs',     valeur: nbProfs,     couleur: '#4CC9A8' },
          { label: 'Etudiants',       valeur: nbEtudiants, couleur: '#C9A84C' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-3 text-center"
            style={{ border: `1px solid ${s.couleur}20` }}>
            <p className="text-2xl font-bold" style={{ color: s.couleur }}>{s.valeur}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* FILTRES */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Rechercher par nom ou identifiant..."
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
          <option value="tous">Tous les rôles</option>
          {Object.entries(roleConfig).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* CHARGEMENT */}
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

      {/* TABLEAU */}
      {!loading && !erreur && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0ece0' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '2px solid #f0ece0' }}>
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
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
                {usersFiltres.map((u) => {
                  const role = roleConfig[u.role] || { label: u.role, couleur: '#9ca3af' }
                  const initiale = (u.prenom || u.username)?.[0]?.toUpperCase()
                  return (
                    <tr key={u.id}
                      style={{ borderBottom: '1px solid #f8f7f4' }}
                      className="hover:bg-gray-50 transition">

                      {/* Nom complet */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: role.couleur }}>
                            {initiale}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {u.prenom || ''} {u.nom || '—'}
                            </p>
                            {/* Modalité sous le nom pour les étudiants */}
                            {u.modalite && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {u.modalite === 'en_ligne' ? '💻 En ligne' : '🏫 Présentiel'}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Identifiant */}
                      <td className="p-4">
                        <span className="font-mono font-bold" style={{ color: '#C9A84C' }}>
                          {u.username}
                        </span>
                      </td>

                      {/* Rôle */}
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs font-bold"
                          style={{ background: `${role.couleur}15`, color: role.couleur }}>
                          {role.label}
                        </span>
                      </td>

                      {/* Date inscription */}
                      <td className="p-4 text-gray-400">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Actions */}
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