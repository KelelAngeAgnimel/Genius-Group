import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import API_URL from '../../config'

const matieresConcours = {
  'INP-HB': ['Culture Générale', 'Culture Scientifique', 'Culture Littéraire'],
  'ESATIC': ['Mathématiques', 'Physique', 'Anglais', 'Français'],
  'CME': ['Culture Générale', 'Culture Scientifique', 'Anglais', 'Français'],
  'tous': ['Culture Générale', 'Culture Scientifique', 'Culture Littéraire', 'Mathématiques', 'Physique', 'Anglais', 'Français']
}

const periodes = ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Fev 2026', 'Mar 2026', 'Avr 2026', 'Mai 2026', 'Jun 2026', 'Jul 2026', 'Aout 2026']

const typeColor = {
  pdf: '#C9A84C',
  video: '#4C7BC9',
  lien: '#4CC9A8',
  exercice: '#C94C7B'
}

const roleLabel = {
  etudiant_inphb: 'INP-HB',
  etudiant_esatic: 'ESATIC',
  etudiant_both: 'INP-HB + ESATIC',
  etudiant_cme: 'CME',
  etudiant_inphb_cme: 'INP-HB + CME',
  etudiant_esatic_cme: 'ESATIC + CME',
  etudiant_all: 'INP-HB + ESATIC + CME',
}

// ══════════════════════════════════════════════════════════════
// Concours reellement prepares par un etudiant selon son role.
// Un profil multi-concours (etudiant_all, etudiant_both, ...) doit
// apparaitre dans TOUTES les listes correspondantes, sinon il devient
// invisible au moment de publier une note.
// ══════════════════════════════════════════════════════════════
const concoursDeRole = (role) => {
  const r = (role || '').toLowerCase()
  if (r === 'etudiant_all')  return ['INP-HB', 'ESATIC', 'CME']
  if (r === 'etudiant_both') return ['INP-HB', 'ESATIC']
  const liste = []
  if (r.includes('inphb'))  liste.push('INP-HB')
  if (r.includes('esatic')) liste.push('ESATIC')
  if (r.includes('cme'))    liste.push('CME')
  return liste
}

// L'etudiant prepare-t-il ce concours ? ('tous' = aucun filtre)
const suitLeConcours = (role, concours) =>
  !concours || concours === 'tous' || concoursDeRole(role).includes(concours)

// Identifiant affichable : matricule en priorite, sinon username
const identifiant = (e) => e.matricule || e.username || ''

// Nom lisible, avec repli sur l'identifiant si le nom n'est pas renseigne
const nomComplet = (e) =>
  [e.prenom, e.nom].filter(Boolean).join(' ').trim() || identifiant(e) || 'Etudiant sans nom'

