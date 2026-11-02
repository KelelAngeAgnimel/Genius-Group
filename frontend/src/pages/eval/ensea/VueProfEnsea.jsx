import { useCallback, useEffect, useState } from 'react'
import api from '../../../api'
import { ouvrirFichierProtege } from '../../../lib/fichiers'

const VIOLET = '#7B4CC9'
const MATIERES = ['Français', 'Mathématiques'] // docs/pole-educatif.md
const FILTRES = [
  { id: '', label: 'Toutes' },
  { id: 'non_corrigees', label: 'Non corrigées' },
  { id: 'en_retard', label: 'En retard' },
]

const formaterDate = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// <input type="datetime-local"> → ISO (le serveur attend un horodatage avec fuseau)
const versIso = (valeurLocale) => (valeurLocale ? new Date(valeurLocale).toISOString() : undefined)

const STYLE_CHAMP = { background: '#f8f7f4', border: '1px solid #e8e4da' }
const champ = 'w-full text-sm rounded-xl px-3 py-2 outline-none'

// ── Formulaire de création ───────────────────────────────────────────────────
function FormulaireEvaluation({ onCree, onAnnuler }) {
  const [form, setForm] = useState({
    matiere: 'Français', titre: '', consignes: '', date_ouverture: '', date_limite: '', retard_autorise: true, competences: ''
  })
  const [sujet, setSujet] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const maj = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur('')
    if (!form.titre.trim() || !form.date_limite) return setErreur('Le titre et la date limite sont obligatoires.')
    setEnvoi(true)
    try {
      const donnees = new FormData()
      donnees.append('concours_code', 'ensea')
      donnees.append('matiere', form.matiere)
      donnees.append('titre', form.titre.trim())
      if (form.consignes.trim()) donnees.append('consignes', form.consignes.trim())
      const ouverture = versIso(form.date_ouverture)
      if (ouverture) donnees.append('date_ouverture', ouverture)
      donnees.append('date_limite', versIso(form.date_limite))
      donnees.append('retard_autorise', String(form.retard_autorise))
      if (form.competences.trim()) donnees.append('competences', form.competences)
      if (sujet) donnees.append('sujet', sujet)
      const res = await api.post('/api/evaluations', donnees)
      if (!res.ok) return setErreur(res.data?.message || 'Création impossible')
      onCree()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={soumettre} className="bg-white rounded-2xl p-5 mb-6 flex flex-col gap-3" style={{ border: '1px solid #f0ece0' }}>
      <h3 className="font-bold text-sm" style={{ color: '#071020' }}>Nouvelle évaluation ENSEA</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={form.matiere} onChange={e => maj('matiere', e.target.value)} className={champ} style={STYLE_CHAMP}>
          {MATIERES.map(m => <option key={m}>{m}</option>)}
        </select>
        <input value={form.titre} onChange={e => maj('titre', e.target.value)} placeholder="Titre *" maxLength={200} className={champ} style={STYLE_CHAMP} />
      </div>
      <textarea value={form.consignes} onChange={e => maj('consignes', e.target.value)} rows={3} maxLength={5000}
        placeholder="Consignes (facultatif)" className={champ} style={STYLE_CHAMP} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs text-gray-500">Ouverture (vide = maintenant)
          <input type="datetime-local" value={form.date_ouverture} onChange={e => maj('date_ouverture', e.target.value)} className={champ + ' mt-1'} style={STYLE_CHAMP} />
        </label>
        <label className="text-xs text-gray-500">Date limite *
          <input type="datetime-local" value={form.date_limite} onChange={e => maj('date_limite', e.target.value)} className={champ + ' mt-1'} style={STYLE_CHAMP} />
        </label>
      </div>
      <input value={form.competences} onChange={e => maj('competences', e.target.value)}
        placeholder="Compétences évaluées, ex. FR-RES-1, FR-RES-4 (facultatif)" className={champ} style={STYLE_CHAMP} />
      <label className="text-xs text-gray-500 flex items-center gap-2">
        <input type="checkbox" checked={form.retard_autorise} onChange={e => maj('retard_autorise', e.target.checked)} />
        Dépôt autorisé après la date limite (signalé « en retard »)
      </label>
      <label className="text-xs text-gray-500">Sujet (PDF ou image, facultatif)
        <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setSujet(e.target.files?.[0] ?? null)} className="block mt-1 text-xs" />
      </label>
      {erreur && <p className="text-xs" style={{ color: '#C94C7B' }}>{erreur}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={envoi} className="text-xs font-bold px-4 py-2 rounded-xl text-white disabled:opacity-50" style={{ background: VIOLET }}>
          {envoi ? 'Création…' : 'Créer l’évaluation'}
        </button>
        <button type="button" onClick={onAnnuler} className="text-xs font-bold px-4 py-2 rounded-xl text-gray-500">Annuler</button>
      </div>
    </form>
  )
}

