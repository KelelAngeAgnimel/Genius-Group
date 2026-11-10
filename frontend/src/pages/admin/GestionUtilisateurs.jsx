import { useEffect, useState } from 'react'
import api from '../../api'
import SelecteurConcours from '../../components/SelecteurConcours'
import { CODES_CONCOURS, concoursDe, libelleConcours, libelleUtilisateur, couleurConcours, roleDeBase } from '../../lib/concours'
import { useToast, useConfirm } from '../../hooks/useUi'

// Rôles de l'application ; les concours sont gérés séparément (inscriptions)
const roleConfig = {
  admin:      { label: 'Admin',      couleur: '#C94C7B' },
  professeur: { label: 'Professeur', couleur: '#4CC9A8' },
  etudiant:   { label: 'Étudiant',   couleur: '#C9A84C' },
}

const PAR_PAGE = 20

const modaliteConfig = {
  en_ligne:   { label: 'En ligne',   icone: '💻', couleur: '#4C7BC9' },
  presentiel: { label: 'Présentiel', icone: '🏫', couleur: '#C9A84C' },
}

export default function GestionUtilisateurs() {
  const toast = useToast()
  const confirmer = useConfirm()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreRole, setFiltreRole] = useState('tous')
  const [filtreModalite, setFiltreModalite] = useState('tous')
  const [page, setPage] = useState(1)
  const [occupe, setOccupe] = useState(null) // id de la ligne dont une action est en cours

  // Édition en ligne
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ nom: '', prenom: '', modalite: '', password: '', concours: [] })
  const [enregistrement, setEnregistrement] = useState(false)

  useEffect(() => { chargerUtilisateurs() }, [])

  const chargerUtilisateurs = async () => {
    try {
      const res = await api.get('/api/users/all')
      const data = res.data
      if (data.users) setUsers(data.users)
      else setErreur('Impossible de charger les utilisateurs.')
    } catch {
      setErreur('Impossible de charger les utilisateurs.')
    } finally {
      setLoading(false)
    }
  }

  const supprimerUtilisateur = async (id) => {
    if (!(await confirmer({ titre: 'Supprimer l’utilisateur ?', message: 'Le compte sera supprimé définitivement.', confirmer: 'Supprimer', danger: true }))) return
    setOccupe(id)
    try {
      await api.delete(`/api/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch {
      toast.erreur('Erreur lors de la suppression')
    } finally {
      setOccupe(null)
    }
  }

  const basculerBlocage = async (u) => {
    const bloquer = !u.bloque
    if (bloquer && !(await confirmer({ titre: 'Bloquer ce compte ?', message: `${u.prenom || ''} ${u.nom || u.username} ne pourra plus se connecter.`, confirmer: 'Bloquer', danger: true }))) return
    setOccupe(u.id)
    try {
      const res = await api.patch(`/api/users/${u.id}`, { bloque: bloquer })
      const data = res.data
      if (res.ok) {
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, bloque: bloquer } : x))
      } else {
        toast.erreur(data.message || 'Erreur lors du blocage')
      }
    } catch {
      toast.erreur('Erreur serveur lors du blocage')
    } finally {
      setOccupe(null)
    }
  }

  const commencerEdition = (u) => {
    setEditingId(u.id)
    setEditForm({ nom: u.nom || '', prenom: u.prenom || '', modalite: u.modalite || '', password: '', concours: concoursDe(u) })
  }

  const annulerEdition = () => {
    setEditingId(null)
    setEditForm({ nom: '', prenom: '', modalite: '', password: '', concours: [] })
  }

  const enregistrerEdition = async (id) => {
    setEnregistrement(true)
    try {
      const res = await api.patch(`/api/users/${id}`, {
          nom: editForm.nom,
          prenom: editForm.prenom,
          concours: editForm.concours,
          ...(editForm.modalite ? { modalite: editForm.modalite } : {}),
          ...(editForm.password ? { password: editForm.password } : {})
        })
      const data = res.data
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data.user } : u))
        setEditingId(null)
      } else {
        toast.erreur(data.message || 'Erreur lors de la modification')
      }
    } catch {
      toast.erreur('Erreur serveur lors de la modification')
    } finally {
      setEnregistrement(false)
    }
  }

  const usersFiltres = users.filter(u => {
    const matchRecherche = recherche === '' ||
      u.username?.toLowerCase().includes(recherche.toLowerCase()) ||
      u.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      u.prenom?.toLowerCase().includes(recherche.toLowerCase())
    const matchRole =
      filtreRole === 'tous' ||
      (filtreRole.startsWith('concours:') ? concoursDe(u).includes(filtreRole.slice(9)) : roleDeBase(u.role) === filtreRole)
    const matchModalite = filtreModalite === 'tous' || u.modalite === filtreModalite
    return matchRecherche && matchRole && matchModalite
  })

  // Pagination (20 par page) : évite 68+ lignes × 3 boutons dans le DOM
  const nbPages = Math.max(1, Math.ceil(usersFiltres.length / PAR_PAGE))
  const pageCourante = Math.min(page, nbPages)
  const usersPage = usersFiltres.slice((pageCourante - 1) * PAR_PAGE, pageCourante * PAR_PAGE)

  // Un filtre est-il actif ?
  const filtreActif = recherche !== '' || filtreRole !== 'tous' || filtreModalite !== 'tous'

  // Stats : calculées sur la liste filtrée dès qu'un filtre est actif
  const base = filtreActif ? usersFiltres : users
  const nbAdmins    = base.filter(u => u.role === 'admin').length
  const nbProfs     = base.filter(u => u.role === 'professeur').length
  const nbEtudiants = base.filter(u => roleDeBase(u.role) === 'etudiant').length

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>
          Administration
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Gestion des utilisateurs
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {filtreActif
            ? `${usersFiltres.length} résultat${usersFiltres.length > 1 ? 's' : ''} sur ${users.length}`
            : `${users.length} utilisateur${users.length > 1 ? 's' : ''} inscrit${users.length > 1 ? 's' : ''}`}
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
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* FILTRES */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Rechercher par nom ou identifiant..."
          value={recherche}
          onChange={e => { setRecherche(e.target.value); setPage(1) }}
          className="flex-1 border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
          style={{ borderColor: '#f0ece0' }}
          onFocus={e => e.target.style.borderColor = '#C9A84C'}
          onBlur={e => e.target.style.borderColor = '#f0ece0'}
          aria-label="Rechercher par nom ou identifiant..." />
        <select aria-label="Filtrer par rôle ou concours"
          value={filtreRole}
          onChange={e => { setFiltreRole(e.target.value); setPage(1) }}
          className="border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none bg-white"
          style={{ borderColor: '#f0ece0' }}>
          <option value="tous">Tous les rôles</option>
          {Object.entries(roleConfig).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
          {CODES_CONCOURS.map(code => (
            <option key={code} value={`concours:${code}`}>Concours {libelleConcours(code)}</option>
          ))}
        </select>
        <select aria-label="Filtrer par modalité"
          value={filtreModalite}
          onChange={e => { setFiltreModalite(e.target.value); setPage(1) }}
          className="border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none bg-white"
          style={{ borderColor: '#f0ece0' }}>
          <option value="tous">Toutes les modalités</option>
          <option value="en_ligne">💻 En ligne</option>
          <option value="presentiel">🏫 Présentiel</option>
        </select>
      </div>

      {/* CHARGEMENT */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
          <span className="ml-3 text-sm text-gray-500" role="status">Chargement des utilisateurs…</span>
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
                  <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-widest">Nom complet</th>
                  <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-widest">Identifiant</th>
                  <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-widest">Role</th>
                  <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-widest">Inscrit le</th>
                  <th className="text-left p-4 font-semibold text-gray-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersFiltres.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
                {usersPage.map((u) => {
                  const base = roleConfig[roleDeBase(u.role)] || { label: u.role, couleur: '#9ca3af' }
                  // Élève / professeur : on affiche ses concours (couleur du premier)
                  const role = roleDeBase(u.role) === 'admin' ? base
                    : { label: libelleUtilisateur(u), couleur: concoursDe(u).length ? couleurConcours(concoursDe(u)[0]) : base.couleur }
                  const initiale = (u.prenom || u.username)?.[0]?.toUpperCase()
                  const enEdition = editingId === u.id
                  const estEtudiant = roleDeBase(u.role) === 'etudiant'

                  return (
                    <tr key={u.id}
                      style={{ borderBottom: '1px solid #f8f7f4' }}
                      className="hover:bg-gray-50 transition">

                      {/* Nom complet */}
                      <td className="p-4">
                        {enEdition ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: role.couleur }}>
                              {initiale}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={editForm.prenom}
                                  onChange={e => setEditForm({ ...editForm, prenom: e.target.value })}
                                  placeholder="Prénom"
                                  className="w-24 border rounded-lg px-2 py-1 text-xs focus:outline-none"
                                  style={{ borderColor: '#C9A84C' }}
                                  aria-label="Prénom" />
                                <input
                                  type="text"
                                  value={editForm.nom}
                                  onChange={e => setEditForm({ ...editForm, nom: e.target.value })}
                                  placeholder="Nom"
                                  className="w-24 border rounded-lg px-2 py-1 text-xs focus:outline-none"
                                  style={{ borderColor: '#C9A84C' }}
                                  aria-label="Nom" />
                              </div>
                              {(estEtudiant || roleDeBase(u.role) === 'professeur') && (
                                <SelecteurConcours compact value={editForm.concours}
                                  onChange={concours => setEditForm({ ...editForm, concours })} />
                              )}
                              {estEtudiant && (
                                <select aria-label="Modalité"
                                  value={editForm.modalite}
                                  onChange={e => setEditForm({ ...editForm, modalite: e.target.value })}
                                  className="border rounded-lg px-2 py-1 text-xs bg-white focus:outline-none"
                                  style={{ borderColor: '#C9A84C' }}>
                                  <option value="">— Modalité —</option>
                                  <option value="en_ligne">💻 En ligne</option>
                                  <option value="presentiel">🏫 Présentiel</option>
                                </select>
                              )}
                              <input
                                type="text"
                                value={editForm.password}
                                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                placeholder="Nouveau mot de passe (laisser vide)"
                                autoComplete="new-password"
                                className="w-full border rounded-lg px-2 py-1 text-xs focus:outline-none"
                                style={{ borderColor: '#C9A84C' }}
                                aria-label="Nouveau mot de passe (laisser vide)" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: role.couleur }}>
                              {initiale}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 flex items-center gap-2">
                                {u.prenom || ''} {u.nom || '—'}
                                {u.bloque && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                                    style={{ background: 'rgba(201,76,123,0.12)', color: '#C94C7B' }}>
                                    🚫 Bloqué
                                  </span>
                                )}
                              </p>
                              {/* Modalité sous le nom pour les étudiants */}
                              {u.modalite && modaliteConfig[u.modalite] && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {modaliteConfig[u.modalite].icone} {modaliteConfig[u.modalite].label}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
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
                      <td className="p-4 text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        {enEdition ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => enregistrerEdition(u.id)}
                              disabled={enregistrement}
                              className="px-3 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                              style={{ background: 'rgba(76,201,168,0.1)', color: '#4CC9A8' }}>
                              {enregistrement ? '...' : 'Enregistrer'}
                            </button>
                            <button
                              onClick={annulerEdition}
                              disabled={enregistrement}
                              className="px-3 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                              style={{ background: '#f8f7f4', color: '#6b7280' }}>
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => commencerEdition(u)}
                              disabled={occupe === u.id}
                              className="px-3 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                              style={{ background: 'rgba(76,123,201,0.1)', color: '#4C7BC9' }}>
                              Modifier
                            </button>
                            <button
                              onClick={() => basculerBlocage(u)}
                              disabled={occupe === u.id}
                              className="px-3 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                              style={u.bloque
                                ? { background: 'rgba(76,201,168,0.12)', color: '#4CC9A8' }
                                : { background: 'rgba(230,150,40,0.12)', color: '#C97B1A' }}>
                              {occupe === u.id ? '…' : u.bloque ? 'Débloquer' : 'Bloquer'}
                            </button>
                            <button
                              onClick={() => supprimerUtilisateur(u.id)}
                              disabled={occupe === u.id}
                              className="px-3 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                              style={{ background: 'rgba(201,76,123,0.1)', color: '#C94C7B' }}>
                              Supprimer
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {usersFiltres.length > PAR_PAGE && (
            <nav aria-label="Pagination" className="flex items-center justify-between gap-3 p-3 text-xs"
              style={{ borderTop: '1px solid #f0ece0' }}>
              <span className="text-gray-500">
                {(pageCourante - 1) * PAR_PAGE + 1}–{Math.min(pageCourante * PAR_PAGE, usersFiltres.length)} sur {usersFiltres.length}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage(pageCourante - 1)} disabled={pageCourante <= 1}
                  className="px-3 py-1 rounded-lg font-semibold disabled:opacity-40"
                  style={{ background: '#f8f7f4', color: '#374151' }}>
                  Précédent
                </button>
                <span className="text-gray-600">Page {pageCourante} / {nbPages}</span>
                <button type="button" onClick={() => setPage(pageCourante + 1)} disabled={pageCourante >= nbPages}
                  className="px-3 py-1 rounded-lg font-semibold disabled:opacity-40"
                  style={{ background: '#f8f7f4', color: '#374151' }}>
                  Suivant
                </button>
              </div>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}