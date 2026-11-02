import { useEffect, useState } from 'react'
import api from '../../api'
import { useConcours } from '../../hooks/useConcours'
import { ouvrirFichierProtege } from '../../lib/fichiers'

const VIOLET = '#7B4CC9'
const CHAMP = 'text-sm rounded-xl px-3 py-2 outline-none'
const STYLE = { background: '#f8f7f4', border: '1px solid #e8e4da' }
const NIVEAUX = ['facile', 'moyen', 'difficile']

const formaterDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const nomEleve = (e) => [e.prenom, e.nom].filter(Boolean).join(' ') || e.username

// ── Élèves en difficulté ─────────────────────────────────────────────────────
function ListeDifficultes() {
  const [donnees, setDonnees] = useState(null)
  const [erreur, setErreur] = useState('')
  const [info, setInfo] = useState('')
  const [ouvert, setOuvert] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let actif = true
    api.get('/api/renforcement/difficultes', { params: { concours: 'ensea' } })
      .then(res => {
        if (!actif) return
        if (res.ok) setDonnees(res.data)
        else setErreur(res.data?.message || 'Chargement impossible')
      })
      .catch(() => actif && setErreur('Erreur de connexion au serveur'))
    return () => { actif = false }
  }, [version])

  const envoyer = async (d) => {
    setErreur(''); setInfo('')
    const res = await api.post('/api/renforcement/envoyer', {
      etudiant_id: d.etudiant.id, competence_id: d.competence.id, exercice_id: d.exercice_suggere?.id ?? null
    })
    if (!res.ok) return setErreur(res.data?.message || 'Envoi impossible')
    setInfo(`Exercice envoyé à ${nomEleve(d.etudiant)}.`)
    setVersion(v => v + 1)
  }

  if (!donnees && !erreur) return <p className="text-sm text-gray-400">Chargement…</p>
  const { parametres, difficultes } = donnees ?? { parametres: null, difficultes: [] }

  return (
    <div>
      {parametres && (
        <p className="text-xs text-gray-400 mb-4">
          Seuil de renforcement : {parametres.seuil} / 100 · envoi {parametres.mode === 'auto' ? 'automatique' : 'manuel (en un clic)'}.
          Seuls les scores définitifs (au moins une note rattachée) sont listés.
        </p>
      )}
      {erreur && <p className="text-sm mb-3" style={{ color: '#C94C7B' }}>{erreur}</p>}
      {info && <p className="text-sm mb-3" style={{ color: '#2a9d7f' }}>{info}</p>}
      {difficultes.length === 0 && !erreur && (
        <p className="text-sm text-gray-500">Aucun élève sous le seuil. Pensez à rattacher les notes aux compétences (bouton « Compétences » dans la grille de notes).</p>
      )}
      <div className="flex flex-col gap-3">
        {difficultes.map(d => {
          const cle = `${d.etudiant.id}|${d.competence.id}`
          return (
            <div key={cle} className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ece0' }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm" style={{ color: '#071020' }}>{nomEleve(d.etudiant)} <span className="font-normal text-xs text-gray-400">{d.etudiant.matricule}</span></p>
                  <p className="text-xs text-gray-600 mt-0.5"><span className="font-semibold" style={{ color: VIOLET }}>{d.competence.code}</span> · {d.competence.libelle}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold" style={{ color: '#C94C7B' }}>{Math.round(d.score)}<span className="text-xs text-gray-400"> / 100</span></p>
                  <button type="button" onClick={() => envoyer(d)} disabled={!d.peut_envoyer} title={d.raison ?? ''}
                    className="text-xs font-bold px-3 py-2 rounded-xl text-white disabled:opacity-40" style={{ background: VIOLET }}>
                    {d.exercice_suggere ? `Envoyer « ${d.exercice_suggere.titre} »` : 'Aucun exercice'}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-gray-400">
                <span>
                  {d.nb_autoeval} auto-évaluation(s) · {d.nb_notes} note(s)
                  {d.dernier_envoi && ` · dernier envoi le ${formaterDate(d.dernier_envoi)}`}
                  {d.raison && ` · ${d.raison}`}
                </span>
                <button type="button" onClick={() => setOuvert(ouvert === cle ? null : cle)} className="font-semibold" style={{ color: VIOLET }}>
                  {ouvert === cle ? 'Masquer l’historique' : 'Historique'}
                </button>
              </div>
              {ouvert === cle && (
                <ol className="mt-3 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                  {d.historique.map((h, i) => (
                    <li key={i}>{formaterDate(h.date)} : <b>{Math.round(h.score)}</b>{h.provisoire ? ' (provisoire)' : ''}</li>
                  ))}
                </ol>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Bibliothèque d'exercices de renforcement ────────────────────────────────
function Bibliotheque() {
  const [exercices, setExercices] = useState([])
  const [competences, setCompetences] = useState([])
  const [version, setVersion] = useState(0)
  const [form, setForm] = useState({ competence_id: '', titre: '', niveau: 'moyen' })
  const [fichier, setFichier] = useState(null)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    let actif = true
    api.get('/api/renforcement/exercices', { params: { concours: 'ensea' } }).then(res => actif && res.ok && setExercices(res.data.exercices))
    return () => { actif = false }
  }, [version])
  useEffect(() => {
    let actif = true
    api.get('/api/competences', { params: { concours: 'ensea' } }).then(res => actif && res.ok && setCompetences(res.data.competences))
    return () => { actif = false }
  }, [])

  const ajouter = async (e) => {
    e.preventDefault()
    setErreur('')
    if (!form.competence_id || !form.titre.trim() || !fichier) return setErreur('Choisissez la compétence, un titre et un fichier.')
    setEnvoi(true)
    try {
      const donnees = new FormData()
      donnees.append('competence_id', form.competence_id)
      donnees.append('titre', form.titre.trim())
      donnees.append('niveau', form.niveau)
      donnees.append('fichier', fichier)
      const res = await api.post('/api/renforcement/exercices', donnees)
      if (!res.ok) return setErreur(res.data?.message || 'Ajout impossible')
      setForm({ competence_id: form.competence_id, titre: '', niveau: 'moyen' }); setFichier(null)
      setVersion(v => v + 1)
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setEnvoi(false)
    }
  }
  const basculer = async (e) => {
    await api.patch(`/api/renforcement/exercices/${e.id}`, { actif: !e.actif })
    setVersion(v => v + 1)
  }
  const voir = async (id) => {
    const message = await ouvrirFichierProtege(`/api/renforcement/exercices/${id}/fichier`)
    if (message) setErreur(message)
  }

  return (
    <div>
      <form onSubmit={ajouter} className="bg-white rounded-2xl p-5 mb-5 flex flex-col gap-3" style={{ border: '1px solid #f0ece0' }}>
        <h3 className="font-bold text-sm" style={{ color: '#071020' }}>Ajouter un exercice</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={form.competence_id} onChange={e => setForm({ ...form, competence_id: e.target.value })} className={CHAMP} style={STYLE}>
            <option value="">— Compétence —</option>
            {competences.map(c => <option key={c.id} value={c.id}>{c.code} · {c.libelle}</option>)}
          </select>
          <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Titre" maxLength={200} className={CHAMP} style={STYLE} />
          <select value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })} className={CHAMP} style={STYLE}>
            {NIVEAUX.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <label className="text-xs text-gray-500">Fichier (PDF, JPG ou PNG)
          <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setFichier(e.target.files?.[0] ?? null)} className="block mt-1 text-xs" />
        </label>
        {erreur && <p className="text-xs" style={{ color: '#C94C7B' }}>{erreur}</p>}
        <button type="submit" disabled={envoi} className="self-start text-xs font-bold px-4 py-2 rounded-xl text-white disabled:opacity-50" style={{ background: VIOLET }}>
          {envoi ? 'Envoi…' : 'Ajouter'}
        </button>
      </form>

      <div className="bg-white rounded-2xl overflow-x-auto" style={{ border: '1px solid #f0ece0' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-400"><th className="p-3">Compétence</th><th className="p-3">Titre</th><th className="p-3">Niveau</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {exercices.map(e => (
              <tr key={e.id} style={{ borderTop: '1px solid #f8f7f4', opacity: e.actif ? 1 : 0.45 }}>
                <td className="p-3 font-semibold" style={{ color: VIOLET }}>{e.competence?.code}</td>
                <td className="p-3">{e.titre}</td>
                <td className="p-3">{e.niveau}</td>
                <td className="p-3 whitespace-nowrap text-xs font-semibold">
                  <button type="button" onClick={() => voir(e.id)} className="mr-3" style={{ color: VIOLET }}>Voir</button>
                  <button type="button" onClick={() => basculer(e)} className="text-gray-500">{e.actif ? 'Désactiver' : 'Réactiver'}</button>
                </td>
              </tr>
            ))}
            {exercices.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">Aucun exercice. Ajoutez-en pour que l’envoi soit possible.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Difficultes() {
  const { estPersonnel } = useConcours()
  const [onglet, setOnglet] = useState('difficultes')

  if (!estPersonnel) return <div className="p-6"><p className="text-sm text-gray-500">Page réservée aux professeurs et administrateurs.</p></div>

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: VIOLET }}>Outils</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>Élèves en difficulté</h1>
        <p className="text-gray-400 text-sm mt-1">Compétences sous le seuil et exercices de renforcement.</p>
      </div>
      <div className="flex gap-2 mb-5">
        {[['difficultes', 'Élèves en difficulté'], ['exercices', 'Exercices de renforcement']].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setOnglet(id)} className="text-xs font-bold px-4 py-2 rounded-xl"
            style={{ background: onglet === id ? '#071020' : 'white', color: onglet === id ? '#C9A84C' : '#6b7280', border: '1px solid #f0ece0' }}>
            {label}
          </button>
        ))}
      </div>
      {onglet === 'difficultes' ? <ListeDifficultes /> : <Bibliotheque />}
    </div>
  )
}