// ── Correction d'une copie ───────────────────────────────────────────────────
function FormulaireCorrection({ copie, onFait }) {
  const [note, setNote] = useState(copie.note ?? '')
  const [commentaire, setCommentaire] = useState(copie.commentaire ?? '')
  const [corrige, setCorrige] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  const enregistrer = async (e) => {
    e.preventDefault()
    setErreur('')
    const valeur = Number(String(note).replace(',', '.'))
    if (note === '' || Number.isNaN(valeur) || valeur < 0 || valeur > 20) return setErreur('La note doit être comprise entre 0 et 20.')
    setEnvoi(true)
    try {
      const donnees = new FormData()
      donnees.append('note', String(valeur))
      if (commentaire.trim()) donnees.append('commentaire', commentaire.trim())
      if (corrige) donnees.append('corrige', corrige)
      const res = await api.put(`/api/evaluations/copies/${copie.id}/correction`, donnees)
      if (!res.ok) return setErreur(res.data?.message || 'Enregistrement impossible')
      onFait()
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={enregistrer} className="mt-3 rounded-xl p-4 flex flex-col gap-3" style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }}>
      <div className="flex items-center gap-2">
        <input type="number" min="0" max="20" step="0.25" value={note} onChange={e => setNote(e.target.value)}
          placeholder="Note" className="w-24 text-sm rounded-xl px-3 py-2 outline-none bg-white" style={{ border: '1px solid #e8e4da' }} />
        <span className="text-sm text-gray-400">/ 20</span>
      </div>
      <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={3} maxLength={5000}
        placeholder="Commentaire pour l’élève" className="w-full text-sm rounded-xl px-3 py-2 outline-none bg-white" style={{ border: '1px solid #e8e4da' }} />
      <label className="text-xs text-gray-500">Corrigé annoté (PDF, JPG ou PNG — facultatif)
        <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setCorrige(e.target.files?.[0] ?? null)} className="block mt-1 text-xs" />
        {copie.a_corrige && !corrige && <span className="text-gray-400"> Un corrigé est déjà enregistré ; un nouveau fichier le remplacera.</span>}
      </label>
      {erreur && <p className="text-xs" style={{ color: '#C94C7B' }}>{erreur}</p>}
      <button type="submit" disabled={envoi} className="self-start text-xs font-bold px-4 py-2 rounded-xl text-white disabled:opacity-50" style={{ background: '#4CC9A8' }}>
        {envoi ? 'Enregistrement…' : copie.statut === 'corrigee' ? 'Mettre à jour la correction' : 'Enregistrer la correction'}
      </button>
    </form>
  )
}

