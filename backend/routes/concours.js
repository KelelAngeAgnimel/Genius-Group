import express from 'express'
import supabase from '../supabase.js'
import { z } from 'zod'
import { verifyToken, requireRole } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import { viderCacheOptions } from '../lib/inscriptions.js'
import { recalculerConcours } from '../lib/renforcement.js'
import { CODES_CONCOURS, LIBELLES } from '../lib/concours.js'

const router = express.Router()

// GET /api/concours — référentiel des concours actifs (cases à cocher, filtres, options)
router.get('/', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('concours').select('code, nom, actif, options').eq('actif', true).order('code')
  // Table absente (migration pas encore lancée) : liste par défaut
  if (error) {
    return res.json({ concours: CODES_CONCOURS.map(code => ({ code, nom: LIBELLES[code], actif: true, options: {} })) })
  }
  res.json({ concours: data })
})

// Options modifiables en administration (rien n'est codé en dur côté interface)
const optionsSchema = z.object({
  generation_auto_tests: z.boolean().optional(),
  autoeval_bloquante: z.boolean().optional(),
  autoeval_delai_heures: z.number().int().min(1).max(720).optional(),
  autoeval_rappel_heures: z.number().int().min(0).max(720).optional(),
  classement_visible: z.boolean().optional(),
  score_alpha: z.number().min(0).max(1).optional(),     // poids de l'auto-évaluation (0,3 = 30 %)
  score_seuil: z.number().min(0).max(100).optional(),   // sous ce score : renforcement
  renforcement_mode: z.enum(['auto', 'manuel']).optional()
}).strict().refine(
  v => v.autoeval_rappel_heures === undefined || v.autoeval_delai_heures === undefined || v.autoeval_rappel_heures <= v.autoeval_delai_heures,
  { path: ['autoeval_rappel_heures'], message: 'Le rappel doit précéder la fin du délai' }
)

// PATCH /api/concours/:code/options — fusionne les options reçues avec les options existantes (admin)
router.patch('/:code/options', verifyToken, requireRole('admin'), validate(optionsSchema), async (req, res) => {
  if (!CODES_CONCOURS.includes(req.params.code)) return res.status(404).json({ message: 'Concours inconnu', error: 'Concours inconnu' })
  const { data: actuel, error } = await supabase.from('concours').select('code, options').eq('code', req.params.code).maybeSingle()
  if (error) throw error
  if (!actuel) return res.status(404).json({ message: 'Concours introuvable', error: 'Concours introuvable' })

  const options = { ...(actuel.options ?? {}), ...req.body }
  const { error: errMaj } = await supabase.from('concours').update({ options }).eq('code', req.params.code)
  if (errMaj) throw errMaj
  viderCacheOptions()
  // α ou seuil modifié : on recalcule les scores du concours, sans envoyer aucun exercice
  if (req.body.score_alpha !== undefined || req.body.score_seuil !== undefined) {
    await recalculerConcours(req.params.code, { declencher: false })
  }
  res.json({ success: true, code: req.params.code, options })
})

export default router
