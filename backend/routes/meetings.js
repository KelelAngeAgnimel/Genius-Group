import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from './auth.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// GET /api/meetings — tous les cours (accessible à tous les rôles connectés)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/meetings — créer un cours (admin uniquement)
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  const { titre, prof, heure, salle, live } = req.body
  if (!titre || !salle) {
    return res.status(400).json({ error: 'titre et salle sont requis' })
  }
  try {
    const { data, error } = await supabase
      .from('meetings')
      .insert([{
        titre,
        prof: prof || null,
        heure: heure || null,
        salle,
        live: live || false,
        created_by: req.user.id
      }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PATCH /api/meetings/:id — toggler le statut "live" (admin uniquement)
router.patch('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  const { live } = req.body
  try {
    const { data, error } = await supabase
      .from('meetings')
      .update({ live })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Cours non trouvé' })
      }
      return res.status(500).json({ error: error.message })
    }
    if (!data) return res.status(404).json({ error: 'Cours non trouvé' })
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/meetings/:id — supprimer un cours (admin uniquement)
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' })
  }
  try {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', req.params.id)

    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router