// ── Copies d'une évaluation ──────────────────────────────────────────────────
function ListeCopies({ evaluation, onRetour, onChange }) {
  const [filtre, setFiltre] = useState('')
  const [copies, setCopies] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [enCorrection, setEnCorrection] = useState(null)

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/evaluations/${evaluation.id}/copies`, { params: filtre ? { filtre } : {} })
      if (res.ok) setCopies(res.data.copies)
      else setErreur(res.data?.message || 'Chargement impossible')
    } catch {
      setErreur('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }, [evaluation.id, filtre])

  useEffect(() => { charger() }, [charger])

  const ouvrirCopie = async (copie) => {
    setErreur('')
    const message = await ouvrirFichierProtege(`/api/evaluations/copies/${copie.id}/fichier`)
    if (message) setErreur(message)
    else { charger(); onChange() } // le statut passe à « en correction »
  }

  const nomEleve = (c) => [c.etudiant?.prenom, c.etudiant?.nom].filter(Boolean).join(' ') || c.etudiant?.username || 'Élève'

  return (
    <div>
      <button type="button" onClick={onRetour} className="text-xs font-semibold mb-3" style={{ color: VIOLET }}>← Retour aux évaluations</button>
      <h2 className="font-bold text-lg" style={{ color: '#071020' }}>{evaluation.titre}</h2>
      <p className="text-xs text-gray-400 mb-4">{evaluation.matiere} · limite {formaterDate(evaluation.date_limite)}</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTRES.map(f => (
          <button key={f.id} type="button" onClick={() => setFiltre(f.id)} className="text-xs font-bold px-3 py-2 rounded-xl"
            style={{ background: filtre === f.id ? '#071020' : 'white', color: filtre === f.id ? '#C9A84C' : '#6b7280', border: '1px solid #f0ece0' }}>
            {f.label}
          </button>
        ))}
      </div>

      {erreur && <p className="text-sm mb-3" style={{ color: '#C94C7B' }}>{erreur}</p>}
      {loading ? <p className="text-sm text-gray-400">Chargement…</p>
        : copies.length === 0 ? <p className="text-sm text-gray-400">Aucune copie.</p>
        : (
          <div className="flex flex-col gap-3">
            {copies.map(c => (
              <div key={c.id} className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ece0' }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#071020' }}>{nomEleve(c)}</p>
                    <p className="text-xs text-gray-400">{c.etudiant?.matricule} · déposée le {formaterDate(c.deposee_le)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.en_retard && <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(201,76,123,0.1)', color: '#C94C7B' }}>En retard</span>}
                    <span className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{ background: c.statut === 'corrigee' ? 'rgba(76,201,168,0.12)' : 'rgba(201,168,76,0.12)', color: c.statut === 'corrigee' ? '#2a9d7f' : '#a8872f' }}>
                      {c.statut === 'corrigee' ? `${c.note} / 20` : c.statut === 'en_correction' ? 'En correction' : 'À corriger'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => ouvrirCopie(c)} className="text-xs font-bold px-3 py-2 rounded-xl" style={{ color: VIOLET, border: `1px solid ${VIOLET}60` }}>
                    👁 Ouvrir la copie
                  </button>
                  <button type="button" onClick={() => setEnCorrection(enCorrection === c.id ? null : c.id)}
                    className="text-xs font-bold px-3 py-2 rounded-xl text-white" style={{ background: '#071020' }}>
                    {c.statut === 'corrigee' ? 'Modifier la correction' : 'Corriger'}
                  </button>
                </div>
                {enCorrection === c.id && <FormulaireCorrection copie={c} onFait={() => { setEnCorrection(null); charger(); onChange() }} />}
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

// ── Vue professeur / admin ───────────────────────────────────────────────────
export default function VueProfEnsea() {
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [creation, setCreation] = useState(false)
  const [ouverte, setOuverte] = useState(null)

  const charger = useCallback(async () => {
    try {
      const res = await api.get('/api/evaluations/gestion')
      if (res.ok) setEvaluations(res.data.evaluations)
      else setErreur(res.data?.message || 'Chargement impossible')
    } catch {
      setErreur('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { charger() }, [charger])

  if (ouverte) {
    return <ListeCopies evaluation={ouverte} onRetour={() => { setOuverte(null); charger() }} onChange={charger} />
  }

  return (
    <div>
      {!creation && (
        <button type="button" onClick={() => setCreation(true)} className="text-xs font-bold px-4 py-2 rounded-xl text-white mb-5" style={{ background: VIOLET }}>
          + Nouvelle évaluation
        </button>
      )}
      {creation && <FormulaireEvaluation onCree={() => { setCreation(false); charger() }} onAnnuler={() => setCreation(false)} />}

      {erreur && <p className="text-sm mb-3" style={{ color: '#C94C7B' }}>{erreur}</p>}
      {loading ? <p className="text-sm text-gray-400">Chargement…</p>
        : evaluations.length === 0 ? <p className="text-sm text-gray-400">Aucune évaluation pour le moment.</p>
        : (
          <div className="flex flex-col gap-3">
            {evaluations.map(e => (
              <button key={e.id} type="button" onClick={() => setOuverte(e)} className="text-left bg-white rounded-2xl p-5 hover:shadow transition" style={{ border: '1px solid #f0ece0' }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest" style={{ color: VIOLET }}>{e.matiere}</p>
                    <p className="font-bold" style={{ color: '#071020' }}>{e.titre}</p>
                    <p className="text-xs text-gray-400 mt-1">Limite : {formaterDate(e.date_limite)}{e.ouverte ? '' : ' · pas encore ouverte'}</p>
                  </div>
                  <div className="flex gap-2 text-xs font-bold">
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">{e.nb_copies} copie(s)</span>
                    {e.nb_a_corriger > 0 && <span className="px-2 py-1 rounded-full" style={{ background: 'rgba(201,168,76,0.12)', color: '#a8872f' }}>{e.nb_a_corriger} à corriger</span>}
                    {e.nb_en_retard > 0 && <span className="px-2 py-1 rounded-full" style={{ background: 'rgba(201,76,123,0.1)', color: '#C94C7B' }}>{e.nb_en_retard} en retard</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
    </div>
  )
}
