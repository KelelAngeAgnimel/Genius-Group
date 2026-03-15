import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import API_URL from '../../config'

export default function EspaceProfesseur() {
  const { user, token } = useAuth()
  const [onglet, setOnglet] = useState('ressources')
  const [ressources, setRessources] = useState([])
  const [etudiants, setEtudiants] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')

  // Formulaire upload
  const [form, setForm] = useState({
    titre: '', description: '', type: 'pdf',
    matiere: '', concours: 'INP-HB', lien: ''
  })
  const [fichier, setFichier] = useState(null)

  // Message
  const [msgForm, setMsgForm] = useState({ a_id: '', sujet: '', contenu: '' })

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    chargerRessources()
    chargerEtudiants()
    chargerMessages()
  }, [])

  const chargerRessources = async () => {
    const res = await fetch(`${API_URL}/api/ressources/toutes`, { headers })
    const data = await res.json()
    if (data.ressources) setRessources(data.ressources)
  }

  const chargerEtudiants = async () => {
    const res = await fetch(`${API_URL}/api/users/all`, { headers })
    const data = await res.json()
    if (data.users) setEtudiants(data.users.filter(u =>
      ['etudiant_inphb', 'etudiant_esatic', 'etudiant_both'].includes(u.role)
    ))
  }

  const chargerMessages = async () => {
    const res = await fetch(`${API_URL}/api/messages/envoyes`, { headers })
    const data = await res.json()
    if (data.messages) setMessages(data.messages)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur('')
    setSucces('')

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      if (fichier) formData.append('fichier', fichier)

      const res = await fetch(`${API_URL}/api/ressources/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()

      if (data.success) {
        setSucces('Ressource publiee avec succes !')
        setForm({ titre: '', description: '', type: 'pdf', matiere: '', concours: 'INP-HB', lien: '' })
        setFichier(null)
        chargerRessources()
      } else {
        setErreur(data.message || 'Erreur lors de la publication')
      }
    } catch {
      setErreur('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibilite = async (id, visible) => {
    await fetch(`${API_URL}/api/ressources/${id}/visibilite`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !visible })
    })
    chargerRessources()
  }

  const supprimerRessource = async (id) => {
    if (!confirm('Supprimer cette ressource ?')) return
    await fetch(`${API_URL}/api/ressources/${id}`, { method: 'DELETE', headers })
    chargerRessources()
  }

  const envoyerMessage = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/messages/envoyer`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(msgForm)
      })
      const data = await res.json()
      if (data.success) {
        setSucces('Message envoye avec succes !')
        setMsgForm({ a_id: '', sujet: '', contenu: '' })
        chargerMessages()
      }
    } catch {
      setErreur('Erreur envoi message')
    } finally {
      setLoading(false)
    }
  }

  const roleLabel = {
    etudiant_inphb: 'INP-HB',
    etudiant_esatic: 'ESATIC',
    etudiant_both: 'INP-HB + ESATIC'
  }

  const typeColor = {
    pdf: '#C9A84C',
    video: '#4C7BC9',
    lien: '#4CC9A8',
    exercice: '#C94C7B'
  }

  const onglets = [
    { key: 'ressources', label: 'Mes ressources' },
    { key: 'upload', label: 'Publier une ressource' },
    { key: 'etudiants', label: 'Mes etudiants' },
    { key: 'messages', label: 'Envoyer un message' },
  ]

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Espace professeur
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Bienvenue, {user?.prenom || user?.username}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Gérez vos ressources et suivez vos étudiants
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Ressources publiees', valeur: ressources.filter(r => r.visible).length, couleur: '#C9A84C' },
          { label: 'Ressources masquees', valeur: ressources.filter(r => !r.visible).length, couleur: '#9ca3af' },
          { label: 'Etudiants', valeur: etudiants.length, couleur: '#4C7BC9' },
          { label: 'Messages envoyes', valeur: messages.length, couleur: '#4CC9A8' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4"
            style={{ border: '1px solid #f0ece0' }}>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: s.couleur }}>{s.valeur}</p>
          </div>
        ))}
      </div>

      {/* ONGLETS */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {onglets.map((o, i) => (
          <button key={i}
            onClick={() => { setOnglet(o.key); setSucces(''); setErreur('') }}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap"
            style={{
              background: onglet === o.key ? '#071020' : 'white',
              color: onglet === o.key ? '#C9A84C' : '#6b7280',
              border: onglet === o.key ? '1px solid rgba(201,168,76,0.4)' : '1px solid #f0ece0'
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {succes && (
        <div className="mb-4 p-3 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(76,201,168,0.1)', color: '#4CC9A8', border: '1px solid rgba(76,201,168,0.3)' }}>
          {succes}
        </div>
      )}
      {erreur && (
        <div className="mb-4 p-3 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(201,76,123,0.1)', color: '#C94C7B', border: '1px solid rgba(201,76,123,0.3)' }}>
          {erreur}
        </div>
      )}

      {/* ONGLET RESSOURCES */}
      {onglet === 'ressources' && (
        <div className="flex flex-col gap-3">
          {ressources.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl"
              style={{ border: '1px solid #f0ece0' }}>
              Aucune ressource publiee pour l'instant
            </div>
          )}
          {ressources.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-4"
              style={{
                border: '1px solid #f0ece0',
                opacity: r.visible ? 1 : 0.6
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                style={{ background: typeColor[r.type] || '#9ca3af' }}>
                {r.type?.toUpperCase().slice(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{r.titre}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                    {r.concours}
                  </span>
                  <span className="text-xs text-gray-400">{r.matiere}</span>
                  <span className="text-xs font-semibold"
                    style={{ color: r.visible ? '#4CC9A8' : '#9ca3af' }}>
                    {r.visible ? 'Visible' : 'Masquee'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleVisibilite(r.id, r.visible)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={{
                    background: r.visible ? '#f0ece0' : 'rgba(76,201,168,0.1)',
                    color: r.visible ? '#6b7280' : '#4CC9A8'
                  }}>
                  {r.visible ? 'Masquer' : 'Rendre visible'}
                </button>
                <button
                  onClick={() => supprimerRessource(r.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(201,76,123,0.1)', color: '#C94C7B' }}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ONGLET UPLOAD */}
      {onglet === 'upload' && (
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f0ece0' }}>
          <h2 className="font-bold text-base mb-5" style={{ color: '#071020' }}>
            Publier une nouvelle ressource
          </h2>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Titre</label>
                <input type="text" required
                  value={form.titre}
                  onChange={e => setForm({ ...form, titre: e.target.value })}
                  placeholder="Ex: Cours de Mathematiques - Chapitre 1"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                  style={{ borderColor: '#f0ece0' }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#f0ece0'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Matiere</label>
                <input type="text" required
                  value={form.matiere}
                  onChange={e => setForm({ ...form, matiere: e.target.value })}
                  placeholder="Ex: Mathematiques"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                  style={{ borderColor: '#f0ece0' }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#f0ece0'}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Description de la ressource..."
                className="w-full border rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none resize-none"
                style={{ borderColor: '#f0ece0' }}
                onFocus={e => e.target.style.borderColor = '#C9A84C'}
                onBlur={e => e.target.style.borderColor = '#f0ece0'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                  style={{ borderColor: '#f0ece0' }}>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="lien">Lien externe</option>
                  <option value="exercice">Exercice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Concours cible</label>
                <select
                  value={form.concours}
                  onChange={e => setForm({ ...form, concours: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                  style={{ borderColor: '#f0ece0' }}>
                  <option value="INP-HB">INP-HB uniquement</option>
                  <option value="ESATIC">ESATIC uniquement</option>
                  <option value="tous">Tous les etudiants</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {form.type === 'lien' ? 'Lien URL' : 'Fichier (PDF/Video)'}
                </label>
                {form.type === 'lien' ? (
                  <input type="url"
                    value={form.lien}
                    onChange={e => setForm({ ...form, lien: e.target.value })}
                    placeholder="https://..."
                    className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                    style={{ borderColor: '#f0ece0' }}
                    onFocus={e => e.target.style.borderColor = '#C9A84C'}
                    onBlur={e => e.target.style.borderColor = '#f0ece0'}
                  />
                ) : (
                  <input type="file"
                    accept={form.type === 'video' ? 'video/*' : '.pdf'}
                    onChange={e => setFichier(e.target.files[0])}
                    className="w-full border rounded-xl px-4 py-2 text-xs text-gray-600"
                    style={{ borderColor: '#f0ece0' }}
                  />
                )}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="py-3 rounded-xl text-sm font-bold tracking-widest transition disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                color: '#C9A84C',
                border: '1px solid rgba(201,168,76,0.4)'
              }}>
              {loading ? 'Publication en cours...' : 'Publier la ressource'}
            </button>
          </form>
        </div>
      )}

      {/* ONGLET ETUDIANTS */}
      {onglet === 'etudiants' && (
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
          <h2 className="font-bold text-base mb-5" style={{ color: '#071020' }}>
            Liste des etudiants ({etudiants.length})
          </h2>
          <div className="flex flex-col gap-2">
            {etudiants.map((etudiant, i) => (
              <div key={i}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: '#f8f7f4', border: '1px solid #f0ece0' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: '#071020' }}>
                  {etudiant.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {etudiant.prenom || ''} {etudiant.nom || etudiant.username}
                  </p>
                  <p className="text-xs text-gray-400">{etudiant.matricule}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                  {roleLabel[etudiant.role] || etudiant.role}
                </span>
                <button
                  onClick={() => {
                    setMsgForm({ ...msgForm, a_id: etudiant.id })
                    setOnglet('messages')
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition"
                  style={{
                    background: 'rgba(76,123,201,0.1)',
                    color: '#4C7BC9'
                  }}>
                  Envoyer message
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ONGLET MESSAGES */}
      {onglet === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Formulaire */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
            <h2 className="font-bold text-base mb-5" style={{ color: '#071020' }}>
              Envoyer un message
            </h2>
            <form onSubmit={envoyerMessage} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Destinataire</label>
                <select required
                  value={msgForm.a_id}
                  onChange={e => setMsgForm({ ...msgForm, a_id: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                  style={{ borderColor: '#f0ece0' }}>
                  <option value="">Choisir un etudiant</option>
                  {etudiants.map((e, i) => (
                    <option key={i} value={e.id}>
                      {e.prenom || ''} {e.nom || e.username} — {roleLabel[e.role]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sujet</label>
                <input type="text" required
                  value={msgForm.sujet}
                  onChange={e => setMsgForm({ ...msgForm, sujet: e.target.value })}
                  placeholder="Ex: Exercices supplementaires Mathematiques"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                  style={{ borderColor: '#f0ece0' }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#f0ece0'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
                <textarea rows={5} required
                  value={msgForm.contenu}
                  onChange={e => setMsgForm({ ...msgForm, contenu: e.target.value })}
                  placeholder="Votre message..."
                  className="w-full border rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none resize-none"
                  style={{ borderColor: '#f0ece0' }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#f0ece0'}
                />
              </div>

              <button type="submit" disabled={loading}
                className="py-3 rounded-xl text-sm font-bold tracking-widest transition disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                  color: '#C9A84C',
                  border: '1px solid rgba(201,168,76,0.4)'
                }}>
                {loading ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </form>
          </div>

          {/* Messages envoyés */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
            <h2 className="font-bold text-base mb-5" style={{ color: '#071020' }}>
              Messages envoyes ({messages.length})
            </h2>
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '400px' }}>
              {messages.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">
                  Aucun message envoye
                </p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className="p-3 rounded-xl"
                  style={{ background: '#f8f7f4', border: '1px solid #f0ece0' }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-gray-800">{msg.sujet}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(msg.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mb-1 truncate">{msg.contenu}</p>
                  <p className="text-xs font-semibold" style={{ color: '#C9A84C' }}>
                    A : {msg.destinataire?.prenom || ''} {msg.destinataire?.nom || msg.destinataire?.username}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}