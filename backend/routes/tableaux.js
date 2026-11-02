import express from 'express'
import { z } from 'zod'
import supabase from '../supabase.js'
import { verifyToken, requireRole } from '../middleware/authMiddleware.js'
import { peutAcceder, peutGererEleve, CODES_CONCOURS, LIBELLES, OPTIONS_PAR_DEFAUT } from '../lib/concours.js'
import { elevesDuConcours, reglesAutoEval } from '../lib/autoeval.js'
import { optionsConcours } from '../lib/inscriptions.js'

const router = express.Router()

const message = (res, statut, texte) => res.status(statut).json({ message: texte, error: texte })
const lire = async (requete) => {
  const { data, error } = await requete
  if (error) throw error
  return data ?? []
}
const moyenne = (valeurs) => {
  const nombres = valeurs.map(Number).filter(Number.isFinite)
  return nombres.length ? Math.round((nombres.reduce((s, n) => s + n, 0) / nombres.length) * 100) / 100 : null
}

// Les périodes sont du texte libre (« Mar 2026 »). Tri chronologique si le format est reconnu,
// sinon d'après la date de saisie de la note.
const MOIS = { jan: 1, fev: 2, mar: 3, avr: 4, mai: 5, jun: 6, jul: 7, aout: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
function ordrePeriode(periode, creeLe) {
  const m = /^([A-Za-zéûÉ]+)\s+(\d{4})$/.exec(String(periode ?? '').trim())
  const mois = m && MOIS[m[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')]
  if (mois) return Number(m[2]) * 12 + mois
  const d = new Date(creeLe ?? 0)
  return d.getFullYear() * 12 + d.getMonth() + 1 + 0.5
}

const classementVisible = (optionsParCode, code) =>
  ({ ...OPTIONS_PAR_DEFAUT[code], ...(optionsParCode?.[code] ?? {}) }).classement_visible === true

// ═══ PROFESSEUR : grille élèves × évaluations ════════════════════════════════
const classeSchema = z.object({
  concours: z.enum(CODES_CONCOURS),
  matiere: z.string().trim().max(100).optional(),
  periode: z.string().trim().max(50).optional()
})

// GET /api/tableaux/classe?concours=ensea[&matiere=][&periode=]
router.get('/classe', verifyToken, requireRole('professeur', 'admin'), async (req, res) => {
  const parse = classeSchema.safeParse(req.query)
  if (!parse.success) return message(res, 400, 'Paramètres invalides')
  const { concours, matiere, periode } = parse.data
  if (!peutAcceder(req.user, concours)) return message(res, 403, 'Accès refusé')

  const eleves = (await elevesDuConcours(concours)).filter(e => peutGererEleve(req.user, e))
  const ids = new Set(eleves.map(e => String(e.id)))
  const toutes = (await lire(supabase.from('notes').select('*')))
    .filter(n => n.concours === LIBELLES[concours] && ids.has(String(n.etudiant_id)))

  const competences = await lire(supabase.from('competences').select('matiere').eq('concours_code', concours))
  const matieres = [...new Set([...toutes.map(n => n.matiere), ...competences.map(c => c.matiere)])].sort()
  const periodes = [...new Set(toutes.map(n => n.periode))]
    .sort((a, b) => ordrePeriode(a, toutes.find(n => n.periode === a)?.created_at) - ordrePeriode(b, toutes.find(n => n.periode === b)?.created_at))

  const notes = toutes.filter(n => (!matiere || n.matiere === matiere) && (!periode || n.periode === periode))
  const colonnes = []
  for (const n of notes) {
    const cle = `${n.matiere}|${n.periode}`
    if (!colonnes.some(c => c.cle === cle)) colonnes.push({ cle, matiere: n.matiere, periode: n.periode, ordre: ordrePeriode(n.periode, n.created_at) })
  }
  colonnes.sort((a, b) => a.matiere.localeCompare(b.matiere) || a.ordre - b.ordre)

  // Compétences rattachées à chaque colonne (les notes comptent pour le score de ces compétences)
  const liens = await lire(supabase.from('notes_competences').select('*').eq('concours_code', concours))
  for (const c of colonnes) {
    c.competence_ids = liens.filter(l => l.matiere === c.matiere && l.periode === c.periode).map(l => l.competence_id)
  }

  const lignes = eleves
    .sort((a, b) => `${a.nom ?? ''}${a.prenom ?? ''}`.localeCompare(`${b.nom ?? ''}${b.prenom ?? ''}`))
    .map(e => {
      const siennes = notes.filter(n => String(n.etudiant_id) === String(e.id))
      const parCle = {}
      for (const n of siennes) parCle[`${n.matiere}|${n.periode}`] = { id: n.id, note: Number(n.note) }
      return {
        etudiant: { id: e.id, matricule: e.matricule, username: e.username, prenom: e.prenom, nom: e.nom },
        notes: parCle,
        moyenne: moyenne(siennes.map(n => n.note))
      }
    })

  res.json({
    concours, matieres, periodes, colonnes, lignes,
    moyennes_colonnes: Object.fromEntries(colonnes.map(c => [c.cle, moyenne(notes.filter(n => `${n.matiere}|${n.periode}` === c.cle).map(n => n.note))])),
    moyennes_matieres: Object.fromEntries([...new Set(notes.map(n => n.matiere))].map(m => [m, moyenne(notes.filter(n => n.matiere === m).map(n => n.note))])),
    moyenne_generale: moyenne(notes.map(n => n.note))
  })
})

// ═══ ÉLÈVE : courbes, moyennes, dernières corrections, rang (optionnel) ═════
router.get('/eleve', verifyToken, async (req, res) => {
  if (req.user.role !== 'etudiant') return message(res, 403, 'Réservé aux élèves')
  const siennes = (await lire(supabase.from('notes').select('*').eq('etudiant_id', req.user.id)))

  const parMatiere = new Map()
  for (const n of siennes) {
    const cle = `${n.concours}|${n.matiere}`
    if (!parMatiere.has(cle)) parMatiere.set(cle, { matiere: n.matiere, concours: n.concours, notes: [] })
    parMatiere.get(cle).notes.push(n)
  }
  const matieres = [...parMatiere.values()].map(m => ({
    matiere: m.matiere,
    concours: m.concours,
    moyenne: moyenne(m.notes.map(n => n.note)),
    points: m.notes
      .sort((a, b) => ordrePeriode(a.periode, a.created_at) - ordrePeriode(b.periode, b.created_at))
      .map(n => ({ periode: n.periode, note: Number(n.note) }))
  })).sort((a, b) => a.concours.localeCompare(b.concours) || a.matiere.localeCompare(b.matiere))

  const dernieres = [...siennes]
    .sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0))
    .slice(0, 5)
    .map(n => ({ matiere: n.matiere, concours: n.concours, periode: n.periode, note: Number(n.note), date: n.created_at }))

  // Rang : seulement si l'option « classement_visible » est active pour le concours (désactivée par défaut)
  const options = await optionsConcours()
  const rangs = []
  for (const code of (req.user.concours ?? []).filter(c => classementVisible(options, c))) {
    const eleves = new Set((await elevesDuConcours(code)).map(e => String(e.id)))
    const parEleve = new Map()
    for (const n of (await lire(supabase.from('notes').select('etudiant_id, note, concours'))).filter(n => n.concours === LIBELLES[code] && eleves.has(String(n.etudiant_id)))) {
      const cle = String(n.etudiant_id)
      parEleve.set(cle, [...(parEleve.get(cle) ?? []), n.note])
    }
    const moyennes = [...parEleve.entries()].map(([id, v]) => [id, moyenne(v)])
    const maMoyenne = moyennes.find(([id]) => id === String(req.user.id))?.[1]
    if (maMoyenne != null) rangs.push({ concours_code: code, rang: 1 + moyennes.filter(([, m]) => m > maMoyenne).length, sur: moyennes.length })
  }

  res.json({ matieres, moyenne_generale: moyenne(siennes.map(n => n.note)), dernieres, rangs })
})

// ═══ ADMIN : vue globale par concours ═══════════════════════════════════════
router.get('/admin', verifyToken, requireRole('admin'), async (req, res) => {
  const notes = await lire(supabase.from('notes').select('etudiant_id, note, concours, matiere'))
  const seances = await lire(supabase.from('seances').select('*'))
  const liens = seances.length ? await lire(supabase.from('seance_competences').select('seance_id').in('seance_id', seances.map(s => s.id))) : []
  const reponses = seances.length ? await lire(supabase.from('auto_evaluations').select('seance_id, etudiant_id').in('seance_id', seances.map(s => s.id))) : []
  const options = await optionsConcours()
  const maintenant = Date.now()

  const concours = []
  for (const code of CODES_CONCOURS) {
    const eleves = await elevesDuConcours(code)
    const notesCode = notes.filter(n => n.concours === LIBELLES[code])
    const seancesCode = seances.filter(s => s.concours_code === code && new Date(s.fin).getTime() <= maintenant)

    const detail = seancesCode.map(s => {
      const nbComp = liens.filter(l => String(l.seance_id) === String(s.id)).length
      const complets = nbComp === 0 ? 0 : eleves.filter(e =>
        reponses.filter(r => String(r.seance_id) === String(s.id) && String(r.etudiant_id) === String(e.id)).length >= nbComp).length
      return { id: s.id, titre: s.titre, fin: s.fin, nb_eleves: eleves.length, nb_complets: complets, avec_competences: nbComp > 0 }
    }).filter(s => s.avec_competences)

    const taux = detail.length && eleves.length
      ? Math.round(detail.reduce((somme, s) => somme + s.nb_complets / s.nb_eleves, 0) / detail.length * 100)
      : null
    const regles = reglesAutoEval(options, code)

    concours.push({
      code, nom: LIBELLES[code],
      nb_eleves: eleves.length,
      nb_notes: notesCode.length,
      moyenne: moyenne(notesCode.map(n => n.note)),
      moyennes_matieres: Object.fromEntries([...new Set(notesCode.map(n => n.matiere))].sort()
        .map(m => [m, moyenne(notesCode.filter(n => n.matiere === m).map(n => n.note))])),
      nb_seances_terminees: detail.length,
      taux_autoeval: taux,
      autoeval_bloquante: regles.bloquante,
      seances: detail.sort((a, b) => new Date(b.fin) - new Date(a.fin)).slice(0, 10)
    })
  }
  res.json({ concours })
})

export default router
