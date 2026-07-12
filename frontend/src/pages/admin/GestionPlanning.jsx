import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import API_URL from '../../config'

const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const typeConfig = {
  cours: { label: 'Cours', couleur: '#C9A84C' },
  examen: { label: 'Examen', couleur: '#C94C7B' },
  evenement: { label: 'Événement', couleur: '#4C7BC9' },
}

const concoursConfig = {
  inphb: { label: 'INP-HB' },
  esatic: { label: 'ESATIC' },
  both: { label: 'INP-HB + ESATIC' },
  all: { label: 'Tous les étudiants' },
}

const modaliteConfig = {
  en_ligne: { label: 'En ligne', icone: '💻', couleur: '#4C7BC9' },
  presentiel: { label: 'Présentiel', icone: '🏫', couleur: '#C9A84C' },
  les_deux: { label: 'En ligne + Présentiel', icone: '🔀', couleur: '#4CC9A8' },
}

const formVide = {
  jour: 'Lundi',
  heure_debut: '08:00',
  heure_fin: '10:00',
  matiere: '',
  type: 'cours',
  salle: '',
  concours: 'both',
  modalite: 'les_deux',
  professeur_id: ''
}

export default function GestionPlanning() {
  const { token } = useAuth()
  const [cours, setCours] = useState([])
  const [profs, setProfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [form, setForm] = useState(formVide)
  const [editId, setEditId] = useState(null)
  const [filtreJour, setFiltreJour] = useState('tous')

  useEffect(() => {
    chargerDonnees()
  }, [])

  const chargerDonnees = async () => {
    setLoading(true)
    try {
      const [resPlanning, resUsers] = await Promise.all([
        fetch(`${API_URL}/api/planning`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/users/all`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      const dataPlanning = await resPlanning.json()
      const dataUsers = await resUsers.json()

      if (Array.isArray(dataPlanning)) setCours(dataPlanning)
      else setErreur(dataPlanning.error || 'Impossible de charger le planning.')

      if (dataUsers.users) {
        setProfs(dataUsers.users.filter(u => u.role === 'professeur'))
      }
    } catch {
      setErreur('Erreur de connexion au serveur.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm(formVide)
    setEditId(null)
  }

  const handleChange = (champ, valeur) => {
    setForm(f => ({ ...f, [champ]: valeur }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    setSucces('')

    if (!form.matiere.trim()) {
      setErreur('La matière est requise.')
      return
    }
    if (form.heure_fin <= form.heure_debut) {
      setErreur("L'heure de fin doit être après l'heure de début.")
      return
    }

    const payload = {
      ...form,
      professeur_id: form.professeur_id || null
    }

    try {
      const url = editId ? `${API_URL}/api/planning/${editId}` : `${API_URL}/api/planning`
      const method = editId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (!res.ok) {
        setErreur(data.error || "Erreur lors de l'enregistrement.")
        return
      }

      setSucces(editId ? 'Cours modifié avec succès.' : 'Cours ajouté avec succès.')
      resetForm()
      chargerDonnees()
    } catch {
      setErreur('Erreur de connexion au serveur.')
    }
  }

  const handleEdit = (c) => {
    setEditId(c.id)
    setForm({
      jour: c.jour,
      heure_debut: c.heure_debut,
      heure_fin: c.heure_fin,
      matiere: c.matiere,
      type: c.type,
      salle: c.salle || '',
      concours: c.concours,
      modalite: c.modalite || 'les_deux',
      professeur_id: c.professeur_id || ''
    })
    setSucces('')
    setErreur('')
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce cours du planning ?')) return
    try {
      const res = await fetch(`${API_URL}/api/planning/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        setErreur(data.error || 'Erreur lors de la suppression.')
        return
      }
      if (editId === id) resetForm()
      chargerDonnees()
    } catch {
      setErreur('Erreur de connexion au serveur.')
    }
  }

  const coursAffiches = filtreJour === 'tous'
    ? cours
    : cours.filter(c => c.jour === filtreJour)

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">📅 Gestion du planning</h2>
      <p className="text-sm text-gray-500 mb-6">
        Ajoutez, modifiez ou supprimez les cours de l'emploi du temps. Les étudiants ne voient que les cours de leur concours.
      </p>

      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {erreur}
        </div>
      )}
      {succes && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
          {succes}
        </div>
      )}

      {/* FORMULAIRE */}
      <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8">
        <p className="font-semibold text-gray-700 mb-4">
          {editId ? 'Modifier le cours' : 'Ajouter un cours'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Jour</label>
            <select
              value={form.jour}
              onChange={e => handleChange('jour', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {jours.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Heure début</label>
            <input
              type="time"
              value={form.heure_debut}
              onChange={e => handleChange('heure_debut', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Heure fin</label>
            <input
              type="time"
              value={form.heure_fin}
              onChange={e => handleChange('heure_fin', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Matière / Titre</label>
            <input
              type="text"
              value={form.matiere}
              onChange={e => handleChange('matiere', e.target.value)}
              placeholder="Ex: Mathématiques"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
            <select
              value={form.type}
              onChange={e => handleChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(typeConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Salle</label>
            <input
              type="text"
              value={form.salle}
              onChange={e => handleChange('salle', e.target.value)}
              placeholder="Ex: Salle A1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Concours concerné</label>
            <select
              value={form.concours}
              onChange={e => handleChange('concours', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(concoursConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Modalité du cours <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              {Object.entries(modaliteConfig).map(([key, val]) => (
                <button key={key} type="button"
                  onClick={() => handleChange('modalite', key)}
                  className="flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition text-center"
                  style={{
                    background: form.modalite === key ? val.couleur : `${val.couleur}15`,
                    color: form.modalite === key ? 'white' : val.couleur,
                    border: `1px solid ${val.couleur}40`
                  }}>
                  {val.icone} {val.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Détermine quels étudiants voient ce cours selon leur mode d'inscription
            </p>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Professeur mandaté</label>
            <select
              value={form.professeur_id}
              onChange={e => handleChange('professeur_id', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— Aucun professeur assigné —</option>
              {profs.map(p => (
                <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
              ))}
            </select>
            {profs.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Aucun professeur trouvé. Créez-en un dans "Créer un utilisateur" avec le rôle Professeur.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
          >
            {editId ? 'Enregistrer les modifications' : 'Ajouter au planning'}
          </button>
          {editId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Annuler la modification
            </button>
          )}
        </div>
      </form>

      {/* FILTRE */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFiltreJour('tous')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            filtreJour === 'tous' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Tous les jours
        </button>
        {jours.map(j => (
          <button
            key={j}
            onClick={() => setFiltreJour(j)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filtreJour === j ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {j}
          </button>
        ))}
      </div>

      {/* LISTE */}
      {loading ? (
        <p className="text-gray-400 text-sm">Chargement du planning...</p>
      ) : coursAffiches.length === 0 ? (
        <p className="text-gray-400 text-sm">Aucun cours pour le moment.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-200">
                <th className="py-2 pr-4">Jour</th>
                <th className="py-2 pr-4">Horaire</th>
                <th className="py-2 pr-4">Matière</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Salle</th>
                <th className="py-2 pr-4">Professeur</th>
                <th className="py-2 pr-4">Concours</th>
                <th className="py-2 pr-4">Modalité</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {coursAffiches.map(c => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-700">{c.jour}</td>
                  <td className="py-3 pr-4 text-gray-500">{c.heure_debut} - {c.heure_fin}</td>
                  <td className="py-3 pr-4 font-semibold text-gray-800">{c.matiere}</td>
                  <td className="py-3 pr-4">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-lg"
                      style={{
                        background: `${typeConfig[c.type]?.couleur}15`,
                        color: typeConfig[c.type]?.couleur
                      }}
                    >
                      {typeConfig[c.type]?.label || c.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{c.salle || '—'}</td>
                  <td className="py-3 pr-4 text-gray-500">{c.prof || '—'}</td>
                  <td className="py-3 pr-4 text-gray-500">{concoursConfig[c.concours]?.label || c.concours}</td>
                  <td className="py-3 pr-4">
                    {c.modalite && modaliteConfig[c.modalite] && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                        style={{
                          background: `${modaliteConfig[c.modalite].couleur}15`,
                          color: modaliteConfig[c.modalite].couleur
                        }}>
                        {modaliteConfig[c.modalite].icone} {modaliteConfig[c.modalite].label}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(c)}
                      className="text-blue-600 hover:underline text-xs font-semibold mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600 hover:underline text-xs font-semibold"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}