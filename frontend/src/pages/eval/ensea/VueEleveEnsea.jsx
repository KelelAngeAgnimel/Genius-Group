import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../../../api'
import { LIMITES, TYPES_ACCEPTES, compresserImage, formaterTaille, ouvrirFichierProtege } from '../../../lib/fichiers'

const VIOLET = '#7B4CC9'
const ONGLETS = [
  { id: 'a_faire', label: 'À faire' },
  { id: 'deposee', label: 'Déposées' },
  { id: 'corrigee', label: 'Corrigées' },
]

const formaterDate = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

// Compte à rebours : « 2 j 05 h 12 min » ; se met à jour toutes les 30 s
function tempsRestant(limiteIso, maintenant) {
  const ms = new Date(limiteIso) - maintenant
  if (ms <= 0) return null
  const minutes = Math.floor(ms / 60000)
  const j = Math.floor(minutes / 1440)
  const h = Math.floor((minutes % 1440) / 60)
  const m = minutes % 60
  return j > 0 ? `${j} j ${String(h).padStart(2, '0')} h ${String(m).padStart(2, '0')} min` : `${h} h ${String(m).padStart(2, '0')} min`
}

function useMaintenant() {
  const [maintenant, setMaintenant] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])
  return maintenant
}

// ── Zone de dépôt : fichiers + prise de photo directe sur mobile ─────────────
function FormulaireDepot({ evaluation, onDepose }) {
  const [fichiers, setFichiers] = useState([]) // [{ id, fichier, apercu }]
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const compteur = useRef(0)

  const total = fichiers.reduce((s, f) => s + f.fichier.size, 0)

  const ajouter = async (liste) => {
    setErreur('')
    const nouveaux = []
    for (const brut of Array.from(liste)) {
      if (!TYPES_ACCEPTES.includes(brut.type)) {
        setErreur(`« ${brut.name} » : seuls les PDF, JPG et PNG sont acceptés.`)
        continue
      }
      const fichier = await compresserImage(brut)
      if (fichier.size > LIMITES.octetsParFichier) {
        setErreur(`« ${brut.name} » dépasse 15 Mo.`)
        continue
      }
      nouveaux.push({
        id: ++compteur.current,
        fichier,
        apercu: fichier.type.startsWith('image/') ? URL.createObjectURL(fichier) : null
      })
    }
    setFichiers(prev => {
      const suite = [...prev, ...nouveaux]
      if (suite.length > LIMITES.nbFichiers) setErreur('10 fichiers maximum : les derniers n’ont pas été ajoutés.')
      return suite.slice(0, LIMITES.nbFichiers)
    })
  }

  const retirer = (id) => setFichiers(prev => {
    const cible = prev.find(f => f.id === id)
    if (cible?.apercu) URL.revokeObjectURL(cible.apercu)
    return prev.filter(f => f.id !== id)
  })
  const deplacer = (index, sens) => setFichiers(prev => {
    const copie = [...prev]
    const cible = index + sens
    if (cible < 0 || cible >= copie.length) return prev
    ;[copie[index], copie[cible]] = [copie[cible], copie[index]]
    return copie
  })

  const envoyer = async () => {
    if (fichiers.length === 0) return setErreur('Ajoutez au moins une page.')
    if (total > LIMITES.octetsTotal) return setErreur('Les fichiers dépassent 20 Mo au total.')
    setEnvoi(true)
    setErreur('')
    try {
      const donnees = new FormData()
      fichiers.forEach(f => donnees.append('fichiers', f.fichier, f.fichier.name))
      const res = await api.post(`/api/evaluations/${evaluation.id}/copie`, donnees)
      if (!res.ok) return setErreur(res.data?.message || 'Dépôt impossible')
      fichiers.forEach(f => f.apercu && URL.revokeObjectURL(f.apercu))
      setFichiers([])
      onDepose()
    } catch {
      setErreur('Erreur réseau : réessayez.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="mt-4 rounded-xl p-4" style={{ background: '#f8f7f4', border: '1px dashed #d9d4c3' }}>
      <p className="text-xs font-semibold text-gray-600 mb-3">
        {evaluation.copie ? 'Remplacer ma copie' : 'Déposer ma copie'}
        <span className="font-normal text-gray-400"> — PDF, JPG ou PNG · 10 fichiers max · 20 Mo au total</span>
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {/* Mobile : ouvre directement l'appareil photo, une page par prise de vue */}
        <label className="text-xs font-bold px-4 py-2 rounded-xl cursor-pointer text-white" style={{ background: VIOLET }}>
          📷 Prendre une page en photo
          <input type="file" accept="image/jpeg,image/png" capture="environment" className="hidden"
            onChange={e => { ajouter(e.target.files); e.target.value = '' }} />
        </label>
        <label className="text-xs font-bold px-4 py-2 rounded-xl cursor-pointer bg-white"
          style={{ color: VIOLET, border: `1px solid ${VIOLET}60` }}>
          📎 Choisir des fichiers
          <input type="file" multiple accept="application/pdf,image/jpeg,image/png" className="hidden"
            onChange={e => { ajouter(e.target.files); e.target.value = '' }} />
        </label>
      </div>

      {fichiers.length > 0 && (
        <ol className="flex flex-col gap-2 mb-3">
          {fichiers.map((f, i) => (
            <li key={f.id} className="flex items-center gap-3 bg-white rounded-xl p-2" style={{ border: '1px solid #f0ece0' }}>
              <span className="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</span>
              {f.apercu
                ? <img src={f.apercu} alt="" className="w-12 h-12 object-cover rounded-lg" />
                : <div className="w-12 h-12 rounded-lg flex items-center justify-center text-lg bg-gray-100">📄</div>}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate">{f.fichier.name}</p>
                <p className="text-xs text-gray-400">{formaterTaille(f.fichier.size)}</p>
              </div>
              <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0} className="text-xs px-2 disabled:opacity-30" aria-label="Monter">↑</button>
              <button type="button" onClick={() => deplacer(i, 1)} disabled={i === fichiers.length - 1} className="text-xs px-2 disabled:opacity-30" aria-label="Descendre">↓</button>
              <button type="button" onClick={() => retirer(f.id)} className="text-xs px-2" style={{ color: '#C94C7B' }}>Retirer</button>
            </li>
          ))}
        </ol>
      )}

      {erreur && <p className="text-xs mb-3" style={{ color: '#C94C7B' }}>{erreur}</p>}

      <div className="flex items-center gap-3">
        <button type="button" onClick={envoyer} disabled={envoi || fichiers.length === 0}
          className="text-xs font-bold px-4 py-2 rounded-xl text-white disabled:opacity-50"
          style={{ background: '#071020' }}>
          {envoi ? 'Envoi en cours…' : 'Envoyer ma copie'}
        </button>
        {fichiers.length > 0 && <span className="text-xs text-gray-400">{fichiers.length} fichier(s) · {formaterTaille(total)}</span>}
      </div>
    </div>
  )
}

// ── Carte d'une évaluation ───────────────────────────────────────────────────
function CarteEvaluation({ evaluation, maintenant, onChange }) {
  const [erreur, setErreur] = useState('')
  const { copie } = evaluation
  const restant = tempsRestant(evaluation.date_limite, maintenant)
  const enRetard = !restant
  const depotPossible = evaluation.ouverte && evaluation.etat !== 'corrigee' && (restant || evaluation.retard_autorise)

  const ouvrir = async (chemin) => {
    setErreur('')
    const message = await ouvrirFichierProtege(chemin)
    if (message) setErreur(message)
  }

  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: VIOLET }}>{evaluation.matiere}</p>
          <h3 className="font-bold text-base" style={{ color: '#071020' }}>{evaluation.titre}</h3>
        </div>
        {evaluation.etat === 'a_faire' && evaluation.ouverte && (
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: enRetard ? 'rgba(201,76,123,0.1)' : 'rgba(201,168,76,0.12)', color: enRetard ? '#C94C7B' : '#a8872f' }}>
            {enRetard ? 'Délai dépassé' : `Reste ${restant}`}
          </span>
        )}
        {copie?.en_retard && <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(201,76,123,0.1)', color: '#C94C7B' }}>Déposée en retard</span>}
      </div>

      {evaluation.competences?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {evaluation.competences.map(c => (
            <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${VIOLET}15`, color: VIOLET }}>{c}</span>
          ))}
        </div>
      )}

      {!evaluation.ouverte ? (
        <p className="text-sm text-gray-400 mt-3">Ouverture le {formaterDate(evaluation.date_ouverture)}.</p>
      ) : (
        <>
          {evaluation.consignes && <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">{evaluation.consignes}</p>}
          <p className="text-xs text-gray-400 mt-2">
            À rendre avant le {formaterDate(evaluation.date_limite)}
            {!evaluation.retard_autorise && ' (aucun dépôt après cette date)'}
          </p>
        </>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {evaluation.ouverte && evaluation.a_sujet && (
          <button type="button" onClick={() => ouvrir(`/api/evaluations/${evaluation.id}/sujet`)}
            className="text-xs font-bold px-4 py-2 rounded-xl" style={{ color: VIOLET, border: `1px solid ${VIOLET}60` }}>
            📥 Télécharger le sujet
          </button>
        )}
        {copie && (
          <button type="button" onClick={() => ouvrir(`/api/evaluations/copies/${copie.id}/fichier`)}
            className="text-xs font-bold px-4 py-2 rounded-xl" style={{ color: '#071020', border: '1px solid #e8e4da' }}>
            👁 Voir ma copie
          </button>
        )}
        {copie?.a_corrige && (
          <button type="button" onClick={() => ouvrir(`/api/evaluations/copies/${copie.id}/corrige`)}
            className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background: '#4CC9A8' }}>
            ✍️ Voir le corrigé annoté
          </button>
        )}
      </div>

      {erreur && <p className="text-xs mt-2" style={{ color: '#C94C7B' }}>{erreur}</p>}

      {copie && evaluation.etat === 'deposee' && (
        <p className="text-xs mt-3" style={{ color: '#4C7BC9' }}>
          Copie déposée le {formaterDate(copie.deposee_le)}
          {copie.statut === 'en_correction' ? ' — en cours de correction.' : ' — en attente de correction.'}
        </p>
      )}

      {evaluation.etat === 'corrigee' && (
        <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(76,201,168,0.08)', border: '1px solid rgba(76,201,168,0.3)' }}>
          <p className="text-2xl font-bold" style={{ color: '#2a9d7f' }}>{copie.note} <span className="text-sm text-gray-400">/ 20</span></p>
          {copie.commentaire && <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{copie.commentaire}</p>}
        </div>
      )}

      {depotPossible && <FormulaireDepot evaluation={evaluation} onDepose={onChange} />}
    </div>
  )
}

// ── Page « Mes évaluations » ─────────────────────────────────────────────────
export default function VueEleveEnsea() {
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [onglet, setOnglet] = useState('a_faire')
  const maintenant = useMaintenant()

  const charger = useCallback(async () => {
    try {
      const res = await api.get('/api/evaluations/mes')
      if (res.ok) setEvaluations(res.data.evaluations)
      else setErreur(res.data?.message || 'Impossible de charger vos évaluations')
    } catch {
      setErreur('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { charger() }, [charger])

  const visibles = evaluations.filter(e => e.etat === onglet)
  const compte = (id) => evaluations.filter(e => e.etat === id).length

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {ONGLETS.map(o => (
          <button key={o.id} type="button" onClick={() => setOnglet(o.id)}
            className="text-xs font-bold px-4 py-2 rounded-xl transition"
            style={{
              background: onglet === o.id ? '#071020' : 'white',
              color: onglet === o.id ? '#C9A84C' : '#6b7280',
              border: onglet === o.id ? '1px solid rgba(201,168,76,0.4)' : '1px solid #f0ece0'
            }}>
            {o.label} ({compte(o.id)})
          </button>
        ))}
      </div>

      {erreur && <p className="text-sm mb-4" style={{ color: '#C94C7B' }}>{erreur}</p>}
      {loading ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-gray-400">Aucune évaluation dans cette catégorie.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {visibles.map(e => <CarteEvaluation key={e.id} evaluation={e} maintenant={maintenant} onChange={charger} />)}
        </div>
      )}
    </div>
  )
}
