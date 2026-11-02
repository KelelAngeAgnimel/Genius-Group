import express from 'express'
import { z } from 'zod'
import supabase from '../supabase.js'
import { verifyToken, requireRole } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'

const router = express.Router()

const texte = (max) => z.string().trim().max(max)
const lienSchema = z.string().trim().max(500).refine(v => {
  try { return new URL(v).protocol === 'https:' } catch { return false }
}, 'Le lien doit être une URL https valide')
const concoursSchema = z.enum(['inphb', 'esatic', 'both'])

const creerSchema = z.object({
  titre: texte(200).min(1),
  prof: texte(150).nullish(),
  heure: texte(100).nullish(),
  lien: lienSchema,
  concours: concoursSchema.nullish()
})
const modifierSchema = z.object({
  titre: texte(200).min(1).optional(),
  prof: texte(150).nullable().optional(),
  heure: texte(100).nullable().optional(),
  lien: lienSchema.optional(),
  concours: concoursSchema.optional(),
  live: z.boolean().optional()
})

// Admin : tout. Professeur : uniquement ses propres cours (created_by).
async function chargerCoursModifiable(req, res) {
  const { data: cours, error } = await supabase
    .from('meetings').select('id, created_by').eq('id', req.params.id).maybeSingle()
  if (error) throw error
  if (!cours) { res.status(404).json({ error: 'Cours non trouvé' }); return null }
  if (req.user.role !== 'admin' && String(cours.created_by) !== String(req.user.id)) {
    res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres cours' }); return null
  }
  return cours
}

// Détermine quels concours un rôle donné peut voir
function concoursAutorises(role) {
  // Personnel : voit tout
  if (role === 'admin' || role === 'professeur') {
    return ['inphb', 'esatic', 'both']
  }
  // Étudiants inscrits aux deux concours (ou aux trois) : voient tout
  if (role === 'etudiant_both' || role === 'etudiant_all') {
    return ['inphb', 'esatic', 'both']
  }
  // INP-HB (seul ou avec CME) : cours INP-HB + cours communs
  if (role === 'etudiant_inphb' || role === 'etudiant_inphb_cme') {
    return ['inphb', 'both']
  }
  // ESATIC (seul ou avec CME) : cours ESATIC + cours communs
  if (role === 'etudiant_esatic' || role === 'etudiant_esatic_cme') {
    return ['esatic', 'both']
  }
  // Par défaut : au moins les cours communs
  return ['both']
}

// GET /api/meetings — cours filtrés selon le concours de l'utilisateur
router.get('/', verifyToken, async (req, res) => {
  const concours = concoursAutorises(req.user.role)
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .in('concours', concours)
    .order('created_at', { ascending: false })

  if (error) throw error
  res.json(data)
})

// POST /api/meetings — créer un cours (professeur / admin)
router.post('/', verifyToken, requireRole('admin', 'professeur'), validate(creerSchema), async (req, res) => {
  const { titre, prof, heure, lien, concours } = req.body
  const { data, error } = await supabase
    .from('meetings')
    .insert([{
      titre,
      prof: prof || null,
      heure: heure || null,
      lien,
      salle: 'externe',
      live: false,
      concours: concours || 'both',
      created_by: req.user.id
    }])
    .select()
    .single()

  if (error) throw error
  res.json(data)
})

// PATCH /api/meetings/:id — modifier un cours (admin : tout, professeur : les siens)
router.patch('/:id', verifyToken, requireRole('admin', 'professeur'), validate(modifierSchema), async (req, res) => {
  if (!(await chargerCoursModifiable(req, res))) return

  const updates = {}
  for (const k of ['titre', 'prof', 'heure', 'lien', 'concours', 'live']) {
    if (req.body[k] !== undefined) updates[k] = req.body[k]
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Aucune modification fournie' })
  }

  const { data, error } = await supabase
    .from('meetings').update(updates).eq('id', req.params.id).select().single()
  if (error) throw error
  res.json(data)
})

// DELETE /api/meetings/:id — supprimer un cours (admin : tout, professeur : les siens)
router.delete('/:id', verifyToken, requireRole('admin', 'professeur'), async (req, res) => {
  if (!(await chargerCoursModifiable(req, res))) return

  const { error } = await supabase.from('meetings').delete().eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true })
})

export default router
