import express from 'express'
import { z } from 'zod'
import supabase from '../supabase.js'
import { verifyToken, requireRole } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'

const router = express.Router()

const court = (max) => z.string().trim().max(max)
const idOpt = z.union([z.string().trim().max(64), z.number().int()]).nullish()
const planningBase = {
  jour: court(30).min(1),
  heure_debut: court(10).min(1),
  heure_fin: court(10).min(1),
  matiere: court(100).min(1),
  type: court(30).nullish(),
  salle: court(100).nullish(),
  concours: court(30).nullish(),
  professeur_id: idOpt,
  modalite: z.enum(['en_ligne', 'presentiel', 'les_deux'])
}
const creerSchema = z.object(planningBase)
const modifierSchema = z.object(planningBase).partial()

const SELECT_PLANNING = `
  id, jour, heure_debut, heure_fin, matiere, type, salle, concours, modalite, professeur_id, created_at,
  professeur:professeur_id ( id, nom, prenom )
`

// Concours autorisés selon le rôle
function concoursAutorises(role) {
  if (role === 'admin' || role === 'professeur') return ['inphb', 'esatic', 'both', 'all']
  if (role === 'etudiant_inphb') return ['inphb', 'both', 'all']
  if (role === 'etudiant_esatic') return ['esatic', 'both', 'all']
  if (role === 'etudiant_all') return ['inphb', 'esatic', 'both', 'all']
  return ['both', 'all']
}

const avecProf = (c) => ({ ...c, prof: c.professeur ? `${c.professeur.prenom} ${c.professeur.nom}` : null })

// GET /api/planning — cours filtrés par concours ET modalité de l'étudiant
router.get('/', verifyToken, async (req, res) => {
  const concours = concoursAutorises(req.user.role)
  const modalite = req.user.modalite // 'en_ligne', 'presentiel', ou null pour admin/prof

  let query = supabase
    .from('cours_planning')
    .select(SELECT_PLANNING)
    .in('concours', concours)
    .order('jour')
    .order('heure_debut')

  // Filtrer par modalité uniquement pour les étudiants
  // Un cours peut être pour 'en_ligne', 'presentiel', ou 'les_deux'
  if (modalite && req.user.role !== 'admin' && req.user.role !== 'professeur') {
    query = query.in('modalite', [modalite, 'les_deux'])
  }

  const { data, error } = await query
  if (error) throw error
  res.json((data || []).map(avecProf))
})

// POST /api/planning — créer un cours (admin uniquement)
router.post('/', verifyToken, requireRole('admin'), validate(creerSchema), async (req, res) => {
  const { jour, heure_debut, heure_fin, matiere, type, salle, concours, professeur_id, modalite } = req.body

  const { data, error } = await supabase
    .from('cours_planning')
    .insert([{
      jour,
      heure_debut,
      heure_fin,
      matiere,
      type: type || 'cours',
      salle: salle || null,
      concours: concours || 'both',
      modalite,
      professeur_id: professeur_id || null,
      created_by: req.user.id
    }])
    .select(SELECT_PLANNING)
    .single()

  if (error) throw error
  res.json(avecProf(data))
})

// PATCH /api/planning/:id — modifier un cours (admin uniquement)
router.patch('/:id', verifyToken, requireRole('admin'), validate(modifierSchema), async (req, res) => {
  const updates = {}
  for (const k of ['jour', 'heure_debut', 'heure_fin', 'matiere', 'type', 'salle', 'concours', 'modalite']) {
    if (req.body[k] !== undefined) updates[k] = req.body[k]
  }
  if (req.body.professeur_id !== undefined) updates.professeur_id = req.body.professeur_id || null
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Aucune modification fournie' })
  }

  const { data, error } = await supabase
    .from('cours_planning')
    .update(updates)
    .eq('id', req.params.id)
    .select(SELECT_PLANNING)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return res.status(404).json({ error: 'Cours non trouvé' })
    throw error
  }
  res.json(avecProf(data))
})

// DELETE /api/planning/:id
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const { error } = await supabase.from('cours_planning').delete().eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true })
})

export default router
