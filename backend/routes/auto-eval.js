import express from 'express'
import { z } from 'zod'
import supabase from '../supabase.js'
import { verifyToken } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import { peutAcceder, estEtudiant } from '../lib/concours.js'
import { statutsEleve } from '../lib/autoeval.js'
import { recalculerSansBloquer } from '../lib/renforcement.js'

const router = express.Router()

const message = (res, statut, texte) => res.status(statut).json({ message: texte, error: texte })
const uuid = z.string().uuid()

const envoiSchema = z.object({
  seance_id: uuid,
  reponses: z.array(z.object({
    competence_id: uuid,
    niveau: z.number().int().min(0).max(5),
    commentaire: z.string().trim().max(1000).nullish()
  })).min(1).max(40)
})

// GET /api/auto-eval/en-attente — séances terminées à auto-évaluer (élève)
//  rappel     : au moins une est en retard de réponse (rappel à 24 h)
//  verrouille : au moins une bloque l'accès aux cours et ressources (délai de 48 h dépassé)
router.get('/en-attente', verifyToken, async (req, res) => {
  if (!estEtudiant(req.user)) return res.json({ en_attente: [], rappel: false, verrouille: false })
  const statuts = await statutsEleve(req.user)
  const enAttente = statuts
    .filter(s => s.etat === 'en_attente')
    .sort((a, b) => new Date(a.seance.fin) - new Date(b.seance.fin))
  res.json({
    en_attente: enAttente,
    rappel: enAttente.some(s => s.rappel),
    verrouille: enAttente.some(s => s.verrouille)
  })
})

// POST /api/auto-eval — enregistre l'auto-évaluation d'une séance (toutes les compétences, niveau 0 à 5)
router.post('/', verifyToken, validate(envoiSchema), async (req, res) => {
  if (!estEtudiant(req.user)) return message(res, 403, 'Réservé aux élèves')
  const { seance_id, reponses } = req.body

  const { data: seance, error } = await supabase.from('seances').select('*').eq('id', seance_id).maybeSingle()
  if (error) throw error
  if (!seance || !peutAcceder(req.user, seance.concours_code)) return message(res, 404, 'Séance introuvable')
  if (new Date(seance.fin) > new Date()) return message(res, 403, 'La séance n’est pas terminée')

  const { data: liens, error: errLiens } = await supabase.from('seance_competences').select('competence_id').eq('seance_id', seance.id)
  if (errLiens) throw errLiens
  const attendues = new Set((liens ?? []).map(l => String(l.competence_id)))

  const envoyees = reponses.map(r => String(r.competence_id))
  if (new Set(envoyees).size !== envoyees.length) return message(res, 400, 'Une compétence est envoyée plusieurs fois')
  if (envoyees.some(id => !attendues.has(id))) return message(res, 400, 'Compétence étrangère à cette séance')

  const { data: deja, error: errDeja } = await supabase.from('auto_evaluations').select('competence_id')
    .eq('seance_id', seance.id).eq('etudiant_id', req.user.id)
  if (errDeja) throw errDeja
  const dejaFaites = new Set((deja ?? []).map(r => String(r.competence_id)))
  if (envoyees.some(id => dejaFaites.has(id))) return message(res, 409, 'Cette compétence a déjà été auto-évaluée')
  if ([...attendues].some(id => !dejaFaites.has(id) && !envoyees.includes(id))) {
    return message(res, 400, 'Évaluez toutes les compétences de la séance')
  }

  const { error: errInsert } = await supabase.from('auto_evaluations').insert(reponses.map(r => ({
    seance_id: seance.id, etudiant_id: req.user.id, competence_id: r.competence_id,
    niveau: r.niveau, commentaire: r.commentaire || null, cree_le: new Date().toISOString()
  })))
  if (errInsert) {
    if (errInsert.code === '23505') return message(res, 409, 'Auto-évaluation déjà enregistrée')
    throw errInsert
  }
  // Le score de chaque compétence évaluée est recalculé (et un exercice envoyé si le concours est en mode AUTO)
  await recalculerSansBloquer(req.user.id)
  res.status(201).json({ success: true })
})

export default router
