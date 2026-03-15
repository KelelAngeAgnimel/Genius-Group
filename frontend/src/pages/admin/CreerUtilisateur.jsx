import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import API_URL from '../../config'

const rolesDisponibles = [
  { value: 'etudiant_inphb', label: 'Etudiant INP-HB', couleur: '#C9A84C', description: 'Accès aux ressources INP-HB uniquement' },
  { value: 'etudiant_esatic', label: 'Etudiant ESATIC', couleur: '#4C7BC9', description: 'Accès aux ressources ESATIC uniquement' },
  { value: 'etudiant_both', label: 'Etudiant INP-HB + ESATIC', couleur: '#4CC9A8', description: 'Accès aux ressources des deux concours' },
  { value: 'professeur', label: 'Professeur', couleur: '#7B4CC9', description: 'Peut publier des ressources et envoyer des messages' },
  { value: 'admin', label: 'Administrateur', couleur: '#C94C7B', description: 'Accès complet à toutes les fonctionnalites' },
]

export default function CreerUtilisateur() {
  const { token } = useAuth()
  const [form, setForm] = useState({
    username: '',
    password: '',
    nom: '',
    prenom: '',
    role: 'etudiant_inphb',
    concours: 'aucun'
  })
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')
  const [utilisateurCree, setUtilisateurCree] = useState(null)

  const roleActif = rolesDisponibles.find(r => r.value === form.role)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSucces('')
    setErreur('')
    setUtilisateurCree(null)

    try {
      const res = await fetch(`${API_URL}/api/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (res.ok) {
        setSucces('Utilisateur créé avec succès !')
        setUtilisateurCree(data.user)
        setForm({
          username: '',
          password: '',
          nom: '',
          prenom: '',
          role: 'etudiant_inphb',
          concours: 'aucun'
        })
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

      {/* EN-TETE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Administration
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Créer un utilisateur
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Ajoutez un nouvel etudiant, professeur ou administrateur
        </p>
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

            {/* Nom et Prénom */}
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

            {/* Identifiant */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Identifiant <span className="text-red-400">*</span>
              </label>
              <input type="text" required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="Ex: jean.dupont"
                className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none transition"
                style={{ borderColor: '#f0ece0' }}
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e => e.target.style.borderColor = '#f0ece0'}
              />
              <p className="text-xs text-gray-400 mt-1">Cet identifiant sera utilisé pour se connecter</p>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Mot de passe <span className="text-red-400">*</span>
              </label>
              <input type="text" required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Mot de passe initial"
                className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none transition"
                style={{ borderColor: '#f0ece0' }}
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e => e.target.style.borderColor = '#f0ece0'}
              />
              <p className="text-xs text-gray-400 mt-1">Communiquez ce mot de passe à l'utilisateur</p>
            </div>

            {/* Rôle */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Rôle <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rolesDisponibles.map((role, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm({ ...form, role: role.value })}
                    className="p-3 rounded-xl text-left transition"
                    style={{
                      border: form.role === role.value ? `2px solid ${role.couleur}` : '1px solid #f0ece0',
                      background: form.role === role.value ? `${role.couleur}08` : 'white'
                    }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: role.couleur }} />
                      <p className="text-xs font-bold" style={{ color: form.role === role.value ? role.couleur : '#071020' }}>
                        {role.label}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 ml-5">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>

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

          {/* Rôle sélectionné */}
          {roleActif && (
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-400">
                Rôle sélectionné
              </p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 rounded-full" style={{ background: roleActif.couleur }} />
                <p className="font-bold text-sm" style={{ color: roleActif.couleur }}>{roleActif.label}</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{roleActif.description}</p>

              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #f0ece0' }}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Accès</p>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: 'Tableau de bord', ok: true },
                    { label: 'Planning', ok: true },
                    { label: 'Ressources INP-HB', ok: ['etudiant_inphb', 'etudiant_both', 'professeur', 'admin'].includes(form.role) },
                    { label: 'Ressources ESATIC', ok: ['etudiant_esatic', 'etudiant_both', 'professeur', 'admin'].includes(form.role) },
                    { label: 'Espace Professeur', ok: ['professeur', 'admin'].includes(form.role) },
                    { label: 'Administration', ok: form.role === 'admin' },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: a.ok ? 'rgba(76,201,168,0.15)' : 'rgba(201,76,123,0.1)' }}>
                        <span className="text-xs" style={{ color: a.ok ? '#4CC9A8' : '#C94C7B' }}>
                          {a.ok ? '✓' : '✗'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Compte créé */}
          {utilisateurCree && (
            <div className="bg-white rounded-2xl p-5"
              style={{ border: '1px solid rgba(76,201,168,0.3)', background: 'rgba(76,201,168,0.03)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#4CC9A8' }}>
                Compte créé
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Matricule</span>
                  <span className="text-xs font-bold" style={{ color: '#C9A84C' }}>{utilisateurCree.matricule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Identifiant</span>
                  <span className="text-xs font-bold text-gray-700">{utilisateurCree.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Rôle</span>
                  <span className="text-xs font-bold" style={{ color: roleActif?.couleur }}>
                    {roleActif?.label}
                  </span>
                </div>
              </div>
              <div className="mt-3 p-2 rounded-lg text-xs text-center"
                style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C' }}>
                Communiquez le matricule et le mot de passe à l'utilisateur
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}