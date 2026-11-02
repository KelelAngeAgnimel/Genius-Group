import express from 'express'
import { z } from 'zod'
import supabase from '../supabase.js'
import { verifyToken, requireRole } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import { peutAcceder, peutPublierPour, peutGererEleve, CODES_CONCOURS } from '../lib/concours.js'
import { etatSeance, reglesAutoEval, elevesDuConcours } from '../lib/autoeval.js'
import { optionsConcours } from '../lib/inscriptions.js'

const router = express.Router()

const message = (res, statut, texte) => res.status(statut).json({ message: texte, error: texte })
const uuid = z.string().uuid()
const lire = async (requete) => {
  const { data, error } = await requete
  if (error) throw error
  return data ?? []
}
const controleId = (req, res, next) =>
  uuid.safeParse(req.params.id).success ? next() : message(res, 400, 'Identifiant invalide')

const creerSchema = z.object({
  concours_code: z.enum(CODES_CONCOURS),
  titre: z.string().trim().min(1).max(200),
  debut: z.string().datetime({ offset: true }),
  fin: z.string().datetime({ offset: true }),
  meeting_id: z.union([z.string().trim().max(64), z.number()]).nullish(),
  competence_ids: z.array(uuid).min(1).max(40)
}).refine(v => new Date(v.fin) > new Date(v.debut), { path: ['fin'], message: 'La fin doit suivre le début' })
const debloquerSchema = z.object({ etudiant_id: z.union([z.string().trim().min(1).max(64), z.number().int()]) })

// POST /api/seances — créer une séance et lui associer les compétences abordées
router.post('/', verifyToken, requireRole('professeur', 'admin'), validate(creerSchema), async (req, res) => {
  const v = req.body
  if (!peutPublierPour(req.user, v.concours_code)) return message(res, 403, 'Vous ne pouvez créer des séances que pour vos concours')

  const ids = [...new Set(v.competence_ids)]
  const competences = await lire(supabase.from('competences').select('id, concours_code, actif').in('id', ids))
  if (competences.length !== ids.length || competences.some(c => c.concours_code !== v.concours_code || !c.actif)) {
    return message(res, 400, 'Compétences invalides pour ce concours')
  }

  const { data: seance, error } = await supabase.from('seances').insert([{
    concours_code: v.concours_code, titre: v.titre, debut: v.debut, fin: v.fin,
    meeting_id: v.meeting_id == null ? null : String(v.meeting_id), created_by: req.user.id
  }]).select().single()
  if (error) throw error

  const { error: errLiens } = await supabase.from('seance_competences')
    .insert(ids.map(competence_id => ({ seance_id: seance.id, competence_id })))
  if (errLiens) {
    await supabase.from('seances').delete().eq('id', seance.id)
    throw errLiens
  }
  res.status(201).json({ seance: { ...seance, competence_ids: ids } })
})

// GET /api/seances — séances des concours du personnel, avec taux de remplissage
router.get('/', verifyToken, requireRole('professeur', 'admin'), async (req, res) => {
  const seances = (await lire(supabase.from('seances').select('*').order('fin')))
    .filter(s => peutAcceder(req.user, s.concours_code))
    .sort((a, b) => new Date(b.fin) - new Date(a.fin))
  if (seances.length === 0) return res.json({ seances: [] })
  const ids = seances.map(s => s.id)

  const liens = await lire(supabase.from('seance_competences').select('seance_id, competence_id').in('seance_id', ids))
  const competences = await lire(supabase.from('competences').select('id, code, libelle, matiere').in('id', [...new Set(liens.map(l => l.competence_id))]))
  const reponses = await lire(supabase.from('auto_evaluations').select('seance_id, etudiant_id, competence_id').in('seance_id', ids))

  const elevesParConcours = {}
  for (const code of new Set(seances.map(s => s.concours_code))) {
    elevesParConcours[code] = (await elevesDuConcours(code)).filter(e => peutGererEleve(req.user, e))
  }

  res.json({
    seances: seances.map(s => {
      const comps = liens.filter(l => String(l.seance_id) === String(s.id))
        .map(l => competences.find(c => String(c.id) === String(l.competence_id))).filter(Boolean)
      const eleves = elevesParConcours[s.concours_code]
      const complets = eleves.filter(e => {
        const siennes = reponses.filter(r => String(r.seance_id) === String(s.id) && String(r.etudiant_id) === String(e.id))
        return comps.length > 0 && siennes.length >= comps.length
      })
      return { ...s, competences: comps, nb_eleves: eleves.length, nb_complets: complets.length }
    })
  })
})

// GET /api/seances/:id/suivi — état de chaque élève (pour débloquer)
router.get('/:id/suivi', verifyToken, requireRole('professeur', 'admin'), controleId, async (req, res) => {
  const [seance] = await lire(supabase.from('seances').select('*').eq('id', req.params.id))
  if (!seance || !peutAcceder(req.user, seance.concours_code)) return message(res, 404, 'Séance introuvable')

  const liens = await lire(supabase.from('seance_competences').select('competence_id').eq('seance_id', seance.id))
  const reponses = await lire(supabase.from('auto_evaluations').select('etudiant_id').eq('seance_id', seance.id))
  const deblocages = await lire(supabase.from('autoeval_deblocages').select('etudiant_id').eq('seance_id', seance.id))
  const regles = reglesAutoEval(await optionsConcours(), seance.concours_code)

  const eleves = (await elevesDuConcours(seance.concours_code)).filter(e => peutGererEleve(req.user, e))
  res.json({
    seance,
    eleves: eleves.map(e => ({
      id: e.id, matricule: e.matricule, prenom: e.prenom, nom: e.nom, username: e.username,
      ...etatSeance({
        fin: seance.fin,
        nbCompetences: liens.length,
        nbReponses: reponses.filter(r => String(r.etudiant_id) === String(e.id)).length,
        debloque: deblocages.some(d => String(d.etudiant_id) === String(e.id))
      }, regles)
    }))
  })
})

// POST /api/seances/:id/debloquer — lève le verrouillage d'un élève pour cette séance
router.post('/:id/debloquer', verifyToken, requireRole('professeur', 'admin'), controleId, validate(debloquerSchema), async (req, res) => {
  const [seance] = await lire(supabase.from('seances').select('*').eq('id', req.params.id))
  if (!seance || !peutAcceder(req.user, seance.concours_code)) return message(res, 404, 'Séance introuvable')

  const eleve = (await elevesDuConcours(seance.concours_code)).find(e => String(e.id) === String(req.body.etudiant_id))
  if (!eleve) return message(res, 404, 'Élève introuvable pour ce concours')
  if (!peutGererEleve(req.user, eleve)) return message(res, 403, 'Cet élève ne fait pas partie de vos concours')

  const deja = await lire(supabase.from('autoeval_deblocages').select('etudiant_id').eq('seance_id', seance.id).eq('etudiant_id', eleve.id))
  if (deja.length === 0) {
    const { error } = await supabase.from('autoeval_deblocages').insert([{ seance_id: seance.id, etudiant_id: eleve.id, par: req.user.id }])
    if (error) throw error
  }
  res.json({ success: true })
})

export default router
