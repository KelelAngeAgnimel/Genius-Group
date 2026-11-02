import { useEffect, useState } from 'react'
import api from '../../api'
import { CODES_CONCOURS, libelleConcours } from '../../lib/concours'
import { lireCsv, telechargerCsv } from '../../lib/csv'
import Loader from '../../components/Loader'
import { useConfirm } from '../../hooks/useUi'

const VIOLET = '#7B4CC9'
const CHAMP = 'text-sm rounded-xl px-3 py-2 outline-none'
const STYLE = { background: '#f8f7f4', border: '1px solid #e8e4da' }

// ── Options du concours (modifiables en administration) ──────────────────────
function OptionsConcours({ code }) {
  const [options, setOptions] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let actif = true
    api.get('/api/concours').then(res => {
      if (!actif || !res.ok) return
      const o = res.data.concours.find(c => c.code === code)?.options ?? {}
      const ensea = code === 'ensea' // valeurs du pôle éducatif tant que rien n'est enregistré
      setOptions({
        generation_auto_tests: o.generation_auto_tests ?? !ensea,
        autoeval_bloquante: o.autoeval_bloquante ?? ensea,
        autoeval_delai_heures: o.autoeval_delai_heures ?? 48,
        autoeval_rappel_heures: o.autoeval_rappel_heures ?? 24,
        classement_visible: o.classement_visible ?? false,
        score_alpha_pct: Math.round((o.score_alpha ?? 0.3) * 100),
        score_seuil: o.score_seuil ?? 50,
        renforcement_mode: o.renforcement_mode ?? 'manuel'
      })
    })
    return () => { actif = false }
  }, [code])

  if (!options) return null
  const maj = (k, v) => setOptions(o => ({ ...o, [k]: v }))

  const enregistrer = async () => {
    setMessage('')
    const { score_alpha_pct, ...autres } = options
    const res = await api.patch(`/api/concours/${code}/options`, { ...autres, score_alpha: score_alpha_pct / 100 })
    setMessage(res.ok ? 'Options enregistrées.' : (res.data?.message || 'Enregistrement impossible'))
  }

  return (
    <div className="rounded-2xl p-5 mb-6" style={{ border: '1px solid #f0ece0', background: 'white' }}>
      <h3 className="font-bold text-sm mb-3" style={{ color: '#071020' }}>Options — {libelleConcours(code)}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={options.autoeval_bloquante} onChange={e => maj('autoeval_bloquante', e.target.checked)} />
          Auto-évaluation bloquante (cours et ressources verrouillés si non remplie)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={options.generation_auto_tests} onChange={e => maj('generation_auto_tests', e.target.checked)} />
          Génération automatique de quiz autorisée
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={options.classement_visible} onChange={e => maj('classement_visible', e.target.checked)} />
          Afficher le rang aux élèves
        </label>
        <div className="flex items-center gap-2">
          Délai
          <input type="number" min="1" max="720" value={options.autoeval_delai_heures} className={CHAMP + ' w-20'} style={STYLE}
            onChange={e => maj('autoeval_delai_heures', Number(e.target.value))} />
          h, rappel à
          <input type="number" min="0" max="720" value={options.autoeval_rappel_heures} className={CHAMP + ' w-20'} style={STYLE}
            onChange={e => maj('autoeval_rappel_heures', Number(e.target.value))} /> h
        </div>
      </div>
      <h4 className="font-bold text-xs uppercase tracking-wide text-gray-400 mt-5 mb-2">Score de compétence et renforcement</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          Part de l’auto-évaluation (α)
          <input type="number" min="0" max="100" value={options.score_alpha_pct} className={CHAMP + ' w-20'} style={STYLE}
            onChange={e => maj('score_alpha_pct', Number(e.target.value))} /> %
          <span className="text-xs text-gray-400">(notes : {100 - options.score_alpha_pct} %)</span>
        </div>
        <div className="flex items-center gap-2">
          Seuil de renforcement
          <input type="number" min="0" max="100" value={options.score_seuil} className={CHAMP + ' w-20'} style={STYLE}
            onChange={e => maj('score_seuil', Number(e.target.value))} /> / 100
        </div>
        <label className="flex items-center gap-2 md:col-span-2">
          Envoi des exercices
          <select value={options.renforcement_mode} onChange={e => maj('renforcement_mode', e.target.value)} className={CHAMP} style={STYLE}>
            <option value="manuel">Manuel : alerte au professeur, envoi en un clic</option>
            <option value="auto">Automatique : envoi immédiat sous le seuil</option>
          </select>
        </label>
      </div>
      <p className="text-xs text-gray-400 mt-2">Modifier α ou le seuil recalcule les scores du concours (sans envoyer d’exercice).</p>
      <div className="flex items-center gap-3 mt-4">
        <button type="button" onClick={enregistrer} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background: VIOLET }}>Enregistrer</button>
        {message && <span className="text-xs text-gray-500">{message}</span>}
      </div>
    </div>
  )
}

