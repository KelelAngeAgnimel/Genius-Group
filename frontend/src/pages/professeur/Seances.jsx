import { useCallback, useEffect, useState } from 'react'
import api from '../../api'
import { useConcours } from '../../hooks/useConcours'

const VIOLET = '#7B4CC9'
const CHAMP = 'w-full text-sm rounded-xl px-3 py-2 outline-none'
const STYLE = { background: '#f8f7f4', border: '1px solid #e8e4da' }

const formaterDate = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// Valeur par défaut d'un <input type="datetime-local"> (heure locale, sans secondes)
const localeIso = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

// ── Création d'une séance ────────────────────────────────────────────────────
function FormulaireSeance({ onCree, onAnnuler }) {
  const [competences, setCompetences] = useState([])
  const [meetings, setMeetings] = useState([])
  const maintenant = new Date()
  const [form, setForm] = useState({
    titre: '', debut: localeIso(new Date(maintenant.getTime() - 2 * 3600000)), fin: localeIso(maintenant), meeting_id: ''
  })
  const [choisies, setChoisies] = useState([])
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    api.get('/api/competences', { params: { concours: 'ensea' } }).then(res => res.ok && setCompetences(res.data.competences))
    api.get('/api/meetings').then(res => res.ok && setMeetings(res.data.filter(m => String(m.concours ?? '').toLowerCase().includes('ensea'))))
  }, [])

  const matieres = [...new Set(competences.map(c => c.matiere))]
  const basculer = (id) => setChoisies(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))

  const soumettre = async (e) => {
    e.preventDefault()
    setErreur('')
    if (!form.titre.trim()) return setErreur('Donnez un titre à la séance.')
    if (choisies.length === 0) return setErreur('Cochez au moins une compétence abordée.')
    setEnvoi(true)
    try {
      const res = await api.post('/api/seances', {
        concours_code: 'ensea',
        titre: form.titre.trim(),
        debut: new Date(form.debut).toISOString(),
        fin: new Date(form.fin).toISOString(),
        meeting_id: form.meeting_id || null,
        competence_ids: choisies
      })
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
      <h3 className="font-bold text-sm" style={{ color: '#071020' }}>Nouvelle séance ENSEA</h3>
      <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Titre (ex. Limites et continuité)" maxLength={200} className={CHAMP} style={STYLE} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="text-xs text-gray-500">Début
          <input type="datetime-local" value={form.debut} onChange={e => setForm({ ...form, debut: e.target.value })} className={CHAMP + ' mt-1'} style={STYLE} />
        </label>
        <label className="text-xs text-gray-500">Fin de séance
          <input type="datetime-local" value={form.fin} onChange={e => setForm({ ...form, fin: e.target.value })} className={CHAMP + ' mt-1'} style={STYLE} />
        </label>
        <label className="text-xs text-gray-500">Cours à distance associé
          <select value={form.meeting_id} onChange={e => setForm({ ...form, meeting_id: e.target.value })} className={CHAMP + ' mt-1'} style={STYLE}>
            <option value="">— aucun —</option>
            {meetings.map(m => <option key={m.id} value={m.id}>{m.titre}</option>)}
          </select>
        </label>
      </div>
      <p className="text-xs text-gray-400">
        À la fin de la séance, les élèves ENSEA devront auto-évaluer les compétences cochées ci-dessous.
      </p>
      {matieres.map(matiere => (
        <fieldset key={matiere}>
          <legend className="text-xs font-bold mb-1" style={{ color: VIOLET }}>{matiere}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {competences.filter(c => c.matiere === matiere).map(c => (
              <label key={c.id} className="flex items-start gap-2 text-xs text-gray-600 p-1">
                <input type="checkbox" checked={choisies.includes(c.id)} onChange={() => basculer(c.id)} className="mt-0.5" />
                <span><b>{c.code}</b> · {c.libelle}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {erreur && <p className="text-xs" style={{ color: '#C94C7B' }}>{erreur}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={envoi} className="text-xs font-bold px-4 py-2 rounded-xl text-white disabled:opacity-50" style={{ background: VIOLET }}>
          {envoi ? 'Création…' : 'Créer la séance'}
        </button>
        <button type="button" onClick={onAnnuler} className="text-xs font-bold px-4 py-2 rounded-xl text-gray-500">Annuler</button>
      </div>
    </form>
  )
}

// ── Suivi d'une séance : qui a répondu, qui est verrouillé ──────────────────
function SuiviSeance({ seance, onRetour }) {
  const [eleves, setEleves] = useState([])
  const [erreur, setErreur] = useState('')

  const [version, setVersion] = useState(0)
  const charger = () => setVersion(v => v + 1)
  useEffect(() => {
    let actif = true
    api.get(`/api/seances/${seance.id}/suivi`).then(res => {
      if (!actif) return
      if (res.ok) setEleves(res.data.eleves)
      else setErreur(res.data?.message || 'Chargement impossible')
    })
    return () => { actif = false }
  }, [seance.id, version])

  const debloquer = async (e) => {
    const res = await api.post(`/api/seances/${seance.id}/debloquer`, { etudiant_id: e.id })
    if (!res.ok) return setErreur(res.data?.message || 'Déblocage impossible')
    charger()
  }
  const nom = (e) => [e.prenom, e.nom].filter(Boolean).join(' ') || e.username
  const etiquette = (e) =>
    e.etat === 'faite' ? { texte: 'Remplie', couleur: '#2a9d7f' }
    : e.verrouille ? { texte: 'Verrouillé', couleur: '#C94C7B' }
    : e.debloque ? { texte: 'Débloqué', couleur: '#4C7BC9' }
    : e.etat === 'en_attente' ? { texte: e.rappel ? 'En retard' : 'En attente', couleur: '#a8872f' }
    : { texte: '—', couleur: '#9ca3af' }

  return (
    <div>
      <button type="button" onClick={onRetour} className="text-xs font-semibold mb-3" style={{ color: VIOLET }}>← Retour aux séances</button>
      <h2 className="font-bold text-lg" style={{ color: '#071020' }}>{seance.titre}</h2>
      <p className="text-xs text-gray-400 mb-4">Terminée le {formaterDate(seance.fin)}</p>
      {erreur && <p className="text-sm mb-3" style={{ color: '#C94C7B' }}>{erreur}</p>}
      <div className="flex flex-col gap-2">
        {eleves.map(e => {
          const t = etiquette(e)
          return (
            <div key={e.id} className="bg-white rounded-xl p-3 flex items-center justify-between gap-2" style={{ border: '1px solid #f0ece0' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#071020' }}>{nom(e)}</p>
                <p className="text-xs text-gray-400">{e.matricule}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold" style={{ color: t.couleur }}>{t.texte}</span>
                {e.verrouille && (
                  <button type="button" onClick={() => debloquer(e)} className="text-xs font-bold px-3 py-1.5 rounded-xl text-white" style={{ background: VIOLET }}>
                    Débloquer
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {eleves.length === 0 && <p className="text-sm text-gray-400">Aucun élève.</p>}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Seances() {
  const { estPersonnel } = useConcours()
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(true)
  const [creation, setCreation] = useState(false)
  const [ouverte, setOuverte] = useState(null)

  const charger = useCallback(async () => {
    try {
      const res = await api.get('/api/seances')
      if (res.ok) setSeances(res.data.seances)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { if (estPersonnel) charger() }, [estPersonnel, charger])

  if (!estPersonnel) {
    return <div className="p-6"><p className="text-sm text-gray-500">Page réservée aux professeurs et administrateurs.</p></div>
  }

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: VIOLET }}>Outils</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Séances et auto-évaluations</h1>
        <p className="text-gray-400 text-sm mt-1">Associez chaque séance aux compétences abordées et suivez les auto-évaluations des élèves.</p>
      </div>

      {ouverte ? <SuiviSeance seance={ouverte} onRetour={() => { setOuverte(null); charger() }} /> : (
        <>
          {!creation && (
            <button type="button" onClick={() => setCreation(true)} className="text-xs font-bold px-4 py-2 rounded-xl text-white mb-5" style={{ background: VIOLET }}>
              + Nouvelle séance
            </button>
          )}
          {creation && <FormulaireSeance onCree={() => { setCreation(false); charger() }} onAnnuler={() => setCreation(false)} />}

          {loading ? <p className="text-sm text-gray-400">Chargement…</p>
            : seances.length === 0 ? <p className="text-sm text-gray-400">Aucune séance pour le moment.</p>
            : (
              <div className="flex flex-col gap-3">
                {seances.map(s => {
                  const terminee = new Date(s.fin) <= new Date()
                  return (
                    <button key={s.id} type="button" onClick={() => setOuverte(s)} className="text-left bg-white rounded-2xl p-5 hover:shadow transition" style={{ border: '1px solid #f0ece0' }}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold" style={{ color: '#071020' }}>{s.titre}</p>
                          <p className="text-xs text-gray-400 mt-1">{formaterDate(s.debut)} → {formaterDate(s.fin)}{terminee ? '' : ' · à venir'}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {s.competences.map(c => <span key={c.code} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${VIOLET}15`, color: VIOLET }}>{c.code}</span>)}
                          </div>
                        </div>
                        {terminee && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                            {s.nb_complets} / {s.nb_eleves} auto-évaluation(s)
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
        </>
      )}
    </div>
  )
}
