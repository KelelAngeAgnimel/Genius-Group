import express from 'express'
import { z } from 'zod'
import supabase from '../supabase.js'
import { verifyToken, requireRole, estEtudiant } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'

const router = express.Router()

const idSchema = z.union([z.string().trim().min(1).max(64), z.number().int()])
const sujetSchema = z.string().trim().min(1).max(150)
const contenuSchema = z.string().trim().min(1).max(5000)

const envoyerSchema = z.object({ a_id: idSchema, sujet: sujetSchema, contenu: contenuSchema })
const diffuserSchema = z.object({
  groupe: z.enum(['tous', 'inphb', 'esatic', 'all']).optional().default('tous'),
  sujet: sujetSchema,
  contenu: contenuSchema
})

// GET — Mes messages reçus
router.get('/recus', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, expediteur:de_id(username, prenom, nom, role)')
    .eq('a_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  res.json({ messages: data })
})

// GET — Mes messages envoyés
router.get('/envoyes', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, destinataire:a_id(username, prenom, nom, role)')
    .eq('de_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  res.json({ messages: data })
})

// POST — Envoyer un message
// Un élève ne peut écrire qu'aux professeurs et administrateurs.
router.post('/envoyer', verifyToken, validate(envoyerSchema), async (req, res) => {
  const { a_id, sujet, contenu } = req.body

  if (String(a_id) === String(req.user.id)) {
    return res.status(400).json({ message: 'Vous ne pouvez pas vous écrire à vous-même' })
  }

  const { data: dest, error: errDest } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', a_id)
    .maybeSingle()
  if (errDest) throw errDest
  if (!dest) return res.status(404).json({ message: 'Destinataire introuvable' })

  if (estEtudiant(req.user.role) && !['professeur', 'admin'].includes(dest.role)) {
    return res.status(403).json({ message: 'Vous pouvez uniquement écrire aux professeurs et administrateurs' })
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([{ de_id: req.user.id, a_id: dest.id, sujet, contenu }])
    .select()
    .single()

  if (error) throw error
  res.json({ success: true, message: data })
})

// PATCH — Marquer comme lu
router.patch('/:id/lu', verifyToken, async (req, res) => {
  const { error } = await supabase
    .from('messages')
    .update({ lu: true })
    .eq('id', req.params.id)
    .eq('a_id', req.user.id)

  if (error) throw error
  res.json({ success: true })
})

// POST — Diffuser un message à un groupe d'étudiants
// groupe : 'tous' | 'inphb' | 'esatic' | 'all'
router.post('/diffuser', verifyToken, requireRole('admin', 'professeur'), validate(diffuserSchema), async (req, res) => {
  const { groupe, sujet, contenu } = req.body

  const { data: etudiants, error: errE } = await supabase
    .from('users')
    .select('id, role')
    .like('role', 'etudiant%')
  if (errE) throw errE

  // Filtrer selon le groupe ciblé (un étudiant "all" fait aussi INP-HB et ESATIC)
  const cibles = (etudiants || []).filter(u => {
    const r = u.role || ''
    if (groupe === 'inphb')  return r.includes('inphb') || r === 'etudiant_both' || r === 'etudiant_all'
    if (groupe === 'esatic') return r.includes('esatic') || r === 'etudiant_both' || r === 'etudiant_all'
    if (groupe === 'all')    return r === 'etudiant_all'
    return true // 'tous'
  })

  if (cibles.length === 0) {
    return res.json({ success: true, count: 0 })
  }

  const lignes = cibles.map(e => ({ de_id: req.user.id, a_id: e.id, sujet, contenu }))
  const { error } = await supabase.from('messages').insert(lignes)
  if (error) throw error

  res.json({ success: true, count: lignes.length })
})

export default router