// Libelle unique dans les listes deroulantes : identifiant + nom
const libelleEtudiant = (e) =>
  `${identifiant(e)} — ${nomComplet(e)}`

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
    matiere: '', concours: 'INP-HB', lien: '', est_evaluation: false
  })
  const [fichier, setFichier] = useState(null)

  // Message
  const [msgForm, setMsgForm] = useState({ a_id: '', sujet: '', contenu: '' })
  const [msgMode, setMsgMode] = useState('etudiant')   // 'etudiant' | 'groupe'
  const [msgGroupe, setMsgGroupe] = useState('tous')   // 'tous' | 'inphb' | 'esatic' | 'all'

  // Filtres de la liste des étudiants
  const [filtreEtuConcours, setFiltreEtuConcours] = useState('tous') // 'tous' | 'inphb' | 'esatic' | 'all'
  const [filtreEtuModalite, setFiltreEtuModalite] = useState('tous') // 'tous' | 'en_ligne' | 'presentiel'

  // Notes
  const [noteForm, setNoteForm] = useState({
    etudiant_id: '', matiere: '', concours: 'INP-HB', note: '', periode: 'Mar 2026'
  })
  const [rechercheEtu, setRechercheEtu] = useState('')   // recherche nom / matricule
  const [notesClasse, setNotesClasse] = useState([])
  const [filtreNotesConcours, setFiltreNotesConcours] = useState('INP-HB')
  const [filtreNotesPeriode, setFiltreNotesPeriode] = useState('Mar 2026')

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    chargerRessources()
    chargerEtudiants()
    chargerMessages()
  }, [])

  useEffect(() => {
    if (onglet === 'notes') chargerNotesClasse()
  }, [onglet, filtreNotesConcours, filtreNotesPeriode])

  const chargerRessources = async () => {
    const res = await fetch(`${API_URL}/api/ressources/toutes`, { headers })
    const data = await res.json()
    if (data.ressources) setRessources(data.ressources)
  }

  const chargerEtudiants = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/all`, { headers })
      const data = await res.json()
      if (!data.users) {
        setErreur(data.message || 'Impossible de charger la liste des etudiants')
        return
      }
      // (u.role || '') : un role vide ne doit pas faire planter le filtre
      // et donc vider toute la liste des etudiants.
      const liste = data.users
        .filter(u => (u.role || '').startsWith('etudiant'))
        .sort((a, b) => identifiant(a).localeCompare(identifiant(b), 'fr', { numeric: true }))
      setEtudiants(liste)
    } catch {
      setErreur('Impossible de charger la liste des etudiants')
    }
  }

  const chargerMessages = async () => {
    const res = await fetch(`${API_URL}/api/messages/envoyes`, { headers })
    const data = await res.json()
    if (data.messages) setMessages(data.messages)
  }

  const chargerNotesClasse = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API_URL}/api/notes/classe?concours=${filtreNotesConcours}&periode=${filtreNotesPeriode}`,
        { headers }
      )
      const data = await res.json()
      if (data.notes) setNotesClasse(data.notes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
        setSucces(form.est_evaluation
          ? 'Évaluation publiee avec succes ! Elle est disponible dans Outils → Évaluation.'
          : 'Ressource publiee avec succes !')
        setForm({ titre: '', description: '', type: 'pdf', matiere: '', concours: 'INP-HB', lien: '', est_evaluation: false })
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
    setSucces('')
    setErreur('')
    try {
      if (msgMode === 'groupe') {
        // Diffusion à un groupe d'étudiants
        const res = await fetch(`${API_URL}/api/messages/diffuser`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupe: msgGroupe, sujet: msgForm.sujet, contenu: msgForm.contenu })
        })
        const data = await res.json()
        if (data.success) {
          setSucces(`Message envoye a ${data.count} etudiant${data.count > 1 ? 's' : ''} !`)
          setMsgForm({ a_id: '', sujet: '', contenu: '' })
          chargerMessages()
        } else {
          setErreur(data.message || 'Erreur lors de la diffusion')
        }
      } else {
        // Envoi à un seul étudiant
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
        } else {
          setErreur(data.message || 'Erreur envoi message')
        }
      }
    } catch {
      setErreur('Erreur envoi message')
    } finally {
      setLoading(false)
    }
  }

  const publierNote = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSucces('')
    setErreur('')
    try {
      const res = await fetch(`${API_URL}/api/notes/ajouter`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...noteForm,
          note: parseFloat(noteForm.note)
        })
      })
      const data = await res.json()
      if (data.success) {
        setSucces('Note publiee avec succes !')
        setNoteForm({ etudiant_id: '', matiere: '', concours: 'INP-HB', note: '', periode: 'Mar 2026' })
        setRechercheEtu('')
        chargerNotesClasse()
      } else {
        setErreur(data.message || 'Erreur lors de la publication')
      }
    } catch {
      setErreur('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  // Liste des étudiants filtrée (onglet "Mes étudiants")
  const etudiantsFiltres = etudiants.filter(e =>
    suitLeConcours(e.role, filtreEtuConcours) &&
    (filtreEtuModalite === 'tous' || e.modalite === filtreEtuModalite)
  )

  const onglets = [
    { key: 'ressources', label: 'Mes ressources' },
    { key: 'upload', label: 'Publier une ressource' },
    { key: 'notes', label: 'Publier des notes' },
    { key: 'etudiants', label: 'Mes etudiants' },
    { key: 'messages', label: 'Envoyer un message' },
  ]

  // ══════════════════════════════════════════════════════════════
  // Etudiants proposes pour la saisie d'une note.
  // On garde TOUS ceux qui preparent le concours choisi, profils
  // multi-concours compris, puis on applique la recherche libre
  // (nom, prenom ou matricule : ex "26GEN0007" ou "kouakou").
  // ══════════════════════════════════════════════════════════════
  const rechercheNormalisee = rechercheEtu.trim().toLowerCase()
  const etudiantsPourNotes = etudiants
    .filter(e => suitLeConcours(e.role, noteForm.concours))
    .filter(e => !rechercheNormalisee ||
      `${nomComplet(e)} ${identifiant(e)} ${e.username || ''}`
        .toLowerCase()
        .includes(rechercheNormalisee)
    )

  // Si l'etudiant selectionne sort de la liste (changement de concours
  // ou de recherche), on remet le champ a zero pour ne jamais publier
  // une note sur un etudiant qui n'est plus affiche.
  useEffect(() => {
    if (noteForm.etudiant_id &&
        !etudiantsPourNotes.some(e => String(e.id) === String(noteForm.etudiant_id))) {
      setNoteForm(f => ({ ...f, etudiant_id: '' }))
    }
  }, [noteForm.concours, rechercheEtu, etudiants])

  // Organiser les notes par étudiant pour l'affichage
  const notesParEtudiant = notesClasse.reduce((acc, note) => {
    const id = note.etudiant?.id
    if (!id) return acc
    if (!acc[id]) acc[id] = { etudiant: note.etudiant, notes: [] }
    acc[id].notes.push(note)
    return acc
  }, {})

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#4CC9A8' }}>
          Espace professeur
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Bonjour, {user?.prenom || user?.username}
        </h1>
        <p className="text-gray-400 text-sm mt-1">Gérez vos ressources, notes et etudiants</p>
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
              style={{ border: '1px solid #f0ece0', opacity: r.visible ? 1 : 0.6 }}>
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
                <button onClick={() => toggleVisibilite(r.id, r.visible)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={{
                    background: r.visible ? '#f0ece0' : 'rgba(76,201,168,0.1)',
                    color: r.visible ? '#6b7280' : '#4CC9A8'
                  }}>
                  {r.visible ? 'Masquer' : 'Rendre visible'}
                </button>
                <button onClick={() => supprimerRessource(r.id)}
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
          <h2 className="font-bold text-base mb-1" style={{ color: '#071020' }}>
            Publier une nouvelle ressource
          </h2>
          <p className="text-xs text-gray-400 mb-5">
            Le document sera immédiatement visible par les élèves du concours sélectionné dans la section Ressources.
          </p>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">

            {/* Étape 1 — Choisir le concours EN PREMIER */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                1. Concours cible
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { val: 'INP-HB', label: 'INP-HB', couleur: '#C9A84C' },
                  { val: 'ESATIC', label: 'ESATIC', couleur: '#4C7BC9' },
                  { val: 'CME', label: 'CME', couleur: '#4CC9A8' },
                  { val: 'tous', label: 'Tous les élèves', couleur: '#7B4CC9' },
                ].map(c => (
                  <button key={c.val} type="button"
                    onClick={() => setForm({ ...form, concours: c.val, matiere: '' })}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold transition"
                    style={{
                      background: form.concours === c.val ? c.couleur : `${c.couleur}15`,
                      color: form.concours === c.val ? 'white' : c.couleur,
                      border: `1px solid ${c.couleur}40`
                    }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Étape 2 — Choisir la matière (dépend du concours) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                2. Matière
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(matieresConcours[form.concours] || []).map(m => (
                  <button key={m} type="button"
                    onClick={() => setForm({ ...form, matiere: m })}
                    className="py-2 px-3 rounded-xl text-xs font-semibold transition text-left"
                    style={{
                      background: form.matiere === m ? '#071020' : '#f8f7f4',
                      color: form.matiere === m ? '#C9A84C' : '#374151',
                      border: `1px solid ${form.matiere === m ? 'rgba(201,168,76,0.4)' : '#f0ece0'}`
                    }}>
                    {m}
                  </button>
                ))}
              </div>
              {!form.matiere && (
                <p className="text-xs text-orange-400 mt-1">Sélectionnez une matière</p>
              )}
            </div>

            {/* Étape 3 — Titre et description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">3. Titre du document</label>
                <input type="text" required
                  value={form.titre}
                  onChange={e => setForm({ ...form, titre: e.target.value })}
                  placeholder="Ex: Annales Culture Générale 2023"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                  style={{ borderColor: '#f0ece0' }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#f0ece0'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description (optionnel)</label>
                <input type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Sujets officiels avec corrigés"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                  style={{ borderColor: '#f0ece0' }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#f0ece0'}
                />
              </div>
            </div>

            {/* Étape 4 — Fichier PDF */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">4. Fichier PDF</label>
              <div className="border-2 border-dashed rounded-xl p-5 text-center transition"
                style={{ borderColor: fichier ? '#C9A84C' : '#f0ece0', background: fichier ? 'rgba(201,168,76,0.04)' : '#fafafa' }}>
                <input type="file" accept=".pdf"
                  onChange={e => setFichier(e.target.files[0])}
                  className="hidden" id="fichier-upload"
                />
                <label htmlFor="fichier-upload" className="cursor-pointer">
                  {fichier ? (
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#C9A84C' }}>✓ {fichier.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {(fichier.size / 1024 / 1024).toFixed(2)} Mo · Cliquer pour changer
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl mb-2">📄</p>
                      <p className="text-sm font-semibold text-gray-500">Cliquer pour choisir un PDF</p>
                      <p className="text-xs text-gray-400 mt-1">Taille maximale : 50 Mo</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Étape 5 — Est-ce une évaluation ? */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                5. Type de publication
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: false, titre: 'Ressource', sous: 'Apparaît dans la Bibliothèque', couleur: '#C9A84C', icone: '📄' },
                  { val: true, titre: 'Évaluation', sous: 'Apparaît dans Outils → Évaluation', couleur: '#C94C7B', icone: '📝' },
                ].map(opt => {
                  const actif = form.est_evaluation === opt.val
                  return (
                    <button key={String(opt.val)} type="button"
                      onClick={() => setForm({ ...form, est_evaluation: opt.val })}
                      className="p-3 rounded-xl text-left transition"
                      style={{
                        background: actif ? `${opt.couleur}12` : '#f8f7f4',
                        border: `1px solid ${actif ? opt.couleur : '#f0ece0'}`
                      }}>
                      <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: actif ? opt.couleur : '#374151' }}>
                        <span>{opt.icone}</span> {opt.titre}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: actif ? opt.couleur : '#9ca3af' }}>{opt.sous}</p>
                    </button>
                  )
                })}
              </div>
              {form.est_evaluation && (
                <p className="text-xs mt-2" style={{ color: '#C94C7B' }}>
                  Cette évaluation sera visible uniquement par les élèves du concours sélectionné, dans la page Évaluation.
                </p>
              )}
            </div>

            <button type="submit" disabled={loading || !form.matiere || !form.titre || !fichier}
              className="py-3 rounded-xl text-sm font-bold tracking-widest transition"
              style={{
                background: (!form.matiere || !form.titre || !fichier || loading)
                  ? '#e5e1d5' : 'linear-gradient(135deg, #071020, #0d1f3c)',
                color: (!form.matiere || !form.titre || !fichier || loading) ? '#9ca3af' : '#C9A84C',
                border: '1px solid rgba(201,168,76,0.4)',
                cursor: (!form.matiere || !form.titre || !fichier || loading) ? 'not-allowed' : 'pointer'
              }}>
              {loading ? 'Publication en cours...' : (form.est_evaluation ? 'Publier l\'évaluation' : 'Publier la ressource')}
            </button>
          </form>
        </div>
      )}

      {/* ONGLET NOTES */}
      {onglet === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Formulaire saisie note */}
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #f0ece0' }}>
            <h2 className="font-bold text-base mb-5" style={{ color: '#071020' }}>
              Publier une note
            </h2>
            <form onSubmit={publierNote} className="flex flex-col gap-4">

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Concours</label>
                <select required
                  value={noteForm.concours}
                  onChange={e => setNoteForm({ ...noteForm, concours: e.target.value, matiere: '' })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800"
                  style={{ borderColor: '#f0ece0' }}>
                  <option value="INP-HB">INP-HB</option>
                  <option value="ESATIC">ESATIC</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-600">Etudiant</label>
                  <span className="text-xs" style={{ color: '#C9A84C' }}>
                    {etudiantsPourNotes.length} etudiant{etudiantsPourNotes.length > 1 ? 's' : ''}
                  </span>
                </div>

                <input type="text"
                  value={rechercheEtu}
                  onChange={e => setRechercheEtu(e.target.value)}
                  placeholder="Rechercher par nom ou matricule (ex : 26GEN0007)"
                  className="w-full border rounded-xl px-4 py-2 text-sm text-gray-800 mb-2 focus:outline-none"
                  style={{ borderColor: '#f0ece0' }}
                  onFocus={e => e.target.style.borderColor = '#C9A84C'}
                  onBlur={e => e.target.style.borderColor = '#f0ece0'}
                />

                <select required
                  value={noteForm.etudiant_id}
                  onChange={e => setNoteForm({ ...noteForm, etudiant_id: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800"
                  style={{ borderColor: '#f0ece0' }}>
                  <option value="">Choisir un etudiant</option>
                  {etudiantsPourNotes.map(e => (
                    <option key={e.id} value={e.id}>
                      {libelleEtudiant(e)} ({roleLabel[e.role] || e.role})
                    </option>
                  ))}
                </select>

                {etudiantsPourNotes.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: '#C94C7B' }}>
                    {rechercheEtu
                      ? 'Aucun etudiant ne correspond a cette recherche.'
                      : `Aucun etudiant inscrit au concours ${noteForm.concours}.`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Matiere</label>
                <select required
                  value={noteForm.matiere}
                  onChange={e => setNoteForm({ ...noteForm, matiere: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800"
                  style={{ borderColor: '#f0ece0' }}>
                  <option value="">Choisir une matiere</option>
                  {(matieresConcours[noteForm.concours] || []).map((m, i) => (
                    <option key={i} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Note (sur 20)
                  </label>
                  <input type="number" required
                    min="0" max="20" step="0.5"
                    value={noteForm.note}
                    onChange={e => setNoteForm({ ...noteForm, note: e.target.value })}
                    placeholder="Ex: 14.5"
                    className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
                    style={{ borderColor: '#f0ece0' }}
                    onFocus={e => e.target.style.borderColor = '#C9A84C'}
                    onBlur={e => e.target.style.borderColor = '#f0ece0'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Période</label>
                  <select required
                    value={noteForm.periode}
                    onChange={e => setNoteForm({ ...noteForm, periode: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800"
                    style={{ borderColor: '#f0ece0' }}>
                    {periodes.map((p, i) => (
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="py-3 rounded-xl text-sm font-bold tracking-widest transition disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                  color: '#C9A84C',
                  border: '1px solid rgba(201,168,76,0.4)'
                }}>
                {loading ? 'Publication...' : 'Publier la note'}
              </button>
            </form>
          </div>

          {/* Tableau des notes de la classe */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
            <h2 className="font-bold text-base mb-4" style={{ color: '#071020' }}>
              Notes de la classe
            </h2>

            {/* Filtres */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {['INP-HB', 'ESATIC'].map((c, i) => (
                <button key={i}
                  onClick={() => setFiltreNotesConcours(c)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={{
                    background: filtreNotesConcours === c ? '#071020' : '#f8f7f4',
                    color: filtreNotesConcours === c ? '#C9A84C' : '#6b7280',
                    border: `1px solid ${filtreNotesConcours === c ? 'rgba(201,168,76,0.4)' : '#f0ece0'}`
                  }}>
                  {c}
                </button>
              ))}
              <select
                value={filtreNotesPeriode}
                onChange={e => setFiltreNotesPeriode(e.target.value)}
                className="ml-auto border rounded-lg px-3 py-1.5 text-xs text-gray-700"
                style={{ borderColor: '#f0ece0' }}>
                {periodes.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
              </div>
            )}

            {!loading && Object.keys(notesParEtudiant).length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs text-gray-400">Aucune note pour cette periode</p>
              </div>
            )}

            {!loading && (
              <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '400px' }}>
                {Object.values(notesParEtudiant).map((item, i) => (
                  <div key={i} className="p-3 rounded-xl"
                    style={{ background: '#f8f7f4', border: '1px solid #f0ece0' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: '#071020' }}>
                        {item.etudiant?.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">
                          {nomComplet(item.etudiant || {})}
                        </p>
                        <p className="text-xs text-gray-400">{item.etudiant?.matricule}</p>
                      </div>
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                        Moy: {(item.notes.reduce((a, n) => a + n.note, 0) / item.notes.length).toFixed(1)}/20
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.notes.map((n, j) => (
                        <div key={j} className="flex items-center gap-1 px-2 py-1 rounded-lg"
                          style={{ background: 'white', border: '1px solid #f0ece0' }}>
                          <span className="text-xs text-gray-500">{n.matiere}</span>
                          <span className="text-xs font-bold" style={{ color: n.note >= 10 ? '#4CC9A8' : '#C94C7B' }}>
                            {n.note}/20
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONGLET ETUDIANTS */}
      {onglet === 'etudiants' && (
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
          <h2 className="font-bold text-base mb-4" style={{ color: '#071020' }}>
            Liste des etudiants ({etudiantsFiltres.length})
          </h2>

          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Concours</label>
              <select
                value={filtreEtuConcours}
                onChange={e => setFiltreEtuConcours(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                style={{ borderColor: '#f0ece0' }}>
                <option value="tous">Tous les concours</option>
                <option value="INP-HB">INP-HB</option>
                <option value="ESATIC">ESATIC</option>
                <option value="CME">INP-HB + ESATIC + CME</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Modalité</label>
              <select
                value={filtreEtuModalite}
                onChange={e => setFiltreEtuModalite(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                style={{ borderColor: '#f0ece0' }}>
                <option value="tous">Toutes les modalités</option>
                <option value="en_ligne">💻 En ligne</option>
                <option value="presentiel">🏫 Présentiel</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {etudiantsFiltres.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">Aucun étudiant pour ces filtres</p>
            )}
            {etudiantsFiltres.map((etudiant, i) => (
              <div key={i}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: '#f8f7f4', border: '1px solid #f0ece0' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                  style={{ background: '#071020' }}>
                  {(etudiant.prenom || etudiant.username)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {nomComplet(etudiant)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs font-bold" style={{ color: '#C9A84C' }}>
                      {etudiant.matricule || etudiant.username}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">
                      Identifiant : {etudiant.username}
                    </span>
                  </div>
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
                  style={{ background: 'rgba(76,123,201,0.1)', color: '#4C7BC9' }}>
                  Message
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ONGLET MESSAGES */}
      {onglet === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
            <h2 className="font-bold text-base mb-5" style={{ color: '#071020' }}>
              Envoyer un message
            </h2>
            <form onSubmit={envoyerMessage} className="flex flex-col gap-4">
              {/* Choix du type de destinataire */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Envoyer à</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'etudiant', label: '👤 Un étudiant' },
                    { val: 'groupe', label: '👥 Un groupe' },
                  ].map(m => (
                    <button key={m.val} type="button"
                      onClick={() => setMsgMode(m.val)}
                      className="rounded-xl px-3 py-2 text-sm font-bold transition"
                      style={{
                        border: msgMode === m.val ? '2px solid #C9A84C' : '1px solid #f0ece0',
                        background: msgMode === m.val ? 'rgba(201,168,76,0.1)' : 'white',
                        color: msgMode === m.val ? '#C9A84C' : '#071020',
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {msgMode === 'etudiant' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Destinataire</label>
                  <select required
                    value={msgForm.a_id}
                    onChange={e => setMsgForm({ ...msgForm, a_id: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800"
                    style={{ borderColor: '#f0ece0' }}>
                    <option value="">Choisir un etudiant</option>
                    {etudiants.map(e => (
                      <option key={e.id} value={e.id}>
                        {libelleEtudiant(e)} ({roleLabel[e.role] || e.role})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Groupe destinataire</label>
                  <select
                    value={msgGroupe}
                    onChange={e => setMsgGroupe(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-white"
                    style={{ borderColor: '#f0ece0' }}>
                    <option value="tous">Tous les étudiants</option>
                    <option value="inphb">Tous les INP-HB (incl. INP-HB+ESATIC+CME)</option>
                    <option value="esatic">Tous les ESATIC (incl. INP-HB+ESATIC+CME)</option>
                    <option value="all">INP-HB + ESATIC + CME uniquement</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Le message sera envoyé individuellement à chaque étudiant du groupe.
                  </p>
                </div>
              )}
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

          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
            <h2 className="font-bold text-base mb-5" style={{ color: '#071020' }}>
              Messages envoyes ({messages.length})
            </h2>
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '400px' }}>
              {messages.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-8">Aucun message envoye</p>
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