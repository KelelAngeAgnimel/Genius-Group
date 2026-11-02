import express from 'express'
import { z } from 'zod'
import supabase from '../supabase.js'
import { verifyToken, requireRole, estEtudiant } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import { chargerAvecConcours, avecConcours } from '../lib/inscriptions.js'
import { peutGererEleve, peutPublierPour, estPersonnelRestreint } from '../lib/concours.js'

const router = express.Router()

// Les valeurs de concours sont libres (« INP-HB », « ESATIC »…) : elles sont gérées par l'interface.
const noteSchema = z.object({
  etudiant_id: z.union([z.string().trim().min(1).max(64), z.number().int()]),
  matiere: z.string().trim().min(1).max(100),
  concours: z.string().trim().min(1).max(50),
  note: z.number({ error: 'La note doit être un nombre' }).finite().min(0).max(20),
  periode: z.string().trim().min(1).max(50)
})

// POST — Ajouter ou modifier une note (prof et admin)
router.post('/ajouter', verifyToken, requireRole('professeur', 'admin'), validate(noteSchema), async (req, res) => {
  const { id: professeur_id } = req.user
  const { etudiant_id, matiere, concours, note, periode } = req.body

  // L'étudiant doit exister et être un élève
  const etu = await chargerAvecConcours(etudiant_id)
  if (!etu) return res.status(404).json({ message: 'Étudiant introuvable' })
  if (!estEtudiant(etu.role)) {
    return res.status(400).json({ message: 'Les notes ne peuvent être saisies que pour des élèves' })
  }

  // Un professeur rattaché à des concours ne note que ses élèves, pour ses concours
  if (!peutGererEleve(req.user, etu) || (estPersonnelRestreint(req.user) && !peutPublierPour(req.user, concours))) {
    return res.status(403).json({ message: 'Cet élève ou ce concours ne fait pas partie de vos concours' })
  }

  // Vérifier si une note existe déjà pour cet étudiant/matière/période
  const { data: existing, error: errEx } = await supabase
    .from('notes')
    .select('id')
    .eq('etudiant_id', etu.id)
    .eq('matiere', matiere)
    .eq('concours', concours)
    .eq('periode', periode)
    .limit(1)
    .maybeSingle()
  if (errEx) throw errEx

  const result = existing
    ? await supabase.from('notes').update({ note, professeur_id }).eq('id', existing.id).select().single()
    : await supabase.from('notes').insert([{ etudiant_id: etu.id, matiere, concours, note, periode, professeur_id }]).select().single()

  if (result.error) throw result.error
  res.json({ success: true, note: result.data })
})

// GET — Mes notes (étudiant connecté)
router.get('/mes-notes', verifyToken, async (req, res) => {
  if (!estEtudiant(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' })
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*, professeur:professeur_id(username, prenom, nom)')
    .eq('etudiant_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  res.json({ notes: data })
})

// GET — Notes d'un étudiant spécifique (prof et admin)
router.get('/etudiant/:id', verifyToken, requireRole('professeur', 'admin'), async (req, res) => {
  if (estPersonnelRestreint(req.user)) {
    const etu = await chargerAvecConcours(req.params.id)
    if (!etu || !peutGererEleve(req.user, etu)) {
      return res.status(403).json({ message: 'Cet élève ne fait pas partie de vos concours' })
    }
  }
  const { data, error } = await supabase
    .from('notes')
    .select('*, professeur:professeur_id(username, prenom, nom)')
    .eq('etudiant_id', req.params.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  res.json({ notes: data })
})

// GET — Toutes les notes d'une classe (prof et admin)
router.get('/classe', verifyToken, requireRole('professeur', 'admin'), async (req, res) => {
  const { concours, matiere, periode } = req.query

  let query = supabase
    .from('notes')
    .select('*, etudiant:etudiant_id(id, username, prenom, nom, matricule, role), professeur:professeur_id(username, prenom, nom)')
    .order('created_at', { ascending: false })

  if (typeof concours === 'string' && concours) query = query.eq('concours', concours)
  if (typeof matiere === 'string' && matiere) query = query.eq('matiere', matiere)
  if (typeof periode === 'string' && periode) query = query.eq('periode', periode)

  const { data, error } = await query
  if (error) throw error

  // Professeur rattaché : uniquement les notes de ses élèves
  let notes = data
  if (estPersonnelRestreint(req.user)) {
    const eleves = await avecConcours((data || []).map(n => n.etudiant).filter(Boolean))
    const autorises = new Set(eleves.filter(e => peutGererEleve(req.user, e)).map(e => String(e.id)))
    notes = (data || []).filter(n => n.etudiant && autorises.has(String(n.etudiant.id)))
  }
  res.json({ notes })
})

// DELETE — Supprimer une note (admin seulement)
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const { error } = await supabase.from('notes').delete().eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true })
})

export default router
