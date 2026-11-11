import { useEffect, useMemo, useRef, useState } from 'react'
import api from '../../api'
import { CODES_CONCOURS, libelleConcours } from '../../lib/concours'
import { telechargerCsv } from '../../lib/csv'
import { identifiantDe } from '../../lib/identifiants'
import EmptyState from '../../components/EmptyState'

const VIOLET = '#7B4CC9'
const SELECT = 'text-sm rounded-xl px-3 py-2 outline-none bg-white'
const STYLE = { border: '1px solid #e8e4da' }

const arrondi = (n) => Math.round(n * 100) / 100
const moyenne = (valeurs) => {
  const v = valeurs.filter(x => typeof x === 'number' && Number.isFinite(x))
  return v.length ? arrondi(v.reduce((s, x) => s + x, 0) / v.length) : null
}
const nomEleve = (e) => [e.nom, e.prenom].filter(Boolean).join(' ') || e.username

// Grille élèves × évaluations avec saisie rapide : Tab (cellule suivante), Entrée / ↓ (élève suivant), ↑ (précédent)
export default function GrilleNotes() {
  const [concours, setConcours] = useState('ensea')
  const [matiere, setMatiere] = useState('')
  const [periode, setPeriode] = useState('')
  const [donnees, setDonnees] = useState(null)
  const [valeurs, setValeurs] = useState({})     // `${etudiantId}|${cle}` -> nombre
  const [etats, setEtats] = useState({})         // idem -> 'enregistrement' | 'ok' | 'erreur'
  const [colonnesAjoutees, setColonnesAjoutees] = useState([])
  const [nouvelle, setNouvelle] = useState({ matiere: '', periode: '' })
  const [erreur, setErreur] = useState('')
  const [version, setVersion] = useState(0) // change à chaque rechargement : réinitialise les cases
  const [rechargement, setRechargement] = useState(0) // incrémenté pour relire la grille depuis le serveur
  const [liaison, setLiaison] = useState(null) // { col, liste, choisies, erreur } : fenêtre « Compétences »
  const refs = useRef({})

  useEffect(() => {
    let actif = true
    api.get('/api/tableaux/classe', { params: { concours, ...(matiere && { matiere }), ...(periode && { periode }) } })
      .then(res => {
        if (!actif) return
        if (!res.ok) { setDonnees(null); return setErreur(res.data?.message || 'Chargement impossible') }
        setErreur('')
        setDonnees(res.data)
        const init = {}
        for (const l of res.data.lignes) for (const [cle, n] of Object.entries(l.notes)) init[`${l.etudiant.id}|${cle}`] = n.note
        setValeurs(init)
        setEtats({})
        setVersion(v => v + 1)
      })
      .catch(() => actif && setErreur('Erreur de connexion au serveur'))
    return () => { actif = false }
  }, [concours, matiere, periode, rechargement])

  // Changer de concours repart de zéro (matière, période et colonnes ajoutées à la main)
  const changerConcours = (code) => { setConcours(code); setMatiere(''); setPeriode(''); setColonnesAjoutees([]) }

  const colonnes = useMemo(() => {
    if (!donnees) return []
    const extra = colonnesAjoutees.filter(c => !donnees.colonnes.some(d => d.cle === c.cle) && (!matiere || c.matiere === matiere) && (!periode || c.periode === periode))
    return [...donnees.colonnes, ...extra]
  }, [donnees, colonnesAjoutees, matiere, periode])

  const cle = (e, col) => `${e.id}|${col.cle}`

  const enregistrer = async (eleve, col, saisie) => {
    const k = cle(eleve, col)
    const texte = String(saisie).replace(',', '.').trim()
    if (texte === '') return
    const note = Number(texte)
    if (!Number.isFinite(note) || note < 0 || note > 20) return setEtats(p => ({ ...p, [k]: 'erreur' }))
    if (valeurs[k] === note) return
    setEtats(p => ({ ...p, [k]: 'enregistrement' }))
    try {
      const res = await api.post('/api/notes/ajouter', {
        etudiant_id: eleve.id, matiere: col.matiere, concours: libelleConcours(concours), note, periode: col.periode
      })
      if (!res.ok) return setEtats(p => ({ ...p, [k]: 'erreur' }))
      setValeurs(p => ({ ...p, [k]: note }))
      setEtats(p => ({ ...p, [k]: 'ok' }))
    } catch {
      setEtats(p => ({ ...p, [k]: 'erreur' }))
    }
  }

  const aller = (ligne, colonne) => refs.current[`${ligne}|${colonne}`]?.focus()
  const touche = (e, eleve, col, i, j) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); enregistrer(eleve, col, e.currentTarget.value); aller(i + 1, j) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); enregistrer(eleve, col, e.currentTarget.value); aller(i - 1, j) }
  }

  const ajouterColonne = (e) => {
    e.preventDefault()
    const m = nouvelle.matiere || donnees?.matieres?.[0]
    const p = nouvelle.periode.trim()
    if (!m || !p) return
    setColonnesAjoutees(prev => [...prev, { cle: `${m}|${p}`, matiere: m, periode: p }])
    setNouvelle({ matiere: '', periode: '' })
  }

  const ouvrirLiaison = async (col) => {
    const [comp, liees] = await Promise.all([
      api.get('/api/competences', { params: { concours, matiere: col.matiere } }),
      api.get('/api/notes/competences', { params: { concours, matiere: col.matiere, periode: col.periode } })
    ])
    setLiaison({ col, liste: comp.ok ? comp.data.competences : [], choisies: liees.ok ? liees.data.competence_ids : [], erreur: '' })
  }
  const basculerCompetence = (id) => setLiaison(l => ({
    ...l, choisies: l.choisies.includes(id) ? l.choisies.filter(x => x !== id) : [...l.choisies, id]
  }))
  const enregistrerLiaison = async () => {
    const { col, choisies } = liaison
    const res = await api.put('/api/notes/competences', { concours, matiere: col.matiere, periode: col.periode, competence_ids: choisies })
    if (!res.ok) return setLiaison(l => ({ ...l, erreur: res.data?.message || 'Enregistrement impossible' }))
    setLiaison(null)
    setRechargement(v => v + 1) // les scores sont recalculés côté serveur : on relit la grille
  }

  const lignes = donnees?.lignes ?? []
  const moyenneEleve = (eleve) => moyenne(colonnes.map(c => valeurs[cle(eleve, c)]))
  const moyenneColonne = (col) => moyenne(lignes.map(l => valeurs[cle(l.etudiant, col)]))

  const exporter = () => {
    const entetes = ['Identifiant', 'Nom', 'Prénom', ...colonnes.map(c => `${c.matiere} — ${c.periode}`), 'Moyenne']
    const corps = lignes.map(l => [
      identifiantDe(l.etudiant), l.etudiant.nom ?? '', l.etudiant.prenom ?? '',
      ...colonnes.map(c => valeurs[cle(l.etudiant, c)] ?? ''), moyenneEleve(l.etudiant) ?? ''
    ])
    corps.push(['', '', 'Moyenne', ...colonnes.map(c => moyenneColonne(c) ?? ''), moyenne(lignes.map(l => moyenneEleve(l.etudiant))) ?? ''])
    telechargerCsv(`notes-${concours}${matiere ? `-${matiere}` : ''}.csv`, [entetes, ...corps])
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select value={concours} onChange={e => changerConcours(e.target.value)} className={SELECT} style={STYLE} aria-label="Concours">
          {CODES_CONCOURS.map(c => <option key={c} value={c}>{libelleConcours(c)}</option>)}
        </select>
        <select value={matiere} onChange={e => setMatiere(e.target.value)} className={SELECT} style={STYLE} aria-label="Matière">
          <option value="">Toutes les matières</option>
          {donnees?.matieres.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={periode} onChange={e => setPeriode(e.target.value)} className={SELECT} style={STYLE} aria-label="Période">
          <option value="">Toutes les périodes</option>
          {donnees?.periodes.map(p => <option key={p}>{p}</option>)}
        </select>
        <button type="button" onClick={exporter} disabled={lignes.length === 0}
          className="text-xs font-bold px-4 py-2 rounded-xl text-white disabled:opacity-40 ml-auto" style={{ background: '#071020' }}>
          Exporter en CSV
        </button>
      </div>

      <form onSubmit={ajouterColonne} className="flex flex-wrap gap-2 mb-4 items-center">
        <span className="text-xs text-gray-500">Nouvelle évaluation :</span>
        <select aria-label="Matière de la nouvelle évaluation" value={nouvelle.matiere} onChange={e => setNouvelle({ ...nouvelle, matiere: e.target.value })} className={SELECT} style={STYLE}>
          {(donnees?.matieres ?? []).map(m => <option key={m}>{m}</option>)}
        </select>
        <input value={nouvelle.periode} onChange={e => setNouvelle({ ...nouvelle, periode: e.target.value })} list="periodes-connues"
          placeholder="Période (ex. Nov 2026)" maxLength={50} className={SELECT} style={STYLE} aria-label="Période (ex. Nov 2026)" />
        <datalist id="periodes-connues">{donnees?.periodes.map(p => <option key={p} value={p} />)}</datalist>
        <button type="submit" className="text-xs font-bold px-3 py-2 rounded-xl" style={{ color: VIOLET, border: `1px solid ${VIOLET}60` }}>+ Ajouter la colonne</button>
      </form>

      {erreur && <p className="text-sm mb-3" style={{ color: '#C94C7B' }}>{erreur}</p>}
      {donnees && lignes.length === 0 && <EmptyState titre="Aucun élève inscrit à ce concours" />}

      {lignes.length > 0 && (
        <div className="bg-white rounded-2xl overflow-x-auto" style={{ border: '1px solid #f0ece0' }}>
          <table className="text-sm min-w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="p-3 sticky left-0 bg-white">Élève</th>
                {colonnes.map(c => (
                  <th key={c.cle} className="p-3 whitespace-nowrap">
                    <span className="block uppercase tracking-wide">{c.matiere}</span>
                    <span className="font-normal">{c.periode}</span>
                    <button type="button" onClick={() => ouvrirLiaison(c)} className="block mt-1 text-[11px] font-semibold underline"
                      style={{ color: (c.competence_ids?.length ?? 0) > 0 ? VIOLET : '#C94C7B' }}
                      title="Les notes de cette colonne comptent pour le score des compétences cochées">
                      {(c.competence_ids?.length ?? 0) > 0 ? `${c.competence_ids.length} compétence(s)` : 'Compétences à associer'}
                    </button>
                  </th>
                ))}
                <th className="p-3">Moyenne</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={l.etudiant.id} style={{ borderTop: '1px solid #f8f7f4' }}>
                  <td className="p-3 sticky left-0 bg-white whitespace-nowrap">
                    <span className="font-semibold" style={{ color: '#071020' }}>{nomEleve(l.etudiant)}</span>
                    <span className="block text-xs text-gray-500">{identifiantDe(l.etudiant)}</span>
                  </td>
                  {colonnes.map((c, j) => {
                    const k = cle(l.etudiant, c)
                    const etat = etats[k]
                    return (
                      <td key={c.cle} className="p-1">
                        <input
                          ref={el => { refs.current[`${i}|${j}`] = el }}
                          key={`${k}-${version}`}
                          type="text" inputMode="decimal" defaultValue={valeurs[k] ?? ''}
                          aria-label={`${nomEleve(l.etudiant)} — ${c.matiere} ${c.periode}`}
                          onKeyDown={e => touche(e, l.etudiant, c, i, j)}
                          onBlur={e => enregistrer(l.etudiant, c, e.target.value)}
                          className="w-16 text-center text-sm rounded-lg px-2 py-1.5 outline-none"
                          style={{
                            border: `1px solid ${etat === 'erreur' ? '#C94C7B' : etat === 'ok' ? '#4CC9A8' : '#e8e4da'}`,
                            background: etat === 'enregistrement' ? '#f8f7f4' : 'white'
                          }} />
                      </td>
                    )
                  })}
                  <td className="p-3 font-bold" style={{ color: VIOLET }}>{moyenneEleve(l.etudiant) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #f0ece0' }} className="text-xs font-bold text-gray-500">
                <td className="p-3 sticky left-0 bg-white">Moyenne</td>
                {colonnes.map(c => <td key={c.cle} className="p-3 text-center">{moyenneColonne(c) ?? '—'}</td>)}
                <td className="p-3" style={{ color: VIOLET }}>{moyenne(lignes.map(l => moyenneEleve(l.etudiant))) ?? '—'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {liaison && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(7,16,32,0.6)' }} role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5">
            <h3 className="font-bold" style={{ color: '#071020' }}>Compétences évaluées</h3>
            <p className="text-xs text-gray-500 mb-3">{liaison.col.matiere} — {liaison.col.periode}. Les notes de cette colonne comptent pour le score des compétences cochées.</p>
            {liaison.liste.length === 0 && <p className="text-sm text-gray-500">Aucune compétence pour cette matière.</p>}
            <div className="flex flex-col gap-1">
              {liaison.liste.map(c => (
                <label key={c.id} className="flex items-start gap-2 text-sm text-gray-700 p-1">
                  <input type="checkbox" className="mt-1" checked={liaison.choisies.includes(c.id)} onChange={() => basculerCompetence(c.id)} />
                  <span><b>{c.code}</b> · {c.libelle}</span>
                </label>
              ))}
            </div>
            {liaison.erreur && <p className="text-xs mt-2" style={{ color: '#C94C7B' }}>{liaison.erreur}</p>}
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={enregistrerLiaison} className="text-xs font-bold px-4 py-2 rounded-xl text-white" style={{ background: VIOLET }}>Enregistrer</button>
              <button type="button" onClick={() => setLiaison(null)} className="text-xs font-bold px-4 py-2 rounded-xl text-gray-500">Annuler</button>
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-3">Saisie rapide : Tab = case suivante, Entrée ou ↓ = élève suivant, ↑ = élève précédent. Chaque note est enregistrée en quittant la case.</p>
    </div>
  )
}
