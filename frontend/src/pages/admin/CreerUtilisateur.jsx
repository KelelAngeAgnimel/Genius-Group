import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import API_URL from '../../config'

const rolesDisponibles = [
  { value: 'etudiant_inphb', label: 'Etudiant INP-HB', couleur: '#C9A84C', description: 'Prépare uniquement le concours INP-HB' },
  { value: 'etudiant_esatic', label: 'Etudiant ESATIC', couleur: '#4C7BC9', description: 'Prépare uniquement le concours ESATIC' },
  { value: 'etudiant_all', label: 'Etudiant INP-HB + ESATIC + CME', couleur: '#4CC9A8', description: 'Prépare les trois concours — INP-HB, ESATIC et CME' },
  { value: 'professeur', label: 'Professeur', couleur: '#7B4CC9', description: 'Peut publier des ressources et envoyer des messages' },
  { value: 'admin', label: 'Administrateur', couleur: '#C94C7B', description: 'Accès complet à toutes les fonctionnalités' },
]

export default function CreerUtilisateur() {
  const { token } = useAuth()
  const [form, setForm] = useState({
    username: '',
    password: '',
    nom: '',
    prenom: '',
    role: 'etudiant_inphb',
    concours: 'aucun',
    modalite: ''
  })
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [utilisateurCree, setUtilisateurCree] = useState(null)

  const roleActif = rolesDisponibles.find(r => r.value === form.role)
  const estEtudiant = form.role?.startsWith('etudiant')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSucces('')
    setErreur('')
    setUtilisateurCree(null)

    if (!estEtudiant && !form.username) {
      setErreur('L\'identifiant de connexion est requis pour les professeurs et administrateurs')
      setLoading(false)
      return
    }

    if (estEtudiant && !form.modalite) {
      setErreur('Veuillez choisir la modalité des cours (en ligne ou présentiel)')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        setSucces('Compte créé avec succès !')
        setUtilisateurCree(data.user)
        setForm({ username: '', password: '', nom: '', prenom: '', role: 'etudiant_inphb', concours: 'aucun', modalite: '' })
      } else {
        setErreur(data.message || 'Erreur lors de la création')
      }
    } catch {
      setErreur('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>Administration</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Créer un compte</h1>
        <p className="text-gray-400 text-sm mt-1">Le matricule est généré automatiquement dans l'ordre d'inscription</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORMULAIRE */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ border: '1px solid #f0ece0' }}>

          {succes && (
            <div className="mb-5 p-3 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(76,201,168,0.1)', color: '#4CC9A8', border: '1px solid rgba(76,201,168,0.3)' }}>
              {succes}
            </div>
          )}
          {erreur && (
            <div className="mb-5 p-3 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(201,76,123,0.1)', color: '#C94C7B', border: '1px solid rgba(201,76,123,0.3)' }}>
              {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Prénom et Nom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Prénom</label>
                <input type="text"
                  value={form.prenom}
                  onChange={e => setForm({ ...form, prenom: e.target.value })}
                  placeholder="Ex: Jean-Marie"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none transition"
                  style={{ borderColor: '#f0ece0' }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#f0ece0'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nom</label>
                <input type="text"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Dupont"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none transition"
                  style={{ borderColor: '#f0ece0' }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#f0ece0'}
                />
              </div>
            </div>

            {/* Identifiant — uniquement pour profs et admins */}
            {!estEtudiant && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Identifiant de connexion <span className="text-red-400">*</span>
                </label>
                <input type="text" required={!estEtudiant}
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="Ex: prof.martin"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none transition"
                  style={{ borderColor: '#f0ece0' }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#f0ece0'}
                />
                <p className="text-xs text-gray-400 mt-1">Cet identifiant sera utilisé pour se connecter</p>
              </div>
            )}

            {/* Info matricule pour les étudiants */}
            {estEtudiant && (
              <div className="p-4 rounded-xl"
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 24 }}>🎫</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#C9A84C' }}>
                      Matricule généré automatiquement
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Le matricule (ex: <strong>26GEN0001</strong>) sera attribué automatiquement et servira d'identifiant de connexion à l'étudiant.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Mot de passe initial <span className="text-red-400">*</span>
              </label>
              <input type="text" required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Mot de passe à communiquer à l'utilisateur"
                className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none transition"
                style={{ borderColor: '#f0ece0' }}
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e => e.target.style.borderColor = '#f0ece0'}
              />
            </div>

            {/* Rôle */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Rôle <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rolesDisponibles.map((role, i) => (
                  <button key={i} type="button"
                    onClick={() => setForm({ ...form, role: role.value, modalite: '' })}
                    className="p-3 rounded-xl text-left transition"
                    style={{
                      border: form.role === role.value ? `2px solid ${role.couleur}` : '1px solid #f0ece0',
                      background: form.role === role.value ? `${role.couleur}08` : 'white'
                    }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: role.couleur }} />
                      <p className="text-xs font-bold" style={{ color: form.role === role.value ? role.couleur : '#071020' }}>
                        {role.label}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 ml-5">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* MODALITÉ — uniquement pour les étudiants */}
            {estEtudiant && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Modalité des cours <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  L'emploi du temps de l'étudiant sera adapté selon sa modalité.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button"
                    onClick={() => setForm({ ...form, modalite: 'en_ligne' })}
                    className="p-4 rounded-xl text-left transition"
                    style={{
                      border: form.modalite === 'en_ligne' ? '2px solid #4C7BC9' : '1px solid #f0ece0',
                      background: form.modalite === 'en_ligne' ? 'rgba(76,123,201,0.06)' : 'white'
                    }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span style={{ fontSize: 24 }}>💻</span>
                      <p className="text-sm font-bold" style={{ color: form.modalite === 'en_ligne' ? '#4C7BC9' : '#071020' }}>
                        En ligne
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      L'étudiant suit les cours à distance via la plateforme. Emploi du temps adapté aux sessions virtuelles.
                    </p>
                  </button>

                  <button type="button"
                    onClick={() => setForm({ ...form, modalite: 'presentiel' })}
                    className="p-4 rounded-xl text-left transition"
                    style={{
                      border: form.modalite === 'presentiel' ? '2px solid #C9A84C' : '1px solid #f0ece0',
                      background: form.modalite === 'presentiel' ? 'rgba(201,168,76,0.06)' : 'white'
                    }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span style={{ fontSize: 24 }}>🏫</span>
                      <p className="text-sm font-bold" style={{ color: form.modalite === 'presentiel' ? '#C9A84C' : '#071020' }}>
                        Présentiel
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      L'étudiant suit les cours en classe. Emploi du temps adapté aux sessions en salle.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Bouton */}
            <button type="submit" disabled={loading}
              className="py-3 rounded-xl text-sm font-bold tracking-widest transition disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                color: '#C9A84C',
                border: '1px solid rgba(201,168,76,0.4)'
              }}>
              {loading ? 'Création en cours...' : 'Créer le compte'}
            </button>
          </form>
        </div>

        {/* PANEL DROITE */}
        <div className="flex flex-col gap-4">

          {/* Info matricule automatique */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-400">Matricule automatique</p>
            <div className="text-center py-3">
              <p className="text-2xl font-black" style={{ color: '#C9A84C', letterSpacing: '0.1em' }}>
                26GEN####
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Le matricule est généré automatiquement dans l'ordre d'inscription. Le premier étudiant obtient <strong>26GEN0001</strong>, le suivant <strong>26GEN0002</strong>, etc.
              </p>
            </div>
          </div>

          {/* Rôle sélectionné */}
          {roleActif && (
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-400">Rôle sélectionné</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 rounded-full" style={{ background: roleActif.couleur }} />
                <p className="font-bold text-sm" style={{ color: roleActif.couleur }}>{roleActif.label}</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{roleActif.description}</p>
            </div>
          )}

          {/* Compte créé avec succès */}
          {utilisateurCree && (
            <div className="bg-white rounded-2xl p-5"
              style={{ border: '1px solid rgba(76,201,168,0.3)', background: 'rgba(76,201,168,0.03)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#4CC9A8' }}>
                ✓ Compte créé
              </p>
              <div className="flex flex-col gap-2.5">
                {utilisateurCree.matricule && (
                  <div className="flex justify-between items-center p-2 rounded-lg"
                    style={{ background: 'rgba(201,168,76,0.08)' }}>
                    <span className="text-xs text-gray-500">Matricule</span>
                    <span className="text-sm font-black" style={{ color: '#C9A84C', letterSpacing: '0.1em' }}>
                      {utilisateurCree.matricule}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Identifiant</span>
                  <span className="text-xs font-bold text-gray-700">{utilisateurCree.username}</span>
                </div>
                {utilisateurCree.modalite && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Modalité</span>
                    <span className="text-xs font-bold" style={{ color: utilisateurCree.modalite === 'en_ligne' ? '#4C7BC9' : '#C9A84C' }}>
                      {utilisateurCree.modalite === 'en_ligne' ? '💻 En ligne' : '🏫 Présentiel'}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 p-2 rounded-lg text-xs text-center"
                style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C' }}>
                Communiquez le matricule et le mot de passe à l'étudiant
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}