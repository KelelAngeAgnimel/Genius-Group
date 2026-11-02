import express from 'express'
import { z } from 'zod'
import supabase from '../supabase.js'
import { verifyToken, requireRole, estEtudiant } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import { chargerAvecConcours } from '../lib/inscriptions.js'
import { peutGererEleve } from '../lib/concours.js'

const router = express.Router()

const creerSchema = z.object({
  titre: z.string().trim().min(1).max(200),
  matiere: z.string().trim().min(1).max(100),
  description: z.string().trim().max(5000).nullish(),
  url_fichier: z.string().trim().max(1000).nullish(),
  etudiant_id: z.union([z.string().trim().min(1).max(64), z.number().int()])
})
const statutSchema = z.object({ statut: z.string().trim().min(1).max(50) })

// POST /api/exercices — Créer un exercice (prof/admin)
router.post('/', verifyToken, requireRole('professeur', 'admin'), validate(creerSchema), async (req, res) => {
  const { titre, matiere, description, url_fichier, etudiant_id } = req.body

  const etu = await chargerAvecConcours(etudiant_id)
  if (!etu || !estEtudiant(etu.role)) {
    return res.status(404).json({ error: 'Étudiant introuvable' })
  }
  if (!peutGererEleve(req.user, etu)) {
    return res.status(403).json({ error: 'Cet élève ne fait pas partie de vos concours' })
  }

  const { data, error } = await supabase
    .from('exercices')
    .insert([{
      titre,
      matiere,
      description: description || null,
      url_fichier: url_fichier || null,
      etudiant_id: etu.id,
      professeur_id: req.user.id
    }])
    .select()
    .single()

  if (error) throw error
  res.json({ exercice: data })
})

// GET /api/exercices/recus — Exercices reçus par l'étudiant connecté
router.get('/recus', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('exercices')
    .select('*, professeur:professeur_id(username, prenom, nom)')
    .eq('etudiant_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  res.json({ exercices: data })
})

// GET /api/exercices/envoyes — Exercices envoyés par le prof connecté
router.get('/envoyes', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('exercices')
    .select('*, etudiant:etudiant_id(username, prenom, nom)')
    .eq('professeur_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  res.json({ exercices: data })
})

// PATCH /api/exercices/:id/statut — Marquer comme fait (étudiant)
router.patch('/:id/statut', verifyToken, validate(statutSchema), async (req, res) => {
  const { error } = await supabase
    .from('exercices')
    .update({ statut: req.body.statut })
    .eq('id', req.params.id)
    .eq('etudiant_id', req.user.id)

  if (error) throw error
  res.json({ success: true })
})

export default router