// ── Import CSV ───────────────────────────────────────────────────────────────
function ImportCsv({ code, onFini }) {
  const [lignes, setLignes] = useState(null)
  const [apercu, setApercu] = useState(null)
  const [erreur, setErreur] = useState('')

  const choisir = async (e) => {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    if (!fichier) return
    setErreur(''); setApercu(null)
    const donnees = lireCsv(await fichier.text())
    if (donnees.length === 0) return setErreur('Fichier vide ou illisible (colonnes attendues : matiere ; code ; libelle ; ordre ; url).')
    setLignes(donnees)
    const res = await api.post('/api/competences/import', { concours_code: code, lignes: donnees, confirmer: false })
    if (!res.ok) return setErreur(res.data?.message || 'Import impossible')
    setApercu(res.data)
  }

  const appliquer = async () => {
    const res = await api.post('/api/competences/import', { concours_code: code, lignes, confirmer: true })
    if (!res.ok || !res.data.appliquee) return setErreur(res.data?.message || 'Import non appliqué')
    setLignes(null); setApercu(null)
    onFini()
  }

  return (
    <div className="rounded-2xl p-5 mb-6" style={{ border: '1px solid #f0ece0', background: 'white' }}>
      <h3 className="font-bold text-sm mb-1" style={{ color: '#071020' }}>Importer un fichier CSV</h3>
      <p className="text-xs text-gray-400 mb-3">
        Colonnes : <code>matiere ; code ; libelle ; ordre ; url</code> (séparateur « ; » ou « , »). Un code déjà présent met la compétence à jour.
        Exemple de code : FR-RES-1, MA-ANA-3.
      </p>
      <div className="flex flex-wrap gap-2">
        <label className="text-xs font-bold px-4 py-2 rounded-xl cursor-pointer text-white" style={{ background: VIOLET }}>
          Choisir un fichier .csv
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={choisir} />
        </label>
        <button type="button" className="text-xs font-bold px-4 py-2 rounded-xl text-gray-500"
          onClick={() => telechargerCsv('modele-competences.csv', [['matiere', 'code', 'libelle', 'ordre', 'url'], ['Français', 'FR-RES-1', 'Comprendre le texte', 1, '']])}>
          Télécharger un modèle
        </button>
      </div>
      {erreur && <p className="text-xs mt-3" style={{ color: '#C94C7B' }}>{erreur}</p>}
      {apercu && (
        <div className="mt-4 text-sm">
          <p className="text-gray-600">{apercu.ajouts} ajout(s), {apercu.mises_a_jour} mise(s) à jour, {apercu.erreurs.length} erreur(s).</p>
          {apercu.erreurs.length > 0 && (
            <ul className="mt-2 text-xs list-disc pl-5" style={{ color: '#C94C7B' }}>
              {apercu.erreurs.map(e => <li key={e.ligne}>Ligne {e.ligne} : {e.message}</li>)}
            </ul>
          )}
          {apercu.erreurs.length === 0 && (
            <button type="button" onClick={appliquer} className="mt-3 text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background: '#4CC9A8' }}>
              Appliquer l’import
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function GestionCompetences() {
  const confirmer = useConfirm()
  const [concours, setConcours] = useState('ensea')
  const [competences, setCompetences] = useState([])
  const [edition, setEdition] = useState(null)   // { id, libelle, ordre, url, matiere }
  const [ajout, setAjout] = useState({ matiere: '', code: '', libelle: '', ordre: 0, url: '' })
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(true)

  const [version, setVersion] = useState(0)
  const charger = () => setVersion(v => v + 1)

  useEffect(() => {
    let actif = true
    api.get('/api/competences', { params: { concours, inactives: 1 } })
      .then(res => { if (actif && res.ok) setCompetences(res.data.competences) })
    return () => { actif = false }
  }, [concours, version])

  const enregistrer = async () => {
    setErreur('')
    const { id, ...champs } = edition
    const res = await api.patch(`/api/competences/${id}`, { ...champs, ordre: Number(champs.ordre) })
    if (!res.ok) return setErreur(res.data?.message || 'Modification impossible')
    setEdition(null); charger()
  }
  const basculer = async (c) => {
    await api.patch(`/api/competences/${c.id}`, { actif: !c.actif }); charger()
  }
  const supprimer = async (c) => {
    if (!(await confirmer({ titre: 'Supprimer la compétence ?', message: `${c.code} sera supprimée, ou simplement désactivée si elle a déjà servi.`, confirmer: 'Supprimer', danger: true }))) return
    await api.delete(`/api/competences/${c.id}`); charger()
  }
  const ajouter = async (e) => {
    e.preventDefault(); setErreur('')
    const res = await api.post('/api/competences', { ...ajout, concours_code: concours, ordre: Number(ajout.ordre) })
    if (!res.ok) return setErreur(res.data?.message || 'Ajout impossible')
    setAjout({ matiere: '', code: '', libelle: '', ordre: 0, url: '' }); charger()
  }

  return (
    <div>
      <p className="text-xs tracking-widest uppercase mb-1" style={{ color: VIOLET }}>Administration</p>
      <h1 className="text-2xl font-bold mb-4" style={{ color: '#071020' }}>Compétences et options</h1>

      <div className="flex gap-2 mb-5 flex-wrap">
        {CODES_CONCOURS.map(c => (
          <button key={c} type="button" onClick={() => setConcours(c)} className="text-xs font-bold px-4 py-2 rounded-xl"
            style={{ background: concours === c ? '#071020' : 'white', color: concours === c ? '#C9A84C' : '#6b7280', border: '1px solid #f0ece0' }}>
            {libelleConcours(c)}
          </button>
        ))}
      </div>

      <OptionsConcours code={concours} />
      <ImportCsv code={concours} onFini={charger} />

      <form onSubmit={ajouter} className="rounded-2xl p-5 mb-6 grid grid-cols-1 md:grid-cols-6 gap-2" style={{ border: '1px solid #f0ece0', background: 'white' }}>
        <input value={ajout.matiere} onChange={e => setAjout({ ...ajout, matiere: e.target.value })} placeholder="Matière" className={CHAMP} style={STYLE} required />
        <input value={ajout.code} onChange={e => setAjout({ ...ajout, code: e.target.value })} placeholder="Code (FR-RES-1)" className={CHAMP} style={STYLE} required />
        <input value={ajout.libelle} onChange={e => setAjout({ ...ajout, libelle: e.target.value })} placeholder="Libellé" className={CHAMP + ' md:col-span-2'} style={STYLE} required />
        <input type="number" value={ajout.ordre} onChange={e => setAjout({ ...ajout, ordre: e.target.value })} placeholder="Ordre" className={CHAMP} style={STYLE} />
        <button type="submit" className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background: VIOLET }}>Ajouter</button>
      </form>

      {erreur && <p className="text-sm mb-3" style={{ color: '#C94C7B' }}>{erreur}</p>}

      <div className="bg-white rounded-2xl overflow-x-auto" style={{ border: '1px solid #f0ece0' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="p-3">Ordre</th><th className="p-3">Code</th><th className="p-3">Matière</th><th className="p-3">Libellé</th><th className="p-3">Lien</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {competences.map(c => {
              const enEdition = edition?.id === c.id
              return (
                <tr key={c.id} style={{ borderTop: '1px solid #f8f7f4', opacity: c.actif ? 1 : 0.45 }}>
                  <td className="p-3 w-20">{enEdition
                    ? <input type="number" value={edition.ordre} onChange={e => setEdition({ ...edition, ordre: e.target.value })} className={CHAMP + ' w-16'} style={STYLE} />
                    : c.ordre}</td>
                  <td className="p-3 font-semibold" style={{ color: VIOLET }}>{c.code}</td>
                  <td className="p-3">{enEdition
                    ? <input value={edition.matiere} onChange={e => setEdition({ ...edition, matiere: e.target.value })} className={CHAMP + ' w-36'} style={STYLE} />
                    : c.matiere}</td>
                  <td className="p-3">{enEdition
                    ? <input value={edition.libelle} onChange={e => setEdition({ ...edition, libelle: e.target.value })} className={CHAMP + ' w-full'} style={STYLE} />
                    : c.libelle}</td>
                  <td className="p-3 text-xs">{enEdition
                    ? <input value={edition.url ?? ''} onChange={e => setEdition({ ...edition, url: e.target.value })} className={CHAMP + ' w-40'} style={STYLE} />
                    : (c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: VIOLET }}>Leçon</a> : '—')}</td>
                  <td className="p-3 whitespace-nowrap text-xs font-semibold">
                    {enEdition ? (
                      <>
                        <button type="button" onClick={enregistrer} className="mr-3" style={{ color: '#2a9d7f' }}>Enregistrer</button>
                        <button type="button" onClick={() => setEdition(null)} className="text-gray-400">Annuler</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setEdition({ id: c.id, libelle: c.libelle, ordre: c.ordre, url: c.url ?? '', matiere: c.matiere })} className="mr-3" style={{ color: VIOLET }}>Modifier</button>
                        <button type="button" onClick={() => basculer(c)} className="mr-3 text-gray-500">{c.actif ? 'Désactiver' : 'Réactiver'}</button>
                        <button type="button" onClick={() => supprimer(c)} style={{ color: '#C94C7B' }}>Supprimer</button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
            {competences.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-400">Aucune compétence pour ce concours.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